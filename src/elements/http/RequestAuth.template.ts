import { html, TemplateResult } from 'lit';
import { HttpCertificate, IBasicAuthorization, IBearerAuthorization, ICCAuthorization, INtlmAuthorization, IOAuth2Authorization, IOidcAuthorization, RequestAuthorization } from '@api-client/core/build/browser.js';
import '../../define/authorization-selector.js';
import '../../define/authorization-method.js';

export interface AuthorizationTemplateOptions {
  // ui?: ArcRequest.AuthMeta;
  oauth2RedirectUri?: string;
  hidden?: boolean;
}

/**
 * @returns The template for the basic auth type.
 */
function basicTemplate(auth?: RequestAuthorization): TemplateResult {
  const state = auth && auth.config as IBasicAuthorization || {} as IBasicAuthorization;
  const { username, password } = state;
  return html`
  <authorization-method
    type="basic"
    .username="${username}"
    .password="${password}"
    aria-describedby="basicAuthDesc"
  ></authorization-method>
  <p id="basicAuthDesc" slot="aria">
    Basic authorization allows to send a username and a password in a request header.
  </p>`;
}


/**
 * @returns The template for the bearer auth type.
 */
function bearerTemplate(auth?: RequestAuthorization): TemplateResult {
  const state = auth && auth.config as IBearerAuthorization || {} as IBearerAuthorization;
  const { token } = state;
  return html`
  <authorization-method
    type="bearer"
    .token="${token}"
    aria-describedby="tokenAuthDesc"
  ></authorization-method>
  <p id="tokenAuthDesc" slot="aria">
    Bearer authorization allows to send an authentication token in the authorization header using the "bearer" method.
  </p>`;
}

/**
 * @returns The template for the NTLM auth type.
 */
function ntlmTemplate(auth?: RequestAuthorization): TemplateResult {
  const state = auth && auth.config as INtlmAuthorization || {} as INtlmAuthorization;
  const { username, password, domain } = state;
  return html`
  <authorization-method
    type="ntlm"
    .username="${username}"
    .password="${password}"
    .domain="${domain}"
    aria-describedby="ntlmAuthDesc"
  ></authorization-method>
  <p id="ntlmAuthDesc" slot="aria">
    NTLM authorization is used with Microsoft NT domains.
  </p>`;
}

/**
 * @returns The template for the OAuth2 auth type.
 */
function oa2AuthTemplate(oauth2RedirectUri?: string, auth?: RequestAuthorization): TemplateResult {
  const state = auth && auth.config as IOAuth2Authorization || {} as IOAuth2Authorization;
  const {
    accessToken, tokenType, scopes, clientId, grantType, deliveryMethod,
    deliveryName, clientSecret, accessTokenUri, authorizationUri,
    username, password, redirectUri, assertion, deviceCode, pkce,
  } = state;
  return html`<authorization-method
    type="oauth 2"
    .scopes="${scopes}"
    .accessToken="${accessToken}"
    .tokenType="${tokenType}"
    .clientId="${clientId}"
    .clientSecret="${clientSecret}"
    .grantType="${grantType}"
    .oauthDeliveryMethod="${deliveryMethod}"
    .oauthDeliveryName="${deliveryName}"
    .authorizationUri="${authorizationUri}"
    .accessTokenUri="${accessTokenUri}"
    .username="${username}"
    .password="${password}"
    .redirectUri="${redirectUri || oauth2RedirectUri}"
    .assertion="${assertion}"
    .deviceCode="${deviceCode}"
    .pkce="${pkce || false}"
    allowRedirectUriChange
  ></authorization-method>`;
}

/**
 * @returns The template for the OIDC auth type.
 */
function oidcAuthTemplate(oauth2RedirectUri?: string, auth?: RequestAuthorization): TemplateResult {
  const state = auth && auth.config as IOidcAuthorization || {} as IOidcAuthorization;
  const {
    scopes, clientId, grantType, deliveryMethod,
    deliveryName, clientSecret, accessTokenUri, authorizationUri,
    username, password, redirectUri, assertion, grantTypes, deviceCode,
    issuerUri, pkce, responseType, serverScopes, supportedResponses, tokenInUse,
    tokenType, tokens,
  } = state;
  return html`<authorization-method
    type="open id"
    .scopes="${scopes}"
    .clientId="${clientId}"
    .clientSecret="${clientSecret}"
    .grantType="${grantType}"
    .oauthDeliveryMethod="${deliveryMethod}"
    .oauthDeliveryName="${deliveryName}"
    .authorizationUri="${authorizationUri}"
    .accessTokenUri="${accessTokenUri}"
    .username="${username}"
    .password="${password}"
    .redirectUri="${redirectUri || oauth2RedirectUri}"
    .issuerUri="${issuerUri}"
    .assertion="${assertion}"
    .grantTypes="${grantTypes}"
    .deviceCode="${deviceCode}"
    .pkce="${pkce || false}"
    .responseType="${responseType}"
    .serverScopes="${serverScopes}"
    .supportedResponses="${supportedResponses}"
    .tokenInUse="${tokenInUse}"
    .tokenType="${tokenType}"
    .tokens="${tokens}"
    allowRedirectUriChange
  ></authorization-method>`;
}

/**
 * @returns The template for the Client Certificate auth type.
 */
function ccTemplate(auth?: RequestAuthorization): TemplateResult {
  let cert: HttpCertificate | undefined;
  if (auth) {
    const config = (auth.config || {}) as ICCAuthorization;
    cert = config.certificate;
  }
  return html`
  <authorization-method
    type="client certificate"
    .certificate="${cert}"
  >
  </authorization-method>
  `;
}

function readConfiguration(config: RequestAuthorization[], type: string): RequestAuthorization | undefined {
  if (!Array.isArray(config) || !config.length) {
    return undefined;
  }
  return config.find((cnf) => cnf.type === type);
}

export default function authorizationTemplate(changeHandler: Function, config: AuthorizationTemplateOptions, auth: RequestAuthorization[] = []): TemplateResult {
  const { oauth2RedirectUri, hidden } = config;
  // anypoint, outlined, ui={},
  // const { selected=0 } = ui;
  // .selected="${selected}"
  const enabled: number[] = [];
  auth.forEach((method, index) => {
    if (method.enabled) {
      enabled.push(index);
    }
  });
  return html`
  <authorization-selector
    ?hidden="${hidden}"
    slot="content"
    @change="${changeHandler}"
    horizontal
    multi
    .selectedValues="${enabled}"
  >
    
    ${basicTemplate(readConfiguration(auth, 'basic'))}
    ${bearerTemplate(readConfiguration(auth, 'bearer'))}
    ${ntlmTemplate(readConfiguration(auth, 'ntlm'))}
    ${oa2AuthTemplate(oauth2RedirectUri, readConfiguration(auth, 'oauth 2'))}
    ${oidcAuthTemplate(oauth2RedirectUri, readConfiguration(auth, 'open id'))}
    ${ccTemplate(readConfiguration(auth, 'client certificate'))}
  </authorization-selector>
  `;
}
