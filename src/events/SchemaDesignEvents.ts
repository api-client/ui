import { EventTypes } from './EventTypes.js';

export const SchemaDesignEvents = {
  /**
   * Informs the application that the DataNamespace has changed
   * 
   * @param target Optional event target.
   */
  changed: (target = document.body): void => {
    const e = new Event(EventTypes.SchemaDesign.changed, {
      bubbles: true,
      composed: true,
      cancelable: true,
    });
    target.dispatchEvent(e);
  },
  State: Object.freeze({
    /**
     * A specialized event to the general `change` to inform that a namespace item's 
     * name has changes. Since the name exist in various contexts these have to be informed 
     * about the change.
     * 
     * @param key The key of the changed item
     * @param kind The kind of the changed item
     */
    nameChanged: (key: string, kind: string, target = document.body): void => {
      const e = new CustomEvent(EventTypes.SchemaDesign.State.nameChanged, {
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
