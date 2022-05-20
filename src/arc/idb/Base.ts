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

import 'pouchdb/dist/pouchdb.js';
import { Events as CoreEvents } from '@api-client/core/build/browser.js'
import { Entity } from '@api-client/core/build/legacy.js';
import { ArcModelEventTypes } from '../events/models/ArcModelEventTypes.js';
import { ArcModelEvents } from '../events/models/ArcModelEvents.js';
import { ARCModelDeleteEvent } from '../events/models/BaseEvents.js';

/* eslint-disable class-methods-use-this */

export const deleteModelHandler = Symbol('deleteModelHandler');
export const notifyDestroyed = Symbol('notifyDestroyed');
export const createChangeRecord = Symbol('createChangeRecord');

export interface IBaseQueryOptions {
  limit: number;
  descending: boolean;
  include_docs: boolean;
}

export interface IArcPageToken {
  startkey: string,
  skip: number;
}

/**
 * Base query options for the data store.
 */
export interface IARCModelListOptions {
  /**
   * The number of results per the page.
   */
  limit?: number;
  /**
   * A string that should be used with pagination.
   */
  nextPageToken?: string;
}

/**
 * Data store query result object.
 */
export interface IARCModelListResult<T = unknown> {
  /**
   * Next page token to be used with pagination.
   * It is not set when the query has not returned any results.
   */
  nextPageToken?: string;
  /**
   * The list of items in the response.
   * May be empty array when there was no more results.
   */
  items: T[];
}

/**
 * Event detail object for data store query result object.
 */
export interface IARCModelListResultDetail<T = unknown> {
  result: Promise<IARCModelListResult<T>>;
}

/**
 * An entity change record base definition
 */
export interface IARCEntityChangeRecord<T = unknown> {
  /**
   * The ID of the changed entity
   */
  id: string;
  /**
   * The revision of the updated entity.
   * It is not set when old revision is unavailable (new entity is created).
   */
  oldRev?: string;
  /**
   * New revision id of updated entity
   */
  rev: string;
  /**
   * The updated entity.
   */
  item?: T;
}

export declare interface IDeletedEntity {
  /**
   * Pouch DB datastore `_id`
   */
  id: string;
  /**
   * Pouch DB datastore revision of the deleted object
   */
  rev: string;
}

/**
 * A base class for all models.
 */
export class Base {
  /**
   * Set with `listen()` method or separately. When set the model dispatch events on this node.
   * When not set the model does not dispatch events.
   */
  eventsTarget: EventTarget;

  /**
   * The name of the data store
   */
  name?: string;

  /**
   * The limit number of revisions on the data store.
   */
  revsLimit?: number;

  /**
   * @param dbName Name of the data store
   * @param revsLimit Limit number of revisions on the data store.
   */
  constructor(dbName?: string, revsLimit?: number) {
    this.name = dbName;
    this.revsLimit = revsLimit;
    this[deleteModelHandler] = this[deleteModelHandler].bind(this);
    this.eventsTarget = window;
  }

  /**
   * Note, the element does not include PouchDB to the document!
   * @returns A PouchDB instance.
   */
  get db(): PouchDB.Database {
    if (!this.name) {
      throw new Error('Model name not set');
    }
    const opts: PouchDB.Configuration.LocalDatabaseConfiguration = {};
    if (this.revsLimit) {
      opts.revs_limit = this.revsLimit;
    }
    return new PouchDB(this.name, opts);
  }

  /**
   * Database query options for pagination.
   * Override this value to change the query options like limit of the results in one call.
   *
   * This is query options passed to the PouchDB `allDocs` function. Note that it will not
   * set `include_docs` option. A convinced shortcut is to set the the `includeDocs` property
   * and the directive will be added automatically.
   */
  get defaultQueryOptions(): IBaseQueryOptions {
    return {
      limit: 25,
      descending: true,
      include_docs: true,
    };
  }

  /**
   * Listens for the DOM events.
   */
  listen(node: EventTarget): void {
    this.eventsTarget = node;
    node.addEventListener(ArcModelEventTypes.destroy, this[deleteModelHandler] as EventListener);
  }

  /**
   * Removes the DOM event listeners.
   */
  unlisten(node: EventTarget): void {
    node.removeEventListener(ArcModelEventTypes.destroy, this[deleteModelHandler] as EventListener);
  }

  /**
   * Reads an entry from the datastore.
   *
   * @param id The ID of the datastore entry.
   * @param rev Specific revision to read. Defaults to latest revision.
   * @returns Promise resolved to a datastore object.
   */
  async read<T = unknown>(id: string, rev?: string): Promise<T> {
    if (!id) {
      throw new Error('Missing identifier argument.');
    }
    const opts: PouchDB.Core.GetOptions = {};
    if (rev) {
      opts.rev = rev;
    }
    return this.db.get(id, opts);
  }

  /**
   * Handles any exception in the model in a unified way.
   * @param e An error object
   * @param noThrow If set the function will not throw error.
   * This allow to do the logic without stopping program.
   */
  _handleException(e: Error | unknown, noThrow?: boolean): void {
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
    const { name } = this;
    if (name) {
      await this.db.destroy();
      this[notifyDestroyed](name);
    }
  }

  /**
   * Notifies the application that the model has been removed and data destroyed.
   *
   * @param {string} store The name of the deleted store
   */
  [notifyDestroyed](store: string): void {
    if (this.eventsTarget) {
      ArcModelEvents.destroyed(store, this.eventsTarget);
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
  _eventCancelled(e: Event): boolean {
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
  decodePageToken(token: string): IArcPageToken | null {
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
  encodePageToken(params: IArcPageToken): string {
    const str = JSON.stringify(params);
    return btoa(str);
  }

  /**
   * Lists all project objects.
   *
   * @param db Reference to a database
   * @param opts Query options.
   * @returns A promise resolved to a list of entities.
   */
  async listEntities(db: PouchDB.Database, opts: IARCModelListOptions = {}): Promise<IARCModelListResult> {
    const { limit, nextPageToken } = opts;
    let queryOptions = this.defaultQueryOptions;
    if (limit) {
      queryOptions.limit = limit;
    }
    if (nextPageToken) {
      const pageOptions = this.decodePageToken(nextPageToken);
      if (pageOptions) {
        queryOptions = { ...queryOptions, ...pageOptions };
      }
    }
    let items: unknown[] = [];
    let token;
    const response = await db.allDocs(queryOptions);
    if (response && response.rows.length > 0) {
      const params: IArcPageToken = {
        startkey: response.rows[response.rows.length - 1].key,
        skip: 1,
      }
      token = this.encodePageToken(params);
      items = response.rows.map((item) => item.doc);
    }
    return {
      items,
      nextPageToken: token,
    }
  }

  /**
   * Generates a change record for an update operation
   * @param item Changed entity
   * @param response The data store response
   * @param oldRev The revision before the change
   */
  [createChangeRecord](item: Entity, response: PouchDB.Core.Response, oldRev?: string): IARCEntityChangeRecord {
    // eslint-disable-next-line no-param-reassign
    item._rev = response.rev;
    const result: IARCEntityChangeRecord = {
      id: item._id as string,
      rev: response.rev,
      item,
    }
    if (oldRev) {
      result.oldRev = oldRev;
    }
    return result;
  }
}
