import { DemoBindings } from '../../lib/DemoBindings.js';
import { SchemaDesignerScreen } from '../../../src/index.js';
import appInfo from '../../../src/pages/schema-design/AppInfo.js';

(async (): Promise<void> => {
  const bindings = new DemoBindings(appInfo);
  await bindings.initialize();

  const page = new SchemaDesignerScreen();
  await page.initialize();
})();
