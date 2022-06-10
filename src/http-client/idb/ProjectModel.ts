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
import { IAppProject, AppProject, ContextChangeRecord, ContextDeleteRecord, ContextListOptions, ContextListResult, ContextRestoreEvent } from '@api-client/core/build/browser.js';
import { Base, IGetOptions } from './Base.js';
import { EventTypes } from '../../events/EventTypes.js';
import { Events } from '../../events/Events.js';

/**
 * ARC project model for version >= 18.
 */
export class ProjectModel extends Base {
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
    return result;
  }

  async putBulk(values: (IAppProject | AppProject)[]): Promise<ContextChangeRecord<IAppProject>[]> {
    if (!Array.isArray(values)) {
      throw new Error(`Expected a value when inserting projects.`);
    }
    const inserts: IAppProject[] = [];
    values.forEach((i) => {
      if (typeof (i as AppProject).toJSON === 'function') {
        inserts.push((i as AppProject).toJSON());
      } else {
        inserts.push(i as IAppProject);
      }
    });

    const result = await super.putBulk(inserts) as ContextChangeRecord<IAppProject>[];
    result.forEach(record => Events.HttpClient.Model.Project.State.update(record, this.eventsTarget));
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
    return result;
  }

  async deleteBulk(keys: string[]): Promise<(ContextDeleteRecord | undefined)[]> {
    const result = await super.deleteBulk(keys);
    result.forEach((record) => {
      if (record) {
        Events.HttpClient.Model.Project.State.delete(record, this.eventsTarget);
      }
    });
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
      }
    });
    return result;
  }

  async list(opts?: ContextListOptions): Promise<ContextListResult<IAppProject>> {
    return super.list(opts) as Promise<ContextListResult<IAppProject>>;
  }

  listen(node: EventTarget = window): void {
    super.listen(node);
    node.addEventListener(EventTypes.HttpClient.Model.Project.read, this._readHandler as EventListener);
    node.addEventListener(EventTypes.HttpClient.Model.Project.readBulk, this._readBulkHandler as EventListener);
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
}
