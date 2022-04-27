import Element from "../elements/project/ProjectRunnerNavigationElement.js";

window.customElements.define('project-runner-navigation', Element);

declare global {
  interface HTMLElementTagNameMap {
    'project-runner-navigation': Element;
  }
}
