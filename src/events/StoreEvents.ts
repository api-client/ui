/* eslint-disable no-redeclare */
import { 
  IBackendInfo, IListOptions, WorkspaceKind, ProjectKind, IListResponse, IFile, IFileCreateOptions,
  IHttpProject, AccessOperation, IBackendEvent, IUser, IPatchRevision,
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
function patchFile(key: string, id: string, value: Patch.JsonPatch, media: false, target?: EventTarget): Promise<IPatchRevision>;

/**
 * Patches file's content in the store.
 * 
 * @param key The file key
 * @param value The patch to apply.
 */
function patchFile(key: string, id: string, value: Patch.JsonPatch, media: true, target?: EventTarget): Promise<IPatchRevision>;

/**
 * Patches a file in the store.
 * @param key The key of the file to patch
 * @param value The JSON patch to be processed.
 * @returns The JSON patch to revert the change using the `@api-client/json` library
 */
function patchFile(key: string, id: string, value: Patch.JsonPatch, media?: boolean, target: EventTarget=document.body): Promise<IPatchRevision> {
  const e = new CustomEvent(EventTypes.Store.File.patch, {
    bubbles: true,
    cancelable: true,
    composed: true,
    detail: {
      key,
      value,
      media,
      id,
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
    }
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
  }),
  File: Object.freeze({
    /**
     * Lists files (spaces, projects, etc) in the store.
     * 
     * @param kinds the list of kinds to list. Spaces are always included.
     * @param options Optional query options.
     */
    list: async (kinds: (typeof ProjectKind | typeof WorkspaceKind)[], options?: IListOptions, target: EventTarget=document.body): Promise<IListResponse<IFile>> =>  {
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
    listShared: async (kinds: (typeof ProjectKind | typeof WorkspaceKind)[], options?: IListOptions, target: EventTarget=document.body): Promise<IListResponse<IFile>> =>  {
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
     * @param file The definition of a file that extends the IFile interface or one of the supported by the server schemas.
     * @param opts Optional options when creating a file
     * @returns The key of the creates file.
     */
    create: async (file: IFile | IHttpProject, opts?: IFileCreateOptions, target: EventTarget=document.body): Promise<string> => {
      const e = new CustomEvent(EventTypes.Store.File.create, {
        bubbles: true,
        cancelable: true,
        composed: true,
        detail: {
          file,
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
    patchUsers: async (key: string, id: string, value: AccessOperation[], target: EventTarget=document.body): Promise<void> => {
      const e = new CustomEvent(EventTypes.Store.File.patchUsers, {
        bubbles: true,
        cancelable: true,
        composed: true,
        detail: {
          key,
          value,
          id,
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
       * Informs the application about a change in a user file.
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
});
