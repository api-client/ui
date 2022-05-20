import { html, TemplateResult, CSSResult } from 'lit';
import { Events as CoreEvents } from '@api-client/core/build/browser.js';
import { AnypointListboxElement } from '@anypoint-web-components/awc';
import '@anypoint-web-components/awc/dist/define/anypoint-menu-button.js';
import '@anypoint-web-components/awc/dist/define/anypoint-listbox.js';
import '@anypoint-web-components/awc/dist/define/anypoint-item.js';
import '@github/time-elements/dist/relative-time-element.js';
import { Events } from '../../events/Events.js'
import { EventTypes } from '../../events/EventTypes.js'
import ConfigInitScreen from '../init/ConfigInitScreen.js';
import { reactive, route, routeInitializer } from '../../lib/decorators.js';
import { IRouteResult } from '../../lib/decorators/route.js';
import { buildRoute, navigate } from '../../lib/route.js';
import { IConfigEnvironment, IEnvConfig, IConfigInit } from '../../lib/config/Config.js';
import layout from '../styles/grid-hnmf.js';
import styles from './StoreConfigScreenStyles.js';
import '../../define/rename-file-dialog.js';
import '../../define/confirm-delete-dialog.js';

export default class StoreConfigScreen extends ConfigInitScreen {
  static get styles(): CSSResult[] {
    return [...ConfigInitScreen.styles, layout, styles];
  }

  /**
   * The selected store configuration
   */
  @reactive() protected selected?: string;

  /**
   * The selected environment read from the list of environments.
   */
  @reactive() protected env?: IConfigEnvironment;

  /**
   * Whether the current environment is a default environment
   */
  @reactive() protected isDefault = false;

  /**
   * Flag set when the screen is requesting the list of environments.
   */
  @reactive() protected loadingEnvironments = false;

  /**
   * The list of application environments.
   */
  @reactive() protected config?: IEnvConfig;

  @routeInitializer()
  async initialize(): Promise<void> {
    try {
      await this.initializeStore(false);
    } catch (e) {
      // ...
    }
    await this.listEnvironments();
    this.listen();
    await super.initialize();
    this.initReason = 'add';
    this.initialized = true;
  }

  async listEnvironments(): Promise<void> {
    this.loadingEnvironments = true;
    this.config = undefined;
    try {
      this.config = await Events.Config.Environment.list();
    } catch (e) {
      const err = e as Error;
      CoreEvents.Telemetry.exception(err.message, true);
      this.reportCriticalError('Unable to load the list of environments.');
    } finally {
      this.loadingEnvironments = false;
    }
  }

  protected resetRoute(): void {
    this.page = undefined;
    this.selected = undefined;
    this.env = undefined;
    this.isDefault = false;
  }

  protected listen(): void {
    window.addEventListener(EventTypes.Config.Environment.State.updated, this._handleEnvUpdated.bind(this));
    window.addEventListener(EventTypes.Config.Environment.State.deleted, this._handleEnvDeleted.bind(this));
    window.addEventListener(EventTypes.Config.Environment.State.created, this._handleEnvCreated.bind(this));
    window.addEventListener(EventTypes.Config.Environment.State.defaultChange, this._handleEnvDefault.bind(this));
  }

  @route({ pattern: '/start', fallback: true, name: 'Store welcome', title: 'Store Configuration Welcome' })
  protected startRoute(): void {
    this.resetRoute();
    this.page = 'start';
  }

  @route({ pattern: '/store/(?<key>.*)', name: 'Store configuration', title: 'Store configuration' })
  protected storeRoute(info: IRouteResult): void {
    if (!info.params || !info.params.key) {
      throw new Error(`Invalid route configuration. Missing parameters.`);
    }
    this.resetRoute();
    const key = info.params.key as string;
    this.page = 'store';
    this.selected = key;
    const { config } = this;
    if (config && config.environments) {
      const env = config.environments.find(i => i.key === key);
      this.env = env;
      this.isDefault = !!env && env.key === config.current;
    }
  }

  @route({ pattern: '/new', name: 'New store configuration', title: 'New store configuration' })
  protected newRoute(): void {
    this.resetRoute();
    this.page = 'new';
  }

  @route({ pattern: '*' })
  protected telemetryRoute(info: IRouteResult): void {
    CoreEvents.Telemetry.view(info.route.name || info.route.pattern || '/');
  }

  protected _handleEnvUpdated(init: Event): void {
    const e = init as CustomEvent;
    const env = e.detail.env as IConfigEnvironment;
    const { config } = this;
    if (!env || !config) {
      return;
    }
    if (!config.environments) {
      config.environments = [];
    }
    const index = config.environments.findIndex(i => i.key === env.key);
    if (index >= 0) {
      config.environments[index] = env;
    } else {
      config.environments.push(env);
    }
    if (this.env && this.env.key === env.key) {
      this.env = env;
    }
    this.render();
  }

