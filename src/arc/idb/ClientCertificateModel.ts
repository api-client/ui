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
// import { ArcModelEventTypes, ArcModelEvents } from '@advanced-rest-client/events';
import { ARCCertificateIndex, ARCRequestCertificate, Certificate, ClientCertificate } from '@api-client/core/build/legacy.js';
import { ArcModelEvents } from '../events/models/ArcModelEvents.js';
import { ArcModelEventTypes } from '../events/models/ArcModelEventTypes.js';
import { ARCClientCertificateDeleteEvent, ARCClientCertificateInsertEvent, ARCClientCertificateListEvent, ARCClientCertificateReadEvent } from '../events/models/CertificatesEvents.js';
import { Base, createChangeRecord, IARCEntityChangeRecord, IARCModelListOptions, IARCModelListResult, IDeletedEntity } from './Base.js';

/* eslint-disable class-methods-use-this */
/* eslint-disable no-param-reassign */

export const listHandler = Symbol('listHandler');
export const insertHandler = Symbol('insertHandler');
export const deleteHandler = Symbol('deleteHandler');
export const readHandler = Symbol('readHandler');

/**
 * Events based access to client-certificates data store.
 *
 * Note: **All events must be cancelable.** When the event is cancelled by an instance
 * of the element it won't be handled again by other instance that possibly exists
 * in the DOM.
 *
 * Cancellable event is a request to models for change. Non-cancellable event
 * is a notification for views to update their values.
 * For example `request-object-changed` event notifies model to update object in
 * the datastore if the event is cancelable and to update views if it's not
 * cancellable.
 *
 * Each handled event contains the `result` property on the `detail` object. It
 * contains a `Promise` object with a result of the operation. Also, for update / delete
 * events the same non-cancelable event is fired.
 *
 * Events handled by this element are cancelled and propagation of the event is
 * stopped.
 *
 * The certificates are located in the `client-certificates-data` store.
 * Content is not stored with the listing data for performance.
 *
 * `clientCertificate` structure
 * - `type` {String} - Certificate type. Either p12 or pem. Required.
 * - `cert` {Array<Certificate>} or {Certificate} - Certificate or list of certificates to use. Required.
 * - `key` {Array<Certificate>} or {Certificate} - Key for pem certificate. Optional.
 * - `name` {String} - Custom name of the certificate. Optional.
 * - `created` {Number} - Timestamp when the certificate was inserted into the data store.
 * Required when returning a result. Auto-generated when inserting.
 *
 * `Certificate` structure
 * - `data` {String} or {ArrayBuffer} or {Buffer} The certificate to use. Required.
 * The p12 type certificate must be a Buffer. The `get()` method always returns
 * original data type.
 * - `passphrase` {String} - A passphrase to use to unlock the certificate. Optional.
 */
export class ClientCertificateModel extends Base {
  constructor() {
    super('client-certificates');
    this[listHandler] = this[listHandler].bind(this);
    this[readHandler] = this[readHandler].bind(this);
    this[deleteHandler] = this[deleteHandler].bind(this);
    this[insertHandler] = this[insertHandler].bind(this);
  }

  /**
   * A handler to the datastore containing the actual certificates contents.
   */
  get dataDb(): PouchDB.Database {
    return new PouchDB('client-certificates-data');
  }

  listen(node: EventTarget): void {
    super.listen(node);
    node.addEventListener(ArcModelEventTypes.ClientCertificate.list, this[listHandler] as EventListener);
    node.addEventListener(ArcModelEventTypes.ClientCertificate.read, this[readHandler] as EventListener);
    node.addEventListener(ArcModelEventTypes.ClientCertificate.delete, this[deleteHandler] as EventListener);
    node.addEventListener(ArcModelEventTypes.ClientCertificate.insert, this[insertHandler] as EventListener);
  }

  unlisten(node: EventTarget): void {
    super.unlisten(node);
    node.removeEventListener(ArcModelEventTypes.ClientCertificate.list, this[listHandler] as EventListener);
    node.removeEventListener(ArcModelEventTypes.ClientCertificate.read, this[readHandler] as EventListener);
    node.removeEventListener(ArcModelEventTypes.ClientCertificate.delete, this[deleteHandler] as EventListener);
    node.removeEventListener(ArcModelEventTypes.ClientCertificate.insert, this[insertHandler] as EventListener);
  }

  /**
   * Lists certificates installed in the application.
   *
   * @param opts Query options.
   * @returns A promise resolved to a list of projects.
   */
  async list(opts: IARCModelListOptions = {}): Promise<IARCModelListResult<ARCCertificateIndex>> {
    const result = await this.listEntities(this.db, opts) as IARCModelListResult<ARCCertificateIndex>;
    result.items.forEach((doc) => {
      delete doc.dataKey;
    });
    return result;
  }

  /**
   * Reads client certificate full structure.
   * Returns certificate's meta data + cert + key.
   * @param id Certificate's datastore id.
   * @returns Promise resolved to a certificate object.
   */
  async get(id: string): Promise<ClientCertificate> {
    if (!id) {
      throw new Error('The "id" argument is missing');
    }
    const index = await this.db.get(id) as ARCCertificateIndex;
    const { dataKey, _id: indexId } = index;
    const dataId = dataKey || indexId;
    if (!dataId) {
      throw new Error(`Invalid sate. The "dataId" not found on the certificate.`);
    }
    const data = (await this.dataDb.get(dataId) as ARCRequestCertificate);

    const result: ClientCertificate = ({
      cert: this.certificateFromStore(data.cert),
      name: index.name,
      created: index.created,
      type: index.type,
    });
    if (data.key) {
      result.key = this.certificateFromStore(data.key);
    }
    return result;
  }

