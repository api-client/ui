/* eslint-disable class-methods-use-this */
import { html, TemplateResult } from "lit";
import { IOAuth2Authorization, IOauth2GrantType, ITokenInfo, OAuth2DeliveryMethod, KnownGrants, Events as CoreEvents, AuthorizationUtils } from "@api-client/core/build/browser.js";
import { AnypointCheckboxElement, AnypointListboxElement, AnypointSwitchElement } from "@anypoint-web-components/awc";
import '@anypoint-web-components/awc/dist/define/anypoint-switch.js';
import '@anypoint-web-components/awc/dist/define/anypoint-checkbox.js';
import '@anypoint-web-components/awc/dist/define/anypoint-listbox.js';
import '@anypoint-web-components/awc/dist/define/anypoint-icon-button.js';
import '../../../define/api-icon.js';
import { passwordTemplate, inputTemplate } from '../CommonTemplates.js';
import AuthUiBase from "./AuthUiBase.js";
import '../../../define/oauth2-scope-selector.js';
import { selectNode } from "../Utils.js";
import { Oauth2Credentials, AuthUiInit, CredentialsInfo } from '../types.js';
import OAuth2ScopeSelectorElement, { AllowedScope } from "../OAuth2ScopeSelectorElement.js";

const { CUSTOM_CREDENTIALS, generateState, readUrlValue, validateRedirectUri } = AuthorizationUtils;

/**
 * List of OAuth 2.0 default response types.
 * This list can be extended by custom grants
 *
 * @returns List of objects with `type` and `label` properties.
 */
export const oauth2GrantTypes: IOauth2GrantType[] = [
  {
    type: KnownGrants.implicit,
    label: "Access token (browser flow)",
  },
  {
    type: KnownGrants.code,
    label: "Authorization code (server flow)",
  },
  {
    type: KnownGrants.clientCredentials,
    label: "Client credentials",
  },
  {
    type: KnownGrants.password,
    label: "Password",
  },
  {
    type: KnownGrants.deviceCode,
    label: "Device code",
  },
  {
    type: KnownGrants.jwtBearer,
    label: "JWT Bearer",
  },
];

/**
 * A handler for `focus` event on a label that contains text and
 * should be copied to clipboard when user is interacting with it.
 */
const selectFocusable = (e: KeyboardEvent): void => {
  const node = e.target as HTMLElement;
  selectNode(node);
};

export default class OAuth2 extends AuthUiBase {
  /**
   * @return Computed value, true if the response type is a custom definition.
   */
  get isCustomGrantType(): boolean {
    const { grantType } = this;
    return (
      !!grantType &&
      ![
        KnownGrants.implicit,
        KnownGrants.code,
        KnownGrants.clientCredentials,
        KnownGrants.password,
        KnownGrants.jwtBearer,
        KnownGrants.deviceCode,
      ].includes(grantType)
    );
  }

  /**
   * @returns {boolean} true when the client id field is required.
   */
  get clientIdRequired(): boolean {
    const { grantType } = this;
    if (!grantType) {
      return false;
    }
    return ![KnownGrants.clientCredentials, KnownGrants.password, KnownGrants.deviceCode].includes(grantType);
  }

  /**
   * @returns {boolean} true when the client id field is rendered.
   */
  get hasClientId(): boolean {
    const { grantType } = this;
    if (!grantType) {
      return false;
    }
    return ![KnownGrants.jwtBearer].includes(grantType);
  }

  /**
   * @returns {boolean} true when the client secret field is rendered.
   */
  get hasClientSecret(): boolean {
    const { grantType, isCustomGrantType } = this;
    if (!grantType) {
      return false;
    }
    if (isCustomGrantType) {
      return isCustomGrantType;
    }
    return [
      KnownGrants.code,
      KnownGrants.clientCredentials,
      KnownGrants.password,
      KnownGrants.deviceCode,
    ].includes(grantType);
  }

  /**
   * @returns {boolean} true when the client secret field is required.
   */
  get clientSecretRequired(): boolean {
    const { grantType } = this;
    if (!grantType) {
      return false;
    }
    return [KnownGrants.code].includes(grantType);
  }

  /**
   * @returns {boolean} true when the authorization URI field is rendered.
   */
  get authorizationUriRendered(): boolean {
    const { grantType, isCustomGrantType } = this;
    if (!grantType) {
      return false;
    }
    return isCustomGrantType || [
      KnownGrants.implicit,
      KnownGrants.code,
    ].includes(grantType);
  }

  /**
   * @returns {boolean} true when the token URI field is rendered.
   */
  get accessTokenUriRendered(): boolean {
    const { grantType, isCustomGrantType } = this;
    if (!grantType) {
      return false;
    }
    return isCustomGrantType || [
      KnownGrants.clientCredentials,
      KnownGrants.code,
      KnownGrants.password,
      KnownGrants.jwtBearer,
      KnownGrants.deviceCode,
    ].includes(grantType);
  }

