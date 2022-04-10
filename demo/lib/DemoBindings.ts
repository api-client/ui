import { WebConfigurationBindings } from '../../src/bindings/web/WebConfigurationBindings.js';
import { WebStoreBindings } from '../../src/bindings/web/WebStoreBindings.js';
import { WebNavigationBindings } from '../../src/bindings/web/WebNavigationBindings.js';
import { IoProcess } from './io/main.js';

/**
 * A class that mocks Electron APIs.
 */
export class DemoBindings {
  io: IoProcess;

  config: WebConfigurationBindings;
  
  store: WebStoreBindings;

  nav: WebNavigationBindings;
  
  constructor() {
    this.io = new IoProcess();
    // const base = new URL(window.location.href);
    this.config = new WebConfigurationBindings();
    this.store = new WebStoreBindings(`http://localhost:${8550}/v1`);
    this.nav = new WebNavigationBindings();
  }

  async initialize(): Promise<void> {
    await this.io.initialize();
    await this.config.initialize();
    await this.store.initialize();
    await this.nav.initialize();
  }
}