  /**
   * Safely deletes certificate data from the data store.
   * It marks the certificate as deleted so DB apis won't use this data but
   * it is possible to restore the data in case of accidental delete.
   *
   * Note, this data always stays only on the user's machine so there's no
   * conflict with GDPR.
   *
   * @param id Certificate's datastore id.
   * @returns Promise resolved when both entries are deleted.
   */
  async delete(id: string): Promise<IDeletedEntity> {
    if (!id) {
      throw new Error('The "id" argument is missing');
    }
    const { db } = this;
    const index = await db.get(id) as ARCCertificateIndex;
    index._deleted = true;
    const updateRecord = await db.put(index);
    const { dataKey, _id: indexId } = index;
    const dataId = dataKey || indexId;
    const { dataDb } = this;
    if (dataId) {
      const data = await dataDb.get(dataId) as ARCRequestCertificate;
      data._deleted = true;
      await dataDb.put(data);
    }
    ArcModelEvents.ClientCertificate.State.delete(id, updateRecord.rev, this.eventsTarget);
    return {
      id,
      rev: updateRecord.rev,
    };
  }

  /**
   * Inserts new client certificate object.
   *
   * @param cert Data to insert.
   * @returns Returns a change record for the index entity
   */
  async insert(cert: ClientCertificate): Promise<IARCEntityChangeRecord<ARCCertificateIndex>> {
    if (!cert.cert) {
      throw new Error('The "cert" property is required.');
    }
    if (!cert.type) {
      throw new Error('The "type" property is required.');
    }
    const dataEntity: ARCRequestCertificate = ({
      cert: this.certificateToStore(cert.cert),
      type: cert.type,
    });
    if (cert.key) {
      dataEntity.key = this.certificateToStore(cert.key);
    }
    const indexEntity: ARCCertificateIndex = ({
      name: cert.name,
      type: cert.type,
    });
    if (cert.created) {
      indexEntity.created = cert.created;
    } else {
      indexEntity.created = Date.now();
    }
    const dataResponse = await this.dataDb.post(dataEntity);
    dataEntity._rev = dataResponse.rev;
    dataEntity._id = dataResponse.id;
    indexEntity._id = dataResponse.id;
    const response = await this.db.put(indexEntity);
    const record = this[createChangeRecord](indexEntity, response) as IARCEntityChangeRecord<ARCCertificateIndex>;
    ArcModelEvents.ClientCertificate.State.update(record, this.eventsTarget);
    return record;
  }

  /**
   * Prepares certificate object to be stored in the data store.
   * If the `data` property is not string then it assumes buffer (either
   * Node's or ArrayBuffer). In this case it converts buffer to base64 string.
   * It also adds `type` property set to `buffer` for the `certificateFromStore()`
   * function to recognize what to do with the data.
   *
   * Note, for optimization, PEM keys should be strings as the content of the
   * certificate is already a base62 string. To spare double base64 conversion
   * use string data.
   *
   * @param cert Certificate definition. See class description.
   * @throws {Error} When data is not set
   */
  certificateToStore(cert: Certificate | Certificate[]): Certificate | Certificate[] {
    if (Array.isArray(cert)) {
      return (cert.map((info) => this.certificateToStore(info))) as Certificate[];
    }
    if (!cert.data) {
      throw new Error('Certificate content not set.');
    }
    if (typeof cert.data !== 'string') {
      cert.type = 'buffer';
      const buff = cert.data as Buffer;
      cert.data = this.bufferToBase64(buff);
    }
    return cert;
  }

  /**
   * Restores certificate object to it's original values after reading it from
   * the data store.
   * @param cert Restored certificate definition.
   */
  certificateFromStore(cert: Certificate | Certificate[]): Certificate | Certificate[] {
    if (Array.isArray(cert)) {
      return (cert.map((info) => this.certificateFromStore(info))) as Certificate[];
    }
    if (cert.type) {
      delete cert.type;
      const content = cert.data as string;
      cert.data = this.base64ToBuffer(content);
    }
    return cert;
  }

  /**
   * Converts incoming data to base64 string.
   * @returns Safe to store string.
   */
  bufferToBase64(view: Uint8Array): string {
    const str = view.reduce(
      (data, byte) => data + String.fromCharCode(byte),
      ''
    );
    return btoa(str);
  }

  /**
   * Converts base64 string to Uint8Array.
   * @param {string} str
   * @return {Uint8Array} Restored array view.
   */
  base64ToBuffer(str: string): Uint8Array {
    const asciiString = atob(str);
    return new Uint8Array([...asciiString].map((char) => char.charCodeAt(0)));
  }

  /**
   * @param {ARCClientCertificateListEvent} e
   */
  [listHandler](e: ARCClientCertificateListEvent): void {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    const { limit, nextPageToken } = e;

    e.detail.result = this.list({
      limit,
      nextPageToken,
    });
  }

  [readHandler](e: ARCClientCertificateReadEvent): void {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    const { id } = e;
    e.detail.result = this.get(id);
  }

  [deleteHandler](e: ARCClientCertificateDeleteEvent): void {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    const { id } = e;
    e.detail.result = this.delete(id);
  }

  [insertHandler](e: ARCClientCertificateInsertEvent): void {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    const { certificate } = e;
    e.detail.result = this.insert(certificate);
  }

  /**
   * Override's delete model function to include the "data" store.
   */
  async deleteModel(): Promise<void> {
    await this.dataDb.destroy();
    await super.deleteModel();
  }
}
