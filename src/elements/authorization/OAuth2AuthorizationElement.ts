/* eslint-disable class-methods-use-this */
import { EventsTargetMixin } from '@anypoint-web-components/awc'
import { IOAuth2Authorization, ITokenInfo, OAuth2Authorization, OauthProcessingOptions, EventTypes as CoreEventTypes, ContextEvent } from '@api-client/core/build/browser.js';

export const authorizeHandler = Symbol('authorizeHandler');

/**
 * An element that utilizes the `OAuth2Authorization` class in a web component.
 * It handles DOM events to perform the authorization.
 */ 
export class OAuth2AuthorizationElement extends EventsTargetMixin(HTMLElement) {
  static get observedAttributes(): string[] {
    return ['tokenproxy', 'tokenproxyencode']; 
  }

  /** 
   * When set it uses this value to prefix the call to the 
   * OAuth 2 token endpoint. This is to support use cases when 
   * the requests should be proxied through a server to avoid CORS problems.
   */
  tokenProxy?: string;

  /**
   * When set it encodes the token URI value before adding it to the 
   * `tokenProxy`. This is to be used when the proxy takes the target 
   * URL as a query parameter.
   */
  tokenProxyEncode?: boolean;

  constructor() {
    super();
    this[authorizeHandler] = this[authorizeHandler].bind(this);
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    switch (name) {
      case 'tokenproxy': this.tokenProxy = newValue || undefined; break;
      case 'tokenproxyencode': this.tokenProxyEncode = newValue !== null; break;
      default:
    }
  }

  _attachListeners(node: EventTarget): void {
    super._attachListeners(node);
    node.addEventListener(CoreEventTypes.Authorization.OAuth2.authorize, this[authorizeHandler]);
    this.setAttribute('aria-hidden', 'true');
  }

  _detachListeners(node: EventTarget): void {
    super._detachListeners(node);
    node.removeEventListener(CoreEventTypes.Authorization.OAuth2.authorize, this[authorizeHandler]);
  }

  [authorizeHandler](event: Event): void {
    const e = event as ContextEvent<IOAuth2Authorization, ITokenInfo>;
    const config = { ...e.detail } as IOAuth2Authorization;
    e.detail.result = this.authorize(config);
  }

  /**
   * Authorize the user using provided settings.
   * This is left for compatibility. Use the `OAuth2Authorization` instead.
   *
   * @param settings The authorization configuration.
   */
  async authorize(settings: IOAuth2Authorization): Promise<ITokenInfo> {
    const { tokenProxy, tokenProxyEncode } = this;
    const options: OauthProcessingOptions = {};
    if (tokenProxy && typeof tokenProxy === 'string') {
      options.tokenProxy = tokenProxy;
    }
    if (tokenProxy && tokenProxyEncode && typeof tokenProxyEncode === 'boolean') {
      options.tokenProxyEncode = tokenProxyEncode;
    }
    const auth = new OAuth2Authorization(settings, options);
    auth.checkConfig();
    return auth.authorize();
  }
}