  /**
   * @returns {boolean} true when the username and password fields are rendered.
   */
  get passwordRendered(): boolean {
    const { grantType, isCustomGrantType } = this;
    if (!grantType) {
      return false;
    }
    return isCustomGrantType || [KnownGrants.password].includes(grantType);
  }

  /**
   * @returns {boolean} True when the current `grantType` can support redirect URI.
   */
  get hasRedirectUri(): boolean {
    const { grantType } = this;
    if (!grantType) {
      return false;
    }
    return [KnownGrants.implicit, KnownGrants.code].includes(grantType);
  }

  /**
   * Selected authorization grand type.
   */
  grantType?: string;

  /**
   * The client ID for the auth token.
   */
  clientId?: string;

  /**
   * The client secret. It to be used when selected server flow.
   */
  clientSecret?: string;

  /**
   * List of user selected scopes.
   * It can be pre-populated with list of scopes (array of strings).
   */
  scopes?: string[];

  /**
   * An URI of authentication endpoint where the user should be redirected
   * to authorize the app. This endpoint initialized OAuth flow.
   */
  authorizationUri?: string;

  /**
   * Endpoint to authorize the token (OAuth 1) or exchange code for token (OAuth 2).
   *
   * @type {string}
   */
  accessTokenUri?: string;

  /**
   * Authorization redirect URI
   *
   * @type {string}
   */
  redirectUri?: string;

  /**
   * List of pre-defined scopes to choose from. It will be passed to the `oauth2-scope-selector`
   * element.
   */
  allowedScopes?: string[] | AllowedScope[];

  /**
   * If true then the `oauth2-scope-selector` will disallow to add a scope that is not
   * in the `allowedScopes` list. Has no effect if the `allowedScopes` is not set.
   */
  preventCustomScopes = false;

  /**
   * When the user authorized the app it should be set to the token value.
   * This element do not perform authorization. Other elements must intercept
   * the token request event and perform the authorization.
   */
  accessToken?: string;

  /**
   * By default it is "bearer" as the only one defined in OAuth 2.0 spec.
   * If the token response contains `tokenType` property then this value is updated.
   */
  tokenType?: string;

  /**
   * Currently available grant types.
   */
  grantTypes?: IOauth2GrantType[];

  /**
   * When set it renders authorization url, token url and scopes as the advanced options
   * which are then invisible by default. User can oen setting using the UI.
   */
  advanced = false;

  /**
   * If true then the advanced options are opened.
   */
  advancedOpened = false;

  /**
   * If set, the response type selector is hidden from the UI.
   */
  noGrantType = false;

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
  oauthDeliveryName?: string;

  /**
   * The base URI to use to construct the correct URLs to the authorization endpoints.
   *
   * When the paths are relative then base URI is added to the path.
   * Relative paths must start with '/'.
   *
   * Note, URL processing is happening internally in the component. The produced authorize event
   * will have base URI already applied.
   */
  baseUri?: string;

  /**
   * The error message returned by the authorization library.
   * It renders error dialog when an error ocurred.
   * It is automatically cleared when the user request the token again.
   * @type {string}
   */
  lastErrorMessage?: string;

  /**
   * When this property is set then the PKCE option is not rendered for the
   * `authorization_code`. This is mainly meant to be used by the `api-authorization-method`
   * to keep this control disabled and override generated settings when the API spec
   * says that the PKCE is supported.
   */
  noPkce = false;

  /**
   * Whether or not the PKCE extension is enabled for this authorization configuration.
   * Note, PKCE, per the spec, is only available for `authorization_code` grantType.
   */
  pkce = false;

  /**
   * The definition of client credentials to be rendered for a given grant type.
   * When set on the editor it renders a drop down where the user can choose from predefined
   * credentials (client id & secret).
   * 
   */
  credentialsSource?: Oauth2Credentials[];

  /**
   * Selected credential source
   */
  credentialSource?: string;

  /**
   * When set it allows to edit the redirect URI by the user.
   * 
   */
  allowRedirectUriChange = false;

  /** 
   * The value of the username filed.
   * 
   */
  password?: string;

  /** 
   * The value of the password filed.
   * 
   */
  username?: string;

  credentialsDisabled = this.disabled;

  /** 
   * The assertion parameter for the JWT token authorization.
   * 
   * @link https://datatracker.ietf.org/doc/html/rfc7523#section-2.1
   */
  assertion = '';

  /** 
   * The device_code parameter for the device code authorization.
   * 
   * @link https://datatracker.ietf.org/doc/html/rfc8628#section-3.4
   */
  deviceCode = '';

  /** 
   * A flag describing that the redirect URL editor is rendered.
   * 
   */
  editingRedirectUri = false;

  _autoHideSet = false;

