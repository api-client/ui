import { DemoBindings } from '../../lib/DemoBindings.js';
import { StoreConfigScreen } from '../../../src/index.js';

(async (): Promise<void> => {
  const bindings = new DemoBindings();
  await bindings.initialize();

  const page = new StoreConfigScreen();
  await page.initialize();
})();
