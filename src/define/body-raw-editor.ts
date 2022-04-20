import Element from '../elements/http/BodyRawEditorElement.js';

window.customElements.define('body-raw-editor', Element);

declare global {
  interface HTMLElementTagNameMap {
    'body-raw-editor': Element;
  }
}
