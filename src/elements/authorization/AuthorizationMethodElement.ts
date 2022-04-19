/* eslint-disable class-methods-use-this */
import { html, LitElement, CSSResult, PropertyValueMap, TemplateResult } from "lit";
import { property } from 'lit/decorators.js';
import { HttpCertificate, IOauth2GrantType, IOauth2ResponseType, IOidcTokenError, IOidcTokenInfo, OAuth2DeliveryMethod } from "@api-client/core/build/browser.js";
import "@anypoint-web-components/awc/dist/define/anypoint-input.js";
import "@anypoint-web-components/awc/dist/define/anypoint-masked-input.js";
import "@anypoint-web-components/awc/dist/define/anypoint-dropdown-menu.js";
import "@anypoint-web-components/awc/dist/define/anypoint-listbox.js";
import "@anypoint-web-components/awc/dist/define/anypoint-item.js";
import "@anypoint-web-components/awc/dist/define/anypoint-button.js";
import authStyles from "./CommonAuthStyles.js";
import { validateForm } from "./Validation.js";
import {
  normalizeType,
  METHOD_BASIC,
  METHOD_BEARER,
  METHOD_NTLM,
  METHOD_DIGEST,
  METHOD_OAUTH2,
  METHOD_OIDC,
  METHOD_CC,
} from "./Utils.js";
import { UiDataHelper } from "./ui/UiDataHelper.js";
import { AllowedScope } from './OAuth2ScopeSelectorElement.js';
import { Oauth2Credentials, AuthUiInit } from './types.js';
import AuthUiBase from './ui/AuthUiBase.js';
import HttpBasic from './ui/HttpBasic.js';
import HttpBearer from './ui/HttpBearer.js';
import Ntlm from './ui/Ntlm.js';
import Digest from './ui/Digest.js';
import OAuth2 from './ui/OAuth2.js';
import OpenID from './ui/OpenID.js';
import ClientCertificate from './ui/ClientCertificate.js';

export const typeChangedSymbol = Symbol("typeChangedSymbol");
export const typeValue = Symbol("typeValue");
export const factory = Symbol("factory");
export const renderCallback = Symbol("renderCallback");
export const changeCallback = Symbol("changeCallback");
export const propagateChanges = Symbol("propagateChanges");

const ignoredProperties = ["type", "_authorizing", 'anypoint'];

/**
 * An element that renders various authorization methods.
 *
 * ## Development
 *
 * The element mixes in multiple mixins from `src/` directory.
 * Each mixin support an authorization method. When selection change (the `type`
 * property) a render function from corresponding mixin is called.
 */
export default class AuthorizationMethodElement extends LitElement {
  static get styles(): CSSResult {
    return authStyles;
  }

  [typeValue]?: string;

  /**
   * Authorization method type.
   *
   * Supported types are (case insensitive, spaces sensitive):
   *
   * - Basic
   * - Client certificate
   * - Digest
   * - NTLM
   * - OAuth 1
   * - OAuth 2
   * - Bearer
   *
   * Depending on selected type different properties are used.
   * For example Basic type only uses `username` and `password` properties,
   * while NTLM also uses `domain` property.
   *
   * See readme file for detailed list of properties depending on selected type.
   */
  @property({ type: String, reflect: true })
  get type(): string | undefined {
    return this[typeValue];
  }

  set type(value: string | undefined) {
    const old = this[typeValue];
    if (old === value) {
      return;
    }
    this[typeValue] = value;
    this.requestUpdate("type", old);
    this[typeChangedSymbol](value);
  }

  _onChange: EventListener | null = null;

  /**
   * @returns Previously registered function or undefined.
   */
  get onchange(): EventListener | null {
    return this._onChange;
  }

  /**
   * Registers listener for the `change` event
   * @param value A function to be called when `change` event is dispatched
   */
  set onchange(value: EventListener | null) {
    if (this._onChange) {
      this.removeEventListener("change", this._onChange);
    }
    if (typeof value !== "function") {
      this._onChange = null;
      return;
    }
    this._onChange = value;
    this.addEventListener("change", value);
  }

