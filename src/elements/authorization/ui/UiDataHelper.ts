/* eslint-disable no-param-reassign */
/** @typedef {import('../CcAuthorizationMethodElement').default} CcAuthorizationMethodElement */
import AuthorizationMethodElement from '../AuthorizationMethodElement.js';
import { AuthUiInit } from '../types.js';


import Digest from './Digest.js';
import HttpBasic from './HttpBasic.js';
import HttpBearer from './HttpBearer.js';
import Ntlm from './Ntlm.js';
import OAuth2 from './OAuth2.js';
import OpenID from './OpenID.js';
import ClientCertificate from './ClientCertificate.js';

export class UiDataHelper {
  static setupBasic(element: AuthorizationMethodElement, init: AuthUiInit): HttpBasic {
    const i = new HttpBasic(init);
    i.username = element.username || '';
    i.password = element.password || '';
    return i;
  }

  static setupBearer(element: AuthorizationMethodElement, init: AuthUiInit): HttpBearer {
    const i = new HttpBearer(init);
    i.token = element.token || '';
    return i;
  }

  static setupNtlm(element: AuthorizationMethodElement, init: AuthUiInit): Ntlm {
    const i = new Ntlm(init);
    i.username = element.username || '';
    i.password = element.password || '';
    i.domain = element.domain || '';
    return i;
  }

  static setupDigest(element: AuthorizationMethodElement, init: AuthUiInit): Digest {
    const i = new Digest(init);
    this.setDigestValues(i, element);
    return i;
  }

  static setDigestValues(i: Digest, element: AuthorizationMethodElement): void {
    i.username = element.username || '';
    i.password = element.password || '';
    i.realm = element.realm;
    i.nonce = element.nonce;
    i.algorithm = element.algorithm;
    i.qop = element.qop;
    i.nc = element.nc;
    i.cnonce = element.cnonce;
    i.opaque = element.opaque;
    i.response = element.response;
    i.httpMethod = element.httpMethod;
    i.requestUrl = element.requestUrl;
    i.requestBody = element.requestBody;
  }

  static setupOauth2(element: AuthorizationMethodElement, init: AuthUiInit): OAuth2 {
    const i = new OAuth2(init);
    this.setOAuth2Values(i, element);
    return i;
  }

  static setOAuth2Values(i: OAuth2, element: AuthorizationMethodElement): void {
    i.username = element.username;
    i.password = element.password;
    i.grantType = element.grantType;
    i.clientId = element.clientId;
    i.clientSecret = element.clientSecret;
    i.scopes = element.scopes;
    i.authorizationUri = element.authorizationUri;
    i.accessTokenUri = element.accessTokenUri;
    i.redirectUri = element.redirectUri;
    i.allowedScopes = element.allowedScopes;
    i.preventCustomScopes = element.preventCustomScopes;
    i.accessToken = element.accessToken;
    i.tokenType = element.tokenType;
    i.grantTypes = element.grantTypes;
    i.advanced = element.advanced;
    i.advancedOpened = element.advancedOpened;
    i.noGrantType = element.noGrantType;
    i.oauthDeliveryMethod = element.oauthDeliveryMethod;
    i.ccDeliveryMethod = element.ccDeliveryMethod;
    i.oauthDeliveryName = element.oauthDeliveryName;
    i.baseUri = element.baseUri;
    i.lastErrorMessage = element.lastErrorMessage;
    i.noPkce = element.noPkce;
    i.pkce = element.pkce;
    i.credentialSource = element.credentialSource;
    i.allowRedirectUriChange = element.allowRedirectUriChange;
    i.assertion = element.assertion || '';
    i.deviceCode = element.deviceCode || '';
  }

  static setupOidc(element: AuthorizationMethodElement, init: AuthUiInit): OpenID {
    const i = new OpenID(init);
    this.setOAuth2Values(i, element);
    i.issuerUri = element.issuerUri;
    i.tokens = element.tokens;
    i.tokenInUse = element.tokenInUse;
    i.supportedResponses = element.supportedResponses;
    i.serverScopes = element.serverScopes;
    i.responseType = element.responseType;
    return i;
  }

  static populateBasic(element: AuthorizationMethodElement, ui: HttpBasic): void {
    element.username = ui.username;
    element.password = ui.password;
  }

  static populateBearer(element: AuthorizationMethodElement, ui: HttpBearer): void {
    element.token = ui.token;
  }

  static populateNtlm(element: AuthorizationMethodElement, ui: Ntlm): void {
    element.username = ui.username;
    element.password = ui.password;
    element.domain = ui.domain;
  }

  static populateDigest(element: AuthorizationMethodElement, ui: Digest): void {
    element.username = ui.username;
    element.password = ui.password;
    element.realm = ui.realm;
    element.nonce = ui.nonce;
    element.algorithm = ui.algorithm;
    element.qop = ui.qop;
    element.nc = ui.nc;
    element.cnonce = ui.cnonce;
    element.opaque = ui.opaque;
    element.response = ui.response;
    element.httpMethod = ui.httpMethod;
  }
  
  static populateOAuth2(element: AuthorizationMethodElement, ui: OAuth2): void {
    element.username = ui.username;
    element.password = ui.password;
    element.grantType = ui.grantType;
    element.clientId = ui.clientId;
    element.clientSecret = ui.clientSecret;
    element.scopes = ui.scopes;
    element.authorizationUri = ui.authorizationUri;
    element.accessTokenUri = ui.accessTokenUri;
    element.redirectUri = ui.redirectUri;
    element.allowedScopes = ui.allowedScopes;
    element.preventCustomScopes = ui.preventCustomScopes;
    element.accessToken = ui.accessToken;
    element.tokenType = ui.tokenType;
    element.grantTypes = ui.grantTypes;
    element.advanced = ui.advanced;
    element.advancedOpened = ui.advancedOpened;
    element.noGrantType = ui.noGrantType;
    element.oauthDeliveryMethod = ui.oauthDeliveryMethod;
    element.ccDeliveryMethod = ui.ccDeliveryMethod;
    element.oauthDeliveryName = ui.oauthDeliveryName;
    element.lastErrorMessage = ui.lastErrorMessage;
    element.pkce = ui.pkce;
    element.credentialSource = ui.credentialSource;
    element._authorizing = ui.authorizing || false;
    element.assertion = ui.assertion;
    element.deviceCode = ui.deviceCode;
  }

  
  static populateOpenId(element: AuthorizationMethodElement, ui: OpenID): void {
    this.populateOAuth2(element, ui);
    element.issuerUri = ui.issuerUri;
    element.tokens = ui.tokens;
    element.tokenInUse = ui.tokenInUse;
    element.supportedResponses = ui.supportedResponses;
    element.serverScopes = ui.serverScopes;
    element.responseType = ui.responseType;
  }

  static setupClientCertificate(element: AuthorizationMethodElement, init: AuthUiInit): ClientCertificate {
    const i = new ClientCertificate(init);
    i.certificate = element.certificate;
    return i;
  }

  static populateClientCertificate(element: AuthorizationMethodElement, ui: ClientCertificate): void {
    element.certificate = ui.certificate;
  }
}
