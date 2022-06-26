/* eslint-disable no-param-reassign */
import { html, TemplateResult, CSSResult } from 'lit';
import { 
  AppProjectFolderKind, AppProjectKind, AppProjectRequestKind, EnvironmentKind, IEnvironment,
  IAppProjectParent, IAppProjectRequest,
} from '@api-client/core/build/browser.js';
// import { Patch, JsonPatch, ApplyResult } from '@api-client/json';
import { ApplicationScreen } from '../ApplicationScreen.js';
import { Events } from '../../events/Events.js';
import styles from './HttpClientStyles.js';
import globalStyles from '../styles/global-styles.js';
import mainLayout from '../styles/grid-hnmf.js';
import { HttpClientContextMenu } from './HttpClientContextMenu.js';
import '../../define/layout-panel.js';
import { LayoutManager, ILayoutItem, LayoutPanel } from '../../elements/layout/LayoutManager.js';
import { IRoute } from '../../mixins/RouteMixin.js';
import { HttpWorkspace, IWorkspaceItem } from '../../http-client/models/HttpWorkspace.js';
import { CertificateModel } from '../../http-client/idb/CertificateModel.js';
import { HistoryModel } from '../../http-client/idb/HistoryModel.js';
import { ResizeEventDetail } from '../../lib/ResizableElements.js';
import { query } from '../../lib/decorators.js';
import HttpClientNavigationElement from '../../elements/http-client/HttpClientNavigationElement.js';
import { ProjectsController } from './ProjectsController.js';
import '../../define/http-client-navigation.js';
import '../../define/environment-editor.js';
import '../../define/app-project-editor.js';
import AppInfo from './AppInfo.js';

export default class HttpProjectScreen extends ApplicationScreen {
  static get styles(): CSSResult[] {
    return [styles, globalStyles, mainLayout];
  }

  static get routes(): IRoute[] {
    return [
      { pattern: '/default', method: 'defaultRoute', fallback: true, name: 'HTTP Client home', title: 'HTTP Client home' },
      { pattern: '/invalid-workspace', method: 'invalidWorkspaceRoute', name: 'Invalid workspace', title: 'Invalid workspace' },
      { pattern: '/404', method: 'e404Route', name: 'Not found', title: 'Not found' }
    ];
  }

  /**
   * The state object identifier.
   * It is used to save the sate of the workspace.
   */
  key?: string;

  protected menu: HttpClientContextMenu;

  protected layout = new LayoutManager({ 
    dragTypes: ['text/kind', 'text/key'],
    autoStore: false,
  });

  workspace: HttpWorkspace;

  certificatesModel = new CertificateModel();

  historyModel = new HistoryModel();

  projects = new ProjectsController();

  @query('http-client-navigation')
  nav?: HttpClientNavigationElement | null;

  protected _storeWorkspaceDebouncer?: number;

  constructor() {
    super();
    this.workspace = new HttpWorkspace(this.layout);
    this.menu = new HttpClientContextMenu();
    this.menu.connect();
    this._contextMenuMutationCallback = this._contextMenuMutationCallback.bind(this);
    this.menu.store.set('callback', this._contextMenuMutationCallback);
    this.menu.store.set('layout', this.layout);
    this.menu.store.set('page', this);
  }

  async initialize(): Promise<void> {
    if (!await this.isPlatformSupported()) {
      return;
    }
    await this.initializeStore();
    this.certificatesModel.listen(window);
    this.historyModel.listen(window);
    const key = this.readWorkspaceKey();
    this.key = key;
    let workspace: HttpWorkspace;
    try {
      workspace = await this.requestWorkspace(key);
    } catch (_) {
      if (key === 'workspace.json') {
        workspace = new HttpWorkspace(this.layout);
      } else {
        this.page = 'invalid-workspace';
        this.initializeRouting();
        this.initialized = true;
        return;
      }
    }
    await this.projects.synchronizeWorkspace(workspace);
    this.workspace = workspace;
    await this.layout.initialize();
    this.initializeRouting();
    this.initialized = true;
    this.layout.addEventListener('change', this._layoutChangeHandler.bind(this));
    this.layout.addEventListener('nameitem', this._nameLayoutItemHandler.bind(this));
    this.layout.addEventListener('closetab', this._tabClosed.bind(this) as EventListener);
    this.projects.addEventListener('projectchange', this._projectMetaChange.bind(this) as EventListener);
    this.projects.addEventListener('projectremove', this._projectDeletedHandler.bind(this) as EventListener);
  }

