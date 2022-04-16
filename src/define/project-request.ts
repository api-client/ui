import Element from "../elements/project/ProjectRequestElement.js";

window.customElements.define('project-request', Element);

declare global {
  interface HTMLElementTagNameMap {
    'project-request': Element;
  }
}
