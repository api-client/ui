/**
@license
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
import { ICertificate, Certificate, ContextChangeRecord, ContextDeleteRecord, ContextListOptions, ContextListResult } from '@api-client/core/build/browser.js';
import { ArcModelEvents } from '../events/models/ArcModelEvents.js';
import { ArcModelEventTypes } from '../events/models/ArcModelEventTypes.js';
import { Base, IGetOptions } from './Base.js';

/* eslint-disable class-methods-use-this */
/* eslint-disable no-param-reassign */

/**
 * Client certificates stored locally.
 */
export class CertificateModel extends Base {
  constructor() {
    super('Certificates');
  }

  async put(value: ICertificate | Certificate): Promise<ContextChangeRecord<ICertificate>> {
    if (!value) {
      throw new Error(`Expected a value when inserting a client certificate.`);
    }
    let insert: ICertificate;
    if (typeof (value as Certificate).toJSON === 'function') {
      insert = (value as Certificate).toJSON();
    } else {
      insert = value as ICertificate;
    }
    const result = await super.put(insert) as ContextChangeRecord<ICertificate>;
    ArcModelEvents.ClientCertificate.State.update(result, this.eventsTarget);
    return result;
  }

  async putBulk(values: (ICertificate | Certificate)[]): Promise<ContextChangeRecord<ICertificate>[]> {
    if (!Array.isArray(values)) {
      throw new Error(`Expected a value when inserting client certificates.`);
    }
    const inserts: ICertificate[] = [];
    values.forEach((i) => {
      if (typeof (i as Certificate).toJSON === 'function') {
        inserts.push((i as Certificate).toJSON());
      } else {
        inserts.push(i as ICertificate);
      }
    });
    const result = await super.putBulk(inserts) as ContextChangeRecord<ICertificate>[];
    result.forEach(record => ArcModelEvents.ClientCertificate.State.update(record, this.eventsTarget));
    return result;
  }

  async get(key: string, opts: IGetOptions = {}): Promise<ICertificate | undefined> {
    return super.get(key, opts) as Promise<ICertificate | undefined>;
  }

  async getBulk(keys: string[]): Promise<(ICertificate | undefined)[]> {
    return super.getBulk(keys) as Promise<(ICertificate | undefined)[]>;
  }

  async delete(key: string): Promise<ContextDeleteRecord | undefined> {
    const result = await super.delete(key);
    if (result) {
      ArcModelEvents.ClientCertificate.State.delete(result, this.eventsTarget);
    }
    return result;
  }

  async deleteBulk(keys: string[]): Promise<(ContextDeleteRecord | undefined)[]> {
    const result = await super.deleteBulk(keys);
    result.forEach(record => {
      if (record) {
        ArcModelEvents.ClientCertificate.State.delete(record, this.eventsTarget);
      }
    })
    return result;
  }

  async list(opts?: ContextListOptions): Promise<ContextListResult<ICertificate>> {
    return super.list(opts) as Promise<ContextListResult<ICertificate>>;
  }

  listen(node: EventTarget = window): void {
    super.listen(node);
    node.addEventListener(ArcModelEventTypes.ClientCertificate.list, this._listHandler as EventListener);
    node.addEventListener(ArcModelEventTypes.ClientCertificate.read, this._readHandler as EventListener);
    node.addEventListener(ArcModelEventTypes.ClientCertificate.delete, this._deleteHandler as EventListener);
    node.addEventListener(ArcModelEventTypes.ClientCertificate.insert, this._updateHandler as EventListener);
  }

  unlisten(node: EventTarget = window): void {
    super.unlisten(node);
    node.removeEventListener(ArcModelEventTypes.ClientCertificate.list, this._listHandler as EventListener);
    node.removeEventListener(ArcModelEventTypes.ClientCertificate.read, this._readHandler as EventListener);
    node.removeEventListener(ArcModelEventTypes.ClientCertificate.delete, this._deleteHandler as EventListener);
    node.removeEventListener(ArcModelEventTypes.ClientCertificate.insert, this._updateHandler as EventListener);
  }
}
