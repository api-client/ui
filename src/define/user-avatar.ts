import Element from "../elements/user/UserAvatarElement.js";

window.customElements.define('user-avatar', Element);

declare global {
  interface HTMLElementTagNameMap {
    'user-avatar': Element;
  }
}
