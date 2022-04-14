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
    window.addEventListener(EventTypes.Navigation.HttpProject.open, this.httpProjectOpenHandler.bind(this));
  }

  protected storeConfigHandler(e: Event): void {
    e.preventDefault();
    this.openStoreConfiguration();
  }

  protected httpProjectOpenHandler(e: Event): void {
    e.preventDefault();
    const ev = e as CustomEvent;
    this.openHttpProject(ev.detail.key);
  }

  /**
   * Opens a new window with the store configuration
   */
  abstract openStoreConfiguration(): Promise<void>;

  /**
   * Opens a new window with the HTTP Project
   * @param id the project id.
   */
  abstract openHttpProject(id: string): Promise<void>;
}
