/* eslint-disable class-methods-use-this */
import { html, TemplateResult } from "lit";
import '@github/time-elements';
import { IOauth2GrantType, IOauth2ResponseType, IOidcAuthorization, IOidcTokenError, IOidcTokenInfo, KnownGrants, IOpenIdProviderMetadata, Events as CoreEvents, AuthorizationUtils } from "@api-client/core/build/browser.js";
import { AnypointListboxElement } from "@anypoint-web-components/awc";
import OAuth2 from './OAuth2.js';
import { inputTemplate } from '../CommonTemplates.js';
import { selectNode } from "../Utils.js";
import { AuthUiInit } from '../types.js';

export const GrantLabels: Record<string, string> = {
  [KnownGrants.implicit]: 'Access token',
  [KnownGrants.code]: 'Authorization code',
  refresh_token: 'Refresh token',
  [KnownGrants.password]: 'Password',
  [KnownGrants.clientCredentials]: 'Client credentials',
  [KnownGrants.deviceCode]: 'Device code',
  [KnownGrants.jwtBearer]: 'JWT Bearer',
};

export const ResponseTypeLabels: Record<string, string> = {
  token: 'Token',
  code: 'Code',
  id_token: 'ID token',
  id: 'ID token',
};

export const discoveryCache = new Map();

/**
 * @returns The default grant types for OIDC
 */
export const defaultGrantTypes: IOauth2GrantType[] = [
  {
    type: "implicit",
    label: "Access token (browser flow)",
  },
  {
    type: "authorization_code",
    label: "Authorization code (server flow)",
  },
];

export default class OpenID extends OAuth2 {
  /**
   * @returns {boolean} True when the current `grantType` can support redirect URI.
   */
  get hasRedirectUri(): boolean {
    const { grantType, discovered } = this;
    if (!discovered || ! grantType) {
      return false;
    }
    return [KnownGrants.implicit, KnownGrants.code].includes(grantType);
  }

  discovered = false;
  
  issuerUri?: string;

  tokens?: (IOidcTokenInfo | IOidcTokenError)[];

  tokenInUse?: number;

  supportedResponses?: IOauth2ResponseType[][];

  /** 
   * The index of the response from the `supportedResponses`.
   * By default it selects the first one.
   */
  selectedResponse?: number;

  /** 
   * The list of scopes supported by the authorization server.
   */
  serverScopes?: string[];
  
  /** 
   * The response type to be used with the OAuth 2 request.
   */
  responseType?: string;

  /**
   * @param {AuthUiInit} init
   */
  constructor(init: AuthUiInit) {
    super(init);

    this._issuerUriHandler = this._issuerUriHandler.bind(this);
    this._issuerReadHandler = this._issuerReadHandler.bind(this);
    this._responseTypeSelectionHandler = this._responseTypeSelectionHandler.bind(this);
    this._selectNodeHandler = this._selectNodeHandler.bind(this);
    this._tokenInUseHandler = this._tokenInUseHandler.bind(this);
  }

  /**
   * Serialized input values
   * @returns An object with user input
   */
  serialize(): IOidcAuthorization {
    const result = super.serialize() as IOidcAuthorization;
    delete result.accessToken;
    result.issuerUri = this.issuerUri;
    result.tokens = this.tokens;
    result.tokenInUse = this.tokenInUse;
    result.supportedResponses = this.supportedResponses;
    result.grantTypes = this.grantTypes;
    result.serverScopes = this.serverScopes;

    const { selectedResponse=0, supportedResponses=[], tokens, tokenInUse=0 } = this;
    const response = supportedResponses[selectedResponse];
    if (response) {
      result.responseType = response.map(i => i.type).join(' ');
    }
    if (Array.isArray(tokens)) {
      result.accessToken = this.readTokenValue(tokens[tokenInUse] as IOidcTokenInfo);
    }
    if (result.responseType && !this.noPkce && result.responseType.includes('code')) {
      result.pkce = this.pkce;
    }
    return result;
  }

  async authorize(): Promise<null> {
    this.lastErrorMessage = undefined;
    const validationResult = this.target.validate();
    if (!validationResult) {
      return null;
    }
    this.authorizing = true;
    this.requestUpdate();
    this.notifyChange();
    const detail = this.serialize();
    const state = AuthorizationUtils.generateState();
    detail.state = state;

    try {
      const tokens = await CoreEvents.Authorization.Oidc.authorize(this.target, detail);
      this.authorizing = false;
      this.notifyChange();
      this.requestUpdate();
      if (!Array.isArray(tokens) || !tokens.length) {
        return null;
      }
      this.tokens = tokens;
      this.accessToken = undefined;
      this.tokenInUse = 0;
      this.notifyChange();
      await this.requestUpdate();
    } catch (e) {
      const { message = 'Unknown error' } = (e as Error);
      this.lastErrorMessage = message;
      this.authorizing = false;
      this.notifyChange();
      await this.requestUpdate();
      throw e;
    }

    await this.requestUpdate();
    return null;
  }

