import Element from "../elements/project/ProjectRunnerElement.js";

window.customElements.define('project-runner', Element);

declare global {
  interface HTMLElementTagNameMap {
    'project-runner': Element;
  }
}
