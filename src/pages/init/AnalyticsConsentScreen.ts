/* eslint-disable class-methods-use-this */
import { html, TemplateResult, CSSResult } from 'lit';
import { AnypointRadioButtonElement, AnypointRadioGroupElement } from '@anypoint-web-components/awc';
import { Events } from '../../events/Events.js';
import '@anypoint-web-components/awc/dist/define/anypoint-radio-button.js';
import '@anypoint-web-components/awc/dist/define/anypoint-radio-group.js';
import '@anypoint-web-components/awc/dist/define/anypoint-button.js';
import { ApplicationScreen } from '../ApplicationScreen.js';
import styles from './AnalyticsStyles.js';
import layout from '../styles/global-styles.js';
import { reactive } from '../../lib/decorators.js';
import { ITelemetryConfig, TelemetryLevel } from '../../lib/config/Config.js';

/**
 * A screen presented to the user during the first-run to consent to 
 * analytical data gathering.
 * 
 */
export default class AnalyticsConsentScreen extends ApplicationScreen {
  static get styles(): CSSResult[] {
    return [styles, layout];
  }

  @reactive()
  sharingLevel: TelemetryLevel = 'noting';

  async initialize(): Promise<void> {
    try {
      const config = await Events.Config.Telemetry.read();
      this.sharingLevel = config.level;
    } catch (e) {
      // ...
    }
  }

  protected _sharingLevelHandler(e: Event): void {
    const node = e.target as AnypointRadioGroupElement;
    const radio = node.selectedItem as AnypointRadioButtonElement | undefined;
    if (!radio) {
      return;
    }
    this.sharingLevel = radio.value as TelemetryLevel;
  }

  protected _continueHandler(): void {
    const config: ITelemetryConfig = {
      level: this.sharingLevel,
    };
    Events.Config.Telemetry.set(config);
  }

  pageTemplate(): TemplateResult {
    return html`
    <main class="config-init">
      <form class="form">
        ${this.titleTemplate()}
        ${this.introTemplate()}
        ${this.sharingLevelSelector()}
        ${this.infoTemplate()}
      </form>
      ${this.actionsTemplate()}
    </main>
    `;
  }

  titleTemplate(): TemplateResult {
    return html`<h1>Data sharing</h1>`;
  }

  introTemplate(): TemplateResult {
    return html`
    <div class="description">
      <p id="sharingMessage">
        We value your privacy and by default the application does not share any data. 
        We kindly ask you to allow sending analytics data so we can measure the use of the application.
      </p>
    </div>
    `;
  }

  sharingLevelSelector(): TemplateResult {
    const { sharingLevel } = this;
    return html`
    <div class="sharing-level">
      <anypoint-radio-group 
        @select="${this._sharingLevelHandler}" 
        attrForSelected="value" 
        aria-labelledby="sharingMessage"
      >
        <anypoint-radio-button 
          ?checked="${sharingLevel === 'noting'}"
          class="data-option" 
          name="source" 
          value="nothing"
          title="No analytics data will be send to the analytics server."
        >No analytics</anypoint-radio-button>
        <anypoint-radio-button 
          ?checked="${sharingLevel === 'crash'}"
          class="data-option" 
          name="source" 
          value="crash"
          title="Only application crashes and some critical errors are reported."
        >Crash reports and errors</anypoint-radio-button>
        <anypoint-radio-button 
          ?checked="${sharingLevel === 'all'}"
          class="data-option" 
          name="source" 
          value="all"
          title="Crashers, errors, and usage is reported."
        >Application usage</anypoint-radio-button>
      </anypoint-radio-group>
    </div>
    `;
  }

  actionsTemplate(): TemplateResult {
    return html`
    <div class="actions">
      <anypoint-button 
        emphasis="high" 
        ?disabled="${!this.sharingLevel}" 
        @click="${this._continueHandler}"
      >Continue</anypoint-button>
    </div>
    `;
  }

  infoTemplate(): TemplateResult {
    return html`
    <p class="description">You can read our privacy policy <a href="#">here</a>.</p>
    `;
  }
}