  constructor(init: AuthUiInit) {
    super(init);

    this._advHandler = this._advHandler.bind(this);
    this._clickCopyAction = this._clickCopyAction.bind(this);
    this._copyKeydownHandler = this._copyKeydownHandler.bind(this);
    this._scopesChanged = this._scopesChanged.bind(this);
    this._pkceChangeHandler = this._pkceChangeHandler.bind(this);
    this._editRedirectUriHandler = this._editRedirectUriHandler.bind(this);
    this._redirectInputKeydown = this._redirectInputKeydown.bind(this);
    this._redirectInputBlur = this._redirectInputBlur.bind(this);
    this._grantTypeSelectionHandler = this._grantTypeSelectionHandler.bind(this);
    this._credentialSourceHandler = this._credentialSourceHandler.bind(this);
  }

  /**
   * Restores previously serialized values.
   * @param state Previously serialized values
   */
  restore(state: IOAuth2Authorization): void {
    const type = state.grantType;
    this.grantType = type;
    this.clientId = state.clientId;
    this.accessToken = state.accessToken;
    this.scopes = state.scopes;
    if (state.tokenType) {
      this.tokenType = state.tokenType;
    }
    switch (type) {
      case KnownGrants.implicit:
        this.authorizationUri = state.authorizationUri;
        break;
      case KnownGrants.code:
        this.authorizationUri = state.authorizationUri;
        this.clientSecret = state.clientSecret;
        this.accessTokenUri = state.accessTokenUri;
        this.pkce = state.pkce || false;
        break;
      case KnownGrants.clientCredentials:
        // The server flow.
        this.clientSecret = state.clientSecret;
        this.accessTokenUri = state.accessTokenUri;
        if (state.deliveryMethod) {
          this.ccDeliveryMethod = state.deliveryMethod;
        }
        if (state.deliveryName) {
          this.oauthDeliveryName = state.deliveryName;
        }
        break;
      case KnownGrants.password:
        // The server flow.
        this.username = state.username;
        this.password = state.password;
        this.accessTokenUri = state.accessTokenUri;
        this.clientSecret = state.clientSecret;
        break;
      case KnownGrants.deviceCode:
        this.deviceCode = state.deviceCode || '';
        this.accessTokenUri = state.accessTokenUri;
        this.clientSecret = state.clientSecret;
        break;
      case KnownGrants.jwtBearer:
        this.assertion = state.assertion || '';
        this.accessTokenUri = state.accessTokenUri;
        break;
      default:
        this.authorizationUri = state.authorizationUri;
        this.clientSecret = state.clientSecret;
        this.accessTokenUri = state.accessTokenUri;
        this.username = state.username;
        this.password = state.password;
    }
    this.requestUpdate();
  }

  /**
   * Serialized input values
   * @returns An object with user input
   */
  serialize(): IOAuth2Authorization {
    const { grantType, tokenType, baseUri } = this;
    const detail: IOAuth2Authorization = {
      grantType,
      tokenType,
      clientId: this.clientId,
      accessToken: this.accessToken || '',
      scopes: this.scopes,
      deliveryMethod: this.oauthDeliveryMethod,
      deliveryName: this.oauthDeliveryName,
    };

    switch (grantType) {
      case KnownGrants.implicit:
        // The browser flow.
        detail.authorizationUri = readUrlValue(this.authorizationUri, baseUri);
        detail.redirectUri = readUrlValue(this.redirectUri, baseUri);
        break;
      case KnownGrants.code:
        // The server flow.
        detail.authorizationUri = readUrlValue(this.authorizationUri, baseUri);
        detail.clientSecret = this.clientSecret;
        detail.accessTokenUri = readUrlValue(this.accessTokenUri, baseUri);
        detail.redirectUri = readUrlValue(this.redirectUri, baseUri);
        detail.pkce = this.pkce;
        break;
      case 'application':
      case KnownGrants.clientCredentials:
        // The server flow.
        detail.accessTokenUri = readUrlValue(this.accessTokenUri, baseUri);
        detail.clientSecret = this.clientSecret;
        if (this.ccDeliveryMethod) {
          detail.deliveryMethod = this.ccDeliveryMethod;
        } else {
          // historically it was body by default.
          detail.deliveryMethod = 'body';
        }
        break;
      case KnownGrants.password:
        // The server flow.
        detail.username = this.username;
        detail.password = this.password;
        detail.accessTokenUri = readUrlValue(this.accessTokenUri, baseUri);
        detail.clientSecret = this.clientSecret;
        break;
      case KnownGrants.jwtBearer:
        // https://datatracker.ietf.org/doc/html/rfc7523#section-2.1
        detail.assertion = this.assertion;
        detail.accessTokenUri = readUrlValue(this.accessTokenUri, baseUri);
        delete detail.clientId;
        break;
      case KnownGrants.deviceCode:
        // https://datatracker.ietf.org/doc/html/rfc8628#section-3.4
        detail.deviceCode = this.deviceCode;
        detail.accessTokenUri = readUrlValue(this.accessTokenUri, baseUri);
        detail.clientSecret = this.clientSecret;
        break;
      default:
        // Custom response type.
        detail.authorizationUri = readUrlValue(this.authorizationUri, baseUri);
        detail.clientSecret = this.clientSecret;
        detail.accessTokenUri = readUrlValue(this.accessTokenUri, baseUri);
        detail.redirectUri = readUrlValue(this.redirectUri, baseUri);
        detail.username = this.username;
        detail.password = this.password;
        break;
    }
    return detail;
  }

