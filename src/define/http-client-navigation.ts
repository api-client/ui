import Element from '../elements/http-client/HttpClientNavigationElement.js';

window.customElements.define('http-client-navigation', Element);

declare global {
  interface HTMLElementTagNameMap {
    'http-client-navigation': Element;
  }
}
