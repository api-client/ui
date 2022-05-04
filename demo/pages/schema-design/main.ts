import { DemoBindings } from '../../lib/DemoBindings.js';
import { SchemaDesignerScreen } from '../../../src/index.js';

(async (): Promise<void> => {
  const bindings = new DemoBindings();
  await bindings.initialize();

  const page = new SchemaDesignerScreen();
  await page.initialize();
})();
