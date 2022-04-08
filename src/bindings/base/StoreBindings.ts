/* eslint-disable no-dupe-class-members */
import { 
  IBackendInfo, ProjectKind, WorkspaceKind, IListOptions, IListResponse, IFile,
  IHttpProject, ISpaceCreateOptions, AccessOperation, IUser, IBackendEvent,
  Workspace, HttpProject
} from '@api-client/core/build/browser.js';
import { Patch } from '@api-client/json';
import { PlatformBindings } from './PlatformBindings.js';
import { Events } from '../../events/Events.js';
import { EventTypes } from '../../events/EventTypes.js';
import { IConfigInit } from '../../events/StoreEvents.js';
import { IConfigEnvironment } from '../../lib/config/Config.js';
import { ISessionInitInfo, HttpStore } from '../../store/HttpStore.js';

/**
 * The base class for API store bindings.
 */
export abstract class StoreBindings extends PlatformBindings {
  /**
   * The currently used environment for all store calls.
   * This can be changed via the `Events.Global.setEnv()`
   */
  globalEnvironment?: IConfigEnvironment;

  /**
   * Initialized with the `globalEnvironment`.
   * The store with initialized SDK for the global environment
   */
  store?: HttpStore;

  /**
   * Set after requesting to observe the files.
   */
  filesSocket?: WebSocket;

  async initialize(): Promise<void> {
    window.addEventListener(EventTypes.Store.initEnvironment, this.initEnvHandler.bind(this));
    window.addEventListener(EventTypes.Store.info, this.storeInfoHandler.bind(this));
    window.addEventListener(EventTypes.Store.Global.setEnv, this.setGlobalEnvHandler.bind(this));
    
    // Auth
    window.addEventListener(EventTypes.Store.Auth.authenticate, this.storeAuthHandler.bind(this));
    window.addEventListener(EventTypes.Store.Auth.isAuthenticated, this.storeIsAuthenticatedHandler.bind(this));

    // Files
    window.addEventListener(EventTypes.Store.File.list, this.fileListHandler.bind(this));
    window.addEventListener(EventTypes.Store.File.create, this.fileCreateHandler.bind(this));
    window.addEventListener(EventTypes.Store.File.createDefault, this.fileCreateDefaultHandler.bind(this));
    window.addEventListener(EventTypes.Store.File.read, this.fileReadHandler.bind(this));
    window.addEventListener(EventTypes.Store.File.patch, this.filePatchHandler.bind(this));
    window.addEventListener(EventTypes.Store.File.delete, this.fileDeleteHandler.bind(this));
    window.addEventListener(EventTypes.Store.File.patchUsers, this.filePatchUserHandler.bind(this));
    window.addEventListener(EventTypes.Store.File.observeFiles, this.filesObserveHandler.bind(this));
    window.addEventListener(EventTypes.Store.File.unobserveFiles, this.filesUnobserveHandler.bind(this));

    // User
    window.addEventListener(EventTypes.Store.User.me, this.userMeHandler.bind(this));
  }

  protected initEnvHandler(input: Event): void {
    const e = input as CustomEvent;
    e.preventDefault();
    this.initStoreEnvironment(e.detail);
  }

  protected storeInfoHandler(input: Event): void {
    const e = input as CustomEvent;
    e.preventDefault();
    e.detail.result = this.readStoreInfo(e.detail.baseUri);
  }

  protected storeAuthHandler(input: Event): void {
    const e = input as CustomEvent;
    e.preventDefault();
    e.detail.result = this.authenticateStore(e.detail.update);
  }

  protected setGlobalEnvHandler(input: Event): void {
    const e = input as CustomEvent;
    e.preventDefault();
    e.detail.result = this.setGlobalEnvironment(e.detail.env);
  }

  protected storeIsAuthenticatedHandler(input: Event): void {
    const e = input as CustomEvent;
    e.preventDefault();
    e.detail.result = this.isAuthenticated(e.detail.env);
  }

  protected fileListHandler(input: Event): void {
    const e = input as CustomEvent;
    e.preventDefault();
    e.detail.result = this.listFiles(e.detail.kinds, e.detail.options);
  }

  protected fileCreateHandler(input: Event): void {
    const e = input as CustomEvent;
    e.preventDefault();
    e.detail.result = this.createFile(e.detail.file, e.detail.opts);
  }

  protected fileCreateDefaultHandler(input: Event): void {
    const e = input as CustomEvent;
    e.preventDefault();
    e.detail.result = this.createDefaultFile(e.detail.name, e.detail.kind, e.detail.opts);
  }

  protected fileReadHandler(input: Event): void {
    const e = input as CustomEvent;
    e.preventDefault();
    e.detail.result = this.readFile(e.detail.key, e.detail.media);
  }

