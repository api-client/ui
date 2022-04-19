import Element from '../elements/authorization/AuthDialogNtlmElement.js';

window.customElements.define('auth-dialog-ntlm', Element);

declare global {
  interface HTMLElementTagNameMap {
    'auth-dialog-ntlm': Element;
  }
}
