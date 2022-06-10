/* eslint-disable @typescript-eslint/ban-ts-comment */
import { get, set, del } from 'idb-keyval';
import { EnvironmentsKey, TelemetryKey } from '../../../src/bindings/base/ConfigurationBindings.js';
import { IoCommand, IoEvent, IoNotification } from '../../../src/bindings/base/PlatformBindings.js';
import { IoThread } from '../../../src/bindings/base/IoThread.js';
import { IConfigEnvironment, ITelemetryConfig, IEnvConfig } from '../../../src/lib/config/Config.js';

/**
 * With the `environment-*` events we mimic the application's
 * communication system to all opened windows.
 * 
 * The environments configuration applies to all apps and all windows
 * so we distribute this to all.
 */
class AppConfig extends IoThread {
  ports: MessagePort[] = [];

  async initialize(): Promise<void> {
    // @ts-ignore
    // eslint-disable-next-line no-restricted-globals
    self.onconnect = (e: any): void => {
      const port = e.ports[0] as MessagePort;
      this.ports.push(port);
      port.addEventListener('message', this._messageHandler.bind(this));
      port.start();
      port.postMessage('ready');
    }
  }

  postMessage(message: IoNotification | IoEvent): void {
    this.ports.forEach(p => p.postMessage(message));
  }

  protected _messageHandler(e: MessageEvent): void {
    const event = e.data as IoCommand | IoEvent;
    this.handleMessage(event);
  }

  // 
  // The configuration logic.
  // 

  protected async writeEnvironments(data: IEnvConfig): Promise<void> {
    await set(EnvironmentsKey, data);
  }

  async readEnvironments(): Promise<IEnvConfig> {
    let data = await get(EnvironmentsKey) as IEnvConfig;
    if (!data) {
      data = {
        environments: [],
      };
    }
    return data;
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
    // Events.Config.Environment.State.created({ ...env }, asDefault);
    this.notifyClients('Events.Config.Environment.State.created', env, asDefault);
  }

  /**
   * Updates an existing environment.
   * 
   * @param env The environment to update
   */
  async updateEnvironment(env: IConfigEnvironment): Promise<void> {
    const data = await this.readEnvironments();
    const index = data.environments.findIndex(i => i.key === env.key);
    if (index < 0) {
      throw new Error(`The environment does not exist. Maybe use "add" instead?`);
    }
    data.environments[index] = env;
    await this.writeEnvironments(data);
    // Events.Config.Environment.State.updated({ ...env });
    this.notifyClients('Events.Config.Environment.State.updated', env);
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
    // Events.Config.Environment.State.deleted(id);
    this.notifyClients('Events.Config.Environment.State.deleted', id);
  }

  /**
   * Sets the environment as default.
   * 
   * @param id The key of the environment to set as default.
   */
  async setDefaultEnvironment(id: string): Promise<void> {
    const data = await this.readEnvironments();
    const hasEnv = data.environments.some(i => i.key === id);
    if (!hasEnv) {
      throw new Error(`The environment is not defined: ${id}`);
    }
    data.current = id;
    await this.writeEnvironments(data);
    // Events.Config.Environment.State.defaultChange(id);
    this.notifyClients('Events.Config.Environment.State.defaultChange', id);
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
    // Events.Config.Telemetry.State.set({ ...config });
    this.notifyClients('Events.Config.Telemetry.State.set', config);
  }

  /**
   * Sets a config property that is permanently stored.
   * This is not the same as application configuration. This can be used to store specific configuration 
   * property for a single view.
   * 
   * @param key The key under to store the value.
   * @param value The value to store. If this is not a primitive it will be serialized with `JSON.stringify()`.
   */
  async setLocalProperty(key: string, value: unknown): Promise<void> {
    const storedValue = {
      type: typeof value,
      value,
    };
    await set(key, storedValue);
  }

  /**
   * Reads a previously stored local value.
   * 
   * @param key The key under which the property was stored.
   * @param globalKey If known, the key of the configuration property in the application 
   * global configuration. When set and the value in the local storage is not set, then
   * the config store reads the value from the application configuration. 
   */
  async getLocalProperty(key: string, globalKey?: string): Promise<unknown | undefined> {
    const value = await get(key);
    if (value) {
      return value.value;
    }
    if (globalKey) {
      // ...
    }
    return undefined;
  }

  /**
   * Deletes previously stored local value.
   * 
   * @param key The key under which the property was stored.
   */
  async deleteLocalProperty(key: string): Promise<void> {
    await del(key);
  }
}

const instance = new AppConfig();
instance.initialize();
