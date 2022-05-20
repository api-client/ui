/**
@license
Copyright 2017 The Advanced REST client authors <arc@mulesoft.com>
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
import { ARCAuthData } from '@api-client/core/build/legacy.js';
import { ArcModelEventTypes } from '../events/models/ArcModelEventTypes.js';
import { ARCAuthDataQueryEvent, ARCAuthDataUpdateEvent } from '../events/models/AuthDataEvents.js';
import { Base, IARCEntityChangeRecord } from './Base.js';
import { ArcModelEvents } from '../events/models/ArcModelEvents.js';

/**
 * Removes query parameters and the fragment part from the URL
 * 
 * @param url The URL to process
 * @return The canonical URL.
 */
export function normalizeUrl(url: string): string {
  if (!url) {
    return '';
  }
  try {
    const u = new URL(url);
    u.hash = '';
    u.search = '';
    let result = u.toString();
    // polyfill library leaves '?#'
    result = result.replace('?', '');
    result = result.replace('#', '');
    return result;
  } catch (e) {
    return url;
  }
}

/**
 * Computes the database key for auth data
 *
 * @param method The Authorization method to restore data for.
 * @param url The URL of the request
 * @returns The datastore key for auth data
 */
export function computeKey(method: string, url?: string): string {
  let path = `${method}/`;
  if (url) {
    path += encodeURIComponent(url);
  }
  return path;
}

export const queryHandler = Symbol('queryHandler');
export const updateHandler = Symbol('updateHandler');

/**
 * Model for authorization data stored in the application.
 */
export class AuthDataModel extends Base {
  constructor() {
    super('auth-data');
    this[queryHandler] = this[queryHandler].bind(this);
    this[updateHandler] = this[updateHandler].bind(this);
  }

  listen(node: EventTarget): void {
    super.listen(node);
    node.addEventListener(ArcModelEventTypes.AuthData.query, this[queryHandler] as EventListener);
    node.addEventListener(ArcModelEventTypes.AuthData.update, this[updateHandler] as EventListener);
  }

  unlisten(node: EventTarget): void {
    super.unlisten(node);
    node.removeEventListener(ArcModelEventTypes.AuthData.query, this[queryHandler] as EventListener);
    node.removeEventListener(ArcModelEventTypes.AuthData.update, this[updateHandler] as EventListener);
  }

  [queryHandler](e: ARCAuthDataQueryEvent): void {
    if (this._eventCancelled(e)) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();

    const { url, method } = e;
    e.detail.result = this.query(url, method);
  }

  /**
   * Queries for a datastore entry. Similar to `read()` but without using `id`
   * but rather the URL.
   *
   * @param url The URL of the request
   * @param authMethod The Authorization method to restore data for.
   */
  async query(url: string, authMethod: string): Promise<ARCAuthData | undefined> {
    const parsedUrl = normalizeUrl(url);
    const key = computeKey(authMethod, parsedUrl);
    try {
      return await this.db.get(key);
    } catch (cause) {
      const e = cause as PouchDB.Core.Error;
      /* istanbul ignore else */
      if (e && e.status === 404) {
        return undefined;
      }
      throw cause;
    }
  }

  [updateHandler](e: ARCAuthDataUpdateEvent): void {
    if (this._eventCancelled(e)) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    const { url, method, authData } = e;
    e.detail.result = this.update(url, method, authData);
  }

  /**
   * Creates or updates the auth data in the data store for given method and URl.
   *
   * @param url The URL of the request
   * @param authMethod The Authorization method to restore data for.
   * @param authData The authorization data to store. Schema depends on
   * the `authMethod` property. From model standpoint schema does not matter.
   */
  async update(url: string, authMethod: string, authData: ARCAuthData): Promise<IARCEntityChangeRecord<ARCAuthData>> {
    const parsedUrl = normalizeUrl(url);
    const key = computeKey(authMethod, parsedUrl);
    const { db } = this;
    let stored;
    try {
      stored = await db.get(key);
    } catch (error) {
      const e = error as PouchDB.Core.Error;
      /* istanbul ignore else */
      if (e.status === 404) {
        stored = { _id: key };
      } else {
        this._handleException(error);
      }
    }
    const doc = { ...stored, ...authData } as ARCAuthData;
    const result = await db.put(doc);
    const oldRev = doc._rev;
    doc._rev = result.rev;
    const record: IARCEntityChangeRecord<ARCAuthData> = {
      id: key,
      rev: result.rev,
      item: doc,
      oldRev,
    };
    if (this.eventsTarget) {
      ArcModelEvents.AuthData.State.update(record, this.eventsTarget);
    }
    return record;
  }
}
