import Element from '../elements/http/BodyEditorElement.js';

window.customElements.define('body-editor', Element);

declare global {
  interface HTMLElementTagNameMap {
    'body-editor': Element;
  }
}
