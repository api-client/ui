import Element from "../elements/har/HarViewerElement.js";

window.customElements.define('har-viewer', Element);

declare global {
  interface HTMLElementTagNameMap {
    'har-viewer': Element;
  }
}
