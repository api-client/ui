import Element from "../elements/user/AppSettingsMenuElement.js";

window.customElements.define('app-settings-menu', Element);

declare global {
  interface HTMLElementTagNameMap {
    'app-settings-menu': Element;
  }
}
