import { DemoBindings } from '../lib/DemoBindings.js';
import { HttpProjectHomeScreen } from '../../src/index.js';

(async (): Promise<void> => {
  const bindings = new DemoBindings();
  await bindings.initialize();

  const page = new HttpProjectHomeScreen();
  await page.initialize();
})();
