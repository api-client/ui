/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
@license
Copyright 2018 The Advanced REST client authors <arc@mulesoft.com>
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

import { ContextChangeRecord, ContextDeleteBulkEvent, ContextDeleteEvent, ContextDeleteRecord, ContextListEvent, ContextListOptions, ContextListResult, ContextReadBulkEvent, ContextReadEvent, ContextUpdateBulkEvent, ContextUpdateEvent, Events as CoreEvents, IArcHttpRequest, IArcProject, IAuthorizationData, ICertificate, IHostRule, IUrl } from '@api-client/core/build/browser.js';
import { openDB, DBSchema, IDBPDatabase, IDBPObjectStore } from 'idb/with-async-ittr';
import { EventTypes } from '../../events/EventTypes.js';
import { Events } from '../../events/Events.js';
import { ARCModelDeleteEvent } from '../../events/http-client/models/BaseEvents.js';

/* eslint-disable class-methods-use-this */

export const deleteModelHandler = Symbol('deleteModelHandler');
export const notifyDestroyed = Symbol('notifyDestroyed');

export type StoreName = 'UrlHistory' | 'WsHistory' | 'History' | 'Projects' | 'AuthCache' | 'Certificates' | 'Hosts' | 'Environments';

export interface IBaseQueryOptions {
  /**
   * The number of records in the response.
   */
  limit?: number;
  /**
   * Whether to use the `descending` order.
   */
  descending?: boolean;
  /**
   * The key to start paginating from.
   */
  startKey?: string;
  /**
   * The number of records to skip before start capturing records.
   */
  skip?: number;
}

export interface IEntityMeta {
  deleted?: boolean;
}

export interface IStoredEntity<T = unknown> {
  meta: IEntityMeta;
  data: T;
}

export interface IGetOptions {
  /**
   * Whether to return a deleted document.
   */
  deleted?: boolean;
}

interface ArcDB extends DBSchema {
  UrlHistory: {
    key: string;
    value: IStoredEntity<IUrl>;
  },
  WsHistory: {
    key: string;
    value: IStoredEntity<IUrl>;
  },
  History: {
    key: string;
    value: IStoredEntity<IArcHttpRequest>,
    indexes: { 'day': string };
  },
  Projects: {
    key: string;
    value: IStoredEntity<IArcProject>,
  },
  AuthCache: {
    key: string;
    value: IStoredEntity<IAuthorizationData>,
  },
  Certificates: {
    key: string;
    value: IStoredEntity<ICertificate>,
  },
  Hosts: {
    key: string;
    value: IStoredEntity<IHostRule>,
  },
  Environments: {
    key: string;
    value: IStoredEntity<unknown>,
  },
}

/**
 * A base class for all models.
 * 
 * All models have to:
 * 
 * - have the `key` property that is a unique identifier of the entity. if the entity has duplicated entity it will replace the previous entity.
 */
export class Base {
  /**
   * Set with `listen()` method or separately. When set the model dispatch events on this node.
   * When not set the model does not dispatch events.
   */
  eventsTarget: EventTarget = window;

  /**
   * The name of the store.
   */
  name: StoreName;

  constructor(name: StoreName) {
    this.name = name;

    this._listHandler = this._listHandler.bind(this);
    this._readHandler = this._readHandler.bind(this);
    this._readBulkHandler = this._readBulkHandler.bind(this);
    this._updateHandler = this._updateHandler.bind(this);
    this._updateBulkHandler = this._updateBulkHandler.bind(this);
    this._deleteHandler = this._deleteHandler.bind(this);
    this._deleteBulkHandler = this._deleteBulkHandler.bind(this);

    this[deleteModelHandler] = this[deleteModelHandler].bind(this);
  }

  protected _db?: IDBPDatabase<ArcDB>;

  /**
   * Opens the ARC store.
   * @returns The reference to the database
   */
  async open(): Promise<IDBPDatabase<ArcDB>> {
    if (this._db) {
      return this._db;
    }
    const dbResult = await openDB<ArcDB>('AdvancedRestClient', 1, {
      upgrade(db) {
        const stores: StoreName[] = [
          'UrlHistory', 'WsHistory', 'History', 'Projects', 'AuthCache', 'Certificates', 'Hosts', 'Environments',
        ];
        const names = db.objectStoreNames;
        for (const name of stores) {
          if (!names.contains(name)) {
            const store = db.createObjectStore(name, { keyPath: 'data.key' });
            if (name === 'History') {
              const typed = store as IDBPObjectStore<ArcDB, ['History'], 'History', 'versionchange'>;
              typed.createIndex('day', 'data.midnight', { unique: false });
            }
          }
        }
      },
    });
    this._db = dbResult;
    return dbResult;
  }

