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
import { IArcProject, ArcProject, ContextChangeRecord, ContextDeleteRecord, ContextListOptions, ContextListResult, ContextRestoreEvent } from '@api-client/core/build/browser.js';
import { ArcModelEvents } from '../events/models/ArcModelEvents.js';
import { ArcModelEventTypes } from '../events/models/ArcModelEventTypes.js';
import { Base, IGetOptions } from './Base.js';


/**
 * ARC project model for version >= 18.
 */
export class ProjectModel extends Base {
  constructor() {
    super('Projects');

    this._undeleteBulkHandler = this._undeleteBulkHandler.bind(this);
  }

  async put(value: IArcProject | ArcProject): Promise<ContextChangeRecord<IArcProject>> {
    if (!value) {
      throw new Error(`Expected a value when inserting a project.`);
    }
    let insert: IArcProject;
    if (typeof (value as ArcProject).toJSON === 'function') {
      insert = (value as ArcProject).toJSON();
    } else {
      insert = value as IArcProject;
    }

    const result = await super.put(insert) as ContextChangeRecord<IArcProject>;
    ArcModelEvents.Project.State.update(result, this.eventsTarget);
    return result;
  }

  async putBulk(values: (IArcProject | ArcProject)[]): Promise<ContextChangeRecord<IArcProject>[]> {
    if (!Array.isArray(values)) {
      throw new Error(`Expected a value when inserting projects.`);
    }
    const inserts: IArcProject[] = [];
    values.forEach((i) => {
      if (typeof (i as ArcProject).toJSON === 'function') {
        inserts.push((i as ArcProject).toJSON());
      } else {
        inserts.push(i as IArcProject);
      }
    });

    const result = await super.putBulk(inserts) as ContextChangeRecord<IArcProject>[];
    result.forEach(record => ArcModelEvents.Project.State.update(record, this.eventsTarget));
    return result;
  }

  async get(key: string, opts?: IGetOptions): Promise<IArcProject | undefined> {
    return super.get(key, opts) as Promise<IArcProject | undefined>;
  }

  async getBulk(keys: string[], opts?: IGetOptions): Promise<(IArcProject | undefined)[]> {
    return super.getBulk(keys, opts) as Promise<(IArcProject | undefined)[]>;
  }

  async delete(key: string): Promise<ContextDeleteRecord | undefined> {
    const result = await super.delete(key);
    if (result) {
      ArcModelEvents.Project.State.delete(result, this.eventsTarget);
    }
    return result;
  }

  async deleteBulk(keys: string[]): Promise<(ContextDeleteRecord | undefined)[]> {
    const result = await super.deleteBulk(keys);
    result.forEach((record) => {
      if (record) {
        ArcModelEvents.Project.State.delete(record, this.eventsTarget);
      }
    });
    return result;
  }

  async undeleteBulk(records: ContextDeleteRecord[]): Promise<(ContextChangeRecord<IArcProject> | undefined)[]> {
    if (!records) {
      throw new Error(`The "records" argument is missing.`);
    }
    if (!Array.isArray(records)) {
      throw new Error(`The "records" argument expected to be an array.`);
    }

    const ids = this._readDeletedRecordKeys(records);
    const result = await super.restoreBulk(ids) as (ContextChangeRecord<IArcProject> | undefined)[];
    result.forEach((record) => {
      if (record) {
        ArcModelEvents.Project.State.update(record, this.eventsTarget)
      }
    });
    return result;
  }

  async list(opts?: ContextListOptions): Promise<ContextListResult<IArcProject>> {
    return super.list(opts) as Promise<ContextListResult<IArcProject>>;
  }

  listen(node: EventTarget = window): void {
    super.listen(node);
    node.addEventListener(ArcModelEventTypes.Project.read, this._readHandler as EventListener);
    node.addEventListener(ArcModelEventTypes.Project.readBulk, this._readBulkHandler as EventListener);
    node.addEventListener(ArcModelEventTypes.Project.update, this._updateHandler as EventListener);
    node.addEventListener(ArcModelEventTypes.Project.updateBulk, this._updateBulkHandler as EventListener);
    node.addEventListener(ArcModelEventTypes.Project.delete, this._deleteHandler as EventListener);
    node.addEventListener(ArcModelEventTypes.Project.deleteBulk, this._deleteBulkHandler as EventListener);
    node.addEventListener(ArcModelEventTypes.Project.undeleteBulk, this._undeleteBulkHandler as EventListener);
    node.addEventListener(ArcModelEventTypes.Project.list, this._listHandler as EventListener);
  }

  unlisten(node: EventTarget = window): void {
    super.unlisten(node);
    node.removeEventListener(ArcModelEventTypes.Project.read, this._readHandler as EventListener);
    node.removeEventListener(ArcModelEventTypes.Project.readBulk, this._readBulkHandler as EventListener);
    node.removeEventListener(ArcModelEventTypes.Project.update, this._updateHandler as EventListener);
    node.removeEventListener(ArcModelEventTypes.Project.updateBulk, this._updateBulkHandler as EventListener);
    node.removeEventListener(ArcModelEventTypes.Project.delete, this._deleteHandler as EventListener);
    node.removeEventListener(ArcModelEventTypes.Project.deleteBulk, this._deleteBulkHandler as EventListener);
    node.removeEventListener(ArcModelEventTypes.Project.undeleteBulk, this._undeleteBulkHandler as EventListener);
    node.removeEventListener(ArcModelEventTypes.Project.list, this._listHandler as EventListener);
  }

  protected _undeleteBulkHandler(e: ContextRestoreEvent<IArcProject>): void {
    if (this._eventCancelled(e)) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    e.detail.result = this.undeleteBulk(e.detail.records);
  }
}