  protected resetRoute(): void {
    this.page = undefined;
  }

  protected defaultRoute(): void {
    this.resetRoute();
    this.page = 'default';
  }

  protected invalidWorkspaceRoute(): void {
    this.resetRoute();
    this.page = 'invalid-workspace';
  }

  protected e404Route(): void {
    this.resetRoute();
    this.page = '404';
  }

  protected readWorkspaceKey(): string {
    const url = new URL(window.location.href);
    const key = url.searchParams.get('key');
    return key || 'workspace.json';
  }

  /**
   * An event handler that renders the view on request.
   */
  protected _layoutChangeHandler(): void {
    this.render();
    this.storeWorkspace();
  }

  /**
   * A reference to this function is passed to the context menu
   * and it is called when a project mutates.
   */
  protected _contextMenuMutationCallback(): void {
    this.render();
    this.nav?.requestUpdate();
    // this.updateProject();
  }

  protected _nameLayoutItemHandler(event: Event): void {
    const item = (event as CustomEvent).detail as ILayoutItem;
    if (item.kind === AppProjectKind) {
      const project = this.projects.projects.find(i => i.key === item.key);
      if (!project) {
        return;
      }
      item.label = project.info.renderLabel;
    } else if (item.kind === AppProjectFolderKind) {
      const project = this.projects.projects.find(i => i.key === item.parent);
      if (!project) {
        return;
      }
      const folder = project.findFolder(item.key);
      if (!folder) {
        return;
      }
      item.label = folder.info.renderLabel;
    } else if (item.kind === AppProjectRequestKind) {
      const project = this.projects.projects.find(i => i.key === item.parent);
      if (!project) {
        return;
      }
      const request = project.findRequest(item.key);
      if (!request) {
        return;
      }
      item.label = request.info.renderLabel;
    } else if (item.kind === EnvironmentKind) {
      const project = this.projects.projects.find(i => i.key === item.parent);
      if (!project) {
        return;
      }
      const env = project.getEnvironment(item.key);
      if (!env) {
        return;
      }
      item.label = env.info.renderLabel;
    }
  }

  protected async requestWorkspace(key: string): Promise<HttpWorkspace> {
    const data = await Events.AppData.File.read(key, { type: 'workspace' }) as string | undefined;
    if (!data && key !== 'workspace.json') {
      throw new Error(`Unable to locate the workspace file: ${key}`);
    }
    const workspace = new HttpWorkspace(this.layout, data);
    return workspace;
  }

  protected async storeWorkspace(): Promise<void> {
    const { _storeWorkspaceDebouncer } = this;
    if (_storeWorkspaceDebouncer) {
      return;
    }
    this._storeWorkspaceDebouncer = setTimeout(() => {
      this._storeWorkspaceDebouncer = undefined;
      this._storeWorkspace();
    }, 1000) as unknown as number;
  }

  protected async _storeWorkspace(): Promise<void> {
    const { key, workspace } = this;
    if (!key || !workspace) {
      return;
    }
    await Events.AppData.File.write(key, JSON.stringify(workspace), { type: 'workspace' })
  }

  protected _beforeResizeHandler(e: CustomEvent<ResizeEventDetail>): void {
    const { width } = e.detail;
    if (width && width < 120) {
      e.preventDefault();
      return;
    }
    const app = document.getElementById('app') as HTMLDivElement;
    app.style.gridTemplateColumns = `${width}px auto`;
  }

