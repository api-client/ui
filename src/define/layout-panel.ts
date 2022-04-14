import Element from "../elements/layout/LayoutPanelElement.js";

window.customElements.define('layout-panel', Element);

declare global {
  interface HTMLElementTagNameMap {
    'layout-panel': Element;
  }
}
