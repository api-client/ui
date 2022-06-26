/* eslint-disable class-methods-use-this */
/* eslint-disable arrow-body-style */
/* eslint-disable no-param-reassign */
/**
Copyright 2016 The Advanced REST client authors <arc@mulesoft.com>
Licensed under the Apache License, Version 2.0 (the "License"); you may not
use this file except in compliance with the License. You may obtain a copy of
the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
License for the specific language governing permissions and limitations under
the License.
*/
import { IAppProject, AppProject, ContextChangeRecord, ContextDeleteRecord, ContextListOptions, ContextListResult, ContextRestoreEvent, IListOptions } from '@api-client/core/build/browser.js';
import { Patch } from '@api-client/json';
import { Base, IGetOptions } from './Base.js';
import { EventTypes } from '../../events/EventTypes.js';
import { Events } from '../../events/Events.js';
import { randomString } from '../../lib/Random.js';

interface IPendingPatch {
  patch: Patch.JsonPatch;
  key: string;
}

const lastSyncKey = 'http-client.projects.lastSync';

/**
 * ARC project model for version >= 18.
 */
export class ProjectModel extends Base {
  /**
   * The list of items to synchronize with the server after they being created or updated.
   */
   pendingItems = {
    create: [] as IAppProject[],
    delete: [] as string[],
    patch: [] as IPendingPatch[],
    undelete: [] as string[],
  };

  pendingUpload = false;

  pendingUploadTimeout?: NodeJS.Timeout;

  /**
   * Own patches sent to the server.
   * These are removed after the sever event is received.
   */
  protected pendingPatches = new Map<string, Patch.JsonPatch>();

  constructor() {
    super('Projects');

    this._undeleteBulkHandler = this._undeleteBulkHandler.bind(this);
  }

  async put(value: IAppProject | AppProject): Promise<ContextChangeRecord<IAppProject>> {
    if (!value) {
      throw new Error(`Expected a value when inserting a project.`);
    }
    let insert: IAppProject;
    if (typeof (value as AppProject).toJSON === 'function') {
      insert = (value as AppProject).toJSON();
    } else {
      insert = value as IAppProject;
    }

    const result = await super.put(insert) as ContextChangeRecord<IAppProject>;
    Events.HttpClient.Model.Project.State.update(result, this.eventsTarget);
    this.pendingItems.create.push(insert);
    this._scheduleStoreUpload();
    return result;
  }

  async putBulk(values: (IAppProject | AppProject)[]): Promise<ContextChangeRecord<IAppProject>[]> {
    if (!Array.isArray(values)) {
      throw new Error(`Expected a value when inserting projects.`);
    }
    const inserts: IAppProject[] = [];
    values.forEach((i) => {
      let value: IAppProject;
      if (typeof (i as AppProject).toJSON === 'function') {
        value = (i as AppProject).toJSON();
      } else {
        value = { ...i } as IAppProject;
      }
      inserts.push(value);
      this.pendingItems.create.push(value);
    });

    const result = await super.putBulk(inserts) as ContextChangeRecord<IAppProject>[];
    result.forEach(record => Events.HttpClient.Model.Project.State.update(record, this.eventsTarget));
    this._scheduleStoreUpload();
    return result;
  }

  /**
   * Updates a project in the local and remote store.
   * 
   * @param value The project to update.
   */
  async update(value: IAppProject | AppProject): Promise<ContextChangeRecord<IAppProject>> {
    const current = await this.get(value.key);
    if (!current) {
      return this.put(value);
    }
    let schema: IAppProject;
    if (typeof (value as AppProject).toJSON === 'function') {
      schema = (value as AppProject).toJSON();
    } else {
      schema = { ...value } as IAppProject;
    }
    const patch = Patch.diff(current, schema);
    if (patch.length) {
      this.pendingItems.patch.push({ patch, key: value.key });
      this._scheduleStoreUpload();
    }
    const result = await super.put(schema) as ContextChangeRecord<IAppProject>;
    if (patch.length) {
      Events.HttpClient.Model.Project.State.update(result, this.eventsTarget);
    }
    return result;
  }

  async get(key: string, opts?: IGetOptions): Promise<IAppProject | undefined> {
    return super.get(key, opts) as Promise<IAppProject | undefined>;
  }

  async getBulk(keys: string[], opts?: IGetOptions): Promise<(IAppProject | undefined)[]> {
    return super.getBulk(keys, opts) as Promise<(IAppProject | undefined)[]>;
  }

  async delete(key: string): Promise<ContextDeleteRecord | undefined> {
    const result = await super.delete(key);
    if (result) {
      Events.HttpClient.Model.Project.State.delete(result, this.eventsTarget);
    }
    this.pendingItems.delete.push(key);
    this._scheduleStoreUpload();
    return result;
  }

  async deleteBulk(keys: string[]): Promise<(ContextDeleteRecord | undefined)[]> {
    const result = await super.deleteBulk(keys);
    result.forEach((record) => {
      if (record) {
        Events.HttpClient.Model.Project.State.delete(record, this.eventsTarget);
        this.pendingItems.delete.push(record.key);
      }
    });
    this._scheduleStoreUpload();
    return result;
  }