  protected _projectOpenHandler(event: Event): void {
    const e = event as CustomEvent;
    const key = e.detail.key as string;
    const kind = e.detail.kind as string;
    if (!key || !kind) {
      return;
    }
    const { workspace, layout } = this;
    const existing = workspace.items.find(i => i.key === key);
    if (existing) {
      const panel = layout.findItemPanel(key);
      if (panel) {
        panel.selected = key;
        layout.forceUpdateLayout(panel.id);
        return;
      }
    }
    const pid = e.detail.root as string | undefined;
    switch (kind) {
      case AppProjectKind: this._openProject(key); break;
      case AppProjectFolderKind: this._openProjectFolder(key, pid as string); break;
      case AppProjectRequestKind: this._openProjectRequest(key, pid as string); break;
      case EnvironmentKind: this._openProjectEnvironment(key, pid as string); break;
      default: this.reportCriticalError(`Invalid type of an object to open: ${kind}`);
    }
  }

  protected async _openProject(key: string): Promise<void> {
    const project = await this.projects.ensureProject(key);
    this.workspace.items.push({
      key,
      kind: AppProjectKind,
      parent: key,
      // data: project,
    });
    this.layout.addItem({
      key,
      kind: AppProjectKind,
      label: project.info.renderLabel,
      icon: 'collectionsBookmarkOutline',
    });
  }

  protected async _openProjectFolder(key: string, pid: string): Promise<void> {
    const project = await this.projects.ensureProject(pid);
    const folder = project.findFolder(key);
    if (!folder) {
      this.reportCriticalError(`The folder was not found in the project.`);
      return;
    }
    this.workspace.items.push({
      key,
      kind: AppProjectFolderKind,
      parent: pid,
      data: folder.toJSON(),
    });
    this.layout.addItem({
      kind: AppProjectFolderKind,
      key,
      parent: pid,
      label: folder.info.renderLabel,
      icon: 'folder',
    });
  }

  protected async _openProjectRequest(key: string, pid: string): Promise<void> {
    const project = await this.projects.ensureProject(pid);
    const request = project.findRequest(key);
    if (!request) {
      this.reportCriticalError(`The request was not found in the project.`);
      return;
    }
    this.workspace.items.push({
      kind: AppProjectRequestKind,
      key,
      parent: pid,
      data: request.toJSON(),
    });
    this.layout.addItem({
      kind: AppProjectRequestKind,
      key,
      parent: pid,
      label: request.info.renderLabel,
      icon: 'request',
    });
  }

  protected async _openProjectEnvironment(key: string, pid: string): Promise<void> {
    const project = await this.projects.ensureProject(pid);
    const environment = project.findEnvironment(key);
    if (!environment) {
      this.reportCriticalError(`The environment was not found in the project.`);
      return;
    }
    this.workspace.items.push({
      kind: EnvironmentKind,
      key,
      parent: pid,
      data: environment.toJSON(),
    });
    this.layout.addItem({
      kind: EnvironmentKind,
      key,
      parent: pid,
      label: environment.info.renderLabel,
      icon: 'environment',
    });
  }

  protected _environmentChangeHandler(e: Event): void {
    const node = e.target as HTMLElement;
    const key = node.dataset.key as string;
    const pid = node.dataset.pid as string;
    const project = this.projects.projects.find(i => i.key === pid);
    if (!project) {
      return;
    }
    if (!key) {
      return;
    }
    const workspaceItem = this.workspace.items.find(i => i.key === key);
    if (!workspaceItem) {
      return;
    }
    // the schema is passed to the editor by reference so we can use `item.data` directly.
    const schema = workspaceItem.data as IEnvironment | undefined;
    if (!schema) {
      return;
    }
    const environment = project.definitions.environments.find(i => i.key === key);
    if (!environment) {
      return;
    }
    environment.new(schema);
    workspaceItem.isDirty = true;
    const item = this.layout.findItem(key);
    if (item) {
      item.isDirty = true;
      const panel = this.layout.findItemPanel(key) as LayoutPanel;
      this.layout.forceUpdateLayout(panel.id);
    }
    this.layout.requestNameUpdate(key);
    this.render();
  }

  protected _tabClosed(e: CustomEvent): void {
    const key = e.detail as string;
    const index = this.workspace.items.findIndex(i => i.key === key);
    if (index >= 0) {
      this.workspace.items.splice(index, 1);
      this.storeWorkspace();
    }
  }

