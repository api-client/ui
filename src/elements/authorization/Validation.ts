/* eslint-disable arrow-body-style */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { KnownGrants, AuthorizationUtils } from '@api-client/core/build/browser.js';
import { AnypointInputElement } from '@anypoint-web-components/awc';
import AuthorizationMethod from './AuthorizationMethodElement.js';

const {
  normalizeType,
  METHOD_BASIC,
  METHOD_BEARER,
  METHOD_NTLM,
  METHOD_DIGEST,
  METHOD_OAUTH2,
  METHOD_OIDC,
  METHOD_CC,
} = AuthorizationUtils;

/**
 * Validates basic authorization form.
 * @param element An instance of the element.
 * @returns Validation result
 */
export const validateBasicAuth = (element: AuthorizationMethod): boolean => {
  const { username } = element;
  return !!username;
};

/**
 * Validates bearer authorization form.
 * @param element An instance of the element.
 * @returns Validation result
 */
export const validateBearerAuth = (element: AuthorizationMethod): boolean => {
  const { token } = element;
  return !!token;
};

/**
 * Validates NTLM authorization form.
 * @param element An instance of the element.
 * @returns Validation result
 */
export const validateNtlmAuth = (element: AuthorizationMethod): boolean => {
  const { username } = element;
  return !!username;
};

/**
 * Validates digest authorization form.
 * @param element An instance of the element.
 * @returns Validation result
 */
export const validateDigestAuth = (element: AuthorizationMethod): boolean => {
  const { username, realm, nonce, nc, opaque, cnonce } = element;
  return !!username && !!realm && !!nonce && !!nc && !!opaque && !!cnonce;
};

/**
 * Validates OAuth2 authorization form with implicit grant type.
 * @param element An instance of the element.
 * @returns Validation result
 */
export const validateOauth2AuthImplicit = (element: AuthorizationMethod): boolean => {
  const { clientId, authorizationUri } = element;
  return !!clientId && !!authorizationUri;
};

/**
 * Validates OAuth2 authorization form with authorization code grant type.
 * @param element An instance of the element.
 * @returns Validation result
 */
export const validateOauth2AuthCode = (element: AuthorizationMethod): boolean => {
  const { clientId, clientSecret, authorizationUri, accessTokenUri } = element;
  return !!clientId && !!authorizationUri && !!clientSecret && !!accessTokenUri;
};

/**
 * Validates OAuth2 authorization form with client credentials grant type.
 * @param element An instance of the element.
 * @returns Validation result
 */
export const validateOauth2AuthCredentials = (element: AuthorizationMethod): boolean => {
  const { accessTokenUri } = element;
  return !!accessTokenUri;
};

/**
 * Validates OAuth2 authorization form with password grant type.
 * @param element An instance of the element.
 * @returns Validation result
 */
export const validateOauth2AuthPassword = (element: AuthorizationMethod): boolean => {
  const { accessTokenUri, username, password } = element;
  return !!accessTokenUri && !!password && !!username;
};

/**
 * Validates OAuth2 authorization form with password grant type.
 * @param element An instance of the element.
 * @returns Validation result
 */
export const validateOauth2JwtBearer = (element: AuthorizationMethod): boolean => {
  const { accessTokenUri, assertion } = element;
  return !!accessTokenUri && !!assertion;
};

/**
 * Validates OAuth2 authorization form with password grant type.
 * @param element An instance of the element.
 * @returns Validation result
 */
export const validateOauth2DeviceCode = (element: AuthorizationMethod): boolean => {
  const { accessTokenUri, deviceCode } = element;
  return !!accessTokenUri && !!deviceCode;
};

/**
 * Validates OAuth2 authorization form with custom grant type.
 * @param element An instance of the element.
 * @returns Validation result
 */
export const validateOauth2AuthCustom = (element: AuthorizationMethod): boolean => {
  const { accessTokenUri } = element;
  return !!accessTokenUri;
};
/**
 * Validates the form controls instead of values. This also shows validation
 * errors.
 * Note, this uses form-associated custom elements API. At this moment (Nov 2019)
 * it is only available in CHrome 77. FF is implementing it and Edge will be soon.
 *
 * @param form The form to validate
 * @returns True if the form is valid.
 */
export const validateOauth2form = (form: HTMLFormElement): boolean => {
  const inputs = Array.from(form.elements) as AnypointInputElement[];
  const invalid = inputs.some((node) => {
    if (!node.validate) {
      return true;
    }
    return !node.validate();
  });
  return !invalid;
};

/**
 * Validates OAuth2 authorization form.
 * @param element An instance of the element.
 * @returns Validation result
 */
export const validateOauth2Auth = (element: AuthorizationMethod): boolean => {
  const { grantType } = element;
  if (!grantType) {
    return false;
  }
  // const form = element.shadowRoot.querySelector('form');
  // if (form && form.elements.length) {
  //   return validateOauth2form(form);
  // }
  switch (grantType) {
    case KnownGrants.implicit:
      return validateOauth2AuthImplicit(element);
    case KnownGrants.code:
      return validateOauth2AuthCode(element);
    case KnownGrants.clientCredentials:
      return validateOauth2AuthCredentials(element);
    case KnownGrants.password:
      return validateOauth2AuthPassword(element);
    case KnownGrants.jwtBearer:
      return validateOauth2JwtBearer(element);
    case KnownGrants.deviceCode:
      return validateOauth2DeviceCode(element);
    default:
      return validateOauth2AuthCustom(element);
  }
};

export const validateCertificate = (element: AuthorizationMethod): boolean => {
  // TODO: an actual validation of the CC.
  return true;
}

/**
 * Validates current authorization type
 * @param element An instance of the element.
 * @returns Validation result
 */
export const validateForm = (element: AuthorizationMethod): boolean => {
  const type = normalizeType(element.type);
  switch (type) {
    case METHOD_BASIC:
      return validateBasicAuth(element);
    case METHOD_BEARER:
      return validateBearerAuth(element);
    case METHOD_NTLM:
      return validateNtlmAuth(element);
    case METHOD_DIGEST:
      return validateDigestAuth(element);
    case METHOD_OAUTH2:
      return validateOauth2Auth(element);
    case METHOD_CC:
      return validateCertificate(element);
    default:
      return true;
  }
};
