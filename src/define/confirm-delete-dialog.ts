import Element from "../elements/dialog/ConfirmDeleteDialogElement.js";

window.customElements.define('confirm-delete-dialog', Element);

declare global {
  interface HTMLElementTagNameMap {
    'confirm-delete-dialog': Element;
  }
}
