import { WebConfigurationBindings } from '../../src/bindings/web/WebConfigurationBindings.js';
import { WebStoreBindings } from '../../src/bindings/web/WebStoreBindings.js';

/**
 * A class that mocks Electron APIs.
 */
export class DemoBindings {
  config: WebConfigurationBindings;
  
  store: WebStoreBindings;
  
  constructor() {
    // const base = new URL(window.location.href);
    this.config = new WebConfigurationBindings();
    this.store = new WebStoreBindings(`http://localhost:${8550}/v1`);
  }

  async initialize(): Promise<void> {
    this.config.initialize();
    this.store.initialize();
  }
}
