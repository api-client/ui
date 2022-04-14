
import Element from "../elements/environment/VariablesEditorElement.js";

window.customElements.define('variables-editor', Element);

declare global {
  interface HTMLElementTagNameMap {
    'variables-editor': Element;
  }
}
