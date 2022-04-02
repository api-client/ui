import { PlatformBindings } from './PlatformBindings.js';
import { EventTypes } from '../../events/EventTypes.js';
import { IConfigEnvironment, ITelemetryConfig } from '../../lib/config/Config.js';

export const KeyPrefix = 'api-client.config.';
export const EnvironmentsKey = `${KeyPrefix}environments`;
export const TelemetryKey = `${KeyPrefix}telemetry`;

/**
 * The base class for application settings bindings.
 */
export abstract class ConfigurationBindings extends PlatformBindings {
  async initialize(): Promise<void> {
    window.addEventListener(EventTypes.Config.Environment.add, this.addEnvironmentHandler.bind(this));
    window.addEventListener(EventTypes.Config.Session.get, this.getSessionHandler.bind(this));
    window.addEventListener(EventTypes.Config.Session.set, this.setSessionHandler.bind(this));
    window.addEventListener(EventTypes.Config.Session.delete, this.deleteSessionHandler.bind(this));
    window.addEventListener(EventTypes.Config.Telemetry.read, this.telemetryReadHandler.bind(this));
    window.addEventListener(EventTypes.Config.Telemetry.set, this.telemetrySetHandler.bind(this));
  }

  protected addEnvironmentHandler(input: Event): void {
    const e = input as CustomEvent;
    e.preventDefault();
    e.detail.result = this.addEnvironment(e.detail.env, e.detail.asDefault);
  }

  protected getSessionHandler(input: Event): void {
    const e = input as CustomEvent;
    e.preventDefault();
    e.detail.result = this.getSessionProperty(e.detail.key);
  }

  protected setSessionHandler(input: Event): void {
    const e = input as CustomEvent;
    e.preventDefault();
    e.detail.result = this.setSessionProperty(e.detail.key, e.detail.value);
  }

  protected deleteSessionHandler(input: Event): void {
    const e = input as CustomEvent;
    e.preventDefault();
    e.detail.result = this.deleteSessionProperty(e.detail.key);
  }

  protected telemetryReadHandler(input: Event): void {
    const e = input as CustomEvent;
    e.preventDefault();
    e.detail.result = this.telemetryRead();
  }

  protected telemetrySetHandler(input: Event): void {
    const e = input as CustomEvent;
    e.preventDefault();
    e.detail.result = this.telemetrySet(e.detail.config);
  }

  /**
   * Adds a new environment configuration to the application permanent storage.
   * This is not synchronized between applications.
   * 
   * @param env The environment to add.
   * @param asDefault Whether to set this environment asd default. Default to `false`.
   */
  abstract addEnvironment(env: IConfigEnvironment, asDefault?: boolean): Promise<void>;

  /**
   * Reads the definition of an environment.
   * 
   * @param id The key of the environment to read. When not set it reads the default environment.
   */
  abstract readEnvironment(id?: string): Promise<IConfigEnvironment>;

  /**
   * Removes an environment from the permanent store.
   * @param id The key of the environment to remove.
   */
  abstract removeEnvironment(id: string): Promise<void>;

  /**
   * Sets a config property that is held in the storage only for the time of the current session.
   * 
   * @param key The key under to store the value.
   * @param value The value to store. If this is not a primitive it will be serialized with `JSON.stringify()`.
   */
  abstract setSessionProperty(key: string, value: unknown): Promise<void>;

  /**
   * Reads a previously stored session value.
   * 
   * @param key The key under which the property was stored.
   */
  abstract getSessionProperty(key: string): Promise<unknown | undefined>;

  /**
   * Deletes previously stored session value.
   * 
   * @param key The key under which the property was stored.
   */
  abstract deleteSessionProperty(key: string): Promise<void>;

  /**
   * Reads the set telemetry configuration. If the configuration is missing a default value is returned.
   */
  abstract telemetryRead(): Promise<ITelemetryConfig>;

  /**
   * Sets the configuration for telemetry.
   * 
   * @param config The configuration to set.
   */
  abstract telemetrySet(config: ITelemetryConfig): Promise<void>;
}
