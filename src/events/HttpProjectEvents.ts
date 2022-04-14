import { EventTypes } from './EventTypes.js';

export const HttpProjectEvents = {
  /**
   * Informs the application that the HttpProject has changed
   * internally and the view should be updated and project stored in the store.
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
};
