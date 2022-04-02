import { IBackendInfo } from '@api-client/core/build/browser.js';
import { DataSourceType } from '../lib/config/Config.js';
import { EventTypes } from './EventTypes.js';

export type ConfigInitReason = 'first-run';

export interface IConfigInit {
  source: DataSourceType;
  reason: ConfigInitReason;
  location?: string;
  name?: string;
}

export const StoreEvents = Object.freeze({
  /**
     * Initializes the store configuration for the application.
     * 
     * @param init The configuration initialization.
     * @param target Optional events target.
     */
   initEnvironment: (init: IConfigInit, target: EventTarget=document.body): void => {
    const e = new CustomEvent(EventTypes.Store.initEnvironment, {
      bubbles: true,
      cancelable: true,
      composed: true,
      detail: init,
    });
    target.dispatchEvent(e);
  },

  /**
   * Reads the information about the data store.
   * 
   * @param baseUri The store's base URI
   * @param target Optional events target.
   */
  storeInfo: async (baseUri: string, target: EventTarget=document.body): Promise<IBackendInfo> => {
    const e = new CustomEvent(EventTypes.Store.info, {
      bubbles: true,
      cancelable: true,
      composed: true,
      detail: {
        baseUri,
        result: undefined,
      },
    });
    target.dispatchEvent(e);
    return ((e.detail.result as unknown) as Promise<IBackendInfo>);
  },
});
