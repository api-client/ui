import { IApplication } from '@api-client/core/build/browser.js';
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
  
  constructor(app: IApplication) {
    this.io = new IoProcess();
    // const base = new URL(window.location.href);
    this.config = new WebConfigurationBindings(app, '/demo/lib/io/AppConfig.ts');
    this.store = new WebStoreBindings(app, `http://localhost:${8550}/v1`);
    this.nav = new WebNavigationBindings(app);
    this.appData = new WebAppDataBindings(app, '/demo/lib/io/AppData.ts');
    this.http = new WebHttpBindings(app, `http://192.168.86.249:8553/v1`);
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
