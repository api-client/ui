import Element from '../elements/schema-design/EntityFormElement.js';

window.customElements.define('data-entity-form', Element);

declare global {
  interface HTMLElementTagNameMap {
    'data-entity-form': Element;
  }
}