  _authorizing = false;

  /**
   * Used in the following types:
   * - OAuth 1
   * - OAuth 2
   *
   * @return True when currently authorizing the user.
   */
  get authorizing(): boolean {
    return this._authorizing;
  }

  /**
   * When set the editor is in read only mode.
   */
  @property({ type: Boolean }) readOnly = false;

  /**
   * When set the inputs are disabled
   */
  @property({ type: Boolean }) disabled = false;

  /**
   * Current password.
   *
   * Used in the following types:
   * - Basic
   * - NTLM
   * - Digest
   * - OAuth 2
   */
  @property({ type: String }) password?: string;

  /**
   * Current username.
   *
   * Used in the following types:
   * - Basic
   * - NTLM
   * - Digest
   * - OAuth 2
   */
  @property({ type: String }) username?: string;

  /**
   * Authorization redirect URI
   *
   * Used in the following types:
   * - OAuth 1
   * - OAuth 2
   */
  @property({ type: String }) redirectUri?: string;

  /**
   * Endpoint to authorize the token (OAuth 1) or exchange code for token (OAuth 2).
   *
   * Used in the following types:
   * - OAuth 1
   * - OAuth 2
   */
  @property({ type: String }) accessTokenUri?: string;

  /**
   * An URI of authentication endpoint where the user should be redirected
   * to authorize the app. This endpoint initialized OAuth flow.
   *
   * Used in the following types:
   * - OAuth 1
   * - OAuth 2
   */
  @property({ type: String }) authorizationUri?: string;
  
  /**
   * Oauth 1 or Bearer token (from the oauth console or received from auth server)
   *
   * Used in the following types:
   * - OAuth 1
   * - bearer
   */
  @property({ type: String }) token?: string;

  /**
   * The authorization domain.
   */
  @property({ type: String }) domain?: string;

  /**
   * Server issued realm for Digest authorization.
   *
   * Used in the following types:
   * - Digest
   * - OAuth 1
   */
  @property({ type: String }) realm?: string;

  /**
   * Server issued nonce for Digest authorization.
   *
   * Used in the following types:
   * - Digest
   * - OAuth 1
   */
  @property({ type: String }) nonce?: string;

  /**
   * The algorithm used to hash the response for Digest authorization.
   *
   * It can be either `MD5` or `MD5-sess`.
   *
   * Used in the following types:
   * - Digest
   */
  @property({ type: String }) algorithm?: string;

  /**
   * The quality of protection value for the digest response.
   * Either '', 'auth' or 'auth-int'
   *
   * Used in the following types:
   * - Digest
   */
  @property({ type: String }) qop?: string;

  /**
   * Nonce count - increments with each request used with the same nonce
   *
   * Used in the following types:
   * - Digest
   */
  @property({ type: Number }) nc?: number;

  /**
   * Client nonce
   *
   * Used in the following types:
   * - Digest
   */
  @property({ type: String }) cnonce?: string;

  /**
   * A string of data specified by the server
   *
   * Used in the following types:
   * - Digest
   */
  @property({ type: String }) opaque?: string;

  /**
   * Hashed response to server challenge
   *
   * Used in the following types:
   * - Digest
   */
  @property({ type: String }) response?: string;

  /**
   * Request HTTP method
   *
   * Used in the following types:
   * - Digest
   */
  @property({ type: String }) httpMethod?: string;

  /**
   * Current request URL.
   *
   * Used in the following types:
   * - Digest
   */
  @property({ type: String }) requestUrl?: string;

  /**
   * Current request body.
   *
   * Used in the following types:
   * - Digest
   */
  @property() requestBody?: any;

  /**
   * The client secret aka consumer secret
   *
   * Used in the following types:
   * - OAuth 1
   */
  @property({ type: String }) consumerSecret?: string;

  /**
   * Oauth 1 token secret (from the oauth console).
   *
   * Used in the following types:
   * - OAuth 1
   */
  @property({ type: String }) tokenSecret?: string;

