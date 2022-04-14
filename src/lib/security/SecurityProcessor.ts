/* eslint-disable no-continue */
import { 
  IProjectRequest, IRequestAuthorization, IBasicAuthorization, IOAuth2Authorization, Headers,
  IBearerAuthorization, IOidcAuthorization,
} from '@api-client/core/build/browser.js';
import {
  normalizeType,
  METHOD_BASIC,
  METHOD_BEARER,
  METHOD_OAUTH2,
  METHOD_OIDC,
} from "../../elements/authorization/Utils.js";

export interface IAuthApplyOptions {
  /**
   * When set it won't change the originating authorization objects.
   * By default it sets the authorization's `enabled` property to `false` after applying the 
   * value to the request.
   */
  immutable?: boolean;
}

export class SecurityProcessor {
  /**
   * Applies authorization configuration to the request object.
   */
  static applyAuthorization(request: IProjectRequest, authorization: IRequestAuthorization[], opts: IAuthApplyOptions={}): void {
    if (!Array.isArray(authorization) || !authorization.length) {
      return;
    }

    for (const auth of authorization) {
      if (!auth.enabled || !auth.config) {
        continue;
      }

      switch (normalizeType(auth.type)) {
        case METHOD_BASIC: 
          SecurityProcessor.applyBasicAuth(request, auth.config as IBasicAuthorization);
          if (!opts.immutable) {
            auth.enabled = false; 
          }
          break;
        case METHOD_OAUTH2: 
          SecurityProcessor.applyOAuth2(request, auth.config as IOAuth2Authorization); 
          if (!opts.immutable) {
            auth.enabled = false; 
          }
          break;
        case METHOD_OIDC: 
          SecurityProcessor.applyOpenId(request, auth.config as IOidcAuthorization); 
          if (!opts.immutable) {
            auth.enabled = false; 
          }
          break;
        case METHOD_BEARER: 
          SecurityProcessor.applyBearer(request, auth.config as IBearerAuthorization); 
          if (!opts.immutable) {
            auth.enabled = false; 
          }
          break;
        default:
      }
    }
  }

  /**
   * Injects basic auth header into the request headers.
   */
  static applyBasicAuth(request: IProjectRequest, config: IBasicAuthorization): void {
    const { username, password } = config;
    if (!username) {
      return;
    }
    const value = btoa(`${username}:${password || ''}`);

    const headers = new Headers(request.expects.headers || '');
    headers.append('authorization', `Basic ${value}`);
    request.expects.headers = headers.toString();
  }

  /**
   * Injects oauth 2 auth header into the request headers.
   */
  static applyOAuth2(request: IProjectRequest, config: IOAuth2Authorization): void {
    const { accessToken, tokenType='Bearer', deliveryMethod='header', deliveryName='authorization' } = config;
    if (!accessToken) {
      return;
    }
    const value = `${tokenType} ${accessToken}`;
    if (deliveryMethod === 'header') {
      const headers = new Headers(request.expects.headers || '');
      headers.append(deliveryName, value);
      request.expects.headers = headers.toString();
    } else if (deliveryMethod === 'query') {
      const { url } = request.expects;
      try {
        // todo: this won't work when variables are used.
        const parsed = new URL(url);
        parsed.searchParams.append(deliveryName, value);
        request.expects.url = parsed.toString();
      } catch (e) {
        // ...
      }
    }
  }

  /**
   * Injects OpenID Connect auth header into the request headers.
   */
  static applyOpenId(request: IProjectRequest, config: IOidcAuthorization): void {
    const { accessToken } = config;
    if (accessToken) {
      SecurityProcessor.applyOAuth2(request, config);
    }
    // todo - if AT is missing find the current token from the tokens list in the passed configuration.
    // Currently the authorization method UI sets the token when the requests is generated so it's not as much important.
  }

  /**
   * Injects bearer auth header into the request headers.
   */
  static applyBearer(request: IProjectRequest, config: IBearerAuthorization): void {
    const { token } = config;
    const value = `Bearer ${token}`;

    const headers = new Headers(request.expects.headers || '');
    headers.append('authorization', value);
    request.expects.headers = headers.toString();
  }
}