  defaults(): void {
    let changed = false;
    if (!this.oauthDeliveryName) {
      this.oauthDeliveryName = 'authorization';
      changed = true;
    }
    if (!this.oauthDeliveryMethod) {
      this.oauthDeliveryMethod = 'header';
      changed = true;
    }
    if (!Array.isArray(this.grantTypes) || !this.grantTypes.length) {
      this.grantTypes = oauth2GrantTypes;
      changed = true;
    }
    if (!this.tokenType) {
      this.tokenType = 'Bearer';
      changed = true;
    }
    this.autoHide();
    if (changed) {
      this.requestUpdate();
    }
  }

  reset(): void {
    this.tokenType = '';
    this.accessToken = '';
    this.grantType = '';
    this.scopes = /** @type string[] */ ([]);
    this.oauthDeliveryMethod = undefined;
    this.oauthDeliveryName = undefined;
    this.authorizationUri = '';
    this.accessTokenUri = '';
    this.clientId = '';
    this.clientSecret = '';
    this.username = '';
    this.password = '';
    this.assertion = '';
    this.deviceCode = '';
    this._autoHideSet = false;

    this.defaults();
    this.notifyChange();
    this.requestUpdate();
  }

  /**
   * Performs the authorization.
   * 
   * @returns The auth token or null if couldn't be requested.
   * @throws When authorization error
   */
  async authorize(): Promise<ITokenInfo | null> {
    if (this.lastErrorMessage) {
      this.lastErrorMessage = undefined;
    }
    const validationResult = this.target.validate();
    if (!validationResult) {
      return null;
    }
    this.authorizing = true;
    this.requestUpdate();
    this.notifyChange();
    const detail = this.serialize();
    const state = generateState();
    detail.state = state;
    let tokenInfo: ITokenInfo | undefined;
    try {
      tokenInfo = await CoreEvents.Authorization.OAuth2.authorize(this.target, detail);
      this.authorizing = false;
      this.requestUpdate();
      this.notifyChange();
      if (!tokenInfo) {
        return null;
      }
      if (detail.grantType === KnownGrants.implicit && tokenInfo.state !== state) {
        return null;
      }
      if (tokenInfo.accessToken && tokenInfo.accessToken !== this.accessToken) {
        if (tokenInfo.tokenType && tokenInfo.tokenType !== this.tokenType) {
          this.tokenType = tokenInfo.tokenType;
        } else if (!tokenInfo.tokenType && this.tokenType !== 'Bearer') {
          this.tokenType = 'Bearer';
        }
        this.accessToken = tokenInfo.accessToken;
        this.requestUpdate();
        this.notifyChange();
      }
    } catch (e) {
      const { message = 'Unknown error' } = (e as Error);
      this.lastErrorMessage = message;
      this.authorizing = false;
      this.requestUpdate();
      this.notifyChange();
      throw e;
    }
    return tokenInfo;
  }

  /**
   * This function hides all non-crucial fields that has been pre-filled when element has been
   * initialize (values not provided by the user). Hidden fields will be available under
   * "advanced" options.
   *
   * To prevent this behavior set `no-auto` attribute on this element.
   */
  autoHide(): void {
    const { grantType, scopes } = this;
    const hasScopes = !!(scopes && scopes.length);
    let advOpened;
    let changed = false;
    switch (grantType) {
      case KnownGrants.implicit:
        advOpened = !(hasScopes && !!this.authorizationUri);
        break;
      case KnownGrants.code:
      case KnownGrants.jwtBearer:
      case KnownGrants.deviceCode:
        advOpened = !(
          hasScopes &&
          !!this.authorizationUri &&
          !!this.accessTokenUri
        );
        break;
      case KnownGrants.clientCredentials:
        advOpened = !this.accessTokenUri;
        break;
      default:
        advOpened = true;
        break;
    }
    if (this.advancedOpened !== advOpened) {
      this.advancedOpened = advOpened;
      changed = true;
    }
    if (!advOpened) {
      this.advanced = true;
      changed = true;
    }
    if (changed) {
      this.requestUpdate();
      this.notifyChange();
    }
  }

  autoHideOnce(): void {
    if (this._autoHideSet) {
      return;
    }
    this._autoHideSet = true;
    this.autoHide();
  }

  /**
   * A handler for `focus` event on a label that contains text and
   * should be copied to clipboard when user is interacting with it.
   */
  _clickCopyAction(e: Event): void {
    const node = e.target as HTMLElement;
    this._copyFromNode(node);
  }

  _copyKeydownHandler(e: KeyboardEvent): void {
    if (e.code !== 'Space') {
      return;
    }
    const node = e.target as HTMLElement;
    this._copyFromNode(node);
  }

  /**
   * Copies the content of the node to clipboard.
   */
  async _copyFromNode(node: HTMLElement): Promise<void> {
    await navigator.clipboard.writeText(node.innerText);
    selectNode(node);
  }