  /**
   * Signature method. Enum {`HMAC-SHA256`, `HMAC-SHA1`, `PLAINTEXT`}
   *
   * Used in the following types:
   * - OAuth 1
   */
  @property({ type: String }) signatureMethod?: string;

  /**
   * OAuth1 endpoint to obtain request token to request user authorization.
   *
   * Used in the following types:
   * - OAuth 1
   */
  @property({ type: String }) requestTokenUri?: string;

  /**
   * Selected authorization grand type.
   */
  @property({ type: String }) grantType?: string;

  /**
   * The client ID for the auth token.
   */
  @property({ type: String }) clientId?: string;
  
  /**
   * The client secret. It to be used when selected server flow.
   */
  @property({ type: String }) clientSecret?: string;

  /**
   * List of user selected scopes.
   * It can be pre-populated with list of scopes (array of strings).
   */
  @property({ type: Array }) scopes?: string[];

  /**
   * List of pre-defined scopes to choose from. It will be passed to the `oauth2-scope-selector`
   * element.
   */
  @property({ type: Array }) allowedScopes?: string[] | AllowedScope[];

  /**
   * If true then the `oauth2-scope-selector` will disallow to add a scope that is not
   * in the `allowedScopes` list. Has no effect if the `allowedScopes` is not set.
   */
  @property({ type: Boolean }) preventCustomScopes = false;

  /**
   * When the user authorized the app it should be set to the token value.
   * This element do not perform authorization. Other elements must intercept
   * the token request event and perform the authorization.
   */
  @property({ type: String }) accessToken?: string;

  /**
   * By default it is "bearer" as the only one defined in OAuth 2.0 spec.
   * If the token response contains `tokenType` property then this value is updated.
   */
  @property({ type: String }) tokenType?: string;

  /**
   * Currently available grant types.
   */
  grantTypes?: IOauth2GrantType[];

  /**
   * If set it renders authorization url, token url and scopes as advanced options
   * which are then invisible by default. User can oen setting using the UI.
   */
  @property({ type: Boolean }) advanced = false;

  /**
   * If true then the advanced options are opened.
   */
  @property({ type: Boolean }) advancedOpened = false;

  /**
   * If set, the response type selector is hidden from the UI.
   */
  @property({ type: Boolean }) noGrantType = false;

  /**
   * Informs about what filed of the authenticated request the token property should be set.
   * By default the value is `header` which corresponds to the `authorization` by default,
   * but it is configured by the `deliveryName` property.
   *
   * This can be used by the AMF model when the API spec defines where the access token should be
   * put in the authenticated request.
   *
   * @default header
   */
  oauthDeliveryMethod?: OAuth2DeliveryMethod;

  /**
   * The client credentials delivery method.
   * @default body
   */
  ccDeliveryMethod: OAuth2DeliveryMethod = 'body';

  /**
   * The name of the authenticated request property that carries the token.
   * By default it is `authorization` which corresponds to `header` value of the `deliveryMethod` property.
   *
   * By setting both `deliveryMethod` and `deliveryName` you instruct the application (assuming it reads this values)
   * where to put the authorization token.
   *
   * @default authorization
   */
  @property({ type: String }) oauthDeliveryName?: string;

  /**
   * The base URI to use to construct the correct URLs to the authorization endpoints.
   *
   * When the paths are relative then base URI is added to the path.
   * Relative paths must start with '/'.
   *
   * Note, URL processing is happening internally in the component. The produced authorize event
   * will have base URI already applied.
   */
  @property({ type: String }) baseUri?: string;

  /**
   * The error message returned by the authorization library.
   * It renders error dialog when an error ocurred.
   * It is automatically cleared when the user request the token again.
   */
  @property({ type: String }) lastErrorMessage?: string;

  /**
   * When this property is set then the PKCE option is not rendered for the
   * `authorization_code`. This is mainly meant to be used by the `api-authorization-method`
   * to keep this control disabled and override generated settings when the API spec
   * says that the PKCE is supported.
   */
  @property({ type: Boolean }) noPkce = false;

