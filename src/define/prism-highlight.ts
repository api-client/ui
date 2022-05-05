import Element from '../elements/highlight/PrismHighlightElement.js';

window.customElements.define('prism-highlight', Element);

declare global {
  interface HTMLElementTagNameMap {
    'prism-highlight': Element;
  }
}
