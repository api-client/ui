import { get, set } from 'idb-keyval';
import { Events } from '../../events/Events.js';
import { ConfigurationBindings, EnvironmentsKey, TelemetryKey } from '../base/ConfigurationBindings.js';
import { IConfigEnvironment, ITelemetryConfig } from '../../lib/config/Config.js';

interface IEnvConfig {
  current?: string;
  environments: IConfigEnvironment[];
}

/**
 * Application configuration bindings that handles storing application configuration
 * on the web platform.
 */
export class WebConfigurationBindings extends ConfigurationBindings {
  protected async readEnvironments(): Promise<IEnvConfig> {
    let data = await get(EnvironmentsKey) as IEnvConfig;
    if (!data) {
      data = {
        environments: [],
      };
    }
    return data;
  }

  protected async writeEnvironments(data: IEnvConfig): Promise<void> {
    await set(EnvironmentsKey, data);
  }

  /**
   * Adds a new environment configuration to the application permanent storage.
   * This is not synchronized between applications.
   * 
   * @param env The environment to add.
   * @param asDefault Whether to set this environment asd default. Default to `false`.
   */
  async addEnvironment(env: IConfigEnvironment, asDefault = false): Promise<void> {
    const data = await this.readEnvironments();
    data.environments.push(env);
    if (asDefault) {
      data.current = env.key;
    }
    await this.writeEnvironments(data);
    await Events.Config.Environment.State.created({ ...env });
  }

  /**
   * Reads the definition of an environment.
   * 
   * @param id The key of the environment to read. When not set it reads the default environment.
   */
  async readEnvironment(id?: string): Promise<IConfigEnvironment> {
    const data = await this.readEnvironments();
    const key = id || data.current;
    if (!key) {
      throw new Error(`No default environment.`);
    }
    const env = data.environments.find(i => i.key === key);
    if (!env) {
      throw new Error(`The environment is not found. Reinitialize application configuration.`);
    }
    return env;
  }

  /**
   * Removes an environment from the permanent store.
   * @param id The key of the environment to remove.
   */
  async removeEnvironment(id: string): Promise<void> {
    const data = await this.readEnvironments();
    const index = data.environments.findIndex(i => i.key === id);
    if (index >= 0) {
      data.environments.splice(index, 1);
    }
    if (data.current === id) {
      delete data.current;
    }
    await this.writeEnvironments(data);
  }

  /**
   * Sets a config property that is held in the storage only for the time of the current session.
   * 
   * @param key The key under to store the value.
   * @param value The value to store. If this is not a primitive it will be serialized with `JSON.stringify()`.
   */
  async setSessionProperty(key: string, value: unknown): Promise<void> {
    const storedValue = {
      type: typeof value,
      value,
    };
    sessionStorage.setItem(key, JSON.stringify(storedValue));
  }

  /**
   * Reads a previously stored session value.
   * 
   * @param key The key under which the property was stored.
   */
  async getSessionProperty(key: string): Promise<unknown | undefined> {
    const data = sessionStorage.getItem(key);
    if (data === null) {
      return undefined;
    }
    let restored: unknown | undefined;
    try {
      const parsed = JSON.parse(data);
      restored = parsed.value;
    } catch (e) {
      // ...
    }
    return restored;
  }

  /**
   * Deletes previously stored session value.
   * 
   * @param key The key under which the property was stored.
   */
  async deleteSessionProperty(key: string): Promise<void> {
    sessionStorage.removeItem(key);
  }

  /**
   * Reads the set telemetry configuration. If the configuration is missing a default value is returned.
   */
  async telemetryRead(): Promise<ITelemetryConfig> {
    let data = await get(TelemetryKey) as ITelemetryConfig;
    if (!data) {
      data = {
        level: 'noting',
      };
    }
    return data;
  }

  /**
   * Sets the configuration for telemetry.
   * 
   * @param config The configuration to set.
   */
  async telemetrySet(config: ITelemetryConfig): Promise<void> {
    await set(TelemetryKey, config);
    Events.Config.Telemetry.State.set({ ...config });
  }
}