  /**
   * Whether or not the PKCE extension is enabled for this authorization configuration.
   * Note, PKCE, per the spec, is only available for `authorization_code` grantType.
   */
  @property({ type: Boolean }) pkce = false;

  /**
   * The definition of client credentials to be rendered for a given grant type.
   * When set on the editor it renders a drop down where the user can choose from predefined
   * credentials (client id & secret).
   */
  @property({ type: Array })credentialsSource?: Oauth2Credentials[];

  /**
   * Selected credential source
   */
  @property({ type: String }) credentialSource?: string;

  /**
   * When set it allows to edit the redirect URI by the user.
   */
  @property({ type: Boolean }) allowRedirectUriChange = false;

  /** 
   * The OpenID discovery URI.
   */
  @property({ type: String }) issuerUri?: string;

  /** 
   * The assertion parameter for the JWT token authorization.
   * 
   * @link https://datatracker.ietf.org/doc/html/rfc7523#section-2.1
   */
  @property({ type: String }) assertion?: string;

  /** 
   * The device_code parameter for the device code authorization.
   * 
   * @link https://datatracker.ietf.org/doc/html/rfc8628#section-3.4
   */
  @property({ type: String }) deviceCode?: string;

  /** 
   * In OIDC configuration, the list of mist recent tokens requested from the auth server.
   */
  @property({ type: Array }) tokens?: (IOidcTokenInfo | IOidcTokenError)[];

  /** 
   * In OIDC configuration, the array index of the token to be used with HTTP request.
   */
  @property({ type: Number }) tokenInUse?: number;

  /** 
   * In OIDC configuration, the list of response types supported by the authorization server.
   */
  @property({ type: Array }) supportedResponses?: IOauth2ResponseType[][];

  /** 
   * In OIDC configuration, the list of scopes supported by the authorization server.
   */
  @property({ type: Array }) serverScopes?: string[];

  /** 
   * In OIDC configuration, the response type to be used with the OAuth 2 request.
   */
  @property({ type: String }) responseType?: string;

  /**
   * The certificate object.
   * 
   * Used in `client certificate` type.
   */
  @property({ type: Object }) certificate?: HttpCertificate;

  [factory]?: AuthUiBase;

  constructor() {
    super();

    this[renderCallback] = this[renderCallback].bind(this);
    this[changeCallback] = this[changeCallback].bind(this);
  }

  async [renderCallback](): Promise<void> {
    this.requestUpdate();
    await this.updateComplete;
  }

  [changeCallback](): void {
    this[propagateChanges]();
    this.dispatchEvent(new Event("change"));
  }

  /**
   * Propagates values from the UI factory to this element.
   * This is to synchronize user entered values with the element's state.
   */
  [propagateChanges](): void {
    const f = this[factory]!;
    switch (normalizeType(this.type)) {
      case METHOD_BASIC: UiDataHelper.populateBasic(this, (f as HttpBasic)); break;
      case METHOD_BEARER: UiDataHelper.populateBearer(this, (f as HttpBearer)); break;
      case METHOD_NTLM: UiDataHelper.populateNtlm(this, (f as Ntlm)); break;
      case METHOD_DIGEST: UiDataHelper.populateDigest(this, (f as Digest)); break;
      case METHOD_OAUTH2: UiDataHelper.populateOAuth2(this, (f as OAuth2)); break;
      case METHOD_OIDC: UiDataHelper.populateOpenId(this, (f as OpenID)); break;
      case METHOD_CC: UiDataHelper.populateClientCertificate(this, (f as ClientCertificate)); break;
      default:
    }
  }

  firstUpdated(changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
    super.firstUpdated(changedProperties);
    if (this[factory]) {
      // when setting variables in a template and these variables are `undefined` 
      // the defaults will be overwritten by the pending changes.
      // This makes sure that this won't happen during initialization.
      this[factory]!.defaults();
    }
  }

