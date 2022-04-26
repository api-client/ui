import { uuidV4, IBackendInfo } from '@api-client/core/build/browser.js';
import { Events } from '../../events/Events.js';
import { HttpStore } from '../../store/HttpStore.js';
import { StoreBindings } from '../base/StoreBindings.js';
import { IConfigEnvironment, IConfigInit } from '../../lib/config/Config.js';
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

  channel: BroadcastChannel;

  /**
   * @param storeBaseUri The base URI of the "local" store to be used when the user chooses 
   * the local store over the 
   */
  constructor(storeBaseUri: string) {
    super();
    this.storeBaseUri = storeBaseUri;
    this.channel = new BroadcastChannel('api-store');
  }

  /**
   * Initializes the environment in the application configuration.
   * 
   * It tests whether the store requires authentication and if so, 
   * it redirects the current window to the authentication dialog.
   */
  async initStoreEnvironment(init: IConfigInit): Promise<void> {
    const env: IConfigEnvironment = {
      key: uuidV4(),
      location: init.source === 'local-store' ? this.storeBaseUri : init.location as string,
      name: init.name || 'Default',
      source: init.source,
      authenticated: false,
    };
    const store = new HttpStore(env);
    const info = await store.sdk.store.getInfo();
    if (info.mode === 'single-user') {
      // this store does not require authentication but does require setting up 
      // a session.
      await store.getStoreSessionToken(env);
      // this event is handled by the application controller 
      // and redirects the user to the next step.
      await Events.Config.Environment.add(env, init.reason === 'first-run');
    } else if (init.reason === 'first-run') {
      // the store needs authentication. We redirect the user to the 
      // authentication screen.
      await Events.Config.Session.set(`${EnvironmentsKey}.creating`, env);
      Events.Navigation.Store.authenticate({ sameWindow: true })
    } else if (init.reason === 'add') {
      // this is adding an environment from the configuration screen.
      // We save the configuration in the store.
      await Events.Config.Environment.add(env, false);
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
}