  protected filePatchHandler(input: Event): void {
    const e = input as CustomEvent;
    e.preventDefault();
    e.detail.result = this.patchFile(e.detail.key, e.detail.value, e.detail.media);
  }

  protected fileDeleteHandler(input: Event): void {
    const e = input as CustomEvent;
    e.preventDefault();
    e.detail.result = this.deleteFile(e.detail.key);
  }

  protected filePatchUserHandler(input: Event): void {
    const e = input as CustomEvent;
    e.preventDefault();
    e.detail.result = this.patchFileUsers(e.detail.key, e.detail.value);
  }

  protected filesObserveHandler(input: Event): void {
    const e = input as CustomEvent;
    e.preventDefault();
    e.detail.result = this.observeFiles();
  }

  protected filesUnobserveHandler(input: Event): void {
    const e = input as CustomEvent;
    e.preventDefault();
    e.detail.result = this.unobserveFiles();
  }

  protected userMeHandler(input: Event): void {
    const e = input as CustomEvent;
    e.preventDefault();
    e.detail.result = this.userMe();
  }

  /**
   * Sets the store environment to be used globally by the application.
   * This initializes the store with the configuration.
   * 
   * Note, this won't initialize the session with the store.
   * 
   * @param env The environment to set. Note, it must have the `location` set.
   */
  async setGlobalEnvironment(env: IConfigEnvironment): Promise<void> {
    if (!env.location) {
      throw new Error(`The location is required for store environment configuration.`);
    }
    this.globalEnvironment = env;
    const store = new HttpStore(env);
    this.store = store;
  }

  /**
   * Checks whether the user is authenticated in the store for the environment
   * @param env Optional environment if different than the global environment
   * @returns True if the user is authenticated in the store.
   */
  async isAuthenticated(env?: IConfigEnvironment): Promise<boolean> {
    let { store } = this;
    if (!store && env) {
      store = new HttpStore(env);
    }
    if (!store) {
      throw new Error(`Environment is not set.`);
    }
    return store.isAuthenticated(env);
  }

  /**
   * Authenticates the global environment with the store.
   * 
   * @param updateEnvironment When true it stores the environment data when the session was renewed.
   */
  async authenticateStore(updateEnvironment = true): Promise<ISessionInitInfo> {
    const { store } = this;
    if (!store) {
      throw new Error(`Environment is not set.`);
    }
    const result = await store.getStoreSessionToken();
    if (updateEnvironment && result.new) {
      await Events.Config.Environment.update(this.globalEnvironment!);
    }
    return result;
  }

  /**
   * Initializes the store configuration from the init data.
   * 
   * @param init The init data for the store environment.
   */
  abstract initStoreEnvironment(init: IConfigInit): Promise<void>;

  /**
   * Reads the backend information about the store.
   * 
   * @param baseUri Store's base URI.
   */
  abstract readStoreInfo(baseUri: string): Promise<IBackendInfo>;

  /**
   * Lists files (spaces, projects, etc) in the store.
   * 
   * @param kinds the list of kinds to list. Spaces are always included.
   * @param options Optional query options.
   */
  async listFiles(kinds: (typeof ProjectKind | typeof WorkspaceKind)[], options?: IListOptions): Promise<IListResponse<IFile>> {
    const { store } = this;
    if (!store) {
      throw new Error(`Environment is not set.`);
    }
    return store.sdk.file.list(kinds, options);
  }

  /**
   * Creates a file in the store.
   * 
   * @param file The definition of a file that extends the IFile interface or one of the supported by the server schemas.
   * @param opts Optional options when creating a file
   * @returns The key of the creates file.
   */
  async createFile(file: IFile | IHttpProject, opts?: ISpaceCreateOptions): Promise<string> {
    const { store } = this;
    if (!store) {
      throw new Error(`Environment is not set.`);
    }
    return store.sdk.file.create(file, opts);
  }

  /**
   * A logic that creates an empty (default) file from its name and the file kind.
   * 
   * @param name The name of the file.
   * @param kind The kind of the file.
   * @param opts Optional create options
   * @returns The key of the created file.
   */
  async createDefaultFile(name: string, kind: string, opts?: ISpaceCreateOptions): Promise<string> {
    switch (kind) {
      case ProjectKind: return this.createDefaultProject(name, opts);
      case WorkspaceKind: return this.createDefaultWorkspace(name, opts);
      default: 
        throw new Error(`Unrecognized file kind: ${kind}`);
    }
  }

  /**
   * Creates a default HttpProject from a name
   * 
   * @param name The name of the project
   * @param opts Create options.
   * @returns The key of the created file.
   */
  async createDefaultProject(name: string, opts?: ISpaceCreateOptions): Promise<string> {
    const { store } = this;
    if (!store) {
      throw new Error(`Environment is not set.`);
    }
    const media = HttpProject.fromName(name);
    return store.sdk.file.create(media.toJSON(), opts);
  }

