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
import { IHostRule, HostRule, ContextChangeRecord, ContextDeleteRecord, ContextListOptions, ContextListResult } from '@api-client/core/build/browser.js';
import { ArcModelEvents } from '../events/models/ArcModelEvents.js';
import { ArcModelEventTypes } from '../events/models/ArcModelEventTypes.js';
import { Base, IGetOptions } from './Base.js';


/**
 * ARC hosts table model for version >= 18.
 */
export class HostsModel extends Base {
  constructor() {
    super('Hosts');
  }

  async put(value: IHostRule | HostRule): Promise<ContextChangeRecord<IHostRule>> {
    if (!value) {
      throw new Error(`Expected a value when inserting a project.`);
    }
    let insert: IHostRule;
    if (typeof (value as HostRule).toJSON === 'function') {
      insert = (value as HostRule).toJSON();
    } else {
      insert = value as IHostRule;
    }
    const result = await super.put(insert) as ContextChangeRecord<IHostRule>;
    ArcModelEvents.Host.State.update(result, this.eventsTarget);
    return result;
  }

  async putBulk(values: (IHostRule | HostRule)[]): Promise<ContextChangeRecord<IHostRule>[]> {
    if (!Array.isArray(values)) {
      throw new Error(`Expected a value when inserting projects.`);
    }
    const inserts: IHostRule[] = [];
    values.forEach((i) => {
      if (typeof (i as HostRule).toJSON === 'function') {
        inserts.push((i as HostRule).toJSON());
      } else {
        inserts.push(i as IHostRule);
      }
    });

    const result = await super.putBulk(inserts) as ContextChangeRecord<IHostRule>[];
    result.forEach(record => ArcModelEvents.Host.State.update(record, this.eventsTarget));
    return result;
  }

  async get(key: string, opts?: IGetOptions): Promise<IHostRule | undefined> {
    return super.get(key, opts) as Promise<IHostRule | undefined>;
  }

  async getBulk(keys: string[], opts?: IGetOptions): Promise<(IHostRule | undefined)[]> {
    return super.getBulk(keys, opts) as Promise<(IHostRule | undefined)[]>;
  }

  async delete(key: string): Promise<ContextDeleteRecord | undefined> {
    const result = await super.delete(key);
    if (result) {
      ArcModelEvents.Host.State.delete(result, this.eventsTarget);
    }
    return result;
  }

  async deleteBulk(keys: string[]): Promise<(ContextDeleteRecord | undefined)[]> {
    const result = await super.deleteBulk(keys);
    result.forEach((record) => {
      if (record) {
        ArcModelEvents.Host.State.delete(record, this.eventsTarget);
      }
    });
    return result;
  }

  async undeleteBulk(records: ContextDeleteRecord[]): Promise<(ContextChangeRecord<IHostRule> | undefined)[]> {
    if (!records) {
      throw new Error(`The "records" argument is missing.`);
    }
    if (!Array.isArray(records)) {
      throw new Error(`The "records" argument expected to be an array.`);
    }

    const ids = this._readDeletedRecordKeys(records);
    const result = await super.restoreBulk(ids) as (ContextChangeRecord<IHostRule> | undefined)[];
    result.forEach((record) => {
      if (record) {
        ArcModelEvents.Host.State.update(record, this.eventsTarget)
      }
    });
    return result;
  }

  async list(opts?: ContextListOptions): Promise<ContextListResult<IHostRule>> {
    return super.list(opts) as Promise<ContextListResult<IHostRule>>;
  }

  listen(node: EventTarget = window): void {
    super.listen(node);
    node.addEventListener(ArcModelEventTypes.Host.update, this._updateHandler as EventListener);
    node.addEventListener(ArcModelEventTypes.Host.updateBulk, this._updateBulkHandler as EventListener);
    node.addEventListener(ArcModelEventTypes.Host.delete, this._deleteHandler as EventListener);
    node.addEventListener(ArcModelEventTypes.Host.deleteBulk, this._deleteBulkHandler as EventListener);
    node.addEventListener(ArcModelEventTypes.Host.list, this._listHandler as EventListener);
  }

  unlisten(node: EventTarget = window): void {
    super.unlisten(node);
    node.removeEventListener(ArcModelEventTypes.Host.update, this._updateHandler as EventListener);
    node.removeEventListener(ArcModelEventTypes.Host.updateBulk, this._updateBulkHandler as EventListener);
    node.removeEventListener(ArcModelEventTypes.Host.delete, this._deleteHandler as EventListener);
    node.removeEventListener(ArcModelEventTypes.Host.deleteBulk, this._deleteBulkHandler as EventListener);
    node.removeEventListener(ArcModelEventTypes.Host.list, this._listHandler as EventListener);
  }
}
