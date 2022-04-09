import { WebConfigurationBindings } from '../../src/bindings/web/WebConfigurationBindings.js';
import { WebStoreBindings } from '../../src/bindings/web/WebStoreBindings.js';
import { WebNavigationBindings } from '../../src/bindings/web/WebNavigationBindings.js';

/**
 * A class that mocks Electron APIs.
 */
export class DemoBindings {
  config: WebConfigurationBindings;
  
  store: WebStoreBindings;

  nav: WebNavigationBindings;
  
  constructor() {
    // const base = new URL(window.location.href);
    this.config = new WebConfigurationBindings();
    this.store = new WebStoreBindings(`http://localhost:${8550}/v1`);
    this.nav = new WebNavigationBindings();
  }

  async initialize(): Promise<void> {
    this.config.initialize();
    this.store.initialize();
    this.nav.initialize();
  }
}