  /**
   * Database query options for pagination.
   */
  get defaultQueryOptions(): IBaseQueryOptions {
    return {
      limit: 25,
      descending: true,
    };
  }

  /**
   * Listens for the DOM events.
   */
  listen(node: EventTarget = window): void {
    this.eventsTarget = node;
    node.addEventListener(EventTypes.HttpClient.Model.destroy, this[deleteModelHandler] as EventListener);
  }

  /**
   * Removes the DOM event listeners.
   */
  unlisten(node: EventTarget = window): void {
    node.removeEventListener(EventTypes.HttpClient.Model.destroy, this[deleteModelHandler] as EventListener);
  }

  /**
   * Handles any exception in the model in a unified way.
   * @param e An error object
   * @param noThrow If set the function will not throw error.
   * This allow to do the logic without stopping program.
   */
  protected _handleException(e: Error | unknown, noThrow?: boolean): void {
    let message;
    if (e instanceof Error) {
      message = e.message;
    } else {
      message = JSON.stringify(e);
    }
    if (this.eventsTarget) {
      CoreEvents.Telemetry.exception(message, true, this.eventsTarget);
    }
    if (!noThrow) {
      throw e;
    }
  }

  /**
   * Deletes current datastore.
   * Note that `name` property must be set before calling this function.
   */
  async deleteModel(): Promise<void> {
    const db = await this.open();
    const tx = db.transaction(this.name, 'readwrite');
    const { store } = tx;
    await store.clear();
    await tx.done;
  }

  /**
   * Notifies the application that the model has been removed and data destroyed.
   *
   * @param store The name of the deleted store
   */
  [notifyDestroyed](store: StoreName): void {
    if (this.eventsTarget) {
      Events.HttpClient.Model.destroyed(store, this.eventsTarget);
    }
  }

  /**
   * Handler for `destroy-model` custom event.
   * Deletes current data when scheduled for deletion.
   */
  [deleteModelHandler](e: ARCModelDeleteEvent): void {
    if (e.defaultPrevented) {
      return;
    }
    const { stores, detail } = e;
    if (!stores || !stores.length || !this.name) {
      return;
    }
    /* istanbul ignore else */
    if (!Array.isArray(detail.result)) {
      detail.result = [] as Promise<void>[];
    }
    if (stores.indexOf(this.name) !== -1) {
      const { result=[] } = detail;
      result.push(this.deleteModel());
    }
  }

  /**
   * Checks if event can be processed giving it's cancellation status or if
   * it was dispatched by current element.
   * @param e Event to test
   * @returns True if event is already cancelled or dispatched by self.
   */
  protected _eventCancelled(e: Event): boolean {
    if (e.defaultPrevented) {
      return true;
    }
    if (!e.cancelable) {
      return true;
    }
    return false;
  }

  /**
   * Decodes passed page token back to the passed parameters object.
   * @param token The page token value.
   * @return Restored page query parameters or null if error
   */
  decodePageToken(token: string): IBaseQueryOptions | null {
    if (!token) {
      return null;
    }
    try {
      const decoded = atob(token);
      return JSON.parse(decoded);
    } catch (e) {
      return null;
    }
  }

  /**
   * Encodes page parameters into a page token.
   * @param params Parameters to encode
   * @returns Page token
   */
  encodePageToken(params: IBaseQueryOptions): string {
    const str = JSON.stringify(params);
    return btoa(str);
  }

  /**
   * Lists all objects in the store.
   *
   * @param opts Query options.
   * @returns A promise resolved to a list of entities.
   */
  async list(opts: ContextListOptions = {}): Promise<ContextListResult<unknown>> {
    const { limit, nextPageToken } = opts;
    let queryOptions: IBaseQueryOptions | undefined;
    if (nextPageToken) {
      const pageOptions = this.decodePageToken(nextPageToken);
      if (pageOptions) {
        queryOptions = pageOptions;
      }
    }
    if (!queryOptions) {
      queryOptions = this.defaultQueryOptions;
      if (limit) {
        queryOptions.limit = limit;
      }
    }
    
    const db = await this.open();
    const items = await this._listEntities(db, this.name, queryOptions);
    let token;
    if (items.length) {
      const copy: IBaseQueryOptions = { ...queryOptions };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { key } = (items[items.length - 1] as any);
      copy.skip = 1;
      copy.startKey = key as string;
      token = this.encodePageToken(copy);
    }
    return {
      items,
      nextPageToken: token,
    }
  }

