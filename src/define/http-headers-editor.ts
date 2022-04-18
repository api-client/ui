import Element from "../elements/http/HeadersEditorElement.js";

window.customElements.define('http-headers-editor', Element);

declare global {
  interface HTMLElementTagNameMap {
    'http-headers-editor': Element;
  }
}
