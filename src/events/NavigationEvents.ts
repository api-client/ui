import { EventTypes } from './EventTypes.js';

export const NavigationEvents = Object.freeze({
  HttpProject: Object.freeze({
    /**
     * Dispatches to the application an event asking to open a project.
     * 
     * @param key The project key.
     * @param target The events target.
     */
    open: (key: string, target: EventTarget=document.body): void => {
      const e = new CustomEvent(EventTypes.Navigation.HttpProject.open, {
        bubbles: true,
        cancelable: true,
        composed: true,
        detail: key,
      });
      target.dispatchEvent(e);
    },
  }),
  Store: Object.freeze({
    /**
     * Requests the application to open the screen with the store configuration.
     */
    config: (target: EventTarget=document.body): void => {
      const e = new Event(EventTypes.Navigation.Store.config, {
        bubbles: true,
        cancelable: true,
        composed: true,
      });
      target.dispatchEvent(e);
    },
  }),
});
