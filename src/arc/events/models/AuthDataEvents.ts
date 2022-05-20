/* eslint-disable max-classes-per-file */
import { ARCAuthData } from '@api-client/core/build/legacy.js';
import { IARCEntityChangeRecord } from '../../idb/Base.js';
import { ArcModelEventTypes } from './ArcModelEventTypes.js';
import { IArcEventWithResult } from './BaseEvents.js';

export const urlValue = Symbol('urlValue');
export const methodValue = Symbol('methodValue');
export const authDataValue = Symbol('authDataValue');
export const changeRecordValue = Symbol('changeRecordValue');

/**
 * An event dispatched to the store to update an authorization data object.
 */
export class ARCAuthDataUpdateEvent extends CustomEvent<IArcEventWithResult<IARCEntityChangeRecord<ARCAuthData>>> {
  [urlValue]: string;

  [methodValue]: string;

  [authDataValue]: ARCAuthData;

  /**
   * The URL of the request associated with the authorization method
   */
  get url(): string {
    return this[urlValue];
  }

  /**
   * The name of the authorization method
   */
  get method(): string {
    return this[methodValue];
  }

  /**
   * The authorization data to store.
   */
  get authData(): ARCAuthData {
    return this[authDataValue];
  }

  /**
   * @param url The URL of the request associated with the authorization method
   * @param method The name of the authorization method
   * @param authData The authorization data to store.
   */
  constructor(url: string, method: string, authData: ARCAuthData) {
    if (typeof url !== 'string') {
      throw new Error('Expected url argument as string.');
    }
    if (typeof method !== 'string') {
      throw new Error('Expected method argument as string.');
    }
    if (!authData) {
      throw new Error('Expected authData argument as an object.');
    }
    super(ArcModelEventTypes.AuthData.update, {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: {
        result: undefined,
      }
    });
    this[urlValue] = url;
    this[methodValue] = method;
    this[authDataValue] = authData;
  }
}

/**
 * An event dispatched to the store to query for the authorization data
 */
export class ARCAuthDataQueryEvent extends CustomEvent<IArcEventWithResult<ARCAuthData | undefined>> {
  [urlValue]: string;

  [methodValue]: string;

  /**
   * @return The URL of the request associated with the authorization method
   */
  get url(): string {
    return this[urlValue];
  }

  /**
   * @return The name of the authorization method
   */
  get method(): string {
    return this[methodValue];
  }

  /**
   * @param url The URL of the request associated with the authorization method
   * @param method The name of the authorization method
   */
  constructor(url: string, method: string) {
    if (typeof url !== 'string') {
      throw new Error('Expected url argument as string.');
    }
    if (typeof method !== 'string') {
      throw new Error('Expected method argument as string.');
    }
    super(ArcModelEventTypes.AuthData.query, {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: {
        result: undefined,
      }
    });
    this[urlValue] = url;
    this[methodValue] = method;
  }
}

/**
 * An event dispatched from the store after updating an authorization data
 */
export class ARCAuthDataUpdatedEvent extends Event {
  [changeRecordValue]: IARCEntityChangeRecord<ARCAuthData>;

  /**
   * The change record
   */
  get changeRecord(): IARCEntityChangeRecord<ARCAuthData> {
    return this[changeRecordValue];
  }

  /**
   * The AuthData change record.
   */
  constructor(record: IARCEntityChangeRecord<ARCAuthData>) {
    if (!record) {
      throw new Error('Expected record argument as object.');
    }
    super(ArcModelEventTypes.AuthData.State.update, {
      bubbles: true,
      composed: true,
    });
    this[changeRecordValue] = record;
  }
}

export class AuthDataEvents {
  /**
   * Dispatches an event handled by the data store to update an authorization data.
   *
   * @param target A node on which to dispatch the event.
   * @param url The URL of the request associated with the authorization method
   * @param method The name of the authorization method
   * @param authData The authorization data to store.
   * @returns Promise resolved to a the auth change record
   */
  static async update(url: string, method: string, authData: ARCAuthData, target: EventTarget = window): Promise<IARCEntityChangeRecord<ARCAuthData> | undefined> {
    const e = new ARCAuthDataUpdateEvent(url, method, authData);
    target.dispatchEvent(e);
    return e.detail.result;
  }

  /**
   * Dispatches an event handled by the data store to query for ARC authorization data
   *
   * @param target A node on which to dispatch the event.
   * @param url The URL of the request associated with the authorization method
   * @param method The name of the authorization method
   * @returns Promise resolved to a Project model.
   */
  static async query(url: string, method: string, target: EventTarget = window): Promise<ARCAuthData | undefined> {
    const e = new ARCAuthDataQueryEvent(url, method);
    target.dispatchEvent(e);
    return e.detail.result;
  }

  static State = class {
    /**
     * Dispatches an event informing about a change in the auth data model.
     *
     * @param target A node on which to dispatch the event.
     * @param record AuthData change record.
     */
    static update(record: IARCEntityChangeRecord<ARCAuthData>, target: EventTarget = window): void {
      const e = new ARCAuthDataUpdatedEvent(record);
      target.dispatchEvent(e);
    }
  }
}
