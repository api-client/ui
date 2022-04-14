import Element from "../elements/project/ProjectNavigationElement.js";

window.customElements.define('project-navigation', Element);

declare global {
  interface HTMLElementTagNameMap {
    'project-navigation': Element;
  }
}
