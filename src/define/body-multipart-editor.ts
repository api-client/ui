import Element from '../elements/http/BodyMultipartEditorElement.js';

window.customElements.define('body-multipart-editor', Element);

declare global {
  interface HTMLElementTagNameMap {
    'body-multipart-editor': Element;
  }
}
