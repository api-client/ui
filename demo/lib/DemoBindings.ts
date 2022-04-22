import { WebConfigurationBindings } from '../../src/bindings/web/WebConfigurationBindings.js';
import { WebStoreBindings } from '../../src/bindings/web/WebStoreBindings.js';
import { WebNavigationBindings } from '../../src/bindings/web/WebNavigationBindings.js';
import { WebAppDataBindings } from '../../src/bindings/web/WebAppDataBindings.js';
import { WebHttpBindings } from '../../src/bindings/web/WebHttpBindings.js';
import { IoProcess } from './io/main.js';

/**
 * A class that mocks Electron APIs.
 */
export class DemoBindings {
  io: IoProcess;

  config: WebConfigurationBindings;
  
  store: WebStoreBindings;

  nav: WebNavigationBindings;

  appData: WebAppDataBindings;

  http: WebHttpBindings;
  
  constructor() {
    this.io = new IoProcess();
    // const base = new URL(window.location.href);
    this.config = new WebConfigurationBindings('/demo/lib/io/AppConfig.ts');
    this.store = new WebStoreBindings('x-demo', '0.1.0', `http://localhost:${8550}/v1`);
    this.nav = new WebNavigationBindings();
    this.appData = new WebAppDataBindings('/demo/lib/io/AppData.ts');
    this.http = new WebHttpBindings(`http://192.168.86.249:8553/v1`);
  }

  async initialize(): Promise<void> {
    await this.io.initialize();
    await this.config.initialize();
    await this.store.initialize();
    await this.nav.initialize();
    await this.appData.initialize();
    await this.http.initialize();
  }
}
