import Element from "../elements/http/LogHeadersElement.js";

window.customElements.define('log-headers', Element);

declare global {
  interface HTMLElementTagNameMap {
    'log-headers': Element;
  }
}
