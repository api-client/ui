import Element from '../elements/schema-design/AssociationFormElement.js';

window.customElements.define('data-association-form', Element);

declare global {
  interface HTMLElementTagNameMap {
    'data-association-form': Element;
  }
}
