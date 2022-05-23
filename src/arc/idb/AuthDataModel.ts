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
import { ContextChangeRecord, IAuthorizationData } from '@api-client/core/build/browser.js';
import { Base } from './Base.js';
import { ARCAuthDataQueryEvent, ARCAuthDataUpdateEvent } from '../../events/http-client/models/AuthDataEvents.js';
import { EventTypes } from '../../events/EventTypes.js';
import { Events } from '../../events/Events.js';

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
    super('AuthCache');
    this[queryHandler] = this[queryHandler].bind(this);
    this[updateHandler] = this[updateHandler].bind(this);
  }

  async put(value: IAuthorizationData): Promise<ContextChangeRecord<IAuthorizationData>> {
    const result = await super.put(value) as ContextChangeRecord<IAuthorizationData>;
    Events.HttpClient.Model.AuthData.State.update(result, this.eventsTarget);
    return result;
  }

  async putBulk(values: IAuthorizationData[]): Promise<ContextChangeRecord<IAuthorizationData>[]> {
    const result = await super.putBulk(values) as ContextChangeRecord<IAuthorizationData>[];
    result.forEach(record => Events.HttpClient.Model.AuthData.State.update(record, this.eventsTarget));
    return result;
  }

  async get(key: string): Promise<IAuthorizationData | undefined> {
    return super.get(key) as Promise<IAuthorizationData | undefined>;
  }

  async getBulk(keys: string[]): Promise<(IAuthorizationData | undefined)[]> {
    return super.getBulk(keys) as Promise<(IAuthorizationData | undefined)[]>;
  }

  listen(node: EventTarget): void {
    super.listen(node);
    node.addEventListener(EventTypes.HttpClient.Model.AuthData.query, this[queryHandler] as EventListener);
    node.addEventListener(EventTypes.HttpClient.Model.AuthData.update, this[updateHandler] as EventListener);
  }

  unlisten(node: EventTarget): void {
    super.unlisten(node);
    node.removeEventListener(EventTypes.HttpClient.Model.AuthData.query, this[queryHandler] as EventListener);
    node.removeEventListener(EventTypes.HttpClient.Model.AuthData.update, this[updateHandler] as EventListener);
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
  async query(url: string, authMethod: string): Promise<IAuthorizationData | undefined> {
    const parsedUrl = normalizeUrl(url);
    const key = computeKey(authMethod, parsedUrl);
    try {
      return await this.get(key);
    } catch (cause) {
      return undefined;
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
  async update(url: string, authMethod: string, authData: IAuthorizationData): Promise<ContextChangeRecord<IAuthorizationData>> {
    const parsedUrl = normalizeUrl(url);
    const key = computeKey(authMethod, parsedUrl);
    let stored: IAuthorizationData | undefined;
    try {
      stored = await this.get(key);
    } catch (error) {
      // ...
    }
    if (!stored) {
      stored = { key };
    }
    const doc = { ...stored, ...authData, key } as IAuthorizationData;
    const result = await this.put(doc) as ContextChangeRecord<IAuthorizationData>;
    return result;
  }
}
