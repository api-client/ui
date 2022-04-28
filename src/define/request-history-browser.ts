import Element from "../elements/project/RequestHistoryBrowserElement.js";

window.customElements.define('request-history-browser', Element);

declare global {
  interface HTMLElementTagNameMap {
    'request-history-browser': Element;
  }
}
