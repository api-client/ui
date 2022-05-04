import Element from "../elements/schema-design/SchemaNamespaceSelectorElement.js";

window.customElements.define('schema-namespace-selector', Element);

declare global {
  interface HTMLElementTagNameMap {
    'schema-namespace-selector': Element;
  }
}
