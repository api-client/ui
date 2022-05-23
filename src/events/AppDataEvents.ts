import { IUrl, ContextDeleteEvent, IRequestUiMeta, ContextQueryEvent } from '@api-client/core/build/browser.js';
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
      query: async (q: string, target: EventTarget=document.body): Promise<IUrl[] | undefined> => {
        const e = new ContextQueryEvent<IUrl>(EventTypes.AppData.Http.UrlHistory.query, {
          term: q,
        });
        target.dispatchEvent(e);
        return e.detail.result;
      },

      /**
       * Deletes a single URL from the store.
       * @param url The full stored URL to remove
       * @param target Optional events target
       */
      delete: async (url: string, target: EventTarget=document.body): Promise<void> => {
        const e = new ContextDeleteEvent(EventTypes.AppData.Http.UrlHistory.delete, url);
        target.dispatchEvent(e);
        await e.detail.result;
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
  }),
  Ws: Object.freeze({
    UrlHistory: Object.freeze({
      /**
       * Adds a new URL to the web socket history store.
       * @param url the URL to store.
       * @param target Optional events target
       */
      add: async (url: string, target: EventTarget=document.body): Promise<void> => {
        const e = new CustomEvent(EventTypes.AppData.Ws.UrlHistory.add, {
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
       * Queries for the seb socket URL history data.
       * @param q The part of URL to query for.
       * @param target Optional events target
       */
      query: async (q: string, target: EventTarget=document.body): Promise<IUrl[] | undefined> => {
        const e = new ContextQueryEvent<IUrl>(EventTypes.AppData.Ws.UrlHistory.query, {
          term: q,
        });
        target.dispatchEvent(e);
        return e.detail.result;
      },

      /**
       * Deletes a single web socket URL from the store.
       * @param url The full stored URL to remove
       * @param target Optional events target
       */
      delete: async (url: string, target: EventTarget=document.body): Promise<void> => {
        const e = new ContextDeleteEvent(EventTypes.AppData.Ws.UrlHistory.delete, url);
        target.dispatchEvent(e);
        await e.detail.result;
      },

      /**
       * Clears the web socket URL history store completely.
       * @param target Optional events target
       */
      clear: async (target: EventTarget=document.body): Promise<void> => {
        const e = new CustomEvent(EventTypes.AppData.Ws.UrlHistory.clear, {
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
         * Notifies the application that the web socket history store has been cleared.
         * @param target Optional events target
         */
        clear: (target: EventTarget=document.body): void => {
          const e = new Event(EventTypes.AppData.Ws.UrlHistory.State.clear, {
            bubbles: true,
            cancelable: false,
            composed: true,
          });
          target.dispatchEvent(e);
        },
        /**
         * Notifies the application a web socket history URL has been removed from the store.
         * @param target Optional events target
         */
        delete: (url: string, target: EventTarget=document.body): void => {
          const e = new CustomEvent(EventTypes.AppData.Ws.UrlHistory.State.delete, {
            bubbles: true,
            cancelable: false,
            composed: true,
            detail: url,
          });
          target.dispatchEvent(e);
        },
      }),
    }),
  }),
});
