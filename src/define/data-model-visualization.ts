import Element from '../elements/schema-design/DataModelVisualizationElement.js';

window.customElements.define('data-model-visualization', Element);

declare global {
  interface HTMLElementTagNameMap {
    'data-model-visualization': Element;
  }
}
