import { DemoBindings } from '../../lib/DemoBindings.js';
import { ProjectRunnerScreen } from '../../../src/index.js';
// import * as MonacoLoader from '../../../src/monaco/loader.js';

(async (): Promise<void> => {
  // const base = `../../../node_modules/monaco-editor/`;
  // MonacoLoader.createEnvironment(base);
  // await MonacoLoader.loadMonaco(base);
  // await MonacoLoader.monacoReady();

  const bindings = new DemoBindings();
  await bindings.initialize();

  const page = new ProjectRunnerScreen();
  await page.initialize();
})();
