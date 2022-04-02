import { EventTypes } from './EventTypes.js';
import { ITelemetryConfig, IConfigEnvironment } from '../lib/config/Config.js';

export const ConfigEvents = Object.freeze({
  Environment: Object.freeze({
    /**
     * Adds the environment to the store.
     * 
     * @param env The environment to authenticate.
     * @param asDefault Whether to set the environment as default.
     * @param target Optional events target.
     */
    add: async (env: IConfigEnvironment, asDefault = false, target: EventTarget=document.body): Promise<void> => {
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

    State: Object.freeze({
      /**
       * Informs the application that an environment has been created.
       * 
       * @param env Creates environment.
       * @param target Optional events target.
       */
      created: async (env: IConfigEnvironment, target: EventTarget=document.body): Promise<void> => {
        const e = new CustomEvent(EventTypes.Config.Environment.State.created, {
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
    }),
  }),
  Session: Object.freeze({
    /**
     * Sets a config property that is held in the storage only for the time of the current session.
     * 
     * @param key The key under to store the value.
     * @param value The value to store. If this is not a primitive it will be serialized with `JSON.stringify()`.
     */
    set: async (key: string, value: unknown, target: EventTarget=document.body): Promise<void> => {
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
    get: async (key: string, target: EventTarget=document.body): Promise<unknown | undefined> => {
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
    delete: async (key: string, target: EventTarget=document.body): Promise<void> => {
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
    
  }),
  Telemetry: Object.freeze({
    /**
     * Sets the configuration for telemetry.
     * 
     * @param config The configuration to set.
     * @param target Optional events target.
     */
    set: async (config: ITelemetryConfig, target: EventTarget=document.body): Promise<void> => {
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
    read: async (target: EventTarget=document.body): Promise<ITelemetryConfig> => {
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
      set: (config: ITelemetryConfig, target: EventTarget=document.body): void => {
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
