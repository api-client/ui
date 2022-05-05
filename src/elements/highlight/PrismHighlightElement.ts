/* eslint-disable lit-a11y/click-events-have-key-events */
/**
@license
Copyright 2018 The Advanced REST Client authors
Licensed under the Apache License, Version 2.0 (the "License"); you may not
use this file except in compliance with the License. You may obtain a copy of
the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
License for the specific language governing permissions and limitations under
the License.
*/
import { LitElement, html, CSSResult, css, PropertyValueMap, TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import prismStyles from './PrismStyles.js';
import { PrismHighlighter } from './PrismHighlighter.js';

/** @typedef {import('prismjs')} Prism */

export const rawTemplate = Symbol('rawTemplate');
export const highlightedTemplate = Symbol('highlightedTemplate');
export const handleLinks = Symbol('handleLinks');
export const tokenizeResults = Symbol('tokenizeResults');
export const outputElement = Symbol('outputElement');
export const highlight = Symbol('highlight');
export const rawChanged = Symbol('rawChanged');
export const highlighter = Symbol('highlighter');
export const highlightHandler = Symbol('highlightHandler');

/**
 * Syntax highlighting via Prism
 *
 * ### Example
 *
 * ```html
 * <prism-highlight id="c1" lang="markdown"></prism-highlight>
 * <script>
 *  document.querySelector('#c1').code = '# Test highlight';
 * &lt;/script>
 * ```
 *
 * The `lang` attribute is required and the component will not start parsing data without it.
 *
 * Changing the `lang` and `code` properties together, do it in less than 10 ms.
 * The element is set to commit changes after this time period. Otherwise it may display
 * old and new code due to the asynchronous nature of the code highlighter.
 * 
 * @fires link - An event dispatched when the user click on the link. The detail object has the `url` property with the link value and the `asNew` property set to `true` when ctrl/cmd key was pressed when the link was clicked.
 */
export default class PrismHighlightElement extends LitElement {
  static get styles(): CSSResult[] {
    return [ 
      prismStyles, 
      css`
      :host {
        display: block;
      }

      pre {
        user-select: text;
        margin: 8px;
      }

      .worker-error {
        color: var(--error-color);
      }

      .token a {
        color: inherit;
      }

      .raw-content {
        overflow: hidden;
      }

      .raw {
        overflow: hidden;
        white-space: break-spaces;
      }
      `,
    ];
  }

  /**
   * A data to be highlighted and rendered.
   */
  @property({ type: String }) code?: string;

  /**
   * Prism supported language.
   */
  @property({ type: String, reflect: true }) lang: string = '';

  /** 
   * When set it ignores syntax highlighting and only renders the code.
   */
  @property({ type: Boolean, reflect: true }) raw?: boolean;

  get [outputElement](): HTMLElement | null | undefined {
    return this.shadowRoot?.querySelector('code');
  }

  [highlighter] = new PrismHighlighter(this[highlightHandler].bind(this));

  [tokenizeResults]?: string;

  protected updated(cp: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
    super.updated(cp);
    if (cp.has('code') || cp.has('lang')) {
      this[highlight]();
    }
    if (cp.has('raw')) {
      this[rawChanged]();
    }
  }

  firstUpdated(): void {
    /* istanbul ignore if */
    if (this[tokenizeResults] && !this.raw) {
      const out = this[outputElement];
      if (out) {
        out.innerHTML += this[tokenizeResults];
      }
      this[tokenizeResults] = undefined;
    }
  }

  // Resets the state of the render to initial state.
  reset(): void {
    const node = this[outputElement];
    if (node) {
      node.innerHTML = '';
    }
  }

  [highlightHandler](code: string): void {
    const node = this[outputElement];
    /* istanbul ignore else */
    if (node) {
      node.innerHTML += code;
    } else {
      this[tokenizeResults] = code;
    }
  }

  [rawChanged](): void {
    if (!this.raw) {
      this[highlight]();
    }
  }
  
  /**
   * Highlights the code.
   */
  [highlight](): void {
    const { code, lang, raw } = this;
    if ((!code && lang) || raw) {
      return;
    }
    this.reset();
    this[highlighter].debounce(code || '', lang);
  }

  /**
   * Handler for click events.
   */
  [handleLinks](e: MouseEvent): void {
    const el = e.target as HTMLElement;
    if (el.localName !== 'a') {
      return;
    }
    const link = el as HTMLAnchorElement;
    const newEntity = e.ctrlKey || e.metaKey;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    const url = link.href;
    this.dispatchEvent(new CustomEvent('link', {
      detail: {
        url,
        asNew: newEntity,
      },
    }));
  }

  render(): TemplateResult {
    const { raw } = this;
    return html`
      ${raw ? this[rawTemplate]() : this[highlightedTemplate]()}
    `;
  }

  [highlightedTemplate](): TemplateResult {
    return html`
    <pre class="parsed-content">
      <code id="output" class="language-" @click="${this[handleLinks]}"></code>
    </pre>
    `;
  }

  [rawTemplate](): TemplateResult {
    return html`
    <pre class="raw-content">
      <code id="output" class="raw">${this.code}</code>
    </pre>
    `;
  }
}
