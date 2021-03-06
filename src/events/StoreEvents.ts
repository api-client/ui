/* eslint-disable no-redeclare */
import { 
  IBackendInfo, IListOptions, IListResponse, IFile, IFileCreateOptions,
  ListFileKind, AccessOperation, IBackendEvent, IUser, IPatchRevision, IApplication, IHttpHistory, IHttpHistoryBulkAdd, HistoryListOptions, 
  IBatchUpdateResult, IAppProject, IBatchDeleteResult, IRevertResponse, IAppRequest,
} from '@api-client/core/build/browser.js';
import { Patch } from '@api-client/json';
import { IConfigEnvironment, IConfigInit } from '../lib/config/Config.js';
import { EventTypes } from './EventTypes.js';
import { ISessionInitInfo } from '../store/HttpStore.js';

/**
 * Reads file metadata from the store.
 * 
 * @param key The file key
 * @returns THe file metadata
 */
function fileRead(key: string, media: false, target?: EventTarget): Promise<IFile>;
/**
* Reads file contents from the store.
* 
* @param key The file key
* @returns THe file contents
*/
function fileRead(key: string, media: true, target?: EventTarget): Promise<unknown>;

/**
* Reads a user file definition from the store.
* @param key The file key
* @param media When true it reads file contents rather than metadata.
*/
function fileRead(key: string, media: boolean, target: EventTarget=document.body): Promise<IFile | unknown> {
  const e = new CustomEvent(EventTypes.Store.File.read, {
    bubbles: true,
    cancelable: true,
    composed: true,
    detail: {
      key,
      media,
      result: undefined,
    },
  });
  target.dispatchEvent(e);
  return ((e.detail.result as unknown) as Promise<IFile | unknown>);
}

/**
 * Patches file's meta in the store.
 * 
 * @param key The file key
 * @param value The patch to apply.
 */
function patchFile(key: string, id: string, value: Patch.JsonPatch, app: IApplication, media: false, target?: EventTarget): Promise<IPatchRevision>;

/**
 * Patches file's content in the store.
 * 
 * @param key The file key
 * @param value The patch to apply.
 */
function patchFile(key: string, id: string, value: Patch.JsonPatch, app: IApplication, media: true, target?: EventTarget): Promise<IPatchRevision>;

/**
 * Patches a file in the store.
 * @param key The key of the file to patch
 * @param value The JSON patch to be processed.
 * @returns The JSON patch to revert the change using the `@api-client/json` library
 */
function patchFile(key: string, id: string, value: Patch.JsonPatch, app: IApplication, media?: boolean, target: EventTarget=document.body): Promise<IPatchRevision> {
  const e = new CustomEvent(EventTypes.Store.File.patch, {
    bubbles: true,
    cancelable: true,
    composed: true,
    detail: {
      key,
      value,
      media,
      id,
      app,
      result: undefined,
    },
  });
  target.dispatchEvent(e);
  return ((e.detail.result as unknown) as Promise<IPatchRevision>);
}

