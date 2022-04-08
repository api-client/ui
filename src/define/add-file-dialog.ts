import Element from "../elements/files/AddFileDialogElement.js";

window.customElements.define('add-file-dialog', Element);

declare global {
  interface HTMLElementTagNameMap {
    'add-file-dialog': Element;
  }
}