  /**
   * Event handler for the scopes element changed state
   */
  _scopesChanged(e: CustomEvent): void {
    this.scopes = (e.target as OAuth2ScopeSelectorElement).value;
    this.notifyChange();
  }

  _advHandler(e: Event): void {
    this.advancedOpened = (e.target as AnypointSwitchElement).checked;
    this.requestUpdate();
  }

  /**
   * The handler for the change event coming from the PKCE input checkbox
   */
  _pkceChangeHandler(e: Event): void {
    const node = e.target as AnypointCheckboxElement;
    this.pkce = node.checked;
    this.notifyChange();
  }

  /**
   * A handler for the edit redirect URI button click.
   * Sets the editing flag and requests the update.
   */
  async _editRedirectUriHandler(): Promise<void> {
    this.editingRedirectUri = true;
    await this.requestUpdate();
    const input = this.target.shadowRoot!.querySelector('.redirect-input') as HTMLElement;
    if (input) {
      input.focus();
    }
  }

  /**
   * Commits the redirect URI editor value on enter key or cancels on escape.
   */
  _redirectInputKeydown(e: KeyboardEvent): void {
    if (['Enter', 'NumpadEnter'].includes(e.code)) {
      const node = e.target as HTMLInputElement;
      this.commitRedirectUri(node.value);
    } else if (e.code === 'Escape') {
      this.cancelRedirectUri();
    }
  }

  /**
   * Commits the redirect URI editor value on input blur.
   */
  _redirectInputBlur(e: Event): void {
    const node = e.target as HTMLInputElement;
    this.commitRedirectUri(node.value);
  }

  /**
   * Sets the new redirect URI if the value passes validation.
   * This closes the editor.
   * @param value The new value to set.
   */
  commitRedirectUri(value: string): void {
    if (!this.editingRedirectUri) {
      // this is needed to make sure the value won't change on escape key press
      // via the blur event
      return;
    }
    const old = this.redirectUri;
    let isValid = validateRedirectUri(value);
    if (isValid && old === value) {
      isValid = false;
    }
    if (isValid) {
      this.redirectUri = value;
      this.notifyChange();
    }
    this.cancelRedirectUri();
  }

  /**
   * Resets the redirect URI edit flag and requests an update.
   */
  cancelRedirectUri(): void {
    this.editingRedirectUri = false;
    this.requestUpdate();
  }

  /**
   * @returns The list of client credentials to render in the credentials selector.
   */
  listCredentials(): CredentialsInfo[] {
    const { credentialsSource, grantType } = this;
    let credentials: CredentialsInfo[] = [];
    if (credentialsSource && credentialsSource.length > 0) {
      const grantTypeCredentials = credentialsSource.find(s => s.grantType === grantType);
      if (grantTypeCredentials) {
        const customCredential = { name: CUSTOM_CREDENTIALS };
        credentials = [customCredential].concat(grantTypeCredentials.credentials)
      }
    }
    return credentials;
  }

  /**
   * Sets the client credentials after updating them from the credentials source selector.
   * @param clientId The client id to set on the editor.
   * @param clientSecret The client secret to set on the editor.
   * @param disabled Whether the credentials input is disabled.
   */
  updateCredentials(clientId: string, clientSecret: string, disabled: boolean): void {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.credentialsDisabled = disabled;
    this.requestUpdate();
  }

  /**
   * This triggers change in the client id & secret of the editor after selecting 
   * a credentials source by the user.
   * 
   * @param selectedSource The name of the selected credentials source to select.
   */
  updateClientCredentials(selectedSource: string): void {
    const { credentialsSource } = this;
    if (!credentialsSource) {
      return;
    }
    if (selectedSource) {
      const credentials = this.listCredentials();
      const credential = credentials.find(c => c.name === selectedSource);
      if (credential) {
        this.updateCredentials(credential.clientId || '', credential.clientSecret || '', credential.name !== CUSTOM_CREDENTIALS)
      }
    } else {
      this.updateCredentials('', '', true);
    }
  }

  _grantTypeSelectionHandler(e: Event): void {
    const { selected } = e.target as AnypointListboxElement;
    const { grantType, credentialSource } = this;
    if (grantType !== selected && credentialSource) {
      this.credentialSource = undefined;
      this.credentialsDisabled = this.disabled;
    }
    this.selectHandler(e);
    this.autoHide();
    this.requestUpdate();
  }

  _credentialSourceHandler(e: Event): void {
    const { selected } = e.target as AnypointListboxElement;
    this.updateClientCredentials(selected as string);
    this.selectHandler(e);
  }

  /**
   * @returns true when a credentials source is being selected.
   */
  isSourceSelected(): boolean {
    const { credentialSource } = this;
    const credentials = this.listCredentials();
    if (credentials.length > 0) {
      if (!credentialSource) {
        return false;
      }
    }
    return true
  }

