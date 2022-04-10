/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable class-methods-use-this */
import { html, TemplateResult } from 'lit';
import { IUser, Events as CoreEvents } from '@api-client/core/build/browser.js';
import { RenderableMixin } from '../mixins/RenderableMixin.js';
import { reactive } from '../lib/decorators.js';
import { Events } from '../events/Events.js';
import { EventTypes } from '../events/EventTypes.js';
import { IConfigEnvironment } from '../lib/config/Config.js';
import '../define/alert-dialog.js';

/**
 * A base class for pages build outside the LitElement. It uses `lit-html` 
 * as the template renderer.
 * 
 * The implementation (extending this class) should override the `pageTemplate()`
 * function that returns the `TemplateResult` from the `lit-html` library.
 * 
 * To reflect the changed state call the `render()` function. The function schedules
 * a micro task (through `requestAnimationFrame`) to call the render function on the template.
 * 
 * Use the `@reactive()` decorator from `src/lib/decorators.js` to mark a property as reactive,
 * meaning, when the property change it calls the `render()` function.
 */
export abstract class ApplicationScreen extends RenderableMixin(EventTarget) {
  @reactive() eventTarget: EventTarget = window;

  /** 
   * True when the app should render mobile friendly view.
   */
  @reactive() isMobile = false;

  /** 
   * The loading state information.
   */
  @reactive() loadingStatus = 'Initializing the application...';

  /**
   * Whether to render Anypoint theme.
   */
  @reactive() anypoint = false;

  /**
   * A flag telling the application screen that the logic is initialized.
   * 
   * The page can request different initialization logics. When the logic is
   * loaded the flag is set to true.
   */
  @reactive() initialized = false;

  /**
   * The page on the screen currently being rendered.
   */
  @reactive() page?: string;

  /**
   * The current user.
   * Call the `loadUser()` to populate this.
   */
  @reactive() protected user?: IUser;

  /**
   * True when the user meta is being loaded.
   */
  @reactive() protected loadingUser = false;
  
  @reactive() protected authenticated = false;

  protected pendingResolver?: (value: void | PromiseLike<void>) => void;

  constructor() {
    super();
    window.onunhandledrejection = this.unhandledRejectionHandler.bind(this);
    this.initMediaQueries();
    this.initStoreChange();
  }

  /**
   * Called once when the page is being initialized.
   */
  abstract initialize(): Promise<void>;

  /**
   * Initializes media queries and observers.
   */
  initMediaQueries(): void {
    const mql = window.matchMedia('(max-width: 600px)');
    this.isMobile = mql.matches;
    mql.addEventListener('change', (e) => {
      this.isMobile = e.matches;
    });
  }

  initStoreChange(): void {
    window.addEventListener(EventTypes.Config.Environment.State.defaultChange, (e: Event) => {
      const event = e as CustomEvent;
      const id = event.detail.id as string;
      this.storeChanged(id);
    });
  }

  /**
   * Override in a child class to implement a logic that runs when the default 
   * store change in the configuration.
   * 
   * @param id The id of the activated environment. When missing it means there's no default environment.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async storeChanged(id?: string): Promise<void> {
    // .
  }

  /**
   * Creates a modal dialog with the error details.
   * @param message The message to render
   */
  reportCriticalError(message: string): void {
    try {
      const dialog = document.createElement('alert-dialog');
      dialog.message = message;
      dialog.modal = true;
      dialog.open();
      document.body.appendChild(dialog);
    } catch (e) {
      /* eslint-disable-next-line no-console */  
      console.error(e);
    }
  }

  unhandledRejectionHandler(e: PromiseRejectionEvent): void {
    /* eslint-disable-next-line no-console */
    console.error(e);
    this.reportCriticalError(e.reason);
  }

  /**
   * Called from the initialize store init flow when the user is not authenticated
   * and the auth screen is rendered.
   */
  protected async _authHandler(): Promise<void> {
    await Events.Store.Auth.authenticate(true);
    this.authenticated = true;
    const { pendingResolver } = this;
    if (pendingResolver) {
      this.pendingResolver = undefined;
      pendingResolver();
    }
  }

