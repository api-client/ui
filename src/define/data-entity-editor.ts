import Element from '../elements/schema-design/DataEntityEditorElement.js';

window.customElements.define('data-entity-editor', Element);

declare global {
  interface HTMLElementTagNameMap {
    'data-entity-editor': Element;
  }
}