  render(): TemplateResult {
    const {
      accessToken,
      lastErrorMessage,
    } = this;
    return html`
    <form autocomplete="on" class="oauth2-auth">
      ${this.formContentTemplate()}
    </form>
    ${this.oauth2RedirectTemplate()}
    ${accessToken ? this.oauth2TokenTemplate() : this.oath2AuthorizeTemplate()}
    ${lastErrorMessage ? html`<p class="error-message">⚠ ${lastErrorMessage}</p>` : ''}
    `;
  }

  /**
   * @returns The template for the <form> content.
   */
  formContentTemplate(): (TemplateResult | string)[] {
    const result = [
      this.oauth2GrantTypeTemplate(),
      this.credentialsSourceTemplate(),
      this.clientIdTemplate(),
      this.clientSecretTemplate(),
      this.assertionTemplate(),
      this.deviceCodeTemplate(),
      this.oauth2CustomPropertiesTemplate(),
      this.toggleAdvViewSwitchTemplate(),
      this.oauth2AdvancedTemplate(),
    ];
    return result;
  }

  /**
   * @return The template for API custom properties (annotations)
   */
  oauth2CustomPropertiesTemplate(): TemplateResult | string {
    return '';
  }

  /**
   * @returns The template for the OAuth 2 response type selector
   */
  oauth2GrantTypeTemplate(): TemplateResult | string {
    const ctx = this;
    const {
      grantType,
      readOnly,
      disabled,
      noGrantType,
      isCustomGrantType,
    } = this;
    const items = this.grantTypes || [];
    return html`
    <anypoint-dropdown-menu
      name="grantType"
      ?required="${!isCustomGrantType}"
      class="grant-dropdown"
      ?hidden="${noGrantType}"
      ?disabled="${disabled || readOnly}"
    >
      <label slot="label">Grant type</label>
      <anypoint-listbox
        slot="dropdown-content"
        .selected="${grantType}"
        @selectedchange="${ctx._grantTypeSelectionHandler}"
        data-name="grantType"
        .disabled="${disabled || readOnly}"
        attrforselected="data-value"
      >
        ${items.map((item) => html`
        <anypoint-item data-value="${item.type}">${item.label}</anypoint-item>`)}
      </anypoint-listbox>
    </anypoint-dropdown-menu>`;
  }

  /**
   * @return {TemplateResult|string} The template for the client credentials source.
   */
  credentialsSourceTemplate(): TemplateResult | string {
    const ctx = this;
    const { credentialSource } = this;

    const credentials = this.listCredentials();
    if (credentials.length === 0) {
      return '';
    }

    return html`
    <anypoint-dropdown-menu
      name="credentialSource"
      required
      class="credential-source-dropdown"
    >
      <label slot="label">Credentials source</label>
      <anypoint-listbox
        slot="dropdown-content"
        .selected="${credentialSource}"
        @selectedchange="${ctx._credentialSourceHandler}"
        data-name="credentialSource"
        attrforselected="data-value"
      >
      ${credentials.map((item) => html`
        <anypoint-item data-value="${item.name}">${item.name}</anypoint-item>`)}
      </anypoint-listbox>
    </anypoint-dropdown-menu>
`;
  }

  /**
   * @returns The template for the OAuth 2 client id input.
   */
  clientIdTemplate(): TemplateResult | string {
    if (!this.hasClientId) {
      return '';
    }
    const { clientId, readOnly, credentialsDisabled, clientIdRequired } = this;
    const sourceSelected = this.isSourceSelected();
    return passwordTemplate(
      'clientId',
      clientId || '',
      'Client id',
      this.changeHandler,
      {
        readOnly,
        disabled: sourceSelected ? credentialsDisabled : true,
        required: clientIdRequired,
        autoValidate: true,
        invalidLabel: 'Client ID is required for this response type',
        infoLabel: clientIdRequired
          ? undefined
          : 'Client id is optional for this response type',
      }
    );
  }

  /**
   * @returns The template for the OAuth 2 client secret input.
   */
  clientSecretTemplate(): TemplateResult | string {
    const { hasClientSecret } = this;
    if (!hasClientSecret) {
      return '';
    }
    const { clientSecret, readOnly, credentialsDisabled, clientSecretRequired } = this;
    const ctx = this;
    const sourceSelected = this.isSourceSelected();
    return passwordTemplate(
      'clientSecret',
      clientSecret || '',
      'Client secret',
      ctx.changeHandler,
      {
        readOnly,
        disabled: sourceSelected ? credentialsDisabled : true,
        required: clientSecretRequired,
        autoValidate: true,
        invalidLabel: 'Client secret is required for this response type',
        infoLabel: clientSecretRequired
          ? undefined
          : 'Client secret is optional for this response type',
      }
    );
  }

  /**
   * @returns The template for the toggle advanced view switch
   */
  toggleAdvViewSwitchTemplate(): TemplateResult | string {
    const { advanced } = this;
    if (!advanced) {
      return '';
    }
    const { readOnly, advancedOpened } = this;
    return html` 
    <div class="adv-toggle">
      <anypoint-switch
        class="adv-settings-input"
        .checked="${advancedOpened}"
        @change="${this._advHandler}"
        ?disabled="${readOnly}"
      >Advanced settings</anypoint-switch>
    </div>`;
  }

