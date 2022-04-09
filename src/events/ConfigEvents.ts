import { EventTypes } from './EventTypes.js';
import { ITelemetryConfig, IConfigEnvironment, IEnvConfig } from '../lib/config/Config.js';

export const ConfigEvents = Object.freeze({
  Environment: Object.freeze({
    /**
     * Adds the environment to the store.
     * 
     * @param env The environment to add.
     * @param asDefault Whether to set the environment as default.
     * @param target Optional events target.
     */
    add: async (env: IConfigEnvironment, asDefault = false, target: EventTarget = document.body): Promise<void> => {
      const e = new CustomEvent(EventTypes.Config.Environment.add, {
        bubbles: true,
        cancelable: true,
        composed: true,
        detail: {
          env,
          asDefault,
          result: undefined,
        },
      });
      target.dispatchEvent(e);
      await ((e.detail.result as unknown) as Promise<void>);
    },
    /**
     * Updates an environment
     * 
     * @param env The environment to update.
     * @param target Optional events target.
     */
    update: async (env: IConfigEnvironment, target: EventTarget = document.body): Promise<void> => {
      const e = new CustomEvent(EventTypes.Config.Environment.update, {
        bubbles: true,
        cancelable: true,
        composed: true,
        detail: {
          env,
          result: undefined,
        },
      });
      target.dispatchEvent(e);
      await ((e.detail.result as unknown) as Promise<void>);
    },
    /**
     * Reads the definition of an environment.
     * 
     * @param id The key of the environment to read. When not set it reads the default environment.
     * @param target Optional events target.
     */
    read: async (id?: string, target: EventTarget = document.body): Promise<IConfigEnvironment> => {
      const e = new CustomEvent(EventTypes.Config.Environment.read, {
        bubbles: true,
        cancelable: true,
        composed: true,
        detail: {
          id,
          result: undefined,
        },
      });
      target.dispatchEvent(e);
      return ((e.detail.result as unknown) as Promise<IConfigEnvironment>);
    },
    /**
     * Removes an environment from the permanent store.
     * 
     * @param id The key of the environment to remove.
     * @param target Optional events target.
     */
    delete: async (id: string, target: EventTarget = document.body): Promise<void> => {
      const e = new CustomEvent(EventTypes.Config.Environment.delete, {
        bubbles: true,
        cancelable: true,
        composed: true,
        detail: {
          id,
          result: undefined,
        },
      });
      target.dispatchEvent(e);
      return ((e.detail.result as unknown) as Promise<void>);
    },
    /**
     * Sets the environment as default.
     * 
     * @param id The key of the environment to set as default.
     * @param target Optional events target.
     */
    setDefault: async (id: string, target: EventTarget = document.body): Promise<void> => {
      const e = new CustomEvent(EventTypes.Config.Environment.setDefault, {
        bubbles: true,
        cancelable: true,
        composed: true,
        detail: {
          id,
          result: undefined,
        },
      });
      target.dispatchEvent(e);
      return ((e.detail.result as unknown) as Promise<void>);
    },
    /**
     * Lists all configured environments.
     * 
     * @param target Optional events target.
     */
    list: async (target: EventTarget = document.body): Promise<IEnvConfig> => {
      const e = new CustomEvent(EventTypes.Config.Environment.list, {
        bubbles: true,
        cancelable: true,
        composed: true,
        detail: {
          result: undefined,
        },
      });
      target.dispatchEvent(e);
      return ((e.detail.result as unknown) as Promise<IEnvConfig>);
    },

    State: Object.freeze({
      /**
       * Informs the application that an environment has been created.
       * 
       * @param env Creates environment.
       * @param isDefault Whether the created environment is a default environment
       * @param target Optional events target.
       */
      created: (env: IConfigEnvironment, isDefault: boolean, target: EventTarget = document.body): void => {
        const e = new CustomEvent(EventTypes.Config.Environment.State.created, {
          bubbles: true,
          cancelable: true,
          composed: true,
          detail: {
            env,
            isDefault,
          },
        });
        target.dispatchEvent(e);
      },
      /**
       * Informs the application that an environment has been deleted.
       * 
       * @param id The key of the environment
       * @param target Optional events target.
       */
      deleted: (id: string, target: EventTarget = document.body): void => {
        const e = new CustomEvent(EventTypes.Config.Environment.State.deleted, {
          bubbles: true,
          cancelable: true,
          composed: true,
          detail: {
            id,
          },
        });
        target.dispatchEvent(e);
      },
      /**
       * Informs the application that an environment has been deleted.
       * 
       * @param env The updated environment.
       * @param target Optional events target.
       */
      updated: (env: IConfigEnvironment, target: EventTarget = document.body): void => {
        const e = new CustomEvent(EventTypes.Config.Environment.State.updated, {
          bubbles: true,
          cancelable: true,
          composed: true,
          detail: {
            env,
          },
        });
        target.dispatchEvent(e);
      },
      /**
       * Informs the application that a default environment has changed.
       * 
       * @param id The key of the environment.
       * @param target Optional events target.
       */
      defaultChange: (id: string, target: EventTarget = document.body): void => {
        const e = new CustomEvent(EventTypes.Config.Environment.State.defaultChange, {
          bubbles: true,
          cancelable: true,
          composed: true,
          detail: {
            id,
          },
        });
        target.dispatchEvent(e);
      },
    }),
  }),
  Session: Object.freeze({
    /**
     * Sets a config property that is held in the storage only for the time of the current session.
     * 
     * @param key The key under to store the value.
     * @param value The value to store. If this is not a primitive it will be serialized with `JSON.stringify()`.
     */
    set: async (key: string, value: unknown, target: EventTarget = document.body): Promise<void> => {
      const e = new CustomEvent(EventTypes.Config.Session.set, {
        bubbles: true,
        cancelable: true,
        composed: true,
        detail: {
          key,
          value,
          result: undefined,
        },
      });
      target.dispatchEvent(e);
      await ((e.detail.result as unknown) as Promise<void>);
    },

    /**
     * Reads a previously stored session value.
     * 
     * @param key The key under which the property was stored.
     */
    get: async (key: string, target: EventTarget = document.body): Promise<unknown | undefined> => {
      const e = new CustomEvent(EventTypes.Config.Session.get, {
        bubbles: true,
        cancelable: true,
        composed: true,
        detail: {
          key,
          result: undefined,
        },
      });
      target.dispatchEvent(e);
      return ((e.detail.result as unknown) as Promise<unknown | undefined>);
    },

    /**
     * Deletes previously stored session value.
     * 
     * @param key The key under which the property was stored.
     */
    delete: async (key: string, target: EventTarget = document.body): Promise<void> => {
      const e = new CustomEvent(EventTypes.Config.Session.delete, {
        bubbles: true,
        cancelable: true,
        composed: true,
        detail: {
          key,
          result: undefined,
        },
      });
      target.dispatchEvent(e);
      await ((e.detail.result as unknown) as Promise<void>);
    },
  }),
  Local: Object.freeze({
    /**
     * Sets a config property that is permanently stored.
     * This is not the same as application configuration. This can be used to store specific configuration 
     * property for a single view.
     * 
     * @param key The key under to store the value.
     * @param value The value to store. If this is not a primitive it will be serialized with `JSON.stringify()`.
     */
    set: async (key: string, value: unknown, target: EventTarget = document.body): Promise<void> => {
      const e = new CustomEvent(EventTypes.Config.Local.set, {
        bubbles: true,
        cancelable: true,
        composed: true,
        detail: {
          key,
          value,
          result: undefined,
        },
      });
      target.dispatchEvent(e);
      await ((e.detail.result as unknown) as Promise<void>);
    },

    /**
     * Reads a previously stored local value.
     * 
     * @param key The key under which the property was stored.
     * @param globalKey If known, the key of the configuration property in the application 
     * global configuration. When set and the value in the local storage is not set, then
     * the config store reads the value from the application configuration. 
     */
    get: async (key: string, globalKey?: string, target: EventTarget = document.body): Promise<unknown | undefined> => {
      const e = new CustomEvent(EventTypes.Config.Local.get, {
        bubbles: true,
        cancelable: true,
        composed: true,
        detail: {
          key,
          globalKey,
          result: undefined,
        },
      });
      target.dispatchEvent(e);
      return ((e.detail.result as unknown) as Promise<unknown | undefined>);
    },

    /**
     * Deletes previously stored local value.
     * 
     * @param key The key under which the property was stored.
     */
    delete: async (key: string, target: EventTarget = document.body): Promise<void> => {
      const e = new CustomEvent(EventTypes.Config.Local.delete, {
        bubbles: true,
        cancelable: true,
        composed: true,
        detail: {
          key,
          result: undefined,
        },
      });
      target.dispatchEvent(e);
      await ((e.detail.result as unknown) as Promise<void>);
    },
  }),
  Telemetry: Object.freeze({
    /**
     * Sets the configuration for telemetry.
     * 
     * @param config The configuration to set.
     * @param target Optional events target.
     */
    set: async (config: ITelemetryConfig, target: EventTarget = document.body): Promise<void> => {
      const e = new CustomEvent(EventTypes.Config.Telemetry.set, {
        bubbles: true,
        cancelable: true,
        composed: true,
        detail: {
          config,
          result: undefined,
        },
      });
      target.dispatchEvent(e);
      await ((e.detail.result as unknown) as Promise<void>);
    },
    /**
     * Reads the set telemetry configuration. If the configuration is missing a default value is returned.
     * 
     * @param target Optional events target
     */
    read: async (target: EventTarget = document.body): Promise<ITelemetryConfig> => {
      const e = new CustomEvent(EventTypes.Config.Telemetry.read, {
        bubbles: true,
        cancelable: true,
        composed: true,
        detail: {
          result: undefined,
        },
      });
      target.dispatchEvent(e);
      return ((e.detail.result as unknown) as Promise<ITelemetryConfig>);
    },

    State: Object.freeze({
      /**
       * Dispatched to inform the application that the new telemetry state has been set.
       * 
       * @param config The set configuration.
       * @param target Optional events target.
       */
      set: (config: ITelemetryConfig, target: EventTarget = document.body): void => {
        const e = new CustomEvent(EventTypes.Config.Telemetry.State.set, {
          bubbles: true,
          cancelable: true,
          composed: true,
          detail: config,
        });
        target.dispatchEvent(e);
      },
    }),
  }),
});
