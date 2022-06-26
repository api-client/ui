import Element from "../elements/http-client/AppProjectRequestElement.js";

window.customElements.define('app-project-request', Element);

declare global {
  interface HTMLElementTagNameMap {
    'app-project-request': Element;
  }
}
