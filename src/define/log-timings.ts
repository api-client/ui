import Element from "../elements/http/LogTimings.js";

window.customElements.define('log-timings', Element);

declare global {
  interface HTMLElementTagNameMap {
    'log-timings': Element;
  }
}