  /**
   * Triggers a save action on one of the workspace items.
   * 
   * What happens next depends on the type of the item.
   * 
   * Note, this is used by the context menu to handle the "save" action.
   * 
   * @param key The key of the item to trigger the save action on.
   */
  triggerSave(key: string): void {
    const item = this.workspace.items.find(i => i.key === key);
    if (!item) {
      return;
    }
    switch(item.kind) {
      case EnvironmentKind: this._triggerEnvironmentSave(item); break;
      default:
    }
  }

  protected async _triggerEnvironmentSave(item: IWorkspaceItem): Promise<void> {
    const { key, parent } = item;
    const project = this.projects.projects.find(i => i.key === parent);
    if (!project || !key) {
      return;
    }
    const schema = item.data as IEnvironment | undefined;
    if (!schema) {
      // TODO: This should render an error to the user.
      return;
    }
    const env = project.findEnvironment(key);
    if (!env) {
      // TODO: This should render an error to the user.
      return;
    }
    env.new(schema);
    await this.projects.projectModel.update(project);
    item.isDirty = false;
    const lItem = this.layout.findItem(key);
    if (lItem) {
      lItem.isDirty = false;
      const panel = this.layout.findItemPanel(key) as LayoutPanel;
      this.layout.forceUpdateLayout(panel.id);
    }
    this.render();
    this.storeWorkspace();
  }

  /**
   * A handler for an event informing the application that the project metadata have changed
   * in one of the components. The event is dispatched by the ProjectsController after the project change.
   * This updates the current view, including: navigation, layout, and the main content.
   */
  protected _projectMetaChange(e: CustomEvent): void {
    const key = e.detail as string;
    if (!key) {
      return;
    }
    this.render();
    this.nav?.requestUpdate();
    this.layout.requestNameUpdate(key);
    this.layout.parentNameUpdate(key);
    this.storeWorkspace();
  }