export const StoreEvents = Object.freeze({
  /**
   * Initializes the store configuration for the application.
   * 
   * @param init The configuration initialization.
   * @param target Optional events target.
   */
   initEnvironment: (init: IConfigInit, target: EventTarget=document.body): void => {
    const e = new CustomEvent(EventTypes.Store.initEnvironment, {
      bubbles: true,
      cancelable: true,
      composed: true,
      detail: init,
    });
    target.dispatchEvent(e);
  },

  /**
   * Reads the information about the data store.
   * 
   * @param baseUri The store's base URI
   * @param target Optional events target.
   */
  storeInfo: async (baseUri: string, target: EventTarget=document.body): Promise<IBackendInfo> => {
    const e = new CustomEvent(EventTypes.Store.info, {
      bubbles: true,
      cancelable: true,
      composed: true,
      detail: {
        baseUri,
        result: undefined,
      },
    });
    target.dispatchEvent(e);
    return ((e.detail.result as unknown) as Promise<IBackendInfo>);
  },
  Global: Object.freeze({
    /**
     * Sets the store environment to be used globally by the application.
     * This initializes the store with the configuration.
     * 
     * Note, this won't initialize the session with the store.
     * 
     * @param env The environment to set. Note, it must have the `location` set.
     */
    setEnv: async (env: IConfigEnvironment, target: EventTarget=document.body): Promise<void> => {
      const e = new CustomEvent(EventTypes.Store.Global.setEnv, {
        bubbles: true,
        cancelable: true,
        composed: true,
        detail: {
          env,
          result: undefined,
        },
      });
      target.dispatchEvent(e);
      await (e.detail.result as unknown);
    },
    /**
     * Reads the currently set global environment.
     */
    getEnv: async (target: EventTarget=document.body): Promise<IConfigEnvironment> => {
      const e = new CustomEvent(EventTypes.Store.Global.getEnv, {
        bubbles: true,
        cancelable: true,
        composed: true,
        detail: {
          result: undefined,
        },
      });
      target.dispatchEvent(e);
      return (e.detail.result as unknown) as Promise<IConfigEnvironment>;
    },
  }),
  Auth: Object.freeze({
    /**
     * Checks whether the user is authenticated in the store for the environment
     * @returns True if the user is authenticated in the store.
     */
    isAuthenticated: async (target: EventTarget=document.body): Promise<boolean> => {
      const e = new CustomEvent(EventTypes.Store.Auth.isAuthenticated, {
        bubbles: true,
        cancelable: true,
        composed: true,
        detail: {
          result: undefined,
        },
      });
      target.dispatchEvent(e);
      return ((e.detail.result as unknown) as Promise<boolean>);
    },
    /**
     * Authenticates the current environment, if needed.
     * 
     * @param update Whether to update the stored environment configuration when the token was renewed.
     * @param env Optional environment to authenticated if different than default
     * @param force Whether to force authentication.
     * @param target Optional events target.
     * @returns The session information.
     */
    authenticate: async (update?: boolean, env?: IConfigEnvironment, force?: boolean, target: EventTarget=document.body): Promise<ISessionInitInfo> => {
      const e = new CustomEvent(EventTypes.Store.Auth.authenticate, {
        bubbles: true,
        cancelable: true,
        composed: true,
        detail: {
          update,
          env,
          force,
          result: undefined,
        },
      });
      target.dispatchEvent(e);
      return ((e.detail.result as unknown) as Promise<ISessionInitInfo>);
    },
    /**
     * Reads the store access token in use, if any.
     * Note, this does not perform authentication. The user has to be already authenticated.
     * 
     * @param target Optional events target.
     * @returns The current access token value to use in the store or undefined if none is in use, or the event is not handled.
     */
    getToken: async (target: EventTarget=document.body): Promise<string | undefined> => {
      const e = new CustomEvent(EventTypes.Store.Auth.getToken, {
        bubbles: true,
        cancelable: true,
        composed: true,
        detail: {
          result: undefined,
        },
      });
      target.dispatchEvent(e);
      return ((e.detail.result as unknown) as Promise<string | undefined>);
    },
  }),
  File: Object.freeze({
    /**
     * Lists files (spaces, projects, etc) in the store.
     * 
     * @param kinds the list of kinds to list. Spaces are always included.
     * @param options Optional query options.
     */
    list: async (kinds?: ListFileKind[], options?: IListOptions, target: EventTarget=document.body): Promise<IListResponse<IFile>> =>  {
      const e = new CustomEvent(EventTypes.Store.File.list, {
        bubbles: true,
        cancelable: true,
        composed: true,
        detail: {
          kinds,
          options,
          result: undefined,
        },
      });
      target.dispatchEvent(e);
      return ((e.detail.result as unknown) as Promise<IListResponse<IFile>>);
    },
    /**
     * Lists files that are shared with the user.
     * 
     * @param kinds the list of kinds to list. Spaces are always included.
     * @param options Optional query options.
     */
    listShared: async (kinds?: ListFileKind[], options?: IListOptions, target: EventTarget=document.body): Promise<IListResponse<IFile>> =>  {
      const e = new CustomEvent(EventTypes.Store.File.listShared, {
        bubbles: true,
        cancelable: true,
        composed: true,
        detail: {
          kinds,
          options,
          result: undefined,
        },
      });
      target.dispatchEvent(e);
      return ((e.detail.result as unknown) as Promise<IListResponse<IFile>>);
    },
    /**
     * Creates a file in the store.
     * 
     * @param meta The definition of a file that extends the IFile interface.
     * @param media The file content to create with the file meta, if available.
     * @param opts Optional options when creating a file
     * @returns The key of the creates file.
     */
    create: async (meta: IFile, media?: unknown, opts?: IFileCreateOptions, target: EventTarget=document.body): Promise<string> => {
      const e = new CustomEvent(EventTypes.Store.File.create, {
        bubbles: true,
        cancelable: true,
        composed: true,
        detail: {
          meta,
          media,
          opts,
          result: undefined,
        },
      });
      target.dispatchEvent(e);
      return ((e.detail.result as unknown) as Promise<string>);
    },
    /**
     * A special case of a create file flow.
     * It allow to create a file only from a name and its kind.
     * The store has logic to recognize the file from its `kind` and create a file.
     * 
     * This is helpful when creating a new file from the "create" dialog.
     * 
     * @param name The name provided by the user.
     * @param kind File kind.
     * @param opts Optional options when creating a file
     * @returns The key of the creates file.
     */
    createDefault: async (name: string, kind: string, opts?: IFileCreateOptions, target: EventTarget=document.body): Promise<string> => {
      const e = new CustomEvent(EventTypes.Store.File.createDefault, {
        bubbles: true,
        cancelable: true,
        composed: true,
        detail: {
          name,
          kind,
          opts,
          result: undefined,
        },
      });
      target.dispatchEvent(e);
      return ((e.detail.result as unknown) as Promise<string>);
    },
    read: fileRead,
    patch: patchFile,
    /**
     * Deletes the file in the store.
     * 
     * @param key The key of the file to delete.
     */
    delete: async (key: string, target: EventTarget=document.body): Promise<void> => {
      const e = new CustomEvent(EventTypes.Store.File.delete, {
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
    /**
     * Updates the sharing options of the file.
     * 
     * @param key The file key
     * @param id The generated by the client random id. This id is reported back by the server.
     * @param value The patch operation on the file's ACL
     */
    patchUsers: async (key: string, id: string, value: AccessOperation[], app: IApplication, target: EventTarget=document.body): Promise<void> => {
      const e = new CustomEvent(EventTypes.Store.File.patchUsers, {
        bubbles: true,
        cancelable: true,
        composed: true,
        detail: {
          key,
          value,
          id,
          app,
          result: undefined,
        },
      });
      target.dispatchEvent(e);
      await ((e.detail.result as unknown) as Promise<void>);
    },
    /**
     * Lists the users that have direct permission to the file.
     * 
     * @param key The file key
     */
    listUsers: async (key: string, target: EventTarget=document.body): Promise<IListResponse<IUser>> => {
      const e = new CustomEvent(EventTypes.Store.File.listUsers, {
        bubbles: true,
        cancelable: true,
        composed: true,
        detail: {
          key,
          result: undefined,
        },
      });
      target.dispatchEvent(e);
      return ((e.detail.result as unknown) as Promise<IListResponse<IUser>>);
    },
    /**
     * Creates a WS client that listens to the files events.
     * After the observer is set up then the store binding start
     * dispatching state events.
     * 
     * Subsequent calls to create a socket will do nothing.
     */
    observeFiles: async (target: EventTarget=document.body): Promise<void> => {
      const e = new CustomEvent(EventTypes.Store.File.observeFiles, {
        bubbles: true,
        cancelable: true,
        composed: true,
        detail: {
          result: undefined,
        },
      });
      target.dispatchEvent(e);
      await ((e.detail.result as unknown) as Promise<void>);
    },
    /**
     * Closes previously opened files socket.
     * Does nothing when the socket is not opened.
     */
    unobserveFiles: async (target: EventTarget=document.body): Promise<void> => {
      const e = new CustomEvent(EventTypes.Store.File.unobserveFiles, {
        bubbles: true,
        cancelable: true,
        composed: true,
        detail: {
          result: undefined,
        },
      });
      target.dispatchEvent(e);
      await ((e.detail.result as unknown) as Promise<void>);
    },
    /**
     * Creates a WS client that listens to the file change events.
     * After the observer is set up then the store binding start
     * dispatching state events.
     * 
     * Subsequent calls to create a socket will do nothing.
     * 
     * @param key The file key to observe
     */
    observeFile: async (key: string, alt: 'media' | 'meta' = 'meta', target: EventTarget=document.body): Promise<void> => {
      const e = new CustomEvent(EventTypes.Store.File.observeFile, {
        bubbles: true,
        cancelable: true,
        composed: true,
        detail: {
          key,
          alt,
          result: undefined,
        },
      });
      target.dispatchEvent(e);
      await ((e.detail.result as unknown) as Promise<void>);
    },
    /**
     * Closes previously opened file observer.
     * Does nothing when the socket is not opened.
     * 
     * @param key The file key to unobserve
     */
    unobserveFile: async (key: string, alt: 'media' | 'meta' = 'meta', target: EventTarget=document.body): Promise<void> => {
      const e = new CustomEvent(EventTypes.Store.File.unobserveFile, {
        bubbles: true,
        cancelable: true,
        composed: true,
        detail: {
          key,
          alt,
          result: undefined,
        },
      });
      target.dispatchEvent(e);
      await ((e.detail.result as unknown) as Promise<void>);
    },
    State: Object.freeze({
      /**
       * Informs the application about a change in a user file when the target is a collection.
       */
      change: (event: IBackendEvent, target: EventTarget=document.body): void => {
        const e = new CustomEvent(EventTypes.Store.File.State.change, {
          bubbles: true,
          cancelable: true,
          composed: true,
          detail: event,
        });
        target.dispatchEvent(e);
      },
      /**
       * Informs the application about a change in a user file.
       */
      fileChange: (event: IBackendEvent, target: EventTarget=document.body): void => {
        const e = new CustomEvent(EventTypes.Store.File.State.fileChange, {
          bubbles: true,
          cancelable: true,
          composed: true,
          detail: event,
        });
        target.dispatchEvent(e);
      },
    }),
  }),
  /**
   * Reads the current user.
   */
  User: Object.freeze({
    me: async (target: EventTarget=document.body): Promise<IUser> => {
      const e = new CustomEvent(EventTypes.Store.User.me, {
        bubbles: true,
        cancelable: true,
        composed: true,
        detail: {
          result: undefined,
        },
      });
      target.dispatchEvent(e);
      return ((e.detail.result as unknown) as Promise<IUser>);
    },
    list: async (options?: IListOptions, target: EventTarget=document.body): Promise<IListResponse<IUser>> => {
      const e = new CustomEvent(EventTypes.Store.User.list, {
        bubbles: true,
        cancelable: true,
        composed: true,
        detail: {
          options,
          result: undefined,
        },
      });
      target.dispatchEvent(e);
      return ((e.detail.result as unknown) as Promise<IListResponse<IUser>>);
    },
  }),
  History: Object.freeze({
    create: async (history: IHttpHistory, target: EventTarget=document.body): Promise<string> => {
      const e = new CustomEvent(EventTypes.Store.History.create, {
        bubbles: true,
        cancelable: true,
        composed: true,
        detail: {
          history,
          result: undefined,
        },
      });
      target.dispatchEvent(e);
      return ((e.detail.result as unknown) as Promise<string>);
    },
    createBulk: async (info: IHttpHistoryBulkAdd, target: EventTarget=document.body): Promise<string[]> => {
      const e = new CustomEvent(EventTypes.Store.History.createBulk, {
        bubbles: true,
        cancelable: true,
        composed: true,
        detail: {
          info,
          result: undefined,
        },
      });
      target.dispatchEvent(e);
      return ((e.detail.result as unknown) as Promise<string[]>);
    },
    list: async (init: HistoryListOptions, target: EventTarget=document.body): Promise<IListResponse<IHttpHistory>> => {
      const e = new CustomEvent(EventTypes.Store.History.list, {
        bubbles: true,
        cancelable: true,
        composed: true,
        detail: {
          init,
          result: undefined,
        },
      });
      target.dispatchEvent(e);
      return ((e.detail.result as unknown) as Promise<IListResponse<IHttpHistory>>);
    },
    delete: async (key: string | string[], target: EventTarget=document.body): Promise<void> => {
      const e = new CustomEvent(EventTypes.Store.History.delete, {
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
    read: async (key: string, target: EventTarget=document.body): Promise<IHttpHistory> => {
      const e = new CustomEvent(EventTypes.Store.History.read, {
        bubbles: true,
        cancelable: true,
        composed: true,
        detail: {
          key,
          result: undefined,
        },
      });
      target.dispatchEvent(e);
      return ((e.detail.result as unknown) as Promise<IHttpHistory>);
    },
  }),
  App: Object.freeze({
    Project: Object.freeze({
      /**
       * Creates multiple projects in the net-store.
       * 
       * @param values The projects to create.
       * @param app Optional app to use with the store. By default it uses appId used to initialized the bindings.
       */
      createBulk: async (values: IAppProject[], app?: IApplication, target: EventTarget=document.body): Promise<IBatchUpdateResult<IAppProject>> => {
        const e = new CustomEvent(EventTypes.Store.App.Project.createBulk, {
          bubbles: true,
          cancelable: true,
          composed: true,
          detail: {
            values,
            app,
            result: undefined,
          },
        });
        target.dispatchEvent(e);
        return ((e.detail.result as unknown) as Promise<IBatchUpdateResult<IAppProject>>);
      },
      /**
       * Deletes multiple projects from the net-store.
       * 
       * @param keys The keys of projects to delete.
       * @param app Optional app to use with the store. By default it uses appId used to initialized the bindings.
       */
      deleteBulk: async (keys: string[], app?: IApplication, target: EventTarget=document.body): Promise<IBatchDeleteResult> => {
        const e = new CustomEvent(EventTypes.Store.App.Project.deleteBulk, {
          bubbles: true,
          cancelable: true,
          composed: true,
          detail: {
            keys,
            app,
            result: undefined,
          },
        });
        target.dispatchEvent(e);
        return ((e.detail.result as unknown) as Promise<IBatchDeleteResult>);
      },
      /**
       * Restores multiple projects in the net-store.
       * 
       * @param keys The keys of projects to delete.
       * @param app Optional app to use with the store. By default it uses appId used to initialized the bindings.
       */
      undeleteBulk: async (keys: string[], app?: IApplication, target: EventTarget=document.body): Promise<IRevertResponse<IAppProject>> => {
        const e = new CustomEvent(EventTypes.Store.App.Project.undeleteBulk, {
          bubbles: true,
          cancelable: true,
          composed: true,
          detail: {
            keys,
            app,
            result: undefined,
          },
        });
        target.dispatchEvent(e);
        return ((e.detail.result as unknown) as Promise<IRevertResponse<IAppProject>>);
      },
      /**
       * Patches a project in the store.
       * 
       * @param key The key of the project to patch.
       * @param id Generated patch id used to recognize own patches.
       * @param value The patch info.
       * @param app Optional app to use with the store. By default it uses appId used to initialized the bindings.
       */
      patch: async (key: string, id: string, value: Patch.JsonPatch, app?: IApplication, target: EventTarget=document.body): Promise<IPatchRevision> => {
        const e = new CustomEvent(EventTypes.Store.App.Project.patch, {
          bubbles: true,
          cancelable: true,
          composed: true,
          detail: {
            key,
            value,
            app,
            id,
            result: undefined,
          },
        });
        target.dispatchEvent(e);
        return ((e.detail.result as unknown) as Promise<IPatchRevision>);
      },

      list: async (options?: IListOptions, app?: IApplication, target: EventTarget=document.body): Promise<IListResponse<IAppProject>> =>  {
        const e = new CustomEvent(EventTypes.Store.App.Project.list, {
          bubbles: true,
          cancelable: true,
          composed: true,
          detail: {
            options,
            app,
            result: undefined,
          },
        });
        target.dispatchEvent(e);
        return ((e.detail.result as unknown) as Promise<IListResponse<IAppProject>>);
      },
    }),
    Request: Object.freeze({
      /**
       * Creates multiple requests in the net-store.
       * 
       * @param values The requests to create.
       * @param app Optional app to use with the store. By default it uses appId used to initialized the bindings.
       */
      createBulk: async (values: IAppRequest[], app?: IApplication, target: EventTarget=document.body): Promise<IBatchUpdateResult<IAppRequest>> => {
        const e = new CustomEvent(EventTypes.Store.App.Request.createBulk, {
          bubbles: true,
          cancelable: true,
          composed: true,
          detail: {
            values,
            app,
            result: undefined,
          },
        });
        target.dispatchEvent(e);
        return ((e.detail.result as unknown) as Promise<IBatchUpdateResult<IAppRequest>>);
      },
      /**
       * Deletes multiple requests from the net-store.
       * 
       * @param keys The keys of requests to delete.
       * @param app Optional app to use with the store. By default it uses appId used to initialized the bindings.
       */
      deleteBulk: async (keys: string[], app?: IApplication, target: EventTarget=document.body): Promise<IBatchDeleteResult> => {
        const e = new CustomEvent(EventTypes.Store.App.Request.deleteBulk, {
          bubbles: true,
          cancelable: true,
          composed: true,
          detail: {
            keys,
            app,
            result: undefined,
          },
        });
        target.dispatchEvent(e);
        return ((e.detail.result as unknown) as Promise<IBatchDeleteResult>);
      },
      /**
       * Restores multiple requests in the net-store.
       * 
       * @param keys The keys of requests to restore.
       * @param app Optional app to use with the store. By default it uses appId used to initialized the bindings.
       */
      undeleteBulk: async (keys: string[], app?: IApplication, target: EventTarget=document.body): Promise<IRevertResponse<IAppRequest>> => {
        const e = new CustomEvent(EventTypes.Store.App.Request.undeleteBulk, {
          bubbles: true,
          cancelable: true,
          composed: true,
          detail: {
            keys,
            app,
            result: undefined,
          },
        });
        target.dispatchEvent(e);
        return ((e.detail.result as unknown) as Promise<IRevertResponse<IAppRequest>>);
      },
      /**
       * Patches a request in the store.
       * 
       * @param key The key of the request to patch.
       * @param id Generated patch id used to recognize own patches.
       * @param value The patch info.
       * @param app Optional app to use with the store. By default it uses appId used to initialized the bindings.
       */
      patch: async (key: string, id: string, value: Patch.JsonPatch, app?: IApplication, target: EventTarget=document.body): Promise<IPatchRevision> => {
        const e = new CustomEvent(EventTypes.Store.App.Request.patch, {
          bubbles: true,
          cancelable: true,
          composed: true,
          detail: {
            key,
            id,
            value,
            app,
            result: undefined,
          },
        });
        target.dispatchEvent(e);
        return ((e.detail.result as unknown) as Promise<IPatchRevision>);
      },

      list: async (options?: IListOptions, app?: IApplication, target: EventTarget=document.body): Promise<IListResponse<IAppRequest>> =>  {
        const e = new CustomEvent(EventTypes.Store.App.Request.list, {
          bubbles: true,
          cancelable: true,
          composed: true,
          detail: {
            options,
            app,
            result: undefined,
          },
        });
        target.dispatchEvent(e);
        return ((e.detail.result as unknown) as Promise<IListResponse<IAppRequest>>);
      },
    }),
  }),
});
