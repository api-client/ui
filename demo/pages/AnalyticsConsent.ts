import { DemoBindings } from '../lib/DemoBindings.js';
import { AnalyticsConsentScreen, EventTypes, Router } from '../../src/index.js';

(async (): Promise<void> => {
  const bindings = new DemoBindings();
  await bindings.initialize();

  const page = new AnalyticsConsentScreen();
  await page.initialize();

  window.addEventListener(EventTypes.Config.Telemetry.State.set, () => {
    // We mimic application behavior. This is in the first run flow.
    // When this event is handled we continue to the application main page.
    Router.navigatePage('HttpProjectHome.html');
  });
})();
