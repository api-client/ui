import Element from "../elements/dialog/AlertDialogElement.js";

window.customElements.define('alert-dialog', Element);

declare global {
  interface HTMLElementTagNameMap {
    'alert-dialog': Element;
  }
}
