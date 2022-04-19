import Element from '../elements/authorization/AuthorizationMethodElement.js';

window.customElements.define('authorization-method', Element);

declare global {
  interface HTMLElementTagNameMap {
    'authorization-method': Element;
  }
}
