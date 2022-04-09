import Element from "../elements/dialog/RenameDialogElement.js";

window.customElements.define('rename-file-dialog', Element);

declare global {
  interface HTMLElementTagNameMap {
    'rename-file-dialog': Element;
  }
}
