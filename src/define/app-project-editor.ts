import Element from "../elements/http-client/AppProjectEditorElement.js";

window.customElements.define('app-project-editor', Element);

declare global {
  interface HTMLElementTagNameMap {
    'app-project-editor': Element;
  }
}
