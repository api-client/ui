
import Element from "../elements/project/ProjectRunReportElement.js";

window.customElements.define('project-run-report', Element);

declare global {
  interface HTMLElementTagNameMap {
    'project-run-report': Element;
  }
}