  protected async _listEntities(db: IDBPDatabase<ArcDB>, storeName: StoreName, opts: IBaseQueryOptions): Promise<unknown[]> {
    let adv = opts.skip || 0;
    const { descending, limit = 25, startKey } = opts;
    const tx = db.transaction(storeName, 'readonly');
    const dir = descending === true ? 'prev' : 'next';
    let keyFound = false;
    const items: unknown[] = [];
    for await (const cursor of tx.store.iterate(null, dir)) {
      const info = cursor.value;
      const { meta, data } = info;
      const { key } = data as { key: string };
      if (!key) {
        continue;
      }
      if (startKey && !keyFound) {
        if (key !== startKey) {
          continue;
        }
        keyFound = true;
      }
      if (adv) {
        cursor.advance(adv);
        adv = 0;
        continue;
      }
      if (meta && meta.deleted) {
        continue;
      }
      items.push(data);
      if (items.length >= limit) {
        break;
      }
    }
    return items;
  }

  async put(value: unknown): Promise<ContextChangeRecord<unknown>> {
    const typed = value as { key: string, kind?: string };
    if (!typed.key) {
      throw new Error(`Unable to process the value when inserting to ${this.name}: the key is missing.`);
    }
    const db = await this.open();
    const entity: IStoredEntity = {
      meta: {},
      data: value,
    };
    await db.put(this.name, entity);
    const result: ContextChangeRecord<unknown> = {
      key: typed.key,
      item: { ...typed },
    };
    if (typed.kind) {
      result.kind = typed.kind;
    }
    return result;
  }

  async putBulk(values: unknown[]): Promise<ContextChangeRecord<unknown>[]> {
    if (!Array.isArray(values)) {
      throw new Error(`Unexpected argument. An array must be passed to "putBulk()" method.`)
    }
    if (!values.length) {
      return [];
    }
    const typed = values as { key: string, kind?: string }[];
    const invalid = typed.some(i => !i.key);
    if (invalid) {
      throw new Error(`Unable to process bulk values when inserting to ${this.name}: a key is missing.`);
    }
    const entities: IStoredEntity[] = [];
    const result: ContextChangeRecord<unknown>[] = [];

    typed.forEach((data) => {
      entities.push({
        meta: {},
        data,
      });
      const record: ContextChangeRecord<unknown> = {
        key: data.key,
        item: { ...data },
      }
      if (data.kind) {
        record.kind = data.kind;
      }
      result.push(record);
    });

    const db = await this.open();
    const tx = db.transaction(this.name, 'readwrite');
    const { store } = tx;
    await Promise.all(entities.map(e => store.put(e)));
    await tx.done;
    return result;
  }

  async get(key: string, opts: IGetOptions = {}): Promise<unknown | undefined> {
    if (!key) {
      throw new Error(`The "key" argument is missing.`);
    }
    const db = await this.open();
    const value = await db.get(this.name, key);
    if (!value) {
      return undefined;
    }
    if (value.meta.deleted && !opts.deleted) {
      return undefined;
    }
    return value.data;
  }

  async getBulk(keys: string[], opts: IGetOptions = {}): Promise<(unknown | undefined)[]> {
    if (!keys) {
      throw new Error(`The "keys" argument is missing.`);
    }
    if (!Array.isArray(keys)) {
      throw new Error(`The "keys" argument expected to be an array.`);
    }
    const { name } = this;
    const db = await this.open();
    const { store } = db.transaction(name);
    const items = await Promise.all(keys.map(key => store.get(key)));
    const result: (unknown | undefined)[] = items.map((item) => {
      if (!item) {
        return undefined;
      }
      if (item.meta.deleted && !opts.deleted) {
        return undefined;
      }
      return item.data;
    });
    return result;
  }

  async delete(key: string): Promise<ContextDeleteRecord | undefined> {
    if (!key) {
      throw new Error(`The "key" argument is missing.`);
    }
    const db = await this.open();
    const tx = db.transaction(this.name, 'readwrite');
    const { store } = tx;
    let result: ContextDeleteRecord | undefined;
    const item = await store.get(key);
    if (item) {
      item.meta.deleted = true;
      result = {
        key,
      }
      const typed = item.data as any;
      if (typed.kind) {
        result.kind = typed.kind;
      }
      await store.put(item);
    }
    await tx.done;
    return result;
  }

