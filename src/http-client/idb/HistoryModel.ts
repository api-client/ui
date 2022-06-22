/* eslint-disable @typescript-eslint/ban-ts-comment */
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
import { 
  IAppRequest, AppRequest, ContextChangeRecord, ContextDeleteRecord, ContextRestoreEvent, ContextListResult, ContextListOptions, 
  ContextQueryEvent, IQueryDetail, IListOptions, IQueryResponse 
} from '@api-client/core/build/browser.js';
import { Patch } from '@api-client/json';
import { SimpleDocumentSearchResultSetUnit } from 'flexsearch';
// @ts-ignore
import SearchDocument from 'flexsearch/dist/module/document.js';
import { Base, IGetOptions } from './Base.js';
import { EventTypes } from '../../events/EventTypes.js';
import { Events } from '../../events/Events.js';
import { randomString } from '../../lib/Random.js';

interface IPendingPatch {
  patch: Patch.JsonPatch;
  key: string;
}

const lastSyncKey = 'http-client.history.lastSync';

/**
 * ARC request model for version >= 18.
 */
export class HistoryModel extends Base {
  /**
   * The list of items to synchronize with the server after they being created or updated.
   */
  pendingItems = {
    create: [] as IAppRequest[],
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
    super('History');

    this._undeleteBulkHandler = this._undeleteBulkHandler.bind(this);
    this._queryHandler = this._queryHandler.bind(this);
  }

  async put(value: IAppRequest | AppRequest): Promise<ContextChangeRecord<IAppRequest>> {
    if (!value) {
      throw new Error(`Expected a value when inserting a history.`);
    }
    let insert: IAppRequest;
    if (typeof (value as AppRequest).toJSON === 'function') {
      insert = (value as AppRequest).toJSON();
    } else {
      insert = { ...value } as IAppRequest;
    }
    const result = await super.put(insert) as ContextChangeRecord<IAppRequest>;
    Events.HttpClient.Model.History.State.update(result, this.eventsTarget);
    this.pendingItems.create.push(insert);
    this._scheduleStoreUpload();
    return result;
  }

  async putBulk(values: (IAppRequest | AppRequest)[]): Promise<ContextChangeRecord<IAppRequest>[]> {
    if (!Array.isArray(values)) {
      throw new Error(`Expected a value when inserting history list.`);
    }
    const inserts: IAppRequest[] = [];
    values.forEach((i) => {
      let value: IAppRequest;
      if (typeof (i as AppRequest).toJSON === 'function') {
        value = (i as AppRequest).toJSON();
      } else {
        value = { ...i } as IAppRequest;
      }
      inserts.push(value);
      this.pendingItems.create.push(value);
    });

    const result = await super.putBulk(inserts) as ContextChangeRecord<IAppRequest>[];
    result.forEach(record => Events.HttpClient.Model.History.State.update(record, this.eventsTarget));
    this._scheduleStoreUpload();
    return result;
  }

  /**
   * Updates a request in the local and remote store.
   * 
   * @param value The request to update.
   */
  async update(value: IAppRequest | AppRequest): Promise<ContextChangeRecord<IAppRequest>> {
    const current = await this.get(value.key);
    if (!current) {
      return this.put(value);
    }
    let schema: IAppRequest;
    if (typeof (value as AppRequest).toJSON === 'function') {
      schema = (value as AppRequest).toJSON();
    } else {
      schema = { ...value } as IAppRequest;
    }
    const patch = Patch.diff(current, schema);
    this.pendingItems.patch.push({ patch, key: value.key });
    this._scheduleStoreUpload();
    const result = await super.put(schema) as ContextChangeRecord<IAppRequest>;
    Events.HttpClient.Model.History.State.update(result, this.eventsTarget);
    return result;
  }

  async get(key: string, opts?: IGetOptions): Promise<IAppRequest | undefined> {
    return super.get(key, opts) as Promise<IAppRequest | undefined>;
  }

  async getBulk(keys: string[], opts?: IGetOptions): Promise<(IAppRequest | undefined)[]> {
    return super.getBulk(keys, opts) as Promise<(IAppRequest | undefined)[]>;
  }

  async delete(key: string): Promise<ContextDeleteRecord | undefined> {
    const result = await super.delete(key);
    if (result) {
      Events.HttpClient.Model.History.State.delete(result, this.eventsTarget);
    }
    this.pendingItems.delete.push(key);
    this._scheduleStoreUpload();
    return result;
  }

  async deleteBulk(keys: string[]): Promise<(ContextDeleteRecord | undefined)[]> {
    const result = await super.deleteBulk(keys);
    result.forEach((record) => {
      if (record) {
        Events.HttpClient.Model.History.State.delete(record, this.eventsTarget);
        this.pendingItems.delete.push(record.key);
      }
    });
    this._scheduleStoreUpload();
    return result;
  }

  async undeleteBulk(records: ContextDeleteRecord[]): Promise<(ContextChangeRecord<IAppRequest> | undefined)[]> {
    if (!records) {
      throw new Error(`The "records" argument is missing.`);
    }
    if (!Array.isArray(records)) {
      throw new Error(`The "records" argument expected to be an array.`);
    }

    const ids = this._readDeletedRecordKeys(records);
    const result = await super.restoreBulk(ids) as (ContextChangeRecord<IAppRequest> | undefined)[];
    result.forEach((record) => {
      if (record) {
        Events.HttpClient.Model.History.State.update(record, this.eventsTarget);
        this.pendingItems.undelete.push(record.key);
      }
    });
    this._scheduleStoreUpload();
    return result;
  }

