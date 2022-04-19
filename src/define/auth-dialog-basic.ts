import Element from '../elements/authorization/AuthDialogBasicElement.js';

window.customElements.define('auth-dialog-basic', Element);

declare global {
  interface HTMLElementTagNameMap {
    'auth-dialog-basic': Element;
  }
}
