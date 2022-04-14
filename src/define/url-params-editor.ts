import Element from "../elements/http/UrlParamsEditorElement.js";

window.customElements.define('url-params-editor', Element);

declare global {
  interface HTMLElementTagNameMap {
    'url-params-editor': Element;
  }
}
