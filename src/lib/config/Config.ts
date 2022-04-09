export type DataSourceType = 'local-store' | 'network-store';
export type TelemetryLevel = 'noting' | 'crash' | 'all';

/**
 * The definition of the configuration environment.
 */
export interface IConfigEnvironment {
  /**
   * The key of the environment.
   */
  key: string;
  /**
   * The source of the data.
   * When file it expects the `in` parameter to be set and the CLI operates on a single project file.
   * When `net-store` is selected then it requires store configuration with the URL to the store.
   */
  source: DataSourceType;
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

/**
 * Application configuration for telemetry.
 */
export interface ITelemetryConfig {
  /**
   * The level the user consent to data sharing.
   * @default noting
   */
  level: TelemetryLevel;
}

export interface IEnvConfig {
  current?: string;
  environments: IConfigEnvironment[];
}

export type ConfigInitReason = 'first-run' | 'add';

export interface IConfigInit {
  source: DataSourceType;
  reason: ConfigInitReason;
  location?: string;
  name?: string;
}
