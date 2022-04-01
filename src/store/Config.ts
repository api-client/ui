/**
 * The definition of the configuration environment.
 */
 export interface IConfigEnvironment {
  /**
   * The key of the environment.
   */
  key: string;
  /**
   * The name for the environment
   */
  name: string;
  /**
   * The full base URL to the store.
   */
  location: string;
  /**
   * The auth token to use with the store APIs.
   */
  token?: string;
  /**
   * The access token expiration time. 
   * May not be set if the store's tokens do not expire.
   */
  tokenExpires?: number;
  /**
   * A flag indicating whether the token was authenticated with the user.
   */
  authenticated?: boolean;
}
