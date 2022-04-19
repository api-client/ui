import Element from '../elements/authorization/AuthorizationSelectorElement.js';

window.customElements.define('authorization-selector', Element);

declare global {
  interface HTMLElementTagNameMap {
    'authorization-selector': Element;
  }
}
