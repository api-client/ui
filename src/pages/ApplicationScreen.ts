/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable class-methods-use-this */
import { html, TemplateResult } from 'lit';
import { RenderableMixin } from '../mixins/RenderableMixin.js';
import { reactive } from '../lib/decorators.js';

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
 * More useful option is to use the `initObservableProperties()` function that accepts a list 
 * of properties set on the base class that once set triggers the render function. The setter checks
 * whether the a value actually changed. It works well for primitives but it won't work as expected
 * for complex types.
 */
export class ApplicationScreen extends RenderableMixin(EventTarget) {
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

  constructor() {
    super();
    window.onunhandledrejection = this.unhandledRejectionHandler.bind(this);
    
    this.initMediaQueries();
  }

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
    // const dialog = document.createElement('alert-dialog');
    // dialog.message = message;
    // dialog.modal = true;
    // dialog.open();
    // document.body.appendChild(dialog);
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
}
