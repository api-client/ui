/* eslint-disable no-param-reassign */
import { StoreSdk, RouteBuilder } from '@api-client/core/build/browser.js';
import { IConfigEnvironment } from '../lib/config/Config.js';

export interface ISessionInitInfo {
  /**
   * The user access token to the store.
   */
  token: string;
  /**
   * When the token expires, if ever.
   */
  expires?: number;
  /**
   * Whether a new token was generated or the stored token is valid.
   */
  new: boolean;
}

/**
 * The client (web) side store.
 */
export class HttpStore {
  sdk: StoreSdk;

  url: string;

  env?: IConfigEnvironment;

  static fromEnvironment(env: IConfigEnvironment): HttpStore {
    const { location } = env;
    const store = new HttpStore(location);
    store.env = env;
    return store;
  }

  constructor(url: string) {
    if (!url) {
      throw new Error(`Expected argument.`);
    }
    if (url.endsWith('/')) {
      url = url.substring(0, url.length - 1);
    }
    this.url = url;
    this.sdk = new StoreSdk(url);
  }

  /**
   * Creates a session in the store and authenticates the user when needed.
   */
  async getStoreSessionToken(env = this.env): Promise<ISessionInitInfo> {
    if (!env) {
      throw new Error(`The environment either has to be set on the HttpStore class or passed as an argument.`);
    }
    const meUri = this.sdk.getUrl(RouteBuilder.usersMe()).toString();
    const result: ISessionInitInfo = {
      token: env.token || '',
      expires: env.tokenExpires,
      new: false,
    };
    
    if (result.token) {
      const user = await this.sdk.http.get(meUri, { token: result.token });
      if (user.status === 200) {
        env.authenticated = true;
        this.sdk.token = result.token;
        return result;
      }
    }

    result.token = '';
    delete result.expires;
    result.new = true;

    const info = await this.sdk.auth.createSession();
    result.token = info.token;
    this.sdk.token = info.token;
    env.token = info.token;
    env.authenticated = false;
    if (info.expires) {
      env.tokenExpires = info.expires * 1000;
    }

    const user = await this.sdk.http.get(meUri, { token: result.token });
    
    if (user.status === 200) {
      env.authenticated = true;
    } else {
      await this.authenticateStore();
      env.authenticated = true;
    }
    return result;
  }

  /**
   * Authenticates the user in the store.
   * Note, it opens the browser to the login endpoint.
   */
  async authenticateStore(): Promise<void> {
    const loginEndpoint = this.sdk.getUrl('/auth/login').toString();
    const result = await this.sdk.http.post(loginEndpoint);
    if (result.status !== 204) {
      throw new Error(`Unable to create the authorization session on the store. Invalid status code: ${result.status}.`);
    }
    const location = result.headers.get('location');
    if (!location) {
      throw new Error(`Unable to create the authorization session on the store. The location header is missing.`);
    }
    const authEndpoint = this.sdk.getUrl(location).toString();
    const handle = window.open(authEndpoint);
    if (!handle) {
      throw new Error(`Unable to open an auth window.`);
    }
    await this.sdk.auth.listenAuth(loginEndpoint);
    handle.close();
  }
}
