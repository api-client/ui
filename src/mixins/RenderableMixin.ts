/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */
import { dedupeMixin } from '@open-wc/dedupe-mixin';
import { html, TemplateResult, render, CSSResult, css } from 'lit';
import { reactive } from '../lib/decorators.js';

export const renderingValue = Symbol('renderingValue');
export const renderPage = Symbol('renderPage');
export const setUpdatePromise = Symbol('setUpdatePromise');
export const updateResolver = Symbol('updateResolver');
export const hasPendingUpdatePromise = Symbol('hasPendingUpdatePromise');
export const resolveUpdatePromise = Symbol('resolveUpdatePromise');

type Constructor<T = {}> = new (...args: any[]) => T;

/**
 * Whether the current browser supports `adoptedStyleSheets`.
 */
export const supportsAdoptingStyleSheets =
 window.ShadowRoot &&
 'adoptedStyleSheets' in Document.prototype &&
 'replace' in CSSStyleSheet.prototype;

export declare class RenderableMixinInterface {
  /**
   * Determines whether the initial render had run and the `firstRender()`
   * function was called.
   *
   * @default false
   */
  firstRendered: boolean;

  /** 
   * @type A promise resolved when the render finished.
   */
  updateComplete?: Promise<boolean>;

  /** 
   * True when rendering debouncer is running.
   */
  get rendering(): boolean;

  /**
   * Helper function to be overridden by child classes. It is called when the view
   * is rendered for the first time.
   */
  firstRender(): void;

  /**
   * A function called when the template has been rendered
   */
  updated(): void;

  /**
   * This to be used by the child classes to render page template.
   * @returns Application page template
   */
  pageTemplate(): TemplateResult;

  /**
   * The main render function. Sub classes should not override this method.
   * Override `[renderPage]()` instead.
   *
   * The function calls `[renderPage]()` in a micro task so it is safe to call this
   * multiple time in the same event loop.
   */
  render(): TemplateResult | undefined;
}

/**
 * Adds methods that helps with asynchronous template rendering.
 * 
 * The application page content is rendered into the `#app` container.
 *
 * @mixin
 */
export const RenderableMixin = dedupeMixin(<T extends Constructor<any>>(superClass: T): Constructor<RenderableMixinInterface> & T => {
  class MyMixinClass extends superClass {
    
    static get styles(): CSSResult | CSSResult[] {
      return css``;
    }

    /**
     * Determines whether the initial render had run and the `firstRender()`
     * function was called.
     *
     * @default false
     */
    @reactive() 
    firstRendered = false;

    [renderingValue] = false;

    [hasPendingUpdatePromise] = false;

    [updateResolver]: (value?: any) => void;

    /** 
     * @type A promise resolved when the render finished.
     */
    updateComplete?: Promise<boolean>;

    /** 
     * True when rendering debouncer is running.
     */
    get rendering(): boolean {
      return this[renderingValue];
    }

    constructor(...args: any[]) {
      super(...args);
      this[setUpdatePromise]();
      this.adaptStyles();
    }

    protected adaptStyles(): void {
      // @ts-ignore
      const input = this.constructor.styles as CSSResult | CSSResult[];
      if (!input) {
        return;
      }
      let styles = input as CSSResult[];
      if (!Array.isArray(input)) {
        styles = [input];
      }
      if (supportsAdoptingStyleSheets) {
        const sheets = styles.map(i => i.styleSheet);
        // @ts-ignore
        document.adoptedStyleSheets = [...document.adoptedStyleSheets, ...sheets];
      } else {
        styles.forEach((s) => {
          const style = document.createElement('style');
          style.textContent = (s as CSSResult).cssText;
          document.head.appendChild(style);
        });
      }
    }

    /**
     * Helper function to be overridden by child classes. It is called when the view
     * is rendered for the first time.
     */
    firstRender(): void {
    }

    /**
     * A function called when the template has been rendered
     */
    updated(): void {}

    /**
     * This to be used by the child classes to render page template.
     * @returns Application page template
     */
    pageTemplate(): TemplateResult {
      return html``;
    }

    /**
     * The main render function. Sub classes should not override this method.
     * Override `[renderPage]()` instead.
     *
     * The function calls `[renderPage]()` in a micro task so it is safe to call this
     * multiple time in the same event loop.
     */
    render(): TemplateResult | undefined {
      if (this.rendering) {
        return;
      }
      this[renderingValue] = true;
      if (!this[hasPendingUpdatePromise]) {
        this[setUpdatePromise]();
      }
      requestAnimationFrame(() => {
        this[renderingValue] = false;
        this[renderPage]();
      });
    }

    [renderPage](): void {
      const root = document.querySelector('#app') as HTMLElement;
      if (!root) {
        // eslint-disable-next-line no-console
        console.warn(`The <div id="app"></div> is not in the document.`);
        return;
      }
      if (!this.firstRendered) {
        this.firstRendered = true;
        setTimeout(() => this.firstRender());
      }
      render(this.pageTemplate(), root, {  host: this, });
      this[resolveUpdatePromise]();
      this.updated();
    }

    [setUpdatePromise](): void {
      this.updateComplete = new Promise((resolve) => {
        this[updateResolver] = resolve;
        this[hasPendingUpdatePromise] = true;
      });
    }

    [resolveUpdatePromise](): void {
      if (!this[hasPendingUpdatePromise]) {
        return;
      }
      this[hasPendingUpdatePromise] = false;
      this[updateResolver]();
    }
  };
  return MyMixinClass as Constructor<RenderableMixinInterface> & T;
});
