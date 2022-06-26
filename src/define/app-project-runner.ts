import Element from "../elements/http-client/AppProjectRunnerElement.js";

window.customElements.define('app-project-runner', Element);

declare global {
  interface HTMLElementTagNameMap {
    'app-project-runner': Element;
  }
}