  update(changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
    if (!this[factory]) {
      super.update(changedProperties);
      return;
    }
    for (const key of changedProperties.keys()) {
      if (!ignoredProperties.includes(String(key))) {
        // @ts-ignore
        this[factory][key] = this[key];
      } else if (key === '_authorizing') {
        this[factory]!.authorizing = this[key];
      }
    }
    const type = normalizeType(this.type);
    if (type === METHOD_OAUTH2) {
      (this[factory] as OAuth2).autoHideOnce();
    } else if (type === METHOD_OIDC) {
      const f = (this[factory] as OpenID)!;
      f.detectDiscovered();
      if (changedProperties.has('supportedResponses')) {
        f.detectSelectedResponseType();
      }
    }
    super.update(changedProperties);
  }

  /**
   * A function called when `type` changed.
   * Note, that other properties may not be initialized just yet.
   *
   * @param type The current value.
   */
  [typeChangedSymbol](type?: string): void {
    if (this[factory]) {
      this[factory]!.cleanup();
      this[factory] = undefined;
    }
    let instance: AuthUiBase;
    const init: AuthUiInit = {
      renderCallback: this[renderCallback],
      changeCallback: this[changeCallback],
      target: this,
      readOnly: this.readOnly,
      disabled: this.disabled,
      authorizing: this.authorizing,
    };
    switch (normalizeType(type)) {
      case METHOD_BASIC:
        instance = UiDataHelper.setupBasic(this, init);
        break;
      case METHOD_BEARER:
        instance = UiDataHelper.setupBearer(this, init);
        break;
      case METHOD_NTLM:
        instance = UiDataHelper.setupNtlm(this, init);
        break;
      case METHOD_DIGEST:
        instance = UiDataHelper.setupDigest(this, init);
        break;
      case METHOD_OAUTH2:
        instance = UiDataHelper.setupOauth2(this, init);
        break;
      case METHOD_OIDC:
        instance = UiDataHelper.setupOidc(this, init);
        break;
      case METHOD_CC:
        instance = UiDataHelper.setupClientCertificate(this, init);
        break;
      default:
        throw new Error(`Unsupported authorization type ${type}`);
    }
    this[factory] = instance;
    instance.startup();
    instance.defaults();
    this.requestUpdate();
  }

  /**
   * Clears settings for current type.
   */
  clear(): void {
    if (!this[factory]) {
      throw new Error(`The authorization type is not set.`);
    }
    this._authorizing = false;
    this[factory]!.reset();
  }

  /**
   * Creates a settings object with user provided data for current method.
   *
   * @return User provided data
   */
  serialize(): unknown {
    if (!this[factory]) {
      throw new Error(`The authorization type is not set.`);
    }
    return this[factory]!.serialize();
  }

  /**
   * Validates current method.
   * @returns Validation state for current authorization method.
   */
  validate(): boolean {
    return validateForm(this);
  }

  /**
   * Restores previously serialized settings.
   * A method type must be selected before calling this function.
   *
   * @param settings Depends on current type.
   */
  restore(settings: unknown): void {
    if (!this[factory]) {
      throw new Error(`The authorization type is not set.`);
    }
    this[factory]!.restore(settings);
    this[changeCallback]();
  }

  /**
   * For methods with asynchronous authorization, this functions
   * calls the underlying authorize function and returns the authorization result.
   *
   * @returns A promise resolved to the authorization result that depends on the method, or null
   * if the current method does not support async authorization.
   * @throws {Error} When authorization error.
   */
  async authorize(): Promise<unknown|null> {
    if (!this[factory]) {
      throw new Error(`The authorization type is not set.`);
    }
    return this[factory]!.authorize();
  }

  /**
   * When the type is `open id` it reads the discovery URL data and populates
   * the UI with them. This is equivalent to clicking on the `read` button
   * in the OpenID type authorization.
   */
  async discover(): Promise<void> {
    const f = this[factory];
    if (!f) {
      throw new Error(`The authorization type is not set.`);
    }
    if (normalizeType(this.type) === METHOD_OIDC) {
      await (f as OpenID)!.discover();
    }
  }

  render(): TemplateResult {
    let tpl;
    if (this[factory]) {
      tpl = this[factory]!.render();
    } else {
      tpl = "";
    }
    return html`${tpl}`;
  }
}