  restore(state: IOidcAuthorization): void {
    super.restore(state);
    this.issuerUri = state.issuerUri;
    this.tokens = state.tokens;
    this.tokenInUse = state.tokenInUse;
    this.supportedResponses = state.supportedResponses;
    this.serverScopes = state.serverScopes;
    this.discovered = true;
  }

  _issuerUriHandler(e: Event): void {
    const input = e.target as HTMLInputElement;
    this.issuerUri = input.value;
    this.notifyChange();
    this.discover();
  }

  _issuerReadHandler(): void {
    const { issuerUri } = this;
    if (!issuerUri) {
      this.lastErrorMessage = 'Set the issuer URI first.';
      this.requestUpdate();
      return;
    }
    this.discover();
  }

  _responseTypeSelectionHandler(e: Event): void {
    const { selected } = e.target as AnypointListboxElement;
    if (!Number.isInteger(selected)) {
      return;
    }
    this.selectedResponse = selected as number;
    this.notifyChange();
  }

  /**
   * Downloads the OIDC info and pre-populates the form inputs.
   */
  async discover(): Promise<void> {
    const { issuerUri } = this;
    if (!issuerUri) {
      const message = 'Issuer URI is not set.';
      this.lastErrorMessage = message;
      this.discovered = false;
      await this.requestUpdate();
      throw new Error(message);
    }
    this.lastErrorMessage = undefined;
    this.requestUpdate();
    let info;
    const oidcUrl = this.buildIssuerUrl(issuerUri);
    if (discoveryCache.has(oidcUrl)) {
      info = discoveryCache.get(oidcUrl);
    } else {
      try {
        info = await this.transportDiscovery(oidcUrl);
        discoveryCache.set(oidcUrl, info);
      } catch (e) {
        this.lastErrorMessage = `Unable to read the discovery information.`;
      }
    }
    if (info) {
      this.propagateOidc(info);
      this.discovered = true;
      this.notifyChange();
    } else {
      this.discovered = false;
    }
    await this.requestUpdate();
  }

  /**
   * Requests the data from the discovery endpoint.
   * First it dispatched ARC's HTTP transport event to avoid CORS issues.
   * When this fails then it tried native `fetch` API.
   */
  async transportDiscovery(url: string): Promise<any> {
    let result;
    // try {
    //   result = await this.transportArc(url);
    // } catch (e) {
    //   // ...
    // }
    if (!result) {
      result = await this.transportNative(url);
    }
    return result;
  }

  // /**
  //  * Uses the ARC's internal HTTP request backend service to request the discovery data
  //  * without CORS restrictions. This event may not be handled when component is hosted by another application.
  //  * 
  //  * @param url The URL to request.
  //  * @returns The processed response as JSON.
  //  */
  // async transportArc(url: string): Promise<any> {
  //   const result = await TransportEvents.httpTransport(this.target, {
  //     method: 'GET',
  //     url,
  //   });
  //   if (!result) {
  //     throw new Error(`The ARC request is not handled`);
  //   }
  //   let { payload } = result;
  //   // @ts-ignore
  //   if (typeof payload.buffer === 'object') {
  //     // Node.js buffer object.
  //     payload = payload.toString('utf8');
  //   } else if (typeof payload !== 'string') {
  //     payload = payload.toString();
  //   }
  //   return JSON.parse(payload);
  // }

  /**
   * Uses the `fetch` API as a fallback to download the discovery info.
   * This may not work due to CORS and this is secondary to ARC's backend transport.
   * 
   * @param url The URL to request.
   * @returns The processed response as JSON.
   */
  async transportNative(url: string): Promise<any> {
    const rsp = await fetch(url);
    return rsp.json();
  }

  /**
   * Constructs the OIDC discovery URL.
   * @param baseUri The issues URI.
   */
  buildIssuerUrl(baseUri: string): string {
    let url = baseUri;
    if (!url.includes('.well-known')) {
      if (!url.endsWith('/')) {
        url += '/';
      }
      url += '.well-known/openid-configuration';
    }
    return url;
  }

  propagateOidc(meta: IOpenIdProviderMetadata): void {
    this.authorizationUri = meta.authorization_endpoint;
    this.supportedResponses = this.translateResponseCodes(meta.response_types_supported);
    if (meta.token_endpoint) {
      this.accessTokenUri = meta.token_endpoint;
    }
    if (Array.isArray(meta.grant_types_supported) && meta.grant_types_supported.length) {
      this.serverScopes = meta.grant_types_supported;
      this.grantTypes = this.translateGrantTypesMeta(meta.grant_types_supported);
    } else {
      this.grantTypes = [...defaultGrantTypes];
      this.serverScopes = undefined;
    }
    if (Array.isArray(meta.scopes_supported)) {
      this.scopes = meta.scopes_supported;
    } else {
      this.scopes = ['openid'];
    }
  }

