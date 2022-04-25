import { DemoBindings } from '../lib/DemoBindings.js';
import { StartScreen } from '../../src/index.js';

(async (): Promise<void> => {
  const bindings = new DemoBindings();
  await bindings.initialize();

  const page = new StartScreen();
  await page.initialize();
})();
