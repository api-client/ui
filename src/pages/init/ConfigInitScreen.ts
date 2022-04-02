/* eslint-disable lit-a11y/no-autofocus */
import { html, TemplateResult, CSSResult } from 'lit';
import { AnypointRadioButtonElement, AnypointRadioGroupElement, AnypointInputElement } from '@anypoint-web-components/awc';
import '@anypoint-web-components/awc/dist/define/anypoint-radio-button.js';
import '@anypoint-web-components/awc/dist/define/anypoint-radio-group.js';
import '@anypoint-web-components/awc/dist/define/anypoint-input.js';
import '@anypoint-web-components/awc/dist/define/anypoint-button.js';
import '@anypoint-web-components/awc/dist/define/anypoint-dialog.js';
import '@anypoint-web-components/awc/dist/define/anypoint-progress.js';
import { ApplicationScreen } from '../ApplicationScreen.js';
import { reactive } from '../../lib/decorators.js';
import { DataSourceType } from '../../lib/config/Config.js';
import styles from './ConfigInitStyles.js';
import layout from '../styles/layout.js';
import { Events } from '../../events/Events.js';
import { IConfigInit } from '../../events/StoreEvents.js';

/**
 * The very first screen to render to the user when initializing the application 
 * for the first time and when there's no configuration foe the store.
 * 
 * This screen creates the application basic configuration with the 
 * default environment (net store, local store).
 */
export default class ConfigInitScreen extends ApplicationScreen {
  static get styles(): CSSResult[] {
    return [styles, layout];
  }

  /**
   * The selected store type.
   */
  @reactive()
  storeType?: DataSourceType;

  /**
   * Whether the dialog with the help message is opened.
   */
  @reactive()
  infoDialogOpened = false;

  /**
   * A network store validation error, if any.
   */
  @reactive()
  validationError?: string;

  /**
   * Whether the application is performing the store validation.
   */
  @reactive()
  validating = false;

  /**
   * The application name to render in the title.
   */
  appName = 'API Projects';

  async initialize(): Promise<void> {
    // ...
  }

  protected _sourceHandler(e: Event): void {
    const node = e.target as AnypointRadioGroupElement;
    const radio = node.selectedItem as AnypointRadioButtonElement | undefined;
    if (!radio) {
      this.storeType = undefined;
      return;
    }
    this.storeType = radio.value as DataSourceType;
  }

  protected _helpHandler(): void {
    this.infoDialogOpened = true;
  }

  protected _dialogCloseHandler(): void {
    this.infoDialogOpened = false;
  }

  protected _continueHandler(): void {
    const info = this.createInit();
    if (!info) {
      return;
    }
    this.validateInput(info);
  }

  protected createInit(): IConfigInit | undefined {
    if (!this.storeType) {
      return undefined;
    }
    const isNetwork = this.storeType === 'network-store';
    let location: string | undefined;
    if (isNetwork) {
      const input = document.querySelector('.store-url') as AnypointInputElement;
      if (!input.validate()) {
        return undefined;
      }
      location = input.value;
      if (!location) {
        return undefined;
      }
    }
    const info: IConfigInit = {
      source: this.storeType,
      location,
      reason: 'first-run',
    };
    return info;
  }

  protected async validateInput(init: IConfigInit): Promise<void> {
    if (init.source === 'network-store') {
      this.validating = true;
      const error = await this.validateNetworkStore(init.location as string);
      this.validating = false;
      if (error) {
        this.validationError = error;
        return;
      }
    }
    // This is handled by the ConfigBindings class and, depending on the environment,
    // passed to the application controller.
    Events.Store.initEnvironment(init);
  }

  protected async validateNetworkStore(baseUri: string): Promise<string | undefined> {
    try {
      const info = await Events.Store.storeInfo(baseUri);
      if (!info) {
        throw new Error(`Unable to connect.`);
      }
    } catch (e) {
      return (e as Error).message;
    }
    return undefined;
  }

  /**
   * This to be used by the child classes to render page template.
   * @returns Application page template
   */
  pageTemplate(): TemplateResult {
    return html`
    <main class="config-init">
      <form class="form">
        ${this.titleTemplate()}
        ${this.introTemplate()}
        ${this.storeTypeSelector()}
        ${this.storeUrlTemplate()}
        ${this.progressTemplate()}
        ${this.validationErrorTemplate()}
      </form>
      ${this.actionsTemplate()}
    </main>
    ${this.helpDialog()}
    `;
  }

  titleTemplate(): TemplateResult {
    return html`
    <h1>Welcome to ${this.appName}</h1>
    `;
  }

  introTemplate(): TemplateResult {
    return html`
    <div class="description">
      <p id="dataSourceMessage">What is the data source for the application?</p>
      <a href="#" @click="${this._helpHandler}">Help me decide.</a>
    </div>
    `;
  }

  storeTypeSelector(): TemplateResult {
    return html`
    <div class="data-source">
      <anypoint-radio-group @select="${this._sourceHandler}" attrForSelected="value" aria-labelledby="dataSourceMessage">
        <anypoint-radio-button class="data-option" name="source" value="local-store">Local store</anypoint-radio-button>
        <anypoint-radio-button class="data-option" name="source" value="network-store">Network store</anypoint-radio-button>
      </anypoint-radio-group>
    </div>
    `;
  }

  storeUrlTemplate(): TemplateResult | string {
    if (this.storeType !== 'network-store') {
      return '';
    }
    return html`
    <div class="store-url-input">
      <anypoint-input 
        class="store-url"
        type="url"
        name="location"
        infoMessage="Enter the address to the store"
        invalidMessage="The entered URL is invalid. Please, enter the address of the data store."
        required
        autoValidate
      >
        <label slot="label">Store address</label>
      </anypoint-input>
    </div>
    `;
  }

  actionsTemplate(): TemplateResult {
    return html`
    <div class="actions">
      <anypoint-button 
        emphasis="high" 
        ?disabled="${!this.storeType}" 
        @click="${this._continueHandler}"
      >Continue</anypoint-button>
    </div>
    `;
  }

  helpDialog(): TemplateResult {
    return html`
    <anypoint-dialog ?opened="${this.infoDialogOpened}" @closed="${this._dialogCloseHandler}" class="help-dialog">
      <h2>Selecting data source</h2>
      <section>
        <div class="info-headline">Local Store</div>
        <p>This will install a service on your machine that serves data to the API Client suite. 
          You can access your data only on this device.</p>
        <div class="info-headline">Network Store</div>
        <p>Allows you to connect to a store that is in your local network or over internet. You need the store address to continue.</p>
      </section>
      <div class="buttons">
        <anypoint-button>Learn more</anypoint-button>
        <anypoint-button data-dialog-confirm autofocus>Close</anypoint-button>
      </div>
    </anypoint-dialog>
    `;
  }

  validationErrorTemplate(): TemplateResult | string {
    const { validationError } = this;
    if (!validationError) {
      return '';
    }
    return html`
    <p class="general-error">
      ${this.validationError}<br/>
      Please, verify the store URI and try again.
    </p>
    `;
  }

  progressTemplate(): TemplateResult | string {
    const { validating } = this;
    if (!validating) {
      return '';
    }
    return html`
    <anypoint-progress indeterminate></anypoint-progress>
    `;
  }
}
