import Element from '../elements/schema-design/PropertyFormElement.js';

window.customElements.define('data-property-form', Element);

declare global {
  interface HTMLElementTagNameMap {
    'data-property-form': Element;
  }
}
