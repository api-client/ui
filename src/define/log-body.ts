import Element from "../elements/http/LogBodyElement.js";

window.customElements.define('log-body', Element);

declare global {
  interface HTMLElementTagNameMap {
    'log-body': Element;
  }
}
