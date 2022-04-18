import { DemoBindings } from '../lib/DemoBindings.js';
import { ConfigAuthenticateScreen, EventTypes, Router } from '../../src/index.js';

(async (): Promise<void> => {
  const bindings = new DemoBindings();
  await bindings.initialize();

  const page = new ConfigAuthenticateScreen();
  await page.initialize();

  window.addEventListener(EventTypes.Config.Environment.State.created, () => {
    // We mimic application behavior. This is in the first run flow.
    // We continue to the analytics consent screen.
    Router.navigatePage('AnalyticsConsent.html');
  });
})();