  /**
   * Creates a default Workspace from a name
   * 
   * @param name The name of the space
   * @param opts Create options.
   * @returns The key of the created file.
   */
  async createDefaultWorkspace(name: string, opts?: ISpaceCreateOptions): Promise<string> {
    const { store } = this;
    if (!store) {
      throw new Error(`Environment is not set.`);
    }
    const space = Workspace.fromName(name);
    return store.sdk.file.create(space.toJSON(), opts);
  }

  /**
   * Reads file metadata from the store.
   * 
   * @param key The file key
   * @returns The file metadata
   */
  readFile(key: string, media: false): Promise<IFile>;

  /**
   * Reads file contents from the store.
   * 
   * @param key The file key
   * @returns The file contents
   */
  readFile(key: string, media: true): Promise<unknown>;

  /**
   * Reads a user file definition from the store.
   * @param key The file key
   * @param media When true it reads file contents rather than metadata.
   */
  async readFile(key: string, media: boolean): Promise<IFile | unknown> {
    const { store } = this;
    if (!store) {
      throw new Error(`Environment is not set.`);
    }
    // @ts-ignore
    return store.sdk.file.read(key, media);
  }

  /**
   * Patches file's meta in the store.
   * 
   * @param key The file key
   * @param value The patch to apply.
   */
  patchFile(key: string, value: Patch.JsonPatch, media: false): Promise<Patch.JsonPatch>;

  /**
   * Patches file's content in the store.
   * 
   * @param key The file key
   * @param value The patch to apply.
   */
  patchFile(key: string, value: Patch.JsonPatch, media: true): Promise<Patch.JsonPatch>;

  /**
   * Patches a file in the store.
   * @param key The key of the file to patch
   * @param value The JSON patch to be processed.
   * @returns The JSON patch to revert the change using the `@api-client/json` library
   */
  async patchFile(key: string, value: Patch.JsonPatch, media?: boolean): Promise<Patch.JsonPatch> {
    const { store } = this;
    if (!store) {
      throw new Error(`Environment is not set.`);
    }
    // @ts-ignore
    return store.sdk.file.patch(key, value, media);
  }

  /**
   * Deletes the file in the store.
   * 
   * @param key The key of the file to delete.
   */
  async deleteFile(key: string): Promise<void> {
    const { store } = this;
    if (!store) {
      throw new Error(`Environment is not set.`);
    }
    return store.sdk.file.delete(key);
  }

  /**
   * Updates the sharing options of the file.
   * 
   * @param key The file key
   * @param value The patch operation on the file's ACL
   */
  async patchFileUsers(key: string, value: AccessOperation[]): Promise<void> {
    const { store } = this;
    if (!store) {
      throw new Error(`Environment is not set.`);
    }
    return store.sdk.file.patchUsers(key, value);
  }

  /**
   * Lists uses having access to the file.
   * 
   * @param key The file key
   */
  async listFileUsers(key: string): Promise<IListResponse<IUser>> {
    const { store } = this;
    if (!store) {
      throw new Error(`Environment is not set.`);
    }
    return store.sdk.file.listUsers(key);
  }

  /**
   * Creates a WS client that listens to the files events.
   * After the observer is set up then the store binding start
   * dispatching state events.
   * 
   * Subsequent calls to create a socket will return the existing socket.
   */
  async observeFiles(): Promise<WebSocket> {
    if (this.filesSocket && this.filesSocket.readyState === WebSocket.OPEN) {
      return this.filesSocket;
    }
    const { store } = this;
    if (!store) {
      throw new Error(`Environment is not set.`);
    }
    const socket = await store.sdk.file.observeFiles() as WebSocket;
    this.filesSocket = socket;
    socket.addEventListener('message', this._fileMetaHandler.bind(this));
    return socket;
  }

  /**
   * Closes previously opened files socket.
   * Does nothing when the socket is not opened.
   */
  async unobserveFiles(): Promise<void> {
    const { filesSocket } = this;
    if (!filesSocket) {
      return;
    }
    this.filesSocket = undefined;
    if (filesSocket.readyState !== WebSocket.CLOSED) {
      filesSocket.close();
    }
  }

  protected _fileMetaHandler(e: MessageEvent): void {
    const event = JSON.parse(e.data) as IBackendEvent;
    if (event.type !== 'event') {
      return;
    }
    Events.Store.File.State.change(event);
  }

  /**
   * Reads the current user.
   */
  async userMe(): Promise<IUser> {
    const { store } = this;
    if (!store) {
      throw new Error(`Environment is not set.`);
    }
    return store.sdk.user.me();
  }
}