  async undeleteBulk(records: ContextDeleteRecord[]): Promise<(ContextChangeRecord<IAppProject> | undefined)[]> {
    if (!records) {
      throw new Error(`The "records" argument is missing.`);
    }
    if (!Array.isArray(records)) {
      throw new Error(`The "records" argument expected to be an array.`);
    }

    const ids = this._readDeletedRecordKeys(records);
    const result = await super.restoreBulk(ids) as (ContextChangeRecord<IAppProject> | undefined)[];
    result.forEach((record) => {
      if (record) {
        Events.HttpClient.Model.Project.State.update(record, this.eventsTarget)
        this.pendingItems.undelete.push(record.key);
      }
    });
    this._scheduleStoreUpload();
    return result;
  }

  async list(opts?: ContextListOptions): Promise<ContextListResult<IAppProject>> {
    return super.list(opts) as Promise<ContextListResult<IAppProject>>;
  }

  listen(node: EventTarget = window): void {
    super.listen(node);
    node.addEventListener(EventTypes.HttpClient.Model.Project.read, this._readHandler as EventListener);
    node.addEventListener(EventTypes.HttpClient.Model.Project.readBulk, this._readBulkHandler as EventListener);
    node.addEventListener(EventTypes.HttpClient.Model.Project.create, this._createHandler as EventListener);
    node.addEventListener(EventTypes.HttpClient.Model.Project.update, this._updateHandler as EventListener);
    node.addEventListener(EventTypes.HttpClient.Model.Project.updateBulk, this._updateBulkHandler as EventListener);
    node.addEventListener(EventTypes.HttpClient.Model.Project.delete, this._deleteHandler as EventListener);
    node.addEventListener(EventTypes.HttpClient.Model.Project.deleteBulk, this._deleteBulkHandler as EventListener);
    node.addEventListener(EventTypes.HttpClient.Model.Project.undeleteBulk, this._undeleteBulkHandler as EventListener);
    node.addEventListener(EventTypes.HttpClient.Model.Project.list, this._listHandler as EventListener);
  }

  unlisten(node: EventTarget = window): void {
    super.unlisten(node);
    node.removeEventListener(EventTypes.HttpClient.Model.Project.read, this._readHandler as EventListener);
    node.removeEventListener(EventTypes.HttpClient.Model.Project.readBulk, this._readBulkHandler as EventListener);
    node.removeEventListener(EventTypes.HttpClient.Model.Project.create, this._createHandler as EventListener);
    node.removeEventListener(EventTypes.HttpClient.Model.Project.update, this._updateHandler as EventListener);
    node.removeEventListener(EventTypes.HttpClient.Model.Project.updateBulk, this._updateBulkHandler as EventListener);
    node.removeEventListener(EventTypes.HttpClient.Model.Project.delete, this._deleteHandler as EventListener);
    node.removeEventListener(EventTypes.HttpClient.Model.Project.deleteBulk, this._deleteBulkHandler as EventListener);
    node.removeEventListener(EventTypes.HttpClient.Model.Project.undeleteBulk, this._undeleteBulkHandler as EventListener);
    node.removeEventListener(EventTypes.HttpClient.Model.Project.list, this._listHandler as EventListener);
  }

  protected _undeleteBulkHandler(e: ContextRestoreEvent<IAppProject>): void {
    if (this._eventCancelled(e)) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    e.detail.result = this.undeleteBulk(e.detail.records);
  }

  protected _scheduleStoreUpload(): void {
    if (this.pendingUpload) {
      return;
    }
    this.pendingUpload = true;
    this.pendingUploadTimeout = setTimeout(() => this._storeUpload(), 1000);
  }

  protected async _storeUpload(): Promise<void> {
    const { create, delete: toDelete, patch, undelete } = this.pendingItems;
    this.pendingItems.create = [];
    this.pendingItems.delete = [];
    this.pendingItems.patch = [];
    this.pendingItems.undelete = [];
    const ps: Promise<unknown>[] = [];
    if (create.length) {
      ps.push(Events.Store.App.Project.createBulk(create));
    }
    if (toDelete.length) {
      ps.push(Events.Store.App.Project.deleteBulk(toDelete));
    }
    if (undelete.length) {
      ps.push(Events.Store.App.Project.undeleteBulk(undelete));
    }
    if (patch.length) {
      patch.forEach((i) => {
        const id = randomString(16);
        this.pendingPatches.set(id, i.patch);
        ps.push(Events.Store.App.Project.patch(i.key, id, i.patch));
      });
    }
    await Promise.allSettled(ps);
    if (this.pendingItems.create.length || this.pendingItems.delete.length || this.pendingItems.patch.length || this.pendingItems.undelete.length) {
      await this._storeUpload();
    } else {
      this.pendingUpload = false;
    }
  }

  /**
   * Reads projects data from the store from the last checked time.
   */
  async pullStore(): Promise<void> {
    const since = await Events.Config.Local.get(lastSyncKey) as number | undefined;
    await this._sync(since);
    await Events.Config.Local.set(lastSyncKey, Date.now());
  }

  protected async _sync(sinceOrCursor?: number | string | undefined): Promise<void> {
    const opts: IListOptions = {};
    if (typeof sinceOrCursor === 'number') {
      opts.since = sinceOrCursor;
    } else if (sinceOrCursor) {
      opts.cursor = sinceOrCursor;
    }
    const result = await Events.Store.App.Project.list(opts);
    if (result.items.length) {
      await this.putBulk(result.items);
      if (result.cursor) {
        await this._sync(result.cursor);
      }
    }
  }
}
