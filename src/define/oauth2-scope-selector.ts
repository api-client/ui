import Element from '../elements/authorization/OAuth2ScopeSelectorElement.js';

window.customElements.define('oauth2-scope-selector', Element);

declare global {
  interface HTMLElementTagNameMap {
    'oauth2-scope-selector': Element;
  }
}
