import Element from "../elements/files/ShareFileElement.js";

window.customElements.define('share-file', Element);

declare global {
  interface HTMLElementTagNameMap {
    'share-file': Element;
  }
}