  protected _handleEnvDeleted(init: Event): void {
    const e = init as CustomEvent;
    const id = e.detail.id as string;
    const { config } = this;
    if (!id || !config) {
      return;
    }
    if (!config.environments) {
      return;
    }
    const index = config.environments.findIndex(i => i.key === id);
    if (index >= 0) {
      config.environments.splice(index, 1);
      this.render();
    }
    if (this.selected === id) {
      navigate('start');
    }
  }

  protected _handleEnvCreated(init: Event): void {
    const e = init as CustomEvent;
    const env = e.detail.env as IConfigEnvironment;
    const isDefault = e.detail.isDefault as boolean;
    const { config } = this;
    if (!env || !config) {
      return;
    }
    if (!config.environments) {
      config.environments = [];
    }
    config.environments.push(env);
    if (isDefault) {
      this.revalidateCurrent(env.key);
    }
    if (this.page === 'new') {
      navigate('store', env.key);
    } else {
      this.render();
    }
  }

  protected _handleEnvDefault(init: Event): void {
    const e = init as CustomEvent;
    const id = e.detail.id as string;
    const { config } = this;
    if (!id || !config) {
      return;
    }
    this.revalidateCurrent(id);
  }

  protected revalidateCurrent(id: string): void {
    const { config } = this;
    if (!config) {
      throw new Error(`Config is not set.`);
    }
    config.current = id;
    if (this.env) {
      this.isDefault = this.env.key === id;
    }
  }

  protected _optionHandler(e: Event): void {
    const list = e.target as AnypointListboxElement;
    const option = String(list.selected);
    list.selected = undefined;
    switch (option) {
      case 'rename': this.renameEnvironment(); break;
      case 'make-default': this.makeEnvironmentDefault(); break;
      case 'delete': this.deleteEnvironment(); break;
      case 'authenticate': this.authenticateEnvironment(); break;
      default:
    }
  }

  protected renameEnvironment(): void {
    const env = this.env!;
    const dialog = document.createElement('rename-file-dialog');
    dialog.name = env.name;
    dialog.opened = true;
    document.body.appendChild(dialog);
    dialog.addEventListener('closed', (ev: Event) => {
      document.body.removeChild(dialog);
      const event = ev as CustomEvent;
      const { canceled, confirmed, value } = event.detail;
      if (!canceled && confirmed && value) {
        Events.Config.Environment.update({ ...env, name: value });
      }
    });
  }

  protected deleteEnvironment(): void {
    const env = this.env!;
    const dialog = document.createElement('confirm-delete-dialog');
    dialog.opened = true;
    document.body.appendChild(dialog);
    dialog.addEventListener('closed', (ev: Event) => {
      document.body.removeChild(dialog);
      const event = ev as CustomEvent;
      const { canceled, confirmed } = event.detail;
      if (!canceled && confirmed) {
        Events.Config.Environment.delete(env.key);
      }
    });
  }

  protected makeEnvironmentDefault(): void {
    const { selected } = this;
    if (!selected) {
      return;
    }
    Events.Config.Environment.setDefault(selected);
  }

  protected authenticateEnvironment(): void {
    const { env } = this;
    if (!env) {
      return;
    }
    Events.Store.Auth.authenticate(true, env, true);
  }

  protected _addEnvironmentHandler(): void {
    navigate('new');
  }

  protected createInit(): IConfigInit | undefined {
    const result = super.createInit();
    if (result) {
      result.reason = 'add';
    }

    return result;
  }

  pageTemplate(): TemplateResult {
    const { initialized } = this;
    if (!initialized) {
      return super.pageTemplate();
    }
    return html`
      ${this.headerTemplate()}
      ${this.navigationTemplate()}
      ${this.mainTemplate()}
      ${this.footerTemplate()}
    `;
  }

  protected headerTemplate(): TemplateResult {
    return html`
    <header class="start-page-header">
      <h1 class="start-page-header-title">Store configuration</h1>
      ${this.addButtonTemplate()}
    </header>
    `;
  }

  protected navigationTemplate(): TemplateResult {
    const { config } = this;
    return html`
    <nav aria-label="Application sections">
      ${this.progressTemplate()}
      ${this.navigationConfigTemplate(config)}
      <div class="nav-add-action">
        ${this.addButtonTemplate()}
      </div>
    </nav>
    `;
  }

  protected navigationConfigTemplate(config?: IEnvConfig): TemplateResult | string {
    if (!config || !config.environments || !config.environments.length) {
      return '';
    }
    return html`
    <ul class="navigation-list">
      ${config.environments.map(i => this.navigationItemTemplate(i))}
    </ul>
    `;
  }

