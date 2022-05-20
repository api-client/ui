import { ARCModelDeleteEvent, ARCModelStateDeleteEvent } from "./BaseEvents.js";
import { AuthDataEvents } from './AuthDataEvents.js';
import { CertificatesEvents } from './CertificatesEvents.js';

export const ArcModelEvents = Object.freeze({
  /**
   * Dispatches an event handled by the data store to destroy a data store.
   *
   * @param stores A list of store names to affect
   * @param target A node on which to dispatch the event.
   * @returns A promise resolved when all requested stores are deleted
   */
  destroy: async (stores: string[], target: EventTarget = window): Promise<void> => {
    const e = new ARCModelDeleteEvent(stores);
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
  destroyed: (store: string, target: EventTarget = window) => {
    const e = new ARCModelStateDeleteEvent(store);
    target.dispatchEvent(e);
  },

  AuthData: AuthDataEvents,
  ClientCertificate: CertificatesEvents,
});
