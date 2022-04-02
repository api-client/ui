import { IConfigEnvironment } from '../lib/config/Config.js';
import { ISessionInitInfo } from '../store/HttpStore.js';
import { EventTypes } from './EventTypes.js';

export const AuthEvents = Object.freeze({
  /**
   * Authenticates the environment when needed.
   * 
   * @param env The environment to authenticate
   * @param target Optional events target.
   * @returns The session information.
   */
  authenticate: async (env: IConfigEnvironment, target: EventTarget=document.body): Promise<ISessionInitInfo> => {
    const e = new CustomEvent(EventTypes.Auth.authenticate, {
      bubbles: true,
      cancelable: true,
      composed: true,
      detail: {
        env,
        result: undefined,
      },
    });
    target.dispatchEvent(e);
    return ((e.detail.result as unknown) as Promise<ISessionInitInfo>);
  },
});