  /**
   * @returns The template for the OAuth 2 advanced options.
   */
  oauth2AdvancedTemplate(): TemplateResult | string {
    const {
      advancedOpened,
      baseUri,
    } = this;
    // When the baseUri is set then validation won't allow to provide
    // relative paths to the authorization endpoint hence this should be
    // defined as string and not "url".
    const urlType = baseUri ? 'string' : 'url';
    return html`
    <div class="advanced-section" ?hidden="${!advancedOpened}">
      ${this.authorizationUriTemplate(urlType)}
      ${this.accessTokenUriTemplate(urlType)}
      ${this.usernameTemplate()}
      ${this.passwordTemplateLocal()}
      ${this.scopesTemplate()}
      ${this.paramsLocationTemplate()}
      ${this.pkceTemplate()}
    </div>`;
  }

  /**
   * @returns The template for the OAuth 2 redirect URI label
   */
  oauth2RedirectTemplate(): TemplateResult | string {
    const { hasRedirectUri } = this;
    if (!hasRedirectUri) {
      return '';
    }
    const editing = this.allowRedirectUriChange && this.editingRedirectUri;
    return html`
    <div class="subtitle">Redirect URI</div>
    <section>
      <div class="redirect-section">
        ${editing ? this.redirectUriInputTemplate() : this.redirectUriContentTemplate()}
      </div>
    </section>
    `;
  }

  /**
   * @returns The template for the OAuth 2 token value
   */
  oauth2TokenTemplate(): TemplateResult | string {
    const { accessToken, authorizing } = this;
    return html`
    <div class="current-token">
      <label class="token-label">Current token</label>
      <p class="read-only-param-field padding">
        <span class="code" @click="${this._clickCopyAction}" @keydown="${this._copyKeydownHandler}">${accessToken}</span>
      </p>
      <div class="authorize-actions">
        <anypoint-button
          ?disabled="${authorizing}"
          class="auth-button"
          emphasis="medium"
          data-type="refresh-token"
          @click="${this.authorize}"
        >Refresh access token</anypoint-button>
      </div>
    </div>`;
  }

  /**
   * @returns The template for the "authorize" button.
   */
  oath2AuthorizeTemplate(): TemplateResult | string {
    const { authorizing } = this;
    return html`
    <div class="authorize-actions">
      <anypoint-button
        ?disabled="${authorizing}"
        class="auth-button"
        emphasis="medium"
        data-type="get-token"
        @click="${this.authorize}"
      >Request access token</anypoint-button>
    </div>`;
  }

  /**
   * @param urlType The input type to render
   * @returns The template for the authorization URI input
   */
  authorizationUriTemplate(urlType: string): TemplateResult | string {
    if (!this.authorizationUriRendered) {
      return '';
    }
    const { readOnly, authorizationUri, disabled, isCustomGrantType } = this;
    return inputTemplate(
      'authorizationUri',
      authorizationUri || "",
      'Authorization URI',
      this.changeHandler,
      {
        readOnly,
        disabled,
        type: urlType,
        required: !isCustomGrantType,
        autoValidate: true,
        invalidLabel: 'Authorization URI is required for this response type',
      }
    );
  }

  /**
   * @param urlType The input type to render
   * @returns The template for the access token URI input
   */
  accessTokenUriTemplate(urlType: string): TemplateResult | string {
    if (!this.accessTokenUriRendered) {
      return '';
    }
    const { readOnly, accessTokenUri, disabled, isCustomGrantType } = this;
    return inputTemplate(
      'accessTokenUri',
      accessTokenUri || "",
      'Access token URI',
      this.changeHandler,
      {
        readOnly,
        disabled,
        type: urlType,
        required: !isCustomGrantType,
        autoValidate: true,
        invalidLabel: 'Access token URI is required for this response type',
      }
    );
  }

  /**
   * @returns {TemplateResult|string} The template for the user name input
   */
  usernameTemplate(): TemplateResult | string {
    if (!this.passwordRendered) {
      return '';
    }
    const { readOnly, username, disabled, isCustomGrantType } = this;
    return inputTemplate(
      'username',
      username || "",
      'Username',
      this.changeHandler,
      {
        readOnly,
        disabled,
        required: !isCustomGrantType,
        autoValidate: true,
        invalidLabel: 'User name is required for this response type',
      }
    );
  }

  /**
   * @returns {TemplateResult|string} The template for the user password input
   */
  passwordTemplateLocal(): TemplateResult | string {
    if (!this.passwordRendered) {
      return '';
    }
    const { readOnly, password, disabled, isCustomGrantType } = this;
    return inputTemplate(
      'password',
      password || "",
      'Password',
      this.changeHandler,
      {
        readOnly,
        disabled,
        required: !isCustomGrantType,
        autoValidate: true,
        invalidLabel: 'Password is required for this response type',
      }
    );
  }

