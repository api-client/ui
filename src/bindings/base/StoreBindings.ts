import { IBackendInfo } from '@api-client/core/build/browser.js';
import { PlatformBindings } from './PlatformBindings.js';
import { EventTypes } from '../../events/EventTypes.js';
import { IConfigInit } from '../../events/StoreEvents.js';
import { IConfigEnvironment } from '../../lib/config/Config.js';
import { ISessionInitInfo } from '../../store/HttpStore.js';

/**
 * The base class for API store bindings.
 */
export abstract class StoreBindings extends PlatformBindings {
  async initialize(): Promise<void> {
    window.addEventListener(EventTypes.Store.initEnvironment, this.initEnvHandler.bind(this));
    window.addEventListener(EventTypes.Store.info, this.storeInfoHandler.bind(this));
    window.addEventListener(EventTypes.Auth.authenticate, this.storeAuthHandler.bind(this));
  }

  protected initEnvHandler(input: Event): void {
    const e = input as CustomEvent;
    e.preventDefault();
    this.initStoreEnvironment(e.detail);
  }

  protected storeInfoHandler(input: Event): void {
    const e = input as CustomEvent;
    e.preventDefault();
    e.detail.result = this.readStoreInfo(e.detail.baseUri);
  }

  protected storeAuthHandler(input: Event): void {
    const e = input as CustomEvent;
    e.preventDefault();
    e.detail.result = this.authenticateStore(e.detail.env);
  }

  /**
   * Initializes the store configuration from the init data.
   * 
   * @param init The init data for the store environment.
   */
  abstract initStoreEnvironment(init: IConfigInit): Promise<void>;

  /**
   * Reads the backend information about the store.
   * 
   * @param baseUri Store's base URI.
   */
  abstract readStoreInfo(baseUri: string): Promise<IBackendInfo>;

  /**
   * Authenticates the environment with the store.
   * @param env The environment to authenticate.
   */
  abstract authenticateStore(env: IConfigEnvironment): Promise<ISessionInitInfo>;
}
