/* eslint-disable max-classes-per-file */
import { EventTypes } from '../../EventTypes.js';

export const storesSymbol = Symbol('stores');

/**
 * An event to be dispatched by the UI to destroy all data in a data
 * store.
 */
export class ModelDeleteEvent extends CustomEvent<{ result: Promise<void>[] | undefined }> {
  [storesSymbol]: string[];

  /**
   * @param stores A list of store names to delete the data from
   */
  constructor(stores: string[]) {
    if (!Array.isArray(stores)) {
      throw new Error('The stores expected to be an array.');
    }
    super(EventTypes.HttpClient.Model.destroy, {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: {
        result: undefined,
      },
    });
    this[storesSymbol] = stores;
  }

  /**
   * The list of stores used to initialize the event.
   */
  get stores(): string[] {
    return this[storesSymbol];
  }
}

/**
 * An event dispatched by the data store to inform the application that a data model
 * has been destroyed.
 */
export class ModelStateDeleteEvent extends Event {
  [storesSymbol]: string;

  /**
   * @param store The name of the deleted store
   */
  constructor(store: string) {
    if (typeof store !== 'string') {
      throw new Error('The store expected to be a string.');
    }
    super(EventTypes.HttpClient.Model.destroyed, {
      bubbles: true,
      composed: true,
    });
    this[storesSymbol] = store;
  }

  /**
   * The name of the deleted store used to initialize the event.
   */
  get store(): string {
    return this[storesSymbol];
  }
}
