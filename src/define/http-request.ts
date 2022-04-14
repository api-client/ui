import Element from "../elements/http/HttpRequestElement.js";

window.customElements.define('http-request', Element);

declare global {
  interface HTMLElementTagNameMap {
    'http-request': Element;
  }
}
