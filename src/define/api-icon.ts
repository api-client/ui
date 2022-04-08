import Element from "../elements/icons/ApiIconElement.js";

window.customElements.define('api-icon', Element);

declare global {
  interface HTMLElementTagNameMap {
    'api-icon': Element;
  }
}
