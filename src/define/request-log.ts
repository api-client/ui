import Element from "../elements/http/RequestLogElement.js";

window.customElements.define('request-log', Element);

declare global {
  interface HTMLElementTagNameMap {
    'request-log': Element;
  }
}
