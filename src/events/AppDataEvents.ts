import { IUrl, ContextDeleteEvent, ContextReadEvent, ContextUpdateEvent, IRequestUiMeta, ContextChangeRecord, ContextDeleteRecord } from '@api-client/core/build/browser.js';
import { EventTypes } from './EventTypes.js';

export interface IRequestUiInsertDetail {
  pid: string;
  id: string;
  meta: IRequestUiMeta;
}

export const AppDataEvents = Object.freeze({
  Http: Object.freeze({
    UrlHistory: Object.freeze({
      /**
       * Adds a new URL to the URL history store.
       * @param url the URL to store.
       * @param target Optional events target
       */
      add: async (url: string, target: EventTarget=document.body): Promise<void> => {
        const e = new CustomEvent(EventTypes.AppData.Http.UrlHistory.add, {
          bubbles: true,
          cancelable: true,
          composed: true,
          detail: {
            url,
            result: undefined,
          },
        });
        target.dispatchEvent(e);
        await ((e.detail.result as unknown) as Promise<void>);
      },
      /**
       * Queries for the URL history data.
       * @param q The part of URL to query for.
       * @param target Optional events target
       */
      query: async (q: string, target: EventTarget=document.body): Promise<IUrl[]> => {
        const e = new CustomEvent(EventTypes.AppData.Http.UrlHistory.query, {
          bubbles: true,
          cancelable: true,
          composed: true,
          detail: {
            q,
            result: undefined,
          },
        });
        target.dispatchEvent(e);
        return ((e.detail.result as unknown) as Promise<IUrl[]>);
      },
      /**
       * Deletes a single URL from the store.
       * @param url The full stored URL to remove
       * @param target Optional events target
       */
      delete: async (url: string, target: EventTarget=document.body): Promise<void> => {
        const e = new CustomEvent(EventTypes.AppData.Http.UrlHistory.delete, {
          bubbles: true,
          cancelable: true,
          composed: true,
          detail: {
            url,
            result: undefined,
          },
        });
        target.dispatchEvent(e);
        await ((e.detail.result as unknown) as Promise<void>);
      },
      /**
       * Clears the URL history store completely.
       * @param target Optional events target
       */
      clear: async (target: EventTarget=document.body): Promise<void> => {
        const e = new CustomEvent(EventTypes.AppData.Http.UrlHistory.clear, {
          bubbles: true,
          cancelable: true,
          composed: true,
          detail: {
            result: undefined,
          },
        });
        target.dispatchEvent(e);
        await ((e.detail.result as unknown) as Promise<void>);
      },
      State: Object.freeze({
        /**
         * Notifies the application that the history store has been cleared.
         * @param target Optional events target
         */
        clear: (target: EventTarget=document.body): void => {
          const e = new Event(EventTypes.AppData.Http.UrlHistory.State.clear, {
            bubbles: true,
            cancelable: false,
            composed: true,
          });
          target.dispatchEvent(e);
        },
        /**
         * Notifies the application a history URL has been removed from the store.
         * @param target Optional events target
         */
        delete: (url: string, target: EventTarget=document.body): void => {
          const e = new CustomEvent(EventTypes.AppData.Http.UrlHistory.State.delete, {
            bubbles: true,
            cancelable: false,
            composed: true,
            detail: url,
          });
          target.dispatchEvent(e);
        },
      }),
    }),
    Ui: Object.freeze({
      HttpProject: Object.freeze({
        /**
         * Triggered when a project is removed from a space.
         * Cleans the UI state for all data stored under the project.
         * 
         * @param id The project id.
         * @param target Optional events target
         */
        delete: async (id: string, target: EventTarget=document.body): Promise<ContextDeleteRecord | undefined> => {
          const e = new ContextDeleteEvent(EventTypes.AppData.Ui.HttpProject.delete, id);
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
            const e = new ContextUpdateEvent<IRequestUiInsertDetail, IRequestUiMeta>(EventTypes.AppData.Ui.HttpProject.HttpRequest.set, { 
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
            const e = new ContextReadEvent<IRequestUiMeta>(EventTypes.AppData.Ui.HttpProject.HttpRequest.get, id, pid);
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
            const e = new ContextDeleteEvent(EventTypes.AppData.Ui.HttpProject.HttpRequest.delete, id, pid);
            target.dispatchEvent(e);
            return e.detail.result;
          },
        }),
      }),
    }),
  }),
});
