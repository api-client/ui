import { html, TemplateResult, CSSResult } from 'lit';
import { AnypointSwitchElement } from '@anypoint-web-components/awc';
import { RenderableMixin } from '../../mixins/RenderableMixin.js';
import { reactive } from '../../lib/decorators.js';
import '@anypoint-web-components/awc/dist/define/anypoint-menu-button.js';
import '@anypoint-web-components/awc/dist/define/anypoint-icon-button.js';
import '@anypoint-web-components/awc/dist/define/anypoint-switch.js';
import '../../../define/api-icon.js';
import styles from './DemoStyles.js';

/**
 * A base class for demo pages in the API Client ecosystem.
 */
export abstract class DemoPage extends RenderableMixin(EventTarget) {
  static get styles(): CSSResult {
    return styles;
  }

  /**
   * A list of demo states to be passed to `arc-interactive-demo` element
   */
  demoStates: string[] = ['Material', 'Anypoint'];

  /**
   * Whether the demoed component should be rendered in the "narrow" view
   */
  @reactive()
  narrow: boolean = false;

  /**
   * Whether view controls should be rendered in the top navigation.
   */
  @reactive()
  renderViewControls = false;

  /**
   * Component name rendered in the header section.
   */
  @reactive()
  componentName = '';

  /**
   * Determines whether the initial render had run and the `firstRender()`
   * function was called.
   */
  firstRendered = false;

  /**
   * Whether or not the styles should be applied to `.styled` element.
   */
  @reactive()
  stylesActive = true;

  /**
   * Whether or not the dark theme is active
   */
  @reactive()
  darkThemeActive = false;

  /**
   * Enables Anypoint platform styles.
   */
  @reactive()
  anypoint = false;

  constructor() {
    super();
    this._mediaQueryHandler = this._mediaQueryHandler.bind(this);
    this.initMediaQueries();

    document.body.classList.add('demo');
  }

  /**
   * Initializes media queries and observers.
   */
  initMediaQueries(): void {
    const matcher = window.matchMedia('(prefers-color-scheme: dark)');
    if (matcher.matches) {
      this.darkThemeActive = true;
    }
    matcher.addEventListener('change', this._mediaQueryHandler);
  }

  protected _mediaQueryHandler(e: MediaQueryListEvent): void {
    this.darkThemeActive = e.matches;
  }

  protected _darkThemeHandler(e: CustomEvent): void {
    const node = e.target as AnypointSwitchElement;
    this.darkThemeActive = node.checked;
  }

  protected _narrowHandler(e: Event): void {
    const node = e.target as AnypointSwitchElement;
    this.narrow = node.checked;
  }

  protected _stylesHandler(e: Event): void {
    const node = e.target as AnypointSwitchElement;
    this.stylesActive = node.checked;
    if (node.checked) {
      document.body.classList.add('demo');
    } else {
      document.body.classList.remove('demo');
    }
  }

  /**
   * The page render function. Usually you don't need to use it.
   * It renders the header template, main section, and the content.
   */
  pageTemplate(): TemplateResult {
    return html`
    ${this.headerTemplate()}
    <main>
      ${this.contentTemplate()}
    </main>`;
  }

  /**
   * Call this on the top of the `render()` method to render demo navigation
   * @returns HTML template for demo header
   */
  headerTemplate(): TemplateResult {
    const { componentName } = this;
    return html`
    <header>
      ${componentName ? html`<h1 class="api-title">${componentName}</h1>` : ''}
      <div class="spacer"></div>
      ${this._viewControlsTemplate()}
    </header>`;
  }

  /**
   * @return Template for the view controls
   */
  protected _viewControlsTemplate(): TemplateResult|string {
    if (!this.renderViewControls) {
      return '';
    }
    return html`
    <anypoint-menu-button dynamicAlign>
      <anypoint-icon-button
        slot="dropdown-trigger"
        aria-label="Press to toggle demo page settings menu"
      >
        <api-icon icon="settings"></api-icon>
      </anypoint-icon-button>
      <div slot="dropdown-content">
        <div class="settings-action-item">
          <anypoint-switch @change="${this._darkThemeHandler}">Toggle dark theme</anypoint-switch>
        </div>
        <div class="settings-action-item">
          <anypoint-switch @change="${this._narrowHandler}">Toggle narrow attribute</anypoint-switch>
        </div>
        <div class="settings-action-item">
          <anypoint-switch checked @change="${this._stylesHandler}">Toggle styles</anypoint-switch>
        </div>
        ${this._demoViewControlsTemplate()}
      </div>
    </anypoint-menu-button>`;
  }

  /**
   * Override this function to add some custom custom controls to the
   * view controls dropdown.
   * @returns HTML template for demo header
   */
  protected _demoViewControlsTemplate(): TemplateResult {
    return html``;
  }

  /**
   * Abstract method. When not overriding `render()` method you can use
   * this function to render content inside the standard API components layout.
   *
   * ```
   * contentTemplate() {
   *  return html`<p>Demo content</p>`;
   * }
   * ```
   */
  abstract contentTemplate(): TemplateResult;
}