  protected navigationItemTemplate(item: IConfigEnvironment): TemplateResult {
    const { selected, config } = this;
    const isSelected = selected === item.key;
    const isDefault = !!config && item.key === config.current;
    const url = buildRoute('store', item.key);
    const name = item.name || 'Unnamed configuration';
    return html`
      <li 
        class="navigation-item ${isSelected ? 'selected' : ''}"
      >
        <a href="${url}">
          ${name}
          ${isDefault ? html`<api-icon class="default-mark" icon="taskAlt" slot="item-icon" title="Default configuration">` : ''}
        </a>
      </li>
    `;
  }

  protected addButtonTemplate(): TemplateResult {
    return html`<anypoint-button 
      emphasis="medium" 
      class="add-button" 
      title="Opens a form to create a new environment"
      @click="${this._addEnvironmentHandler}"
    >Add new</anypoint-button>`;
  }

  protected mainTemplate(): TemplateResult {
    let template: TemplateResult;
    switch (this.page) {
      case 'store': template = this.storeTemplate(); break;
      case 'new': template = this.addNewTemplate(); break;
      default:
        template = this.startTemplate(); break;
    }
    return html`
    <main aria-label="projects list">${template}</main>
    `;
  }

  protected startTemplate(): TemplateResult {
    return html`
    <p class="message">Store configuration allows you to manage connections to different API stores.</p>
    `;
  }

  protected storeTemplate(): TemplateResult {
    const { config, env } = this;
    if (!config || !env) {
      return html`Invalid state, config not ready.`;
    }
    const isDefault = env.key === config.current;
    const isLocal = env.source === 'local-store';
    return html`
    <section>
      <div class="title-area">
        <h2 class="env-name text-selectable">${env.name || 'Unnamed configuration'}</h2>
        ${this.environmentOptionsTemplate()}
      </div>
      <dl>
        <dt>Key:</dt>
        <dd class="text-selectable">${env.key}</dd>

        <dt>URI</dt>
        <dd class="text-selectable">${env.location}</dd>

        <dt>Source</dt>
        <dd class="text-selectable">${isLocal ? 'Local store' : 'Network store'}</dd>

        <dt>Default environment</dt>
        <dd>${isDefault ? 'Yes' : 'No'}</dd>

        ${isLocal ? '' : this.storeSessionInfo(env)}
    </dl>
    </section>
    `;
  }

  protected storeSessionInfo(env: IConfigEnvironment): TemplateResult {
    const { tokenExpires } = env;
    const time = tokenExpires ? new Date(tokenExpires) : undefined;
    return html`
    <dt>Authenticated</dt>
    <dd>${env.authenticated ? 'Yes' : 'No'}</dd>

    <dt>Token expires</dt>
    <dd>${time ? html`<relative-time datetime="${time.toISOString()}"></relative-time>` : 'Unknown'}</dd>
    `;
  }

  protected environmentOptionsTemplate(): TemplateResult {
    return html`
    <anypoint-menu-button dynamicAlign ?anypoint="${this.anypoint}" closeOnActivate>
      <anypoint-icon-button 
        slot="dropdown-trigger" 
        aria-label="Press to select available options"
        ?anypoint="${this.anypoint}"
      >
        <api-icon icon="moreVert"></api-icon>
      </anypoint-icon-button>
      <anypoint-listbox 
        class="dropdown-list-container" 
        slot="dropdown-content" 
        ?anypoint="${this.anypoint}"
        @select="${this._optionHandler}" 
        attrForSelected="data-option"
      >
        <anypoint-icon-item ?anypoint="${this.anypoint}" data-option="rename" class="dropdown-option">
          <api-icon icon="rename" slot="item-icon"></api-icon>Rename
        </anypoint-icon-item>
        <anypoint-icon-item ?anypoint="${this.anypoint}" data-option="make-default" class="dropdown-option" ?disabled="${this.isDefault}">
          <api-icon icon="taskAlt" slot="item-icon"></api-icon>Make default
        </anypoint-icon-item>
        <anypoint-icon-item ?anypoint="${this.anypoint}" data-option="authenticate" class="dropdown-option">
          <api-icon icon="key" slot="item-icon"></api-icon>Authenticate
        </anypoint-icon-item>
        <anypoint-icon-item ?anypoint="${this.anypoint}" data-option="delete" class="dropdown-option">
          <api-icon icon="deleteFile" slot="item-icon"></api-icon>Delete
        </anypoint-icon-item>
      </anypoint-listbox>
    </anypoint-menu-button>
    `;
  }

  protected addNewTemplate(): TemplateResult {
    return html`
    <form class="form">
      ${this.introTemplate()}
      ${this.storeTypeSelector()}
      ${this.storeUrlTemplate()}
      ${this.progressTemplate()}
      ${this.validationErrorTemplate()}
    </form>
    ${this.actionsTemplate()}
    ${this.helpDialog()}
    `;
  }
}
