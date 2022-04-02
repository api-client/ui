import { uuidV4, IBackendInfo } from '@api-client/core/build/browser.js';
import { IConfigInit } from '../../events/StoreEvents.js';
import { Events } from '../../events/Events.js';
import { HttpStore, ISessionInitInfo } from '../../store/HttpStore.js';
import { StoreBindings } from '../base/StoreBindings.js';
import { IConfigEnvironment } from '../../lib/config/Config.js';
import { navigatePage } from '../../lib/route.js';
import { EnvironmentsKey } from '../base/ConfigurationBindings.js';

/**
 * API store bindings that handles communication with the store.
 */
export class WebStoreBindings extends StoreBindings {
  /**
   * The base URI of the "local" store to be used when the user chooses 
   * the local store over the 
   */
  storeBaseUri: string;

  /**
   * @param storeBaseUri The base URI of the "local" store to be used when the user chooses 
   * the local store over the 
   */
  constructor(storeBaseUri: string) {
    super();
    this.storeBaseUri = storeBaseUri;
  }

  /**
   * Initializes the environment in the application configuration.
   * 
   * It tests whether the store requires authentication and if so, 
   * it redirects the current window to the authentication dialog.
   */
  async initStoreEnvironment(init: IConfigInit): Promise<void> {
    let store: HttpStore;
    if (init.source === 'local-store') {
      store = new HttpStore(this.storeBaseUri);
    } else {
      store = new HttpStore(init.location as string);
    }
    const env: IConfigEnvironment = {
      key: uuidV4(),
      location: store.url,
      name: init.name || 'Default',
      source: init.source,
      authenticated: false,
    };
    const info = await store.sdk.store.getInfo();
    if (info.mode === 'single-user') {
      // this store does not require authentication but does require setting up 
      // a session.
      await store.getStoreSessionToken(env);
      // this event is handled by the application controller 
      // and redirects the user to the next step.
      await Events.Config.Environment.add(env, true);
    } else {
      // the store needs authentication. We redirect the user to the 
      // authentication screen.
      await Events.Config.Session.set(`${EnvironmentsKey}.creating`, env);
      navigatePage('ConfigAuthenticate.html');
    }
    // http://localhost:8487/v1/
    // http://localhost:8489/v1/
  }

  /**
   * Reads the backend information about the store.
   * 
   * @param baseUri Store's base URI.
   */
  async readStoreInfo(baseUri: string): Promise<IBackendInfo> {
    const store = new HttpStore(baseUri);
    return store.sdk.store.getInfo();
  }

  /**
   * Authenticates the environment with the store.
   * @param env The environment to authenticate.
   */
  async authenticateStore(env: IConfigEnvironment): Promise<ISessionInitInfo> {
    const { location } = env;
    if (!location) {
      throw new Error(`Store location not found.`);
    }
    const store = new HttpStore(location);
    return store.getStoreSessionToken(env);
  }
}