  /**
   * @returns {TemplateResult} The template for the OAuth 2 scopes input
   */
  scopesTemplate(): TemplateResult {
    const {
      allowedScopes,
      preventCustomScopes,
      readOnly,
      disabled,
      scopes,
    } = this;
    return html`
    <oauth2-scope-selector
      .allowedScopes="${allowedScopes}"
      .preventCustomScopes="${preventCustomScopes}"
      .value="${scopes}"
      ?readOnly="${readOnly}"
      ?disabled="${disabled}"
      name="scopes"
      @change="${this._scopesChanged}"
    ></oauth2-scope-selector>`;
  }

  /**
   * For client_credentials grant this renders the dropdown with an option to select
   * where the credentials should be used. Current values: 
   * - authorization header
   * - message body
   * @return {TemplateResult|string} 
   */
  paramsLocationTemplate(): TemplateResult | string {
    const { grantType } = this;
    if (grantType !== KnownGrants.clientCredentials) {
      return '';
    }
    const { ccDeliveryMethod, disabled, readOnly } = this;
    return html`
    <anypoint-dropdown-menu
      name="ccDeliveryMethod"
      class="delivery-dropdown"
      ?disabled="${disabled || readOnly}"
    >
      <label slot="label">Credentials location</label>
      <anypoint-listbox
        slot="dropdown-content"
        .selected="${ccDeliveryMethod}"
        @selectedchange="${this.selectHandler}"
        data-name="ccDeliveryMethod"
        .disabled="${disabled || readOnly}"
        attrforselected="data-value"
      >
        <anypoint-item data-value="header">Authorization header</anypoint-item>
        <anypoint-item data-value="body">Message body</anypoint-item>
      </anypoint-listbox>
    </anypoint-dropdown-menu>
    `;
  }

  /**
   * @returns {TemplateResult|string} The template for the PKCE option of the OAuth 2 extension.
   */
  pkceTemplate(): TemplateResult | string {
    const { grantType, noPkce, pkce } = this;
    if (noPkce || grantType !== KnownGrants.code) {
      return '';
    }
    return html`
    <anypoint-checkbox
      .checked="${pkce}"
      title="Enables PKCE extension of the OAuth 2 protocol."
      name="pkce"
      @change="${this._pkceChangeHandler}"
    >Use PKCE extension</anypoint-checkbox>
    `;
  }

  /**
   * @returns {TemplateResult} The template for the OAuth 2 redirect URI input
   */
  redirectUriInputTemplate(): TemplateResult {
    const { redirectUri } = this;
    return html`
    <anypoint-input 
      class="redirect-input" 
      .value="${redirectUri}"
      @blur="${this._redirectInputBlur}"
      @keydown="${this._redirectInputKeydown}"
      required
      autoValidate
      type="url"
    >
      <label slot="label">Redirect URI value</label>
    </anypoint-input>
    `;
  }

  /**
   * @returns {TemplateResult} The template for the OAuth 2 redirect URI content
   */
  redirectUriContentTemplate(): TemplateResult {
    const { redirectUri } = this;
    return html`
    <p class="read-only-param-field padding">
      <span
        class="code"
        @click="${this._clickCopyAction}"
        @keydown="${this._copyKeydownHandler}"
        @focus="${selectFocusable}"
        title="Click to copy the URI"
        tabindex="0"
      >${redirectUri}</span>
      ${this.editRedirectUriTemplate()}
    </p>
    `;
  }

  /**
   * @return {TemplateResult|string} The template for the edit redirect URI button, when enabled.
   */
  editRedirectUriTemplate(): TemplateResult | string {
    const { allowRedirectUriChange } = this;
    if (!allowRedirectUriChange) {
      return '';
    }
    return html`
    <anypoint-icon-button
      title="Edit the redirect URI"
      class="edit-rdr-uri"
      @click="${this._editRedirectUriHandler}"
    >
      <api-icon icon="edit"></api-icon>
    </anypoint-icon-button>
    `;
  }

  /**
   * @return {TemplateResult|string} The template for the assertion (JWT) input, when needed.
   */
  assertionTemplate(): TemplateResult | string {
    if (this.grantType !== KnownGrants.jwtBearer) {
      return '';
    }
    const { readOnly, assertion, disabled } = this;
    return inputTemplate(
      'assertion',
      assertion,
      'Assertion (JWT)',
      this.changeHandler,
      {
        readOnly,
        disabled,
        required: true,
        autoValidate: true,
        invalidLabel: 'Assertion is required for this response type',
      }
    );
  }

  /**
   * @return The template for the device code input, when needed.
   */
  deviceCodeTemplate(): TemplateResult | string {
    if (this.grantType !== KnownGrants.deviceCode) {
      return '';
    }
    const { readOnly, deviceCode, disabled } = this;
    return inputTemplate(
      'deviceCode',
      deviceCode,
      'Device code',
      this.changeHandler,
      {
        readOnly,
        disabled,
        required: true,
        autoValidate: true,
        invalidLabel: 'Device code is required for this response type',
      }
    );
  }
}
