import { DemoBindings } from '../../lib/DemoBindings.js';
import { HttpClientScreen } from '../../../src/index.js';
import * as MonacoLoader from '../../../src/monaco/loader.js';
import appInfo from '../../../src/pages/http-client/AppInfo.js';

(async (): Promise<void> => {
  const base = `../../../node_modules/monaco-editor/`;
  MonacoLoader.createEnvironment(base);
  await MonacoLoader.loadMonaco(base);
  await MonacoLoader.monacoReady();

  const bindings = new DemoBindings(appInfo);
  await bindings.initialize();

  const page = new HttpClientScreen();
  await page.initialize();
})();
