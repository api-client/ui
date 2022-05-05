import Element from "../elements/highlight/MarkedHighlightElement.js";

window.customElements.define('marked-highlight', Element);

declare global {
  interface HTMLElementTagNameMap {
    'marked-highlight': Element;
  }
}
