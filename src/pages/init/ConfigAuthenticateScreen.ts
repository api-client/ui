/* eslint-disable lit-a11y/no-autofocus */
import { html, TemplateResult, CSSResult } from 'lit';
import '@anypoint-web-components/awc/dist/define/anypoint-button.js';
import '@anypoint-web-components/awc/dist/define/anypoint-progress.js';
import { ApplicationScreen } from '../ApplicationScreen.js';
import { reactive } from '../../lib/decorators.js';
import styles from './ConfigAuthStyles.js';
import layout from '../styles/layout.js';
import { Events } from '../../events/Events.js';
import { IConfigEnvironment } from '../../lib/config/Config.js';
import { ISessionInitInfo } from '../../store/HttpStore.js';
import { EnvironmentsKey } from '../../bindings/base/ConfigurationBindings.js';

/**
 * When the user is redirected here it means that the user provided a configuration
 * that requires user authentication.
 */
export default class ConfigAuthenticateScreen extends ApplicationScreen {
  static get styles(): CSSResult[] {
    return [styles, layout];
  }

  @reactive()
  environmentError?: string;

  environment?: IConfigEnvironment;

  /**
   * Whether the application is performing the store validation.
   */
  @reactive()
  authenticating = false;

  async initialize(): Promise<void> {
    try {
      const env = await Events.Config.Session.get(`${EnvironmentsKey}.creating`) as IConfigEnvironment;
      if (env) {
        this.environment = env;
      } else {
        this.environmentError = 'Environment information not found. Go back to the previous state.';
      }
    } catch (e) {
      this.environmentError = (e as Error).message;
    }
  }

  protected _authenticateHandler(): void {
    const { environment } = this;
    if (!environment) {
      this.environmentError = 'Environment information not found. Go back to the previous state.';
      return;
    }
    this.authenticate(environment);
  }

  protected _backHandler(): void {
    window.history.back();
  }

  protected async authenticate(env: IConfigEnvironment): Promise<void> {
    this.authenticating = true;
    let info: ISessionInitInfo | undefined;
    try {
      info = await Events.Auth.authenticate(env);
    } finally {
      this.authenticating = false;
    }
    if (info) {
      await Events.Config.Environment.add(env, true);
      await Events.Config.Session.delete(`${EnvironmentsKey}.creating`);
    }
  }

  /**
   * This to be used by the child classes to render page template.
   * @returns Application page template
   */
  pageTemplate(): TemplateResult {
    return html`
    <main class="config-init">
      ${this.titleTemplate()}
      ${this.introTemplate()}
      ${this.environmentError ? this.initErrorTemplate() : this.contentTemplate()}
    </main>
    `;
  }

  initErrorTemplate(): TemplateResult {
    return html`
    <p class="general-error">${this.environmentError}</p>
    <div class="action">
      <anypoint-button 
        emphasis="high"
        @click="${this._backHandler}"
      >Back</anypoint-button>
    </div>
    `;
  }

  contentTemplate(): TemplateResult {
    return html`
    ${this.actionTemplate()}
    ${this.infoTemplate()}
    ${this.progressTemplate()}
    `;
  }

  titleTemplate(): TemplateResult {
    return html`<h1>Store authentication</h1>`;
  }

  introTemplate(): TemplateResult {
    return html`
    <div class="description">
      <p id="authenticationMessage">The network store requires authentication.</p>
    </div>
    `;
  }

  actionTemplate(): TemplateResult {
    return html`
    <div class="action">
      <anypoint-button 
        emphasis="high"
        @click="${this._authenticateHandler}"
      >Authenticate</anypoint-button>
    </div>
    `;
  }

  infoTemplate(): TemplateResult {
    return html`
    <p class="description" id="authenticationMessage">This will open a new tab with the authentication options.</p>
    `;
  }

  progressTemplate(): TemplateResult | string {
    const { authenticating } = this;
    if (!authenticating) {
      return '';
    }
    return html`
    <anypoint-progress indeterminate></anypoint-progress>
    `;
  }
}
