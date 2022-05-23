import { ContextDeleteEvent, ContextReadEvent, ContextUpdateEvent, IRequestUiMeta, ContextChangeRecord, ContextDeleteRecord } from '@api-client/core/build/browser.js';
import { IRequestUiInsertDetail } from './AppDataEvents.js';
import { EventTypes } from './EventTypes.js';

export const HttpProjectEvents = {
  /**
   * Informs the application that the HttpProject has changed
   * The view should be updated and the project should be stored in the store.
   * 
   * @param target Optional event target.
   */
  changed: (target = document.body): void => {
    const e = new Event(EventTypes.HttpProject.changed, {
      bubbles: true,
      composed: true,
      cancelable: true,
    });
    target.dispatchEvent(e);
  },
  State: Object.freeze({
    /**
     * A specialized event to the general `change` to inform that a project item's 
     * name has changes. Since the name exist in various contexts these have to be informed 
     * about the change.
     * 
     * @param key The key of the changed item
     * @param kind The kind of the changed item
     */
    nameChanged: (key: string, kind: string, target = document.body): void => {
      const e = new CustomEvent(EventTypes.HttpProject.State.nameChanged, {
        bubbles: true,
        composed: true,
        cancelable: true,
        detail: {
          key, kind,
        },
      });
      target.dispatchEvent(e);
    },
  }),

  Ui: Object.freeze({
    /**
     * Triggered when a project is removed from a space.
     * Cleans the UI state for all data stored under the project.
     * 
     * @param id The project id.
     * @param target Optional events target
     */
    delete: async (id: string, target: EventTarget=document.body): Promise<ContextDeleteRecord | undefined> => {
      const e = new ContextDeleteEvent(EventTypes.HttpProject.Ui.delete, id);
      target.dispatchEvent(e);
      return e.detail.result;
    },
    HttpRequest: Object.freeze({
      /**
       * Sets an UI state for an HTTP request in a project
       * 
       * @param pid The project id.
       * @param id The id of the request.
       * @param target Optional events target
       * @returns The created object or undefined when the context store was not initialized.
       */
      set: async (pid: string, id: string, meta: IRequestUiMeta, target: EventTarget=document.body): Promise<ContextChangeRecord<IRequestUiMeta> | undefined> => {
        const e = new ContextUpdateEvent<IRequestUiInsertDetail, IRequestUiMeta>(EventTypes.HttpProject.Ui.HttpRequest.set, { 
          item: {
            id,
            pid,
            meta,
          },
          parent: pid,
        });
        target.dispatchEvent(e);
        return e.detail.result;
      },
      /**
       * Reads an UI state for an HTTP request in a project
       * 
       * @param pid The project id.
       * @param id The id of the request.
       * @param target Optional events target
       */
      get: async (pid: string, id: string, target: EventTarget=document.body): Promise<IRequestUiMeta | undefined> => {
        const e = new ContextReadEvent<IRequestUiMeta>(EventTypes.HttpProject.Ui.HttpRequest.get, id, pid);
        target.dispatchEvent(e);
        return e.detail.result;
      },
      /**
       * Deletes an UI state for an HTTP request in a project
       * 
       * @param pid The project id.
       * @param id The id of the request.
       * @param target Optional events target
       */
      delete: async (pid: string, id: string, target: EventTarget=document.body): Promise<ContextDeleteRecord | undefined> => {
        const e = new ContextDeleteEvent(EventTypes.HttpProject.Ui.HttpRequest.delete, id, pid);
        target.dispatchEvent(e);
        return e.detail.result;
      },
    }),
  }),
};