  async list(opts?: ContextListOptions): Promise<ContextListResult<IAppRequest>> {
    return super.list(opts) as Promise<ContextListResult<IAppRequest>>;
  }

  async query(opts: IQueryDetail): Promise<IQueryResponse<IAppRequest>> {
    const { term } = opts;
    const db = await this.open();
    const tx = db.transaction('History', 'readonly');
    const index = new SearchDocument({
      document: {
        id: 'key',
        index: [
          'info:name',
          'info:displayName',
          'info:description',
          'expects:method',
          'expects:url',
          'expects:headers',
          'log:response:headers',
        ],
      },
      charset: 'latin:extra',
      tokenize: 'reverse',
      // resolution: 9,
    });
    const docs: IAppRequest[] = [];
    for await (const cursor of tx.store) {
      const { data } = cursor.value;
      index.add(data);
      docs.push(data);
    }
    const searchResult = index.search(term, { enrich: true }) as SimpleDocumentSearchResultSetUnit[];
    const ids: string[] = [];
    searchResult.forEach((indexGroup) => {
      const { result } = indexGroup;
      result.forEach((key) => {
        const dbKey = key as string;
        if (!ids.includes(dbKey)) {
          ids.push(dbKey);
        }
      });
    });
    if (!ids.length) {
      return { items: [] };
    }
    const result: IQueryResponse<IAppRequest> = {
      items: [],
    };
    searchResult.forEach((indexGroup) => {
      const { result: indexes, field } = indexGroup;
      indexes.forEach((rawId) => {
        const id = rawId as string;
        const existing = result.items.find(i => i.doc.key === id);
        if (existing) {
          existing.index.push(field);
        } else {
          const doc = docs.find(i => i.key === id);
          if (doc) {
            result.items.push({
              doc,
              index: [field],
            });
          }
        }
      });
    });
    return result;
  }

  listen(node: EventTarget = window): void {
    super.listen(node);
    node.addEventListener(EventTypes.HttpClient.Model.History.read, this._readHandler as EventListener);
    node.addEventListener(EventTypes.HttpClient.Model.History.readBulk, this._readBulkHandler as EventListener);
    node.addEventListener(EventTypes.HttpClient.Model.History.create, this._createHandler as EventListener);
    node.addEventListener(EventTypes.HttpClient.Model.History.update, this._updateHandler as EventListener);
    node.addEventListener(EventTypes.HttpClient.Model.History.updateBulk, this._updateBulkHandler as EventListener);
    node.addEventListener(EventTypes.HttpClient.Model.History.delete, this._deleteHandler as EventListener);
    node.addEventListener(EventTypes.HttpClient.Model.History.deleteBulk, this._deleteBulkHandler as EventListener);
    node.addEventListener(EventTypes.HttpClient.Model.History.undeleteBulk, this._undeleteBulkHandler as EventListener);
    node.addEventListener(EventTypes.HttpClient.Model.History.list, this._listHandler as EventListener);
    node.addEventListener(EventTypes.HttpClient.Model.History.query, this._queryHandler as EventListener);
  }

  unlisten(node: EventTarget = window): void {
    super.unlisten(node);
    node.removeEventListener(EventTypes.HttpClient.Model.History.read, this._readHandler as EventListener);
    node.removeEventListener(EventTypes.HttpClient.Model.History.readBulk, this._readBulkHandler as EventListener);
    node.removeEventListener(EventTypes.HttpClient.Model.History.create, this._createHandler as EventListener);
    node.removeEventListener(EventTypes.HttpClient.Model.History.update, this._updateHandler as EventListener);
    node.removeEventListener(EventTypes.HttpClient.Model.History.updateBulk, this._updateBulkHandler as EventListener);
    node.removeEventListener(EventTypes.HttpClient.Model.History.delete, this._deleteHandler as EventListener);
    node.removeEventListener(EventTypes.HttpClient.Model.History.deleteBulk, this._deleteBulkHandler as EventListener);
    node.removeEventListener(EventTypes.HttpClient.Model.History.undeleteBulk, this._undeleteBulkHandler as EventListener);
    node.removeEventListener(EventTypes.HttpClient.Model.History.list, this._listHandler as EventListener);
    node.removeEventListener(EventTypes.HttpClient.Model.History.query, this._queryHandler as EventListener);
  }

  protected _undeleteBulkHandler(e: ContextRestoreEvent<IAppRequest>): void {
    if (this._eventCancelled(e)) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    e.detail.result = this.undeleteBulk(e.detail.records);
  }

  protected _queryHandler(e: ContextQueryEvent<IAppRequest>): void {
    if (this._eventCancelled(e)) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    e.detail.result = this.query(e.detail);
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
      ps.push(Events.Store.App.Request.createBulk(create));
    }
    if (toDelete.length) {
      ps.push(Events.Store.App.Request.deleteBulk(toDelete));
    }
    if (undelete.length) {
      ps.push(Events.Store.App.Request.undeleteBulk(undelete));
    }
    if (patch.length) {
      patch.forEach((i) => {
        const id = randomString(16);
        this.pendingPatches.set(id, i.patch);
        ps.push(Events.Store.App.Request.patch(i.key, id, i.patch));
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
   * Reads requests data from the store from the last checked time.
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
    const result = await Events.Store.App.Request.list(opts);
    if (result.items.length) {
      await this.putBulk(result.items);
      if (result.cursor) {
        await this._sync(result.cursor);
      }
    }
  }
}
