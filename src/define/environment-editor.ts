import Element from "../elements/environment/EnvironmentEditorElement.js";

window.customElements.define('environment-editor', Element);

declare global {
  interface HTMLElementTagNameMap {
    'environment-editor': Element;
  }
}
