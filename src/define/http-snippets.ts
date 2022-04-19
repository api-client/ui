import Element from '../elements/code/HttpSnippetsElement.js';

window.customElements.define('http-snippets', Element);

declare global {
  interface HTMLElementTagNameMap {
    'http-snippets': Element;
  }
}
