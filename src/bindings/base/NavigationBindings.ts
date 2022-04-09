import { PlatformBindings } from './PlatformBindings.js';
import { EventTypes } from '../../events/EventTypes.js';

/**
 * Global navigation bindings.
 * This class handles navigation that cannot be handled by any specific
 * application in the suite but rather the event should be transferred
 * to the main process.
 * 
 * An example of such is the store configuration which is handled by the main process
 * instead of an application.
 */
export abstract class NavigationBindings extends PlatformBindings {
  async initialize(): Promise<void> {
    window.addEventListener(EventTypes.Navigation.Store.config, this.storeConfigHandler.bind(this));
  }

  protected storeConfigHandler(e: Event): void {
    e.preventDefault();
    this.openStoreConfiguration();
  }

  /**
   * Opens a new window with the store configuration
   */
  abstract openStoreConfiguration(): Promise<void>;
}
