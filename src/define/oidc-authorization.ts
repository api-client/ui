import Element from '../elements/authorization/OidcAuthorizationElement.js';

window.customElements.define('oidc-authorization', Element);

declare global {
  interface HTMLElementTagNameMap {
    'oidc-authorization': Element;
  }
}
