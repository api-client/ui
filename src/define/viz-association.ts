import Element from '../visualization/elements/VizAssociationElement.js';

window.customElements.define('viz-association', Element);

declare global {
  interface HTMLElementTagNameMap {
    'viz-association': Element;
  }
}
