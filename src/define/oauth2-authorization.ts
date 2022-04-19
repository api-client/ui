import { OAuth2AuthorizationElement } from '../elements/authorization/OAuth2AuthorizationElement.js';

window.customElements.define('oauth2-authorization', OAuth2AuthorizationElement);

declare global {
  interface HTMLElementTagNameMap {
    'oauth2-authorization': Element;
  }
}