  async deleteBulk(keys: string[]): Promise<(ContextDeleteRecord | undefined)[]> {
    if (!keys) {
      throw new Error(`The "keys" argument is missing.`);
    }
    if (!Array.isArray(keys)) {
      throw new Error(`The "keys" argument expected to be an array.`);
    }

    const db = await this.open();
    const tx = db.transaction(this.name, 'readwrite');
    const { store } = tx;
    const result: (ContextDeleteRecord | undefined)[] = [];
    const ps = keys.map(async (key) => {
      if (!key) {
        result.push(undefined);
        return;
      }
      const item = await store.get(key);
      if (!item) {
        result.push(undefined);
        return;
      }
      item.meta.deleted = true;
      const record: ContextDeleteRecord = {
        key,
      }
      const typed = item.data as any;
      if (typed.kind) {
        record.kind = typed.kind;
      }
      result.push(record);
      await store.put(item);
    });
    await Promise.all(ps);
    await tx.done;
    return result;
  }

  async restore(key: string): Promise<ContextChangeRecord<unknown> | undefined> {
    if (!key) {
      throw new Error(`The "key" argument is missing.`);
    }
    const db = await this.open();
    const tx = db.transaction(this.name, 'readwrite');
    const { store } = tx;
    let result: ContextChangeRecord<unknown> | undefined;
    const item = await store.get(key);
    if (item && item.meta.deleted) {
      item.meta.deleted = false;
      result = {
        key,
        item: item.data,
      }
      const typed = item.data as any;
      if (typed.kind) {
        result.kind = typed.kind;
      }
      await store.put(item);
    }
    await tx.done;
    return result;
  }

  async restoreBulk(keys: string[]): Promise<(ContextChangeRecord<unknown> | undefined)[] > {
    if (!keys) {
      throw new Error(`The "keys" argument is missing.`);
    }
    if (!Array.isArray(keys)) {
      throw new Error(`The "keys" argument expected to be an array.`);
    }
    
    const db = await this.open();
    const tx = db.transaction(this.name, 'readwrite');
    const { store } = tx;
    const result: (ContextChangeRecord<unknown> | undefined)[] = [];
    const ps = keys.map(async (key) => {
      if (!key) {
        result.push(undefined);
        return;
      }
      const item = await store.get(key);
      if (!item || !item.meta.deleted) {
        result.push(undefined);
        return;
      }
      item.meta.deleted = false;
      const record: ContextChangeRecord<unknown> = {
        key,
        item: item.data,
      }
      const typed = item.data as any;
      if (typed.kind) {
        record.kind = typed.kind;
      }
      result.push(record);
      await store.put(item);
    });
    await Promise.all(ps);
    await tx.done;
    return result;
  }

  /**
   * A handler for the model list event. To be setup in the child class.
   */
  protected _listHandler(e: ContextListEvent<unknown>): void {
    if (this._eventCancelled(e)) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    const { limit, nextPageToken } = e.detail;

    e.detail.result = this.list({
      limit,
      nextPageToken,
    });
  }

  protected _readHandler(e: ContextReadEvent<unknown>): void {
    if (this._eventCancelled(e)) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    e.detail.result = this.get(e.detail.key) as Promise<unknown>;
  }

  protected _readBulkHandler(e: ContextReadBulkEvent<unknown>): void {
    if (this._eventCancelled(e)) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    e.detail.result = this.getBulk(e.detail.keys) as Promise<unknown[]>;
  }

  protected _updateHandler(e: ContextUpdateEvent<any>): void {
    if (this._eventCancelled(e)) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    e.detail.result = this.put(e.detail.item);
  }

  protected _updateBulkHandler(e: ContextUpdateBulkEvent<any>): void {
    if (this._eventCancelled(e)) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    e.detail.result = this.putBulk(e.detail.items);
  }

  protected _deleteHandler(e: ContextDeleteEvent): void {
    if (this._eventCancelled(e)) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    e.detail.result = this.delete(e.detail.key) as Promise<ContextDeleteRecord>;
  }

  protected _deleteBulkHandler(e: ContextDeleteBulkEvent): void {
    if (this._eventCancelled(e)) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    e.detail.result = this.deleteBulk(e.detail.keys) as Promise<ContextDeleteRecord[]>;
  }

  protected _readDeletedRecordKeys(records: ContextDeleteRecord[]): string[] {
    const ids: string[] = [];
    records.forEach((item) => {
      if (!item || !item.key) {
        throw new Error(`Invalid or missing "ContextDeleteRecord" definition.`);
      }
      ids.push(item.key);
    });
    return ids;
  }
}
