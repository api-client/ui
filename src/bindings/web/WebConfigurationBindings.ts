import { ConfigurationBindings } from '../base/ConfigurationBindings.js';
import { IoCommand, IoEvent, IoNotification } from '../base/PlatformBindings.js';
import { IConfigEnvironment, ITelemetryConfig, IEnvConfig } from '../../lib/config/Config.js';

/**
 * Application configuration bindings that handles storing application configuration
 * on the web platform.
 */
export class WebConfigurationBindings extends ConfigurationBindings {
  worker?: SharedWorker;

  async initialize(): Promise<void> {
    await super.initialize();
    await this.createWorker();
  }

  async createWorker(): Promise<void> {
    return new Promise((resolve, reject) => {
      const worker = new SharedWorker('/demo/lib/io/AppConfig.ts', {
        type: 'module',
      });
      worker.port.start();
      worker.onerror = (): void => reject(new Error('Unable to initialize the IO process.'));
      this.worker = worker;
      const binder = this._ioHandler.bind(this);
      worker.port.addEventListener('message', function init () {
        worker.port.removeEventListener('message', init);
        worker.port.addEventListener('message', binder);
        resolve();
      });
    });
  }

  protected _ioHandler(e: MessageEvent): void {
    const event = e.data as IoCommand | IoEvent | IoNotification;
    this.handleIoMessage(event);
  }

  protected sendIoCommand(cmd: IoCommand): void {
    const { worker } = this;
    if (!worker) {
      throw new Error(`IO not ready.`);
    }
    worker.port.postMessage(cmd);
  }

  async readEnvironments(): Promise<IEnvConfig> {
    return this.invoke('readEnvironments');
  }

  /**
   * Adds a new environment configuration to the application permanent storage.
   * This is not synchronized between applications.
   * 
   * @param env The environment to add.
   * @param asDefault Whether to set this environment asd default. Default to `false`.
   */
  async addEnvironment(env: IConfigEnvironment, asDefault = false): Promise<void> {
    return this.invoke('addEnvironment', env, asDefault);
  }

  /**
   * Updates an existing environment.
   * 
   * @param env The environment to update
   */
  async updateEnvironment(env: IConfigEnvironment): Promise<void> {
    return this.invoke('updateEnvironment', env);
  }

  /**
   * Reads the definition of an environment.
   * 
   * @param id The key of the environment to read. When not set it reads the default environment.
   */
  async readEnvironment(id?: string): Promise<IConfigEnvironment> {
    return this.invoke('readEnvironment', id);
  }

  /**
   * Removes an environment from the permanent store.
   * @param id The key of the environment to remove.
   */
  async removeEnvironment(id: string): Promise<void> {
    await this.invoke('removeEnvironment', id);
  }

  /**
   * Sets the environment as default.
   * 
   * @param id The key of the environment to set as default.
   */
  async setDefaultEnvironment(id: string): Promise<void> {
    await this.invoke('setDefaultEnvironment', id);
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
    return this.invoke('telemetryRead');
  }

  /**
   * Sets the configuration for telemetry.
   * 
   * @param config The configuration to set.
   */
  async telemetrySet(config: ITelemetryConfig): Promise<void> {
    return this.invoke('telemetrySet', config);
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
    return this.invoke('setLocalProperty', key, value);
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
    return this.invoke('getLocalProperty', key, globalKey);
  }

  /**
   * Deletes previously stored local value.
   * 
   * @param key The key under which the property was stored.
   */
  async deleteLocalProperty(key: string): Promise<void> {
    return this.invoke('deleteLocalProperty', key);
  }
}
