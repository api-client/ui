/* eslint-disable max-classes-per-file */
import { IARCModelListOptions } from '../../idb/Base.js';
import { ArcModelEventTypes } from './ArcModelEventTypes.js';

export const idValue = Symbol('idValue');
export const revisionValue = Symbol('revisionValue');
export const limitValue = Symbol('limitValue');
export const nextPageTokenValue = Symbol('nextPageTokenValue');
export const storesValue = Symbol('storesValue');

export interface IArcEventWithResult<T = unknown> {
  result: Promise<T> | undefined;
}

/**
 * An event dispatched by the store after deleting an entity.
 * Check the event type to learn which type of an entity was deleted.
 */
export class ARCEntityDeletedEvent extends Event {
  [idValue]: string;

  [revisionValue]: string;

  /**
   * @param type The event type
   * @param id Entity id
   * @param rev Entity updated revision id
   */
  constructor(type: string, id: string, rev: string) {
    if (typeof type !== 'string') {
      throw new Error('The type argument expected to be a string.');
    }
    if (typeof id !== 'string') {
      throw new Error('The id argument expected to be a string.');
    }
    if (typeof rev !== 'string') {
      throw new Error('The rev argument expected to be a string.');
    }
    super(type, {
      bubbles: true,
      composed: true,
    });
    this[idValue] = id;
    this[revisionValue] = rev;
  }

  /**
   * The id of the deleted entity
   */
  get id(): string {
    return this[idValue];
  }

  /**
   * The new revision id.
   */
  get rev(): string {
    return this[revisionValue];
  }
}

/**
 * A base class for data store query events.
 */
export class ARCEntityListEvent<T = unknown> extends CustomEvent<IArcEventWithResult<T>> {
  [limitValue]?: number;

  [nextPageTokenValue]?: string;

  /**
   * The number of results per the page.
   */
  get limit(): number | undefined {
    return this[limitValue];
  }

  /**
   * A string that should be used with pagination.
   */
  get nextPageToken() : string | undefined {
    return this[nextPageTokenValue];
  }

  /**
   * @param type The event type
   * @param opts The query options.
   */
  constructor(type: string, opts: IARCModelListOptions={}) {
    if (typeof type !== 'string') {
      throw new Error('The type argument expected to be a string.');
    }
    super(type, {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: {
        result: undefined,
      },
    });

    this[limitValue] = opts.limit;
    this[nextPageTokenValue] = opts.nextPageToken;
  }
}

/**
 * An event to be dispatched by the UI to destroy all data in a data
 * store.
 */
export class ARCModelDeleteEvent extends CustomEvent<{ result: Promise<void>[] | undefined }> {
  [storesValue]: string[];

  /**
   * @param stores A list of store names to delete the data from
   */
  constructor(stores: string[]) {
    if (!Array.isArray(stores)) {
      throw new Error('The stores expected to be an array.');
    }
    super(ArcModelEventTypes.destroy, {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: {
        result: undefined,
      },
    });
    this[storesValue] = stores;
  }

  /**
   * The list of stores used to initialize the event.
   */
  get stores(): string[] {
    return this[storesValue];
  }
}

/**
 * An event dispatched by the data store to inform the application that a data model
 * has been destroyed.
 */
export class ARCModelStateDeleteEvent extends Event {
  [storesValue]: string;

  /**
   * @param store The name of the deleted store
   */
  constructor(store: string) {
    if (typeof store !== 'string') {
      throw new Error('The store expected to be a string.');
    }
    super(ArcModelEventTypes.destroyed, {
      bubbles: true,
      composed: true,
    });
    this[storesValue] = store;
  }

  /**
   * The name of the deleted store used to initialize the event.
   */
  get store(): string {
    return this[storesValue];
  }
}
