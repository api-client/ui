import Element from '../visualization/elements/VizWorkspaceElement.js';

window.customElements.define('viz-workspace', Element);

declare global {
  interface HTMLElementTagNameMap {
    'viz-workspace': Element;
  }
}
