import { ModelDeleteEvent, ModelStateDeleteEvent } from "./http-client/models/BaseEvents.js";
import { AuthDataEvents } from './http-client/models/AuthDataEvents.js';
import { CertificatesEvents } from './http-client/models/CertificatesEvents.js';
import { HistoryEvents } from './http-client/models/HistoryEvents.js';
import { ProjectEvents } from './http-client/models/ProjectEvents.js';
import { HostsEvents } from './http-client/models/HostsEvents.js';
import { StoreName } from "../http-client/idb/Base.js";
import { EventTypes } from "./EventTypes.js";

export const HttpClientEvents = Object.freeze({
  Model: Object.freeze({
    /**
     * Dispatches an event handled by the data store to destroy a data store.
     *
     * @param stores A list of store names to affect
     * @param target A node on which to dispatch the event.
     * @returns A promise resolved when all requested stores are deleted
     */
    destroy: async (stores: StoreName[], target: EventTarget = window): Promise<void> => {
      const e = new ModelDeleteEvent(stores);
      target.dispatchEvent(e);
      if (Array.isArray(e.detail.result)) {
        await Promise.all(e.detail.result);
      }
    },
    /**
     * Dispatches an event information the app that a store has been destroyed.
     *
     * @param store The name of the deleted store
     * @param target A node on which to dispatch the event.
     */
    destroyed: (store: StoreName, target: EventTarget = window) => {
      const e = new ModelStateDeleteEvent(store);
      target.dispatchEvent(e);
    },

    /**
     * An event dispatches when a datastore state has been restored and any UI
     * that uses a database should renew data.
     * 
     * @param target A node on which to dispatch the event.
     */
    restored: (target: EventTarget = window): void => {
      const e = new Event(EventTypes.HttpClient.Model.restored);
      target.dispatchEvent(e);
    },
  
    AuthData: AuthDataEvents,
    Certificate: CertificatesEvents,
    History: HistoryEvents,
    Project: ProjectEvents,
    Host: HostsEvents,
  }),
});
