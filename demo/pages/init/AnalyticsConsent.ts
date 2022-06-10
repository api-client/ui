import { DemoBindings } from '../../lib/DemoBindings.js';
import { AnalyticsConsentScreen, EventTypes, Router } from '../../../src/index.js';
import appInfo from '../../../src/pages/start/AppInfo.js';

(async (): Promise<void> => {
  const bindings = new DemoBindings(appInfo);
  await bindings.initialize();

  const page = new AnalyticsConsentScreen();
  await page.initialize();

  window.addEventListener(EventTypes.Config.Telemetry.State.set, () => {
    // We mimic application behavior. This is in the first run flow.
    // When this event is handled we continue to the application main page.
    const url = new URL('/demo/pages/start/main.html', window.location.href).toString();
    Router.navigatePage(url);
  });
})();
