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

  /**
   * @deprecated Use the `constructor(env: IConfigEnvironment)` constructor.
   * @param env The store environment to use.
   */
  static fromEnvironment(env: IConfigEnvironment): HttpStore {
    const { location } = env;
    const store = new HttpStore(location);
    store.env = env;
    return store;
  }

  /**
   * @deprecated Use the `constructor(env: IConfigEnvironment)` constructor.
   * @param url The store URL.
   */
  constructor(url: string);

  constructor(env: IConfigEnvironment);

  constructor(envOrUrl: string | IConfigEnvironment) {
    if (!envOrUrl) {
      throw new Error(`Expected an argument.`);
    }
    if (typeof envOrUrl === 'string') {
      if (envOrUrl.endsWith('/')) {
        envOrUrl = envOrUrl.substring(0, envOrUrl.length - 1);
      }
      this.url = envOrUrl;
      this.sdk = new StoreSdk(envOrUrl);
    } else {
      this.env = envOrUrl;
      const { location } = envOrUrl;
      this.url = location;
      this.sdk = new StoreSdk(location);
    }
  }

  /**
   * Checks whether the environment has the token and whether this token 
   * can make requests to the store.
   * 
   * @param env Optional environment. By default is uses the one defined on the class.
   */
  async isAuthenticated(env = this.env): Promise<boolean> {
    if (!env) {
      throw new Error(`The environment either has to be set on the HttpStore class or passed as an argument.`);
    }
    const { token } = env;
    if (!token) {
      return false;
    }
    const meUri = this.sdk.getUrl(RouteBuilder.usersMe()).toString();
    const user = await this.sdk.http.get(meUri, { token });
    const ok = user.status === 200;
    if (ok) {
      env.authenticated = true;
      this.sdk.token = token;
    }
    return user.status === 200;
  }

  /**
   * Creates a session in the store and authenticates the user when needed.
   * @param env Optional environment to authenticate if should be different than the current
   * @param force Forces logging in even when the token is valid.
   */
  async getStoreSessionToken(env = this.env, force = false): Promise<ISessionInitInfo> {
    if (!env) {
      throw new Error(`The environment either has to be set on the HttpStore class or passed as an argument.`);
    }
    const meUri = this.sdk.getUrl(RouteBuilder.usersMe()).toString();
    const result: ISessionInitInfo = {
      token: env.token || '',
      expires: env.tokenExpires,
      new: false,
    };
    
    if (!force && result.token) {
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
