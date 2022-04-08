/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable class-methods-use-this */
import { html, TemplateResult } from 'lit';
import {  IUser, Events as CoreEvents } from '@api-client/core/build/browser.js';
import { RenderableMixin } from '../mixins/RenderableMixin.js';
import { reactive } from '../lib/decorators.js';
import { Events } from '../events/Events.js';
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
  @reactive()
  eventTarget: EventTarget = window;

  /** 
   * True when the app should render mobile friendly view.
   */
  @reactive()
  isMobile = false;

  /** 
   * The loading state information.
   */
  @reactive()
  loadingStatus = 'Initializing the application...';

  /**
   * Whether to render Anypoint theme.
   */
  @reactive()
  anypoint = false;

  /**
   * A flag telling the application screen that the logic is initialized.
   * 
   * The page can request different initialization logics. When the logic is
   * loaded the flag is set to true.
   */
  @reactive()
  initialized = false;

  /**
   * The page on the screen currently being rendered.
   */
  @reactive()
  page?: string;

  /**
   * The current user.
   * Call the `loadUser()` to populate this.
   */
  @reactive() protected user?: IUser;

  /**
   * True when the user meta is being loaded.
   */
  @reactive() protected loadingUser = false;

  constructor() {
    super();
    window.onunhandledrejection = this.unhandledRejectionHandler.bind(this);
    this.initMediaQueries();
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

  /**
   * Creates a modal dialog with the error details.
   * @param message The message to render
   */
  reportCriticalError(message: string): void {
    /* eslint-disable-next-line no-console */
    console.error(message);
    const dialog = document.createElement('alert-dialog');
    dialog.message = message;
    dialog.modal = true;
    dialog.open();
    document.body.appendChild(dialog);
  }

  unhandledRejectionHandler(e: PromiseRejectionEvent): void {
    /* eslint-disable-next-line no-console */
    console.error(e);
    this.reportCriticalError(e.reason);
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
   */
  protected async initializeStore(): Promise<void> {
    const env = await Events.Config.Environment.read();
    if (!env) {
      // TODO: ask for an environment
      throw new Error(`No environment.`);
    }
    await Events.Store.Global.setEnv(env);
    const authStatus = await Events.Store.Auth.isAuthenticated();
    if (!authStatus) {
      // TODO: Should render a page with auth request.
      await Events.Store.Auth.authenticate(true);
    }
  }

  async loadUser(): Promise<void> {
    this.loadingUser = true;
    try {
      this.user = await Events.Store.User.me();
    } catch (e) {
      CoreEvents.Telemetry.exception(this.eventTarget, `Loading user: ${(e as Error).message}`);
    } finally {
      this.loadingUser = false;
    }
  }

  pageTemplate(): TemplateResult {
    const { initialized } = this;
    if (!initialized) {
      return this.loaderTemplate();
    }
    return html``;
  }
}
