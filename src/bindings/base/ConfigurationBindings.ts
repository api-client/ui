import { PlatformBindings } from './PlatformBindings.js';
import { EventTypes } from '../../events/EventTypes.js';
import { IConfigEnvironment, ITelemetryConfig, IEnvConfig } from '../../lib/config/Config.js';

export const KeyPrefix = 'api-client.config.';
export const EnvironmentsKey = `${KeyPrefix}environments`;
export const TelemetryKey = `${KeyPrefix}telemetry`;

/**
 * The base class for application settings bindings.
 */
export abstract class ConfigurationBindings extends PlatformBindings {
  async initialize(): Promise<void> {
    window.addEventListener(EventTypes.Config.Environment.add, this.addEnvironmentHandler.bind(this));
    window.addEventListener(EventTypes.Config.Environment.update, this.updateEnvironmentHandler.bind(this));
    window.addEventListener(EventTypes.Config.Environment.read, this.readEnvironmentHandler.bind(this));
    window.addEventListener(EventTypes.Config.Environment.delete, this.removeEnvironmentHandler.bind(this));
    window.addEventListener(EventTypes.Config.Environment.setDefault, this.setDefaultHandler.bind(this));
    window.addEventListener(EventTypes.Config.Environment.list, this.listEnvironmentsHandler.bind(this));

    window.addEventListener(EventTypes.Config.Session.get, this.getSessionHandler.bind(this));
    window.addEventListener(EventTypes.Config.Session.set, this.setSessionHandler.bind(this));
    window.addEventListener(EventTypes.Config.Session.delete, this.deleteSessionHandler.bind(this));

    window.addEventListener(EventTypes.Config.Local.get, this.getLocalHandler.bind(this));
    window.addEventListener(EventTypes.Config.Local.set, this.setLocalHandler.bind(this));
    window.addEventListener(EventTypes.Config.Local.delete, this.deleteLocalHandler.bind(this));

    window.addEventListener(EventTypes.Config.Telemetry.read, this.telemetryReadHandler.bind(this));
    window.addEventListener(EventTypes.Config.Telemetry.set, this.telemetrySetHandler.bind(this));
  }

  protected addEnvironmentHandler(input: Event): void {
    const e = input as CustomEvent;
    e.preventDefault();
    e.detail.result = this.addEnvironment(e.detail.env, e.detail.asDefault);
  }

  protected updateEnvironmentHandler(input: Event): void {
    const e = input as CustomEvent;
    e.preventDefault();
    e.detail.result = this.updateEnvironment(e.detail.env);
  }

  protected readEnvironmentHandler(input: Event): void {
    const e = input as CustomEvent;
    e.preventDefault();
    e.detail.result = this.readEnvironment(e.detail.id);
  }

  protected removeEnvironmentHandler(input: Event): void {
    const e = input as CustomEvent;
    e.preventDefault();
    e.detail.result = this.removeEnvironment(e.detail.id);
  }

  protected setDefaultHandler(input: Event): void {
    const e = input as CustomEvent;
    e.preventDefault();
    e.detail.result = this.setDefaultEnvironment(e.detail.id);
  }

  protected listEnvironmentsHandler(input: Event): void {
    const e = input as CustomEvent;
    e.preventDefault();
    e.detail.result = this.readEnvironments();
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

  protected getLocalHandler(input: Event): void {
    const e = input as CustomEvent;
    e.preventDefault();
    e.detail.result = this.getLocalProperty(e.detail.key, e.detail.globalKey);
  }

  protected setLocalHandler(input: Event): void {
    const e = input as CustomEvent;
    e.preventDefault();
    e.detail.result = this.setLocalProperty(e.detail.key, e.detail.value);
  }

  protected deleteLocalHandler(input: Event): void {
    const e = input as CustomEvent;
    e.preventDefault();
    e.detail.result = this.deleteLocalProperty(e.detail.key);
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
   * Updates an existing environment.
   * 
   * @param env The environment to update
   */
  abstract updateEnvironment(env: IConfigEnvironment): Promise<void>;

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
   * Sets the environment as default.
   * 
   * @param id The key of the environment to set as default.
   */
  abstract setDefaultEnvironment(id: string): Promise<void>;

  /**
   * Lists all environments in the store.
   */
  abstract readEnvironments(): Promise<IEnvConfig>;

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

  /**
   * Sets a config property that is permanently stored.
   * This is not the same as application configuration. This can be used to store specific configuration 
   * property for a single view.
   * 
   * @param key The key under to store the value.
   * @param value The value to store. If this is not a primitive it will be serialized with `JSON.stringify()`.
   */
  abstract setLocalProperty(key: string, value: unknown): Promise<void>;

  /**
   * Reads a previously stored local value.
   * 
   * @param key The key under which the property was stored.
   * @param globalKey If known, the key of the configuration property in the application 
   * global configuration. When set and the value in the local storage is not set, then
   * the config store reads the value from the application configuration. 
   */
  abstract getLocalProperty(key: string, globalKey?: string): Promise<unknown | undefined>;

  /**
   * Deletes previously stored local value.
   * 
   * @param key The key under which the property was stored.
   */
  abstract deleteLocalProperty(key: string): Promise<void>;
}
