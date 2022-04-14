import Element from "../elements/environment/ServerEditorElement.js";

window.customElements.define('server-editor', Element);

declare global {
  interface HTMLElementTagNameMap {
    'server-editor': Element;
  }
}
