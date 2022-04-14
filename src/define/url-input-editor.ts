import Element from '../elements/http/UrlInputEditorElement.js';

window.customElements.define('url-input-editor', Element);

declare global {
  interface HTMLElementTagNameMap {
    "url-input-editor": Element;
  }
}
