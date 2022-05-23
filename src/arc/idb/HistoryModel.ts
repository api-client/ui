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
import { IArcHttpRequest, ArcHttpRequest, ContextChangeRecord, ContextDeleteRecord, ContextRestoreEvent, ContextListResult, ContextListOptions, ContextQueryEvent, IQueryDetail } from '@api-client/core/build/browser.js';
import { SimpleDocumentSearchResultSetUnit } from 'flexsearch';
// @ts-ignore
import SearchDocument from 'flexsearch/dist/module/document.js';
import { ArcModelEvents } from '../events/models/ArcModelEvents.js';
import { ArcModelEventTypes } from '../events/models/ArcModelEventTypes.js';
import { Base, IGetOptions } from './Base.js';

/**
 * ARC request model for version >= 18.
 */
export class HistoryModel extends Base {
  constructor() {
    super('History');

    this._undeleteBulkHandler = this._undeleteBulkHandler.bind(this);
    this._queryHandler = this._queryHandler.bind(this);
  }

  async put(value: IArcHttpRequest | ArcHttpRequest): Promise<ContextChangeRecord<IArcHttpRequest>> {
    if (!value) {
      throw new Error(`Expected a value when inserting a history.`);
    }
    let insert: IArcHttpRequest;
    if (typeof (value as ArcHttpRequest).toJSON === 'function') {
      insert = (value as ArcHttpRequest).toJSON();
    } else {
      insert = value as IArcHttpRequest;
    }

    const result = await super.put(insert) as ContextChangeRecord<IArcHttpRequest>;
    ArcModelEvents.History.State.update(result, this.eventsTarget);
    return result;
  }

  async putBulk(values: (IArcHttpRequest | ArcHttpRequest)[]): Promise<ContextChangeRecord<IArcHttpRequest>[]> {
    if (!Array.isArray(values)) {
      throw new Error(`Expected a value when inserting history list.`);
    }
    const inserts: IArcHttpRequest[] = [];
    values.forEach((i) => {
      if (typeof (i as ArcHttpRequest).toJSON === 'function') {
        inserts.push((i as ArcHttpRequest).toJSON());
      } else {
        inserts.push(i as IArcHttpRequest);
      }
    });

    const result = await super.putBulk(inserts) as ContextChangeRecord<IArcHttpRequest>[];
    result.forEach(record => ArcModelEvents.History.State.update(record, this.eventsTarget));
    return result;
  }

  async get(key: string, opts?: IGetOptions): Promise<IArcHttpRequest | undefined> {
    return super.get(key, opts) as Promise<IArcHttpRequest | undefined>;
  }

  async getBulk(keys: string[], opts?: IGetOptions): Promise<(IArcHttpRequest | undefined)[]> {
    return super.getBulk(keys, opts) as Promise<(IArcHttpRequest | undefined)[]>;
  }

  async delete(key: string): Promise<ContextDeleteRecord | undefined> {
    const result = await super.delete(key);
    if (result) {
      ArcModelEvents.History.State.delete(result, this.eventsTarget);
    }
    return result;
  }

  async deleteBulk(keys: string[]): Promise<(ContextDeleteRecord | undefined)[]> {
    const result = await super.deleteBulk(keys);
    result.forEach((record) => {
      if (record) {
        ArcModelEvents.History.State.delete(record, this.eventsTarget);
      }
    });
    return result;
  }

  async undeleteBulk(records: ContextDeleteRecord[]): Promise<(ContextChangeRecord<IArcHttpRequest> | undefined)[]> {
    if (!records) {
      throw new Error(`The "records" argument is missing.`);
    }
    if (!Array.isArray(records)) {
      throw new Error(`The "records" argument expected to be an array.`);
    }

    const ids = this._readDeletedRecordKeys(records);
    const result = await super.restoreBulk(ids) as (ContextChangeRecord<IArcHttpRequest> | undefined)[];
    result.forEach((record) => {
      if (record) {
        ArcModelEvents.History.State.update(record, this.eventsTarget)
      }
    });
    return result;
  }

  async list(opts?: ContextListOptions): Promise<ContextListResult<IArcHttpRequest>> {
    return super.list(opts) as Promise<ContextListResult<IArcHttpRequest>>;
  }

  async query(opts: IQueryDetail): Promise<IArcHttpRequest[]> {
    const { term } = opts;
    const db = await this.open();
    const tx = db.transaction('History', 'readonly');
    const index = new SearchDocument({
      document: {
        id: 'key',
        index: [
          'info:name',
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
    const docs: IArcHttpRequest[] = [];
    for await (const cursor of tx.store) {
      const { data } = cursor.value;
      index.add(data);
      docs.push(data);
    }
    const result = index.search(term, { enrich: true }) as SimpleDocumentSearchResultSetUnit[];
    const ids: string[] = [];
    result.forEach((group) => {
      group.result.forEach((id) => {
        const key = id as string;
        if (ids.includes(key)) {
          return;
        }
        ids.push(key);
      });
    });
    return docs.filter(i => ids.includes(i.key));
  }

  listen(node: EventTarget = window): void {
    super.listen(node);
    node.addEventListener(ArcModelEventTypes.History.read, this._readHandler as EventListener);
    node.addEventListener(ArcModelEventTypes.History.readBulk, this._readBulkHandler as EventListener);
    node.addEventListener(ArcModelEventTypes.History.update, this._updateHandler as EventListener);
    node.addEventListener(ArcModelEventTypes.History.updateBulk, this._updateBulkHandler as EventListener);
    node.addEventListener(ArcModelEventTypes.History.delete, this._deleteHandler as EventListener);
    node.addEventListener(ArcModelEventTypes.History.deleteBulk, this._deleteBulkHandler as EventListener);
    node.addEventListener(ArcModelEventTypes.History.undeleteBulk, this._undeleteBulkHandler as EventListener);
    node.addEventListener(ArcModelEventTypes.History.list, this._listHandler as EventListener);
    node.addEventListener(ArcModelEventTypes.History.query, this._queryHandler as EventListener);
  }

  unlisten(node: EventTarget = window): void {
    super.unlisten(node);
    node.removeEventListener(ArcModelEventTypes.History.read, this._readHandler as EventListener);
    node.removeEventListener(ArcModelEventTypes.History.readBulk, this._readBulkHandler as EventListener);
    node.removeEventListener(ArcModelEventTypes.History.update, this._updateHandler as EventListener);
    node.removeEventListener(ArcModelEventTypes.History.updateBulk, this._updateBulkHandler as EventListener);
    node.removeEventListener(ArcModelEventTypes.History.delete, this._deleteHandler as EventListener);
    node.removeEventListener(ArcModelEventTypes.History.deleteBulk, this._deleteBulkHandler as EventListener);
    node.removeEventListener(ArcModelEventTypes.History.undeleteBulk, this._undeleteBulkHandler as EventListener);
    node.removeEventListener(ArcModelEventTypes.History.list, this._listHandler as EventListener);
    node.removeEventListener(ArcModelEventTypes.History.query, this._queryHandler as EventListener);
  }

  protected _undeleteBulkHandler(e: ContextRestoreEvent<IArcHttpRequest>): void {
    if (this._eventCancelled(e)) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    e.detail.result = this.undeleteBulk(e.detail.records);
  }

  protected _queryHandler(e: ContextQueryEvent<IArcHttpRequest>): void {
    if (this._eventCancelled(e)) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    e.detail.result = this.query(e.detail);
  }
}
