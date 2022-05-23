import { EventTypes } from './EventTypes.js';

export const HttpEvents = {
  Request: Object.freeze({
    /**
     * Requests the application to send a project request
     * @param target Optional events target.
     */
    send: (target = document.body): void => {
      const e = new Event(EventTypes.Http.Request.send, {
        bubbles: true,
        composed: true,
        cancelable: true,
      });
      target.dispatchEvent(e);
    },
    /**
     * Dispatches an event requesting to change a name of a request in a Project.
     * @param key The request key.
     * @param name The new name to set
     * @param target Optional events target.
     */
    rename: (key: string, name: string, target = document.body): void => {
      const e = new CustomEvent(EventTypes.Http.Request.rename, {
        bubbles: true,
        composed: true,
        cancelable: true,
        detail: {
          key, name,
        },
      });
      target.dispatchEvent(e);
    },
    State: Object.freeze({
      /**
       * Dispatches an event that informs the HTTP project's request that the url has changed.
       * @param value The value of the request url
       * @param target Optional events target
       */
      urlChange: (value: string, target = document.body): void => {
        const e = new CustomEvent(EventTypes.Http.Request.State.urlChange, {
          bubbles: true,
          composed: true,
          cancelable: true,
          detail: { value },
        });
        target.dispatchEvent(e);
      },
      /**
       * Dispatches an event that informs the HTTP project's request that a content type header has changed.
       * @param value The value of the content-type header
       * @param target Optional events target
       */
      contentTypeChange: (value: string, target = document.body): void => {
        const e = new CustomEvent(EventTypes.Http.Request.State.contentTypeChange, {
          bubbles: true,
          composed: true,
          cancelable: true,
          detail: { value },
        });
        target.dispatchEvent(e);
      },
    }),
  }),
}