  /**
   * Sets the `discovered` flag depending on the current configuration.
   */
  detectDiscovered(): void {
    const { issuerUri, authorizationUri, grantTypes, scopes } = this;
    if (!issuerUri || !authorizationUri) {
      this.discovered = false;
      return;
    }
    if (!Array.isArray(grantTypes) || !grantTypes.length) {
      this.discovered = false;
      return;
    }
    if (!Array.isArray(scopes) || !scopes.length) {
      this.discovered = false;
      return;
    }
    this.discovered = true;
  }

  /**
   * A function called from the auth element `updated` lifecycle method.
   * It tries to figure out the `selectedResponse` from the current list of 
   * `supportedResponses` and the `responseType`.
   */
  detectSelectedResponseType(): void {
    const { supportedResponses, selectedResponse, responseType } = this;
    if (!responseType || !Array.isArray(supportedResponses)) {
      return;
    }
    const parts = responseType.split(' ');
    const index = supportedResponses.findIndex((i) => {
      const rspTypes = i.map(e => e.type);
      const hasNotFound = parts.some(p => !rspTypes.includes(p));
      return !hasNotFound;
    });
    if (index >= 0 && selectedResponse !== index) {
      this.selectedResponse = index;
    }
  }

  translateGrantTypesMeta(types: string[]): IOauth2GrantType[] {
    const result: IOauth2GrantType[] = [];
    types.forEach((type) => {
      const item = {
        type,
        label: type,
      };
      if (GrantLabels[type]) {
        item.label = GrantLabels[type];
      }
      result.push(item);
    });
    return result;
  }

  /**
   * This generates a 2-dimensional array with the response codes 
   * supported by the authorization server. Next to the grant type 
   * it describes how token is received by the 
   */
  translateResponseCodes(codes: string[]): IOauth2ResponseType[][] {
    const result: IOauth2ResponseType[][] = [];
    codes.forEach((value) => {
      const items = value.split(' ');
      const response: IOauth2ResponseType[] = [];
      result.push(response)
      items.forEach((responseValue) => {
        const type = {
          type: responseValue,
          label: responseValue,
        };
        if (ResponseTypeLabels[responseValue]) {
          type.label = ResponseTypeLabels[responseValue];
        }
        response.push(type);
      });
    });
    return result;
  }

  /**
   * A handler to select the contents of the node that is the event's target.
   */
  _selectNodeHandler(e: Event): void {
    const node = e.target as HTMLElement;
    selectNode(node);
  }

  _tokenInUseHandler(e: Event): void {
    const input = e.target as HTMLInputElement;
    const { value } = input;
    if (!input.checked) {
      return;
    }
    this.tokenInUse = Number(value);
    this.notifyChange();
  }

  readTokenLabel(token: IOidcTokenInfo|IOidcTokenError): string {
    const { responseType } = token;
    switch (responseType) {
      case 'token': return 'Access token';
      case 'code': return 'Access token from code exchange';
      case 'id_token': 
      case 'id': return 'ID token'; 
      default: return 'Unknown token';
    }
  }

  readTokenValue(token: IOidcTokenInfo): string {
    if (!token) {
      return '';
    }
    const { responseType } = token;
    switch (responseType) {
      case 'token': return token.accessToken || '';
      case 'code': return token.accessToken || '';
      case 'id_token': 
      case 'id': return token.idToken || '';
      default: return token.accessToken || token.refreshToken || token.idToken || '';
    }
  }

  render(): TemplateResult {
    const {
      tokens,
      lastErrorMessage,
      discovered,
    } = this;
    return html`
    <form autocomplete="on" class="oauth2-auth">
      ${this.issuerInputTemplate()}
      ${discovered ? this.formContentTemplate() : ''}
    </form>
    ${this.oauth2RedirectTemplate()}
    ${Array.isArray(tokens) && tokens.length ? this.oauth2TokenTemplate() : this.oath2AuthorizeTemplate()}
    ${lastErrorMessage ? html`<p class="error-message">⚠ ${lastErrorMessage}</p>` : ''}
    `;
  }

  issuerInputTemplate(): TemplateResult {
    const { readOnly, issuerUri, disabled } = this;
    const input = inputTemplate(
      'issuerUri',
      issuerUri || '',
      'Issuer URI',
      this._issuerUriHandler,
      {
        readOnly,
        disabled,
        type: 'url',
        required: true,
        autoValidate: true,
        invalidLabel: 'Issuer URI is required',
        infoLabel: 'The URI without the .well-known part.',
      }
    );
    return html`
    <div class="issuer-input">
      ${input}
      <anypoint-button 
        title="Downloads and processes the discovery info"
        @click="${this._issuerReadHandler}"
        data-type="read-discovery"
      >Read</anypoint-button>
    </div>
    `;
  }

