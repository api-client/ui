import { DemoBindings } from '../../lib/DemoBindings.js';
import { ConfigAuthenticateScreen, EventTypes, Router } from '../../../src/index.js';
import appInfo from '../../../src/pages/start/AppInfo.js';

(async (): Promise<void> => {
  const bindings = new DemoBindings(appInfo);
  await bindings.initialize();

  const page = new ConfigAuthenticateScreen();
  await page.initialize();

  window.addEventListener(EventTypes.Config.Environment.State.created, () => {
    // We mimic application behavior. This is in the first run flow.
    // We continue to the analytics consent screen.
    const url = new URL('/demo/pages/init/AnalyticsConsent.ts', window.location.href).toString();
    Router.navigatePage(url);
  });
})();
