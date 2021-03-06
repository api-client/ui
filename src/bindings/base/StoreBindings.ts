/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable no-dupe-class-members */
import { 
  IBackendInfo, ProjectKind, WorkspaceKind, DataFileKind, IListOptions, IListResponse, IFile,
  IFileCreateOptions, AccessOperation, IUser, IBackendEvent,
  Workspace, HttpProject, IAccessPatchInfo, IPatchInfo, IPatchRevision, IApplication, 
  IHttpHistory, IHttpHistoryBulkAdd, HistoryListOptions, Project, ListFileKind, DataNamespace, DataFile, 
  IBatchUpdateResult, IAppProject, IBatchDeleteResult, IRevertResponse, IAppRequest
} from '@api-client/core/build/browser.js';
import { Patch } from '@api-client/json';
import { PlatformBindings } from './PlatformBindings.js';
import { Events } from '../../events/Events.js';
import { EventTypes } from '../../events/EventTypes.js';
import { IConfigEnvironment, IConfigInit } from '../../lib/config/Config.js';
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

  fileSockets = new Map<string, WebSocket>();

  async initialize(): Promise<void> {
    window.addEventListener(EventTypes.Store.initEnvironment, this.initEnvHandler.bind(this));
    window.addEventListener(EventTypes.Store.info, this.storeInfoHandler.bind(this));
    window.addEventListener(EventTypes.Store.Global.setEnv, this.setGlobalEnvHandler.bind(this));
    window.addEventListener(EventTypes.Store.Global.getEnv, this.getGlobalEnvHandler.bind(this));
    
    // Auth
    window.addEventListener(EventTypes.Store.Auth.authenticate, this.storeAuthHandler.bind(this));
    window.addEventListener(EventTypes.Store.Auth.isAuthenticated, this.storeIsAuthenticatedHandler.bind(this));
    window.addEventListener(EventTypes.Store.Auth.getToken, this.getTokenHandler.bind(this));

    // Files
    window.addEventListener(EventTypes.Store.File.list, this.fileListHandler.bind(this));
    window.addEventListener(EventTypes.Store.File.listShared, this.fileListSharedHandler.bind(this));
    window.addEventListener(EventTypes.Store.File.create, this.fileCreateHandler.bind(this));
    window.addEventListener(EventTypes.Store.File.createDefault, this.fileCreateDefaultHandler.bind(this));
    window.addEventListener(EventTypes.Store.File.read, this.fileReadHandler.bind(this));
    window.addEventListener(EventTypes.Store.File.patch, this.filePatchHandler.bind(this));
    window.addEventListener(EventTypes.Store.File.delete, this.fileDeleteHandler.bind(this));
    window.addEventListener(EventTypes.Store.File.patchUsers, this.filePatchUserHandler.bind(this));
    window.addEventListener(EventTypes.Store.File.listUsers, this.fileListUserHandler.bind(this));
    window.addEventListener(EventTypes.Store.File.observeFiles, this.filesObserveHandler.bind(this));
    window.addEventListener(EventTypes.Store.File.unobserveFiles, this.filesUnobserveHandler.bind(this));
    window.addEventListener(EventTypes.Store.File.observeFile, this.fileObserveHandler.bind(this));
    window.addEventListener(EventTypes.Store.File.unobserveFile, this.fileUnobserveHandler.bind(this));

    // User
    window.addEventListener(EventTypes.Store.User.me, this.userMeHandler.bind(this));
    window.addEventListener(EventTypes.Store.User.list, this.listUsersHandler.bind(this));

    // history
    window.addEventListener(EventTypes.Store.History.create, this.historyCreateHandler.bind(this));
    window.addEventListener(EventTypes.Store.History.createBulk, this.historyCreateBulkHandler.bind(this));
    window.addEventListener(EventTypes.Store.History.delete, this.historyDeleteHandler.bind(this));
    window.addEventListener(EventTypes.Store.History.list, this.historyListHandler.bind(this));
    window.addEventListener(EventTypes.Store.History.read, this.historyReadHandler.bind(this));

    // app requests
    window.addEventListener(EventTypes.Store.App.Request.createBulk, this.appRequestCreateHandler.bind(this));
    window.addEventListener(EventTypes.Store.App.Request.deleteBulk, this.appRequestDeleteHandler.bind(this));
    window.addEventListener(EventTypes.Store.App.Request.patch, this.appRequestPatchHandler.bind(this));
    window.addEventListener(EventTypes.Store.App.Request.undeleteBulk, this.appRequestUndeleteHandler.bind(this));
    window.addEventListener(EventTypes.Store.App.Request.list, this.appRequestListHandler.bind(this));

    // app projects
    window.addEventListener(EventTypes.Store.App.Project.createBulk, this.appProjectCreateHandler.bind(this));
    window.addEventListener(EventTypes.Store.App.Project.deleteBulk, this.appProjectDeleteHandler.bind(this));
    window.addEventListener(EventTypes.Store.App.Project.patch, this.appProjectPatchHandler.bind(this));
    window.addEventListener(EventTypes.Store.App.Project.undeleteBulk, this.appProjectUndeleteHandler.bind(this));
    window.addEventListener(EventTypes.Store.App.Project.list, this.appProjectListHandler.bind(this));
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
    e.detail.result = this.authenticateStore(e.detail.update, e.detail.env, e.detail.force);
  }

  protected setGlobalEnvHandler(input: Event): void {
    const e = input as CustomEvent;
    e.preventDefault();
    e.detail.result = this.setGlobalEnvironment(e.detail.env);
  }

  protected getGlobalEnvHandler(input: Event): void {
    const e = input as CustomEvent;
    e.preventDefault();
    e.detail.result = this.getGlobalEnvironment();
  }

  protected storeIsAuthenticatedHandler(input: Event): void {
    const e = input as CustomEvent;
    e.preventDefault();
    e.detail.result = this.isAuthenticated(e.detail.env);
  }

  protected getTokenHandler(input: Event): void {
    const e = input as CustomEvent;
    e.preventDefault();
    e.detail.result = this.getCurrentToken();
  }

  protected fileListHandler(input: Event): void {
    const e = input as CustomEvent;
    e.preventDefault();
    e.detail.result = this.listFiles(e.detail.kinds, e.detail.options);
  }

  protected fileListSharedHandler(input: Event): void {
    const e = input as CustomEvent;
    e.preventDefault();
    e.detail.result = this.listSharedFiles(e.detail.kinds, e.detail.options);
  }

  protected fileCreateHandler(input: Event): void {
    const e = input as CustomEvent;
    e.preventDefault();
    e.detail.result = this.createFile(e.detail.meta, e.detail.media, e.detail.opts);
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
    const { key, id, value, app, media } = e.detail;
    e.detail.result = this.patchFile(key, id, value, app, media);
  }

  protected fileDeleteHandler(input: Event): void {
    const e = input as CustomEvent;
    e.preventDefault();
    e.detail.result = this.deleteFile(e.detail.key);
  }

  protected filePatchUserHandler(input: Event): void {
    const e = input as CustomEvent;
    e.preventDefault();
    const { key, id, value, app } = e.detail;
    e.detail.result = this.patchFileUsers(key, id, value, app);
  }

  protected fileListUserHandler(input: Event): void {
    const e = input as CustomEvent;
    e.preventDefault();
    e.detail.result = this.listFileUsers(e.detail.key);
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

  protected fileObserveHandler(input: Event): void {
    const e = input as CustomEvent;
    e.preventDefault();
    e.detail.result = this.observeFile(e.detail.key, e.detail.alt);
  }

  protected fileUnobserveHandler(input: Event): void {
    const e = input as CustomEvent;
    e.preventDefault();
    e.detail.result = this.unobserveFile(e.detail.key, e.detail.alt);
  }

  protected userMeHandler(input: Event): void {
    const e = input as CustomEvent;
    e.preventDefault();
    e.detail.result = this.userMe();
  }

  protected listUsersHandler(input: Event): void {
    const e = input as CustomEvent;
    e.preventDefault();
    e.detail.result = this.listUsers(e.detail.options);
  }

  protected historyCreateHandler(input: Event): void {
    const e = input as CustomEvent;
    e.preventDefault();
    e.detail.result = this.historyCreate(e.detail.history);
  }

  protected historyCreateBulkHandler(input: Event): void {
    const e = input as CustomEvent;
    e.preventDefault();
    e.detail.result = this.historyCreateBulk(e.detail.info);
  }

  protected historyDeleteHandler(input: Event): void {
    const e = input as CustomEvent;
    e.preventDefault();
    e.detail.result = this.historyDelete(e.detail.key);
  }

  protected historyListHandler(input: Event): void {
    const e = input as CustomEvent;
    e.preventDefault();
    e.detail.result = this.historyList(e.detail.init);
  }

  protected historyReadHandler(input: Event): void {
    const e = input as CustomEvent;
    e.preventDefault();
    e.detail.result = this.historyRead(e.detail.key);
  }

  protected appRequestCreateHandler(input: Event): void {
    const e = input as CustomEvent;
    e.preventDefault();
    e.detail.result = this.appRequestCreateBulk(e.detail.values, e.detail.app);
  }

  protected appRequestDeleteHandler(input: Event): void {
    const e = input as CustomEvent;
    e.preventDefault();
    e.detail.result = this.appRequestDeleteBulk(e.detail.keys, e.detail.app);
  }

  protected appRequestUndeleteHandler(input: Event): void {
    const e = input as CustomEvent;
    e.preventDefault();
    e.detail.result = this.appRequestUndeleteBulk(e.detail.keys, e.detail.app);
  }

  protected appRequestListHandler(input: Event): void {
    const e = input as CustomEvent;
    e.preventDefault();
    e.detail.result = this.appRequestList(e.detail.options, e.detail.app);
  }

  protected appRequestPatchHandler(input: Event): void {
    const e = input as CustomEvent;
    e.preventDefault();
    e.detail.result = this.appRequestPatch(e.detail.key, e.detail.id, e.detail.value, e.detail.app);
  }

  protected appProjectCreateHandler(input: Event): void {
    const e = input as CustomEvent;
    e.preventDefault();
    e.detail.result = this.appProjectCreateBulk(e.detail.values, e.detail.app);
  }

  protected appProjectDeleteHandler(input: Event): void {
    const e = input as CustomEvent;
    e.preventDefault();
    e.detail.result = this.appProjectDeleteBulk(e.detail.keys, e.detail.app);
  }

  protected appProjectUndeleteHandler(input: Event): void {
    const e = input as CustomEvent;
    e.preventDefault();
    e.detail.result = this.appProjectUndeleteBulk(e.detail.keys, e.detail.app);
  }

  protected appProjectPatchHandler(input: Event): void {
    const e = input as CustomEvent;
    e.preventDefault();
    e.detail.result = this.appProjectPatch(e.detail.key, e.detail.id, e.detail.value, e.detail.app);
  }

  protected appProjectListHandler(input: Event): void {
    const e = input as CustomEvent;
    e.preventDefault();
    e.detail.result = this.appProjectList(e.detail.options, e.detail.app);
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

  async getGlobalEnvironment(): Promise<IConfigEnvironment> {
    const { globalEnvironment } = this;
    if (!globalEnvironment) {
      throw new Error(`The current environment is not set.`);
    }
    return globalEnvironment;
  }

  /**
   * Checks whether the user is authenticated in the store for the environment
   * @param env Optional environment if different than the global environment
   * @returns True if the user is authenticated in the store.
   */
  async isAuthenticated(env?: IConfigEnvironment): Promise<boolean> {
    let { store } = this;
    if (env) {
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
  async authenticateStore(updateEnvironment = true, env?: IConfigEnvironment, force?: boolean): Promise<ISessionInitInfo> {
    let { store } = this;
    if (env) {
      store = new HttpStore(env);
    }
    if (!store) {
      throw new Error(`Environment is not set.`);
    }
    const result = await store.getStoreSessionToken(undefined, force);
    if (updateEnvironment && result.new) {
      await Events.Config.Environment.update(env || this.globalEnvironment!);
    }
    return result;
  }

  async getCurrentToken(): Promise<string | undefined> {
    const { store } = this;
    return store && store.sdk && store.sdk.token || undefined;
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
  async listFiles(kinds?: ListFileKind[], options?: IListOptions): Promise<IListResponse<IFile>> {
    const { store } = this;
    if (!store) {
      throw new Error(`Environment is not set.`);
    }
    return store.sdk.file.list(kinds, options);
  }

  /**
   * Lists shared with the user files.
   * 
   * @param kinds the list of kinds to list. Spaces are always included.
   * @param options Optional query options.
   */
  async listSharedFiles(kinds?: ListFileKind[], options?: IListOptions): Promise<IListResponse<IFile>> {
    const { store } = this;
    if (!store) {
      throw new Error(`Environment is not set.`);
    }
    return store.sdk.shared.list(kinds, options);
  }

  /**
   * Creates a file in the store.
   * 
   * @param meta The definition of a file that extends the IFile interface.
   * @param media The file content to create with the file meta, if available.
   * @returns The key of the creates file.
   */
  async createFile(meta: IFile, media?: unknown, opts?: IFileCreateOptions): Promise<string> {
    const { store } = this;
    if (!store) {
      throw new Error(`Environment is not set.`);
    }
    if (media) {
      return store.sdk.file.create(meta, media, opts);
    }
    return store.sdk.file.createMeta(meta, opts);
  }

  /**
   * A logic that creates an empty (default) file from its name and the file kind.
   * 
   * @param name The name of the file.
   * @param kind The kind of the file.
   * @param opts Optional create options
   * @returns The key of the created file.
   */
  async createDefaultFile(name: string, kind: string, opts?: IFileCreateOptions): Promise<string> {
    switch (kind) {
      case ProjectKind: return this.createDefaultProject(name, opts);
      case WorkspaceKind: return this.createDefaultWorkspace(name, opts);
      case DataFileKind: return this.createDefaultDataNamespace(name, opts);
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
  async createDefaultProject(name: string, opts?: IFileCreateOptions): Promise<string> {
    const { store } = this;
    if (!store) {
      throw new Error(`Environment is not set.`);
    }
    const media = HttpProject.fromName(name);
    const file = Project.fromProject(media);
    return store.sdk.file.create(file.toJSON(), media.toJSON(), opts);
  }

  /**
   * Creates a default DataNamespace from a name
   * 
   * @param name The name of the DataNamespace
   * @param opts Create options.
   * @returns The key of the created file.
   */
  async createDefaultDataNamespace(name: string, opts?: IFileCreateOptions): Promise<string> {
    const { store } = this;
    if (!store) {
      throw new Error(`Environment is not set.`);
    }
    const media = DataNamespace.fromName(name);
    const file = DataFile.fromDataNamespace(media);
    return store.sdk.file.create(file.toJSON(), media.toJSON(), opts);
  }

  /**
   * Creates a default Workspace from a name
   * 
   * @param name The name of the space
   * @param opts Create options.
   * @returns The key of the created file.
   */
  async createDefaultWorkspace(name: string, opts?: IFileCreateOptions): Promise<string> {
    const { store } = this;
    if (!store) {
      throw new Error(`Environment is not set.`);
    }
    const space = Workspace.fromName(name);
    return store.sdk.file.createMeta(space.toJSON(), opts);
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
  patchFile(key: string, id: string, value: Patch.JsonPatch, app: IApplication, media: false): Promise<IPatchRevision>;

  /**
   * Patches file's content in the store.
   * 
   * @param key The file key
   * @param value The patch to apply.
   */
  patchFile(key: string, id: string, value: Patch.JsonPatch, app: IApplication, media: true): Promise<IPatchRevision>;

  /**
   * Patches a file in the store.
   * @param key The key of the file to patch
   * @param id The generated by the client random id. This id is reported back by the server.
   * @param value The JSON patch to be processed.
   * @returns The JSON patch to revert the change using the `@api-client/json` library
   */
  async patchFile(key: string, id: string, value: Patch.JsonPatch, app: IApplication, media = false): Promise<IPatchRevision> {
    const { store } = this;
    if (!store) {
      throw new Error(`Environment is not set.`);
    }
    const info: IPatchInfo = {
      app: app.code,
      appVersion: app.version,
      patch: value,
      id,
    };
    return store.sdk.file.patch(key, info, media as any);
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
   * @param id The generated by the client random id. This id is reported back by the server.
   * @param value The patch operation on the file's ACL
   */
  async patchFileUsers(key: string, id: string, value: AccessOperation[], app: IApplication): Promise<void> {
    const { store } = this;
    if (!store) {
      throw new Error(`Environment is not set.`);
    }
    const info: IAccessPatchInfo = {
      app: app.code,
      appVersion: app.version,
      patch: value,
      id,
    };
    return store.sdk.file.patchUsers(key, info);
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

  /**
   * Creates a WS client that listens to a file events.
   * After the observer is set up then the store binding start
   * dispatching state events.
   * 
   * Subsequent calls to create a socket will return the existing socket.
   */
  async observeFile(key: string, alt: 'media' | 'meta' = 'meta'): Promise<WebSocket> {
    const storeKey = `${key}?alt=${alt}`;
    const used = this.fileSockets.get(storeKey);
    if (used && used.readyState === WebSocket.OPEN) {
      return used;
    }
    const { store } = this;
    if (!store) {
      throw new Error(`Environment is not set.`);
    }
    const socket = await store.sdk.file.observeFile(key, alt === 'media') as WebSocket;
    this.fileSockets.set(storeKey, socket);
    socket.addEventListener('message', this._fileChangeHandler.bind(this));
    return socket;
  }

  /**
   * Closes previously opened files socket.
   * Does nothing when the socket is not opened.
   */
  async unobserveFile(key: string, alt: 'media' | 'meta' = 'meta'): Promise<void> {
    const storeKey = `${key}?alt=${alt}`;
    const used = this.fileSockets.get(storeKey);
    if (!used) {
      return;
    }
    this.fileSockets.delete(storeKey);
    if (used.readyState !== WebSocket.CLOSED) {
      used.close();
    }
  }

  protected _fileMetaHandler(e: MessageEvent): void {
    const event = JSON.parse(e.data) as IBackendEvent;
    if (event.type !== 'event') {
      return;
    }
    Events.Store.File.State.change(event);
  }

  protected _fileChangeHandler(e: MessageEvent): void {
    const event = JSON.parse(e.data) as IBackendEvent;
    if (event.type !== 'event') {
      return;
    }
    Events.Store.File.State.fileChange(event);
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

  /**
   * Lists users in the store.
   * 
   * @param options Query options.
   */
  async listUsers(options?: IListOptions): Promise<IListResponse<IUser>> {
    const { store } = this;
    if (!store) {
      throw new Error(`Environment is not set.`);
    }
    return store.sdk.user.list(options);
  }

  /**
   * Creates a single history item.
   * 
   * @param history The history item to create.
   * @returns The key of the created item.
   */
  async historyCreate(history: IHttpHistory): Promise<string> {
    const { store } = this;
    if (!store) {
      throw new Error(`Environment is not set.`);
    }
    return store.sdk.history.create(history);
  }

  /**
   * Creates a single history item.
   * 
   * @param info The history bulk info data object
   * @returns The key of the created item.
   */
  async historyCreateBulk(info: IHttpHistoryBulkAdd): Promise<string[]> {
    const { store } = this;
    if (!store) {
      throw new Error(`Environment is not set.`);
    }
    return store.sdk.history.createBulk(info);
  }

  /**
   * Lists history for data.
   * @param init The history query options.
   */
  async historyList(init: HistoryListOptions): Promise<IListResponse<IHttpHistory>> {
    const { store } = this;
    if (!store) {
      throw new Error(`Environment is not set.`);
    }
    return store.sdk.history.list(init);
  }

  /**
   * Deletes a history item or a list of history items.
   * @param key The key or list of keys to delete.
   */
  async historyDelete(key: string | string[]): Promise<void> {
    const { store } = this;
    if (!store) {
      throw new Error(`Environment is not set.`);
    }
    return store.sdk.history.delete(key as string);
  }

  /**
   * Reads a single history item from the store.
   * @param key The key of the item to read.
   */
  async historyRead(key: string): Promise<IHttpHistory> {
    const { store } = this;
    if (!store) {
      throw new Error(`Environment is not set.`);
    }
    return store.sdk.history.read(key);
  }

  async appProjectCreateBulk(values: IAppProject[], optApp?: IApplication): Promise<IBatchUpdateResult<IAppProject>> {
    const { store, app } = this;
    if (!store) {
      throw new Error(`Environment is not set.`);
    }
    const applicationId = optApp ? optApp.code : app.code;
    return store.sdk.app.projects.createBatch(values, applicationId);
  }

  async appProjectDeleteBulk(keys: string[], optApp?: IApplication): Promise<IBatchDeleteResult> {
    const { store, app } = this;
    if (!store) {
      throw new Error(`Environment is not set.`);
    }
    const applicationId = optApp ? optApp.code : app.code;
    return store.sdk.app.projects.deleteBatch(keys, applicationId);
  }

  async appProjectUndeleteBulk(keys: string[], optApp?: IApplication): Promise<IRevertResponse<IAppProject>> {
    const { store, app } = this;
    if (!store) {
      throw new Error(`Environment is not set.`);
    }
    const applicationId = optApp ? optApp.code : app.code;
    return store.sdk.app.projects.undeleteBatch(keys, applicationId);
  }

  async appProjectPatch(key: string, id: string, value: Patch.JsonPatch, optApp?: IApplication): Promise<IPatchRevision> {
    const { store, app } = this;
    if (!store) {
      throw new Error(`Environment is not set.`);
    }
    const application = optApp || app;
    const info: IPatchInfo = {
      app: application.code,
      appVersion: application.version,
      patch: value,
      id,
    };
    return store.sdk.app.projects.patch(key, application.code, info);
  }

  async appProjectList(options?: IListOptions, optApp?: IApplication): Promise<IListResponse<IAppProject>> {
    const { store, app } = this;
    if (!store) {
      throw new Error(`Environment is not set.`);
    }
    const applicationId = optApp ? optApp.code : app.code;
    return store.sdk.app.projects.list(applicationId, options);
  }

  async appRequestCreateBulk(values: IAppRequest[], optApp?: IApplication): Promise<IBatchUpdateResult<IAppRequest>> {
    const { store, app } = this;
    if (!store) {
      throw new Error(`Environment is not set.`);
    }
    const applicationId = optApp ? optApp.code : app.code;
    return store.sdk.app.requests.createBatch(values, applicationId);
  }

  async appRequestDeleteBulk(keys: string[], optApp?: IApplication): Promise<IBatchDeleteResult> {
    const { store, app } = this;
    if (!store) {
      throw new Error(`Environment is not set.`);
    }
    const applicationId = optApp ? optApp.code : app.code;
    return store.sdk.app.requests.deleteBatch(keys, applicationId);
  }

  async appRequestUndeleteBulk(keys: string[], optApp?: IApplication): Promise<IRevertResponse<IAppRequest>> {
    const { store, app } = this;
    if (!store) {
      throw new Error(`Environment is not set.`);
    }
    const applicationId = optApp ? optApp.code : app.code;
    return store.sdk.app.requests.undeleteBatch(keys, applicationId);
  }

  async appRequestPatch(key: string, id: string, value: Patch.JsonPatch, optApp?: IApplication): Promise<IPatchRevision> {
    const { store, app } = this;
    if (!store) {
      throw new Error(`Environment is not set.`);
    }
    const application = optApp || app;
    const info: IPatchInfo = {
      app: application.code,
      appVersion: application.version,
      patch: value,
      id,
    };
    return store.sdk.app.requests.patch(key, application.code, info);
  }

  async appRequestList(options?: IListOptions, optApp?: IApplication): Promise<IListResponse<IAppRequest>> {
    const { store, app } = this;
    if (!store) {
      throw new Error(`Environment is not set.`);
    }
    const applicationId = optApp ? optApp.code : app.code;
    return store.sdk.app.requests.list(applicationId, options);
  }
}
