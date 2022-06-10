import { DemoBindings } from '../../lib/DemoBindings.js';
import { StartScreen } from '../../../src/index.js';
import appInfo from '../../../src/pages/start/AppInfo.js';

(async (): Promise<void> => {
  console.log('Initializing bindings');
  const bindings = new DemoBindings(appInfo);
  await bindings.initialize();

  console.log('Initializing app screen');
  const page = new StartScreen();
  await page.initialize();
  console.log('The app is up and running.');
})();