  formContentTemplate(): (TemplateResult|string)[] {
    const parts = super.formContentTemplate();
    parts.unshift(this.responsesTemplate())
    return parts;
  }

  /**
   * @returns The template for the response types drop down.
   */
  responsesTemplate(): TemplateResult|string {
    const { supportedResponses } = this;
    if (!Array.isArray(supportedResponses) || !supportedResponses.length) {
      return '';
    }
    const {
      selectedResponse=0,
      readOnly,
      disabled,
    } = this;
    return html`
    <anypoint-dropdown-menu
      name="responseType"
      required
      class="response-type-dropdown"
      ?disabled="${disabled||readOnly}"
    >
      <label slot="label">Response type</label>
      <anypoint-listbox
        slot="dropdown-content"
        .selected="${selectedResponse}"
        @selected="${this._responseTypeSelectionHandler}"
        data-name="responseType"
        .disabled="${disabled||readOnly}"
      >
        ${supportedResponses.map(item => this.responseItemTemplate(item))}
      </anypoint-listbox>
    </anypoint-dropdown-menu>`;
  }

  /**
   * @param item The responses list to render as a single item.
   * @returns The template for the response types drop down item.
   */
  responseItemTemplate(item: IOauth2ResponseType[]): TemplateResult|string {
    const label = item.map(i => i.label).join(', ');
    return html`
    <anypoint-item>${label}</anypoint-item>
    `;
  }

  /**
   * @returns The template for the OAuth 2 token value
   */
  oauth2TokenTemplate(): TemplateResult|string {
    const { tokens=[], authorizing } = this;
    return html`
    <div class="current-tokens">
      <p class="tokens-title">Tokens</p>
      ${tokens.map((info, index) => this.tokenTemplate(info, index))}

      <div class="authorize-actions">
        <anypoint-button
          ?disabled="${authorizing}"
          class="auth-button"
          emphasis="medium"
          data-type="refresh-token"
          @click="${this.authorize}"
        >Refresh tokens</anypoint-button>
      </div>
    </div>`;
  }

  
  tokenTemplate(token: IOidcTokenInfo | IOidcTokenError, index: number): TemplateResult {
    const typedError = token as IOidcTokenError;
    if (typedError.error) {
      return this.errorTokenTemplate(typedError);
    }
    return this.infoTokenTemplate((token as IOidcTokenInfo), index);
  }

  errorTokenTemplate(token: IOidcTokenError): TemplateResult {
    const { error, errorDescription } = token;
    const label = this.readTokenLabel(token);
    return html`
    <div class="current-token">
      <label class="token-label">${label}</label>
      <p class="read-only-param-field padding">
        <span class="code">${error}: ${errorDescription}</span>
      </p>
    </div>`;
  }

  infoTokenTemplate(token: IOidcTokenInfo, index: number): TemplateResult {
    const { responseType } = token;
    const label = this.readTokenLabel(token);
    const value = this.readTokenValue(token);
    return html`
    <div class="token-option">
      <input 
        type="radio" 
        id="${responseType}" 
        name="tokenInUse" 
        .value="${String(index)}" 
        ?checked="${this.tokenInUse === index}"
        @change="${this._tokenInUseHandler}"
      >
      <div class="token-info">
        <label for="${responseType}" class="token-label">
          ${label}
        </label>
        ${this.tokenExpirationTemplate(token)}
        <div class="token-value code" title="${value}" @click="${this._selectNodeHandler}" @keydown="${this._copyKeydownHandler}">${value.trim()}</div>
      </div>
    </div>
    `;
  }

  tokenExpirationTemplate(token: IOidcTokenInfo): TemplateResult|string {
    const { time, expiresIn } = token;
    if (!time || !expiresIn) {
      return '';
    }
    const d = new Date(time + (expiresIn*1000));
    const expTime = d.toISOString();
    const expired = Date.now() > d.getTime();
    const label = expired ? 'Expired' : 'Expires';
    return html`
    <div class="token-expires">
      ${label} <relative-time datetime="${expTime}"></relative-time>
    </div>
    `;
  }

  /**
   * @returns The template for the "authorize" button.
   */
  oath2AuthorizeTemplate(): TemplateResult|string {
    const { authorizing, discovered } = this;
    return html`
    <div class="authorize-actions">
      <anypoint-button
        ?disabled="${authorizing || !discovered}"
        class="auth-button"
        emphasis="medium"
        data-type="get-token"
        @click="${this.authorize}"
      >Request tokens</anypoint-button>
    </div>`;
  }
}
