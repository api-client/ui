import Element from '../elements/http/BodyFormdataEditorElement.js';

window.customElements.define('body-formdata-editor', Element);

declare global {
  interface HTMLElementTagNameMap {
    'body-formdata-editor': Element;
  }
}
