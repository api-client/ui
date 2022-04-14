import { DemoBindings } from '../lib/DemoBindings.js';
import { HttpProjectScreen } from '../../index.js';

(async (): Promise<void> => {
  const bindings = new DemoBindings();
  await bindings.initialize();

  const page = new HttpProjectScreen();
  await page.initialize();
})();