  protected _storeConfigHandler(): void {
    const handler = (e: Event): void => {
      let ok = false;
      if (e.type === EventTypes.Config.Environment.State.defaultChange) {
        ok = true;
      } else {
        const custom = e as CustomEvent;
        ok = !!custom.detail.asDefault;
      }
      if (!ok) {
        return;
      }
      window.removeEventListener(EventTypes.Config.Environment.State.created, handler);
      window.removeEventListener(EventTypes.Config.Environment.State.defaultChange, handler);
      const { pendingResolver } = this;
      if (pendingResolver) {
        this.pendingResolver = undefined;
        pendingResolver();
      }
    };
    window.addEventListener(EventTypes.Config.Environment.State.created, handler);
    window.addEventListener(EventTypes.Config.Environment.State.defaultChange, handler);
    Events.Navigation.Store.config();
  }

  /**
   * @returns A template for the page loader
   */
  loaderTemplate(): TemplateResult {
    return html`
    <div class="app-loader">
      <p class="message">Preparing something spectacular</p>
      <p class="sub-message">${this.loadingStatus}</p>
    </div>
    `;
  }

  /**
   * Initializes the flow where an environment is required.
   * This checks for the default environment.
   * When it doesn't exists it asks the user to pick existing environment 
   * or to create one.
   * When a default environment exists, it performs authentication
   * when necessary. 
   * 
   * Eventually it returns the HTTP store with an authenticated environment.
   * 
   * @param defaultFlows When set to `true` is renders default pages for env selector 
   * or when to authenticate. When false it throws errors instead. Default to `true`.
   */
  protected async initializeStore(defaultFlows = true): Promise<void> {
    let env: IConfigEnvironment | undefined;
    try {
      env = await Events.Config.Environment.read();
    } catch (e) { 
      if (!defaultFlows) {
        throw e;
      }
    }
    if (!env) {
      return new Promise((resolve) => {
        this.pendingResolver = resolve;
        this.page = 'env-required';
      });
    }
    await Events.Store.Global.setEnv(env);
    const authStatus = await Events.Store.Auth.isAuthenticated();
    if (!authStatus) {
      if (!defaultFlows) {
        throw new Error(`Not authenticated.`);
      }
      return new Promise((resolve) => {
        this.pendingResolver = resolve;
        this.page = 'auth-required';
      });
    }
    this.authenticated = true;
    return undefined;
  }

  async loadUser(): Promise<void> {
    this.loadingUser = true;
    try {
      this.user = await Events.Store.User.me();
    } catch (e) {
      CoreEvents.Telemetry.exception(this.eventTarget || window, `Loading user: ${(e as Error).message}`);
    } finally {
      this.loadingUser = false;
    }
  }

  pageTemplate(): TemplateResult {
    const { initialized } = this;
    if (!initialized) {
      if (this.page) {
        return html`
        ${this.renderInitFlowPage()}
        `;
      }
      return this.loaderTemplate();
    }
    return html``;
  }

  protected headerTemplate(): TemplateResult {
    return html`
    <header>Welcome</header>
    `;
  }

  protected mainTemplate(): TemplateResult {
    return html`<main></main>`;
  }

  protected footerTemplate(): TemplateResult {
    return html`<footer>Credits: Pawel Uchida-Psztyc</footer>`;
  }

  protected navigationTemplate(): TemplateResult {
    return html`<nav></nav>`;
  }

  protected renderInitFlowPage(): TemplateResult {
    switch (this.page) {
      case 'auth-required': return this.renderAuthRequired();
      case 'env-required': return this.renderEnvRequired();
      default: return html`<p class="general-error">Unknown state. Did you set the <i>initialized</i> flag?</p>`;
    }
  }

  /**
   * Renders a full page overlay with the authentication required message.
   */
  protected renderAuthRequired(): TemplateResult {
    return html`
    <div class="auth-required-screen">
      <h1>Authentication required</h1>
      <p class="message">You are not authenticated. To continue, please, authenticate your account.</p>
      <anypoint-button emphasis="high" @click="${this._authHandler}">Authenticate</anypoint-button>
    </div>
    `;
  }

  protected renderEnvRequired(): TemplateResult {
    return html`
    <div class="auth-required-screen">
      <h1>Environment configuration missing</h1>
      <p class="message">
        The application is unable to determine which environment to use.
        Open the <b>store configuration</b> screen to configure the connection.
      </p>
      <anypoint-button emphasis="high" @click="${this._storeConfigHandler}">Configure store</anypoint-button>
    </div>
    `;
  }
}
