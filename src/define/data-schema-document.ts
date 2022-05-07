import Element from '../elements/schema-design/DataSchemaDocument.js';

window.customElements.define('data-schema-document', Element);

declare global {
  interface HTMLElementTagNameMap {
    'data-schema-document': Element;
  }
}
