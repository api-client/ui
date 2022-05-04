import Element from "../elements/schema-design/SchemaDesignNavigationElement.js";

window.customElements.define('schema-design-navigation', Element);

declare global {
  interface HTMLElementTagNameMap {
    'schema-design-navigation': Element;
  }
}
