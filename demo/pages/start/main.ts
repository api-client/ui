import { DemoBindings } from '../../lib/DemoBindings.js';
import { StartScreen } from '../../../src/index.js';

console.log('Starting page');

(async (): Promise<void> => {
  console.log('Initializing bindings');
  const bindings = new DemoBindings();
  await bindings.initialize();

  console.log('Initializing app screen');
  const page = new StartScreen();
  await page.initialize();
  console.log('The app is up and running.');
})();
