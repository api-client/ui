import { DemoBindings } from '../../lib/DemoBindings.js';
import { HttpProjectScreen } from '../../../src/index.js';
import * as MonacoLoader from '../../../src/monaco/loader.js';
import appInfo from '../../../src/pages/http-project/AppInfo.js';

(async (): Promise<void> => {
  const base = `../../../node_modules/monaco-editor/`;
  MonacoLoader.createEnvironment(base);
  await MonacoLoader.loadMonaco(base);
  await MonacoLoader.monacoReady();

  const bindings = new DemoBindings(appInfo);
  await bindings.initialize();

  const page = new HttpProjectScreen();
  await page.initialize();
})();