  protected _projectDeletedHandler(e: CustomEvent): void {
    const key = e.detail;
    let changed = false;
    // remove any items from the workspace related to the project.
    const { items } = this.workspace;
    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i];
      if (item.key === key || item.parent === key) {
        items.splice(i, 1);
        this.layout.removeItem(item.key);
        changed = true;
      }
    }
    if (changed) {
      this.storeWorkspace();
    }
    this.nav?.requestUpdate();
  }

  pageTemplate(): TemplateResult {
    const { initialized } = this;
    if (!initialized) {
      return super.pageTemplate();
    }
    return html`
      ${this.headerTemplate()}
      ${this.navigationTemplate()}
      ${this.mainTemplate()}
      ${this.footerTemplate()}
    `;
  }

  protected headerTemplate(): TemplateResult {
    const title = 'HTTP Client';
    return html`
    <header class="start-page-header">
      <h1 class="start-page-header-title">${title}</h1>
    </header>
    `;
  }

  protected navigationTemplate(): TemplateResult {
    const resizeDirection = 'east';
    return html`
    <nav class="project-nav" .resize="${resizeDirection}" @beforeresize="${this._beforeResizeHandler}">
      <http-client-navigation .projects="${this.projects}" @select="${this._projectOpenHandler}"></http-client-navigation>
    </nav>
    `;
  }
  
  protected mainTemplate(): TemplateResult {
    const { page } = this;
    if (page === '404') {
      return this.e404Template();
    }
    if (page === 'invalid-workspace') {
      return this.invalidWorkspaceTemplate();
    }
    return html`<main>
      ${this.renderLayout()}
    </main>`;
  }

  protected e404Template(): TemplateResult {
    return html`
    <main>
      <div class="full-error">
        <h2>Not found</h2>
        <p class="description">
          The workspace you are trying to open does not exist or was removed.
        </p>
      </div>
    </main>`;
  }

  protected invalidWorkspaceTemplate(): TemplateResult {
    return html`
    <main>
      <div class="full-error">
        <h2>Workspace not found</h2>
        <p class="description">
          The workspace you are trying to open does not exist, was removed or is invalid.
        </p>
      </div>
    </main>
    `;
  }

  protected renderLayout(): TemplateResult[] {
    const { layout } = this;
    return layout.render(this.renderItem.bind(this));
  }

  protected renderItem(item: ILayoutItem, visible: boolean): TemplateResult {
    switch (item.kind) {
      case AppProjectKind: return this._projectTemplate(item, visible);
      case AppProjectFolderKind: return this._projectFolderTemplate(item, visible);
      case AppProjectRequestKind: return this._projectRequestTemplate(item, visible);
      case EnvironmentKind: return this.renderEnvironment(item, visible);
      default: return html`<p ?hidden="${!visible}" data-key="${item.key}" >Unsupported object: ${item.kind}</p>`;
    }
  }

  protected _projectTemplate(item: ILayoutItem, visible: boolean): TemplateResult {
    const { key } = item;
    const { projects } = this.projects;
    const project = projects.find(i => i.key === key);
    if (!project) {
      return this._missingWorkspaceItemTemplate(item, visible, 'project');
    }
    return html`
    <div class="project-editor-content" ?hidden="${!visible}" data-key="${key}">
      <app-project-editor .project="${project}" data-key="${key}" .appId="${AppInfo.code}"></app-project-editor>
    </div>`;
  }

  protected _projectFolderTemplate(item: ILayoutItem, visible: boolean): TemplateResult {
    const { workspace } = this;
    const { key, parent } = item;
    const workspaceItem = workspace.items.find(i => i.key === key);
    if (!workspaceItem) {
      return this._missingWorkspaceItemTemplate(item, visible, 'folder');
    }
    const schema = workspaceItem.data as IAppProjectParent | undefined
    if (!schema) {
      return html`
      <p ?hidden="${!visible}" data-key="${key}" class="missing-data">The folder is no longer in the project.</p>
      `;
    }
    return html`
    <div class="folder-editor-content" ?hidden="${!visible}" data-key="${key}">
      <p>Folder: ${item.key}</p>
      <p>Project: ${parent}</p>
      <p>Schema: ${JSON.stringify(schema, null, 2)}</p>
    </div>
    `;
  }

  protected _projectRequestTemplate(item: ILayoutItem, visible: boolean): TemplateResult {
    const { workspace } = this;
    const { key, parent } = item;
    const workspaceItem = workspace.items.find(i => i.key === key);
    if (!workspaceItem) {
      return this._missingWorkspaceItemTemplate(item, visible, 'request');
    }
    const schema = workspaceItem.data as IAppProjectRequest | undefined
    if (!schema) {
      return html`
      <p ?hidden="${!visible}" data-key="${key}" class="missing-data">The request is no longer in the project.</p>
      `;
    }
    return html`
    <div class="request-editor-content" ?hidden="${!visible}" data-key="${key}">
      <p>Request: ${item.key}</p>
      <p>Project: ${parent}</p>
      <p>Schema: ${JSON.stringify(schema, null, 2)}</p>
    </div>
    `;
  }

  protected renderEnvironment(item: ILayoutItem, visible: boolean): TemplateResult {
    const { workspace } = this;
    const { key, parent } = item;
    const workspaceItem = workspace.items.find(i => i.key === key);
    if (!workspaceItem) {
      return this._missingWorkspaceItemTemplate(item, visible, 'environment');
    }
    const schema = workspaceItem.data as IEnvironment | undefined;
    if (!schema) {
      return html`
      <p ?hidden="${!visible}" data-key="${key}" class="missing-data">The environment is no longer in the project.</p>
      `;
    }
    return html`
    <div class="environment-editor-content" ?hidden="${!visible}" data-key="${key}">
      <environment-editor .environment="${schema}"  data-key="${key}" data-pid="${parent as string}" @change="${this._environmentChangeHandler}"></environment-editor>
    </div>
    `;
  }

  protected _missingWorkspaceItemTemplate(item: ILayoutItem, visible: boolean, label: string): TemplateResult {
    const { key } = item;
    return html`
    <p ?hidden="${!visible}" data-key="${key}" class="missing-data">
      Invalid value. The ${label} cannot be found.
    </p>`;
  }
}
