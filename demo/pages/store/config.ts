import { DemoBindings } from '../../lib/DemoBindings.js';
import { StoreConfigScreen } from '../../../src/index.js';
import appInfo from '../../../src/pages/start/AppInfo.js';

(async (): Promise<void> => {
  const bindings = new DemoBindings(appInfo);
  await bindings.initialize();

  const page = new StoreConfigScreen();
  await page.initialize();
})();
