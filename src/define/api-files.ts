import Element from "../elements/files/ApiFilesElement.js";

window.customElements.define('api-files', Element);

declare global {
  interface HTMLElementTagNameMap {
    'api-files': Element;
  }
}
