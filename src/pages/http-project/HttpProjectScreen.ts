import { html, TemplateResult, CSSResult } from 'lit';
import { 
  Events as CoreEvents, HttpProject, IHttpProject, IBackendEvent, HttpProjectKind, ProjectRequestKind, ProjectFolderKind,
  IEnvironment, EnvironmentKind, ApiError, IPatchRevision,
} from '@api-client/core/build/browser.js';
// import { ContextMenuExecuteDetail } from '@api-client/context-menu';
import { Patch, JsonPatch } from '@api-client/json';
import { ApplicationScreen } from '../ApplicationScreen.js';
import { reactive, query } from '../../lib/decorators.js';
import { Events } from '../../events/Events.js';
import { EventTypes } from '../../events/EventTypes.js';
import styles from './HttpProjectStyles.js';
import globalStyles from '../styles/global-styles.js';
import mainLayout from '../styles/grid-hnmf.js';
import { HttpProjectContextMenu } from './HttpProjectContextMenu.js';
import '../../define/project-navigation.js';
import '../../define/layout-panel.js';
import '../../define/project-request.js';
import '../../define/environment-editor.js';
import { LayoutManager, ILayoutItem } from '../../elements/layout/LayoutManager.js';
import { IRoute } from '../../mixins/RouteMixin.js';
import NavElement from '../../elements/project/ProjectNavigationElement.js';
import { randomString } from '../../lib/Random.js';
import { navigate, navigatePage } from '../../lib/route.js';

export default class HttpProjectScreen extends ApplicationScreen {
  static get styles(): CSSResult[] {
    return [styles, globalStyles, mainLayout];
  }

  static get routes(): IRoute[] {
    return [
      { pattern: '/default', method: 'defaultRoute', fallback: true, name: 'HTTP Project home', title: 'HTTP Project home' },
      { pattern: '/404', method: 'e404Route', fallback: true, name: 'Not found', title: 'Not found' }
    ];
  }

  /**
   * The project file key.
   */
  key?: string;

  /**
   * The read project.
   */
  @reactive() project?: HttpProject;

  /**
   * The project schema.
   * It is used as a source schema to build the patch information.
   */
  protected schema?: string;

  protected menu: HttpProjectContextMenu;

  /**
   * Whether currently updating the project.
   */
  protected updatingProject = false;

  /**
   * Whether a change ocurred while the project was being updated.
   * If so, the updating logic will trigger the update again.
   */
  protected isDirty = false;

  protected environmentSchemas = new Map<string, IEnvironment>();

  /**
   * The list of patches made by the current user and received from the server since the beginning of this session
   * or page reload.
   * This is to used to recognize own patches so it won't process a patch that is already applied to the project.
   */
  protected livePatches = new Map<string, IPatchRevision>();

  /**
   * Own patches sent to the server.
   * These are removed after the sever event is received.
   */
  protected pendingPatches = new Map<string, JsonPatch>();

  protected layout = new LayoutManager({ 
    dragTypes: ['text/kind', 'text/key'],
    autoStore: true,
    storeKey: 'api-client.http-project.layout',
  });

  @query('project-navigation')
  nav?: NavElement;

  constructor() {
    super();
    this.menu = new HttpProjectContextMenu();
    this.menu.connect();
    this.menu.addEventListener('execute', this._contextCommandHandler.bind(this)); 
    this._contextMenuMutationCallback = this._contextMenuMutationCallback.bind(this);
    this.menu.store.set('callback', this._contextMenuMutationCallback);
  }

  async initialize(): Promise<void> {
    await this.initializeStore();
    const key = this.readFileKey();
    // async to the initialization
    if (!key) {
      this.reportCriticalError('The project key is not set. Go back to the start page.');
      return;
    }
    this.key = key;
    const hasFile = await this.requestProject(key);
    if (!hasFile) {
      this.initializeRouting();
      this.initialized = true;
      return;
    }
    this.loadUser();
    await this._startObservingProjectFile(key);
    await this.layout.initialize();
    this.initializeRouting();
    this.initialized = true;
    window.addEventListener(EventTypes.Store.File.State.fileChange, this._fileChangeHandler.bind(this));
    window.addEventListener(EventTypes.HttpProject.changed, this._contextMenuMutationCallback);
    window.addEventListener(EventTypes.HttpProject.State.nameChanged, this._projectNameChanged.bind(this));
    this.layout.addEventListener('change', this._renderHandler.bind(this));
    this.layout.addEventListener('nameitem', this._nameLayoutItemHandler.bind(this));
  }

  protected async _startObservingProjectFile(key: string): Promise<void> {
    try {
      await Events.Store.File.observeFile(key, 'media');
    } catch (e) {
      this.reportCriticalError('Unable to observe the project file changes.')
    }
  }

  protected resetRoute(): void {
    this.page = undefined;
  }

  protected defaultRoute(): void {
    this.resetRoute();
    this.page = 'default';
  }

  protected e404Route(): void {
    this.resetRoute();
    this.page = '404';
  }

  protected readFileKey(): string | undefined {
    const url = new URL(window.location.href);
    const key = url.searchParams.get('key');
    return key || undefined;
  }

  protected async requestProject(key: string): Promise<boolean> {
    try {
      const media = await Events.Store.File.read(key, true) as IHttpProject;
      this.schema = JSON.stringify(media);
      this.project = new HttpProject(media);
      this.menu.store.set('project', this.project);
    } catch (e) {
      const cause = e as ApiError;
      if (cause.code === 404) {
        navigate('404');
        return false;
      }
      CoreEvents.Telemetry.exception(window, cause.message, true);
      this.reportCriticalError(cause.message);
    }
    return true;
  }

  /**
   * The main function to call when updating the project in the store.
   * It takes care of the concurrent updates, patch building, and IO.
   */
  async updateProject(): Promise<void> {
    if (this.updatingProject) {
      this.isDirty = true;
      return;
    }

    const { schema, project } = this;
    if (!project || !schema) {
      // eslint-disable-next-line no-console
      console.warn(`Trying to update the project but none is set.`);
      return;
    }
    const newSchema = project.toJSON();
    const diff = Patch.diff(JSON.parse(schema), newSchema);
    if (!diff.length) {
      // eslint-disable-next-line no-console
      console.warn(`Expected to detect changes to the project schema.`);
      return;
    }
    this.updatingProject = true;
    const id = randomString();
    this.pendingPatches.set(id, diff);
    try {
      await Events.Store.File.patch(project.key, id, diff, true);
      this.schema = JSON.stringify(newSchema);
    } catch (e) {
      const cause = e as Error;
      CoreEvents.Telemetry.exception(window, cause.message, true);
      this.reportCriticalError(cause.message);
    } finally {
      this.updatingProject = false;
      if (this.isDirty) {
        this.updateProject();
      }
    }
  }

  protected _fileChangeHandler(event: Event): void {
    const e = event as CustomEvent;
    const info = e.detail as IBackendEvent;
    const { schema, project } = this;
    if (!schema || !project) {
      return;
    }
    if (info.kind !== HttpProjectKind || info.operation !== 'patch') {
      return;
    }
    const iProject = JSON.parse(schema);
    const rev = info.data as IPatchRevision;
    const { id } = rev;
    const ownPatch = this.pendingPatches.get(id);
    if (ownPatch) {
      this.livePatches.set(id, rev);
      this.pendingPatches.delete(id);
      return;
    }
    const result = Patch.apply(iProject, rev.patch);
    this.schema = JSON.stringify(result.doc);
    // this.project = new HttpProject(result.doc as IHttpProject);
    this.project?.new(result.doc as IHttpProject);
    this.render();
    const { nav } = this;
    if (nav) {
      nav.requestUpdate();
    }
  }

  /**
   * An event handler that renders the view on request.
   */
  protected _renderHandler(): void {
    this.render();
  }

  protected _projectOpenHandler(event: Event): void {
    const e = event as CustomEvent;
    const key = e.detail.key as string;
    const kind = e.detail.kind as string;
    if (!key || !kind) {
      return;
    }
    this.layout.addItem({
      key,
      kind,
      label: 'Test'
    });
  }

  /**
   * A reference to this function is passed to the context menu
   * and it is called when a project mutates.
   */
  protected _contextMenuMutationCallback(): void {
    this.render();
    this.updateProject();
    const { nav } = this;
    if (nav) {
      nav.requestUpdate();
    }
  }

  protected _contextCommandHandler(): void {
    // event: Event
    // const e = event as CustomEvent;
    // const info = e.detail as ContextMenuExecuteDetail;
    // console.log('Menu command', info);
  }

  protected _projectNameChanged(e: Event): void {
    const { key } = (e as CustomEvent).detail;
    this.layout.requestNameUpdate(key);
    const { nav } = this;
    if (nav) {
      nav.requestUpdate();
    }
  }

  protected _nameLayoutItemHandler(event: Event): void {
    const item = (event as CustomEvent).detail as ILayoutItem;
    if (item.kind === ProjectFolderKind) {
      const folder = this.project?.findFolder(item.key);
      if (folder && folder.info.name) {
        item.label = folder.info.name;
      } else {
        item.label = 'Folder';
      }
      item.icon = 'folder';
    } else if (item.kind === ProjectRequestKind) {
      const request = this.project?.findRequest(item.key);
      if (request && request.info.name && request.info.name !== 'http://') {
        item.label = request.info.name;
      } else if (request && request.expects.url) {
        item.label = request.expects.url;
      } else {
        item.label = 'HTTP request';
      }
      item.icon = 'request';
    } else if (item.kind === EnvironmentKind) {
      const env = this.project?.getEnvironment(item.key);
      if (env && env.info.name) {
        item.label = env.info.name;
      } else {
        item.label = 'Environment';
      }
      item.icon = 'environment';
    }
  }

  protected _requestChangeHandler(e: Event): void {
    const node = e.target as HTMLElement;
    const key = node.dataset.key as string;
    if (!key) {
      return;
    }
    this.layout.requestNameUpdate(key);
    this.updateProject();
  }

  protected _environmentChangeHandler(e: Event): void {
    const { project } = this;
    if (!project) {
      return;
    }
    const node = e.target as HTMLElement;
    const key = node.dataset.key as string;
    if (!key) {
      return;
    }
    const schema = this.environmentSchemas.get(key);
    if (!schema) {
      return;
    }
    const environment = project.definitions.environments.find(i => i.key === key);
    if (!environment) {
      return;
    }
    environment.new(schema);
    this.layout.requestNameUpdate(key);
    this.updateProject();
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
    const { project } = this;
    const projectTitle = project && project.info && project.info.name;
    const title = projectTitle || 'HTTP Project';
    return html`
    <header class="start-page-header">
      <h1 class="start-page-header-title">${title}</h1>
      <app-settings-menu .user="${this.user}"></app-settings-menu>
    </header>
    `;
  }

  protected navigationTemplate(): TemplateResult {
    return html`
    <project-navigation .project="${this.project}" class="project-nav" @select="${this._projectOpenHandler}"></project-navigation>
    `;
  }
  
  protected mainTemplate(): TemplateResult {
    const { page } = this;
    if (page === '404') {
      return this.e404Template();
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
          The project you are trying to open does not exist, was removed,
          or you lost access to it.
        </p>
        <anypoint-button emphasis="high" @click="${(): void => { navigatePage('HttpProjectHome.html') }}">Back to start</anypoint-button>
      </div>
    </main>`;
  }

  protected renderLayout(): TemplateResult[] {
    const { layout } = this;
    return layout.render(this.renderItem.bind(this));
  }

  protected renderItem(item: ILayoutItem, visible: boolean): TemplateResult {
    switch (item.kind) {
      case EnvironmentKind: return this.renderEnvironment(item, visible);
      case ProjectRequestKind: return this.renderProjectRequest(item, visible);
      default: return html`<p>Unsupported object: ${item.kind}</p>`;
    }
  }

  protected renderProjectRequest(item: ILayoutItem, visible: boolean): TemplateResult {
    const { key } = item;
    const { project } = this;
    const request = project && project.findRequest(key);
    if (!request) {
      return html`
      <p ?hidden="${!visible}" data-key="${key}" class="missing-data">The request is no longer in the project.</p>
      `;
    }
    return html`
    <project-request 
      ?hidden="${!visible}" 
      data-key="${key}" 
      key="${key}" 
      .project="${project}" 
      renderSend
      @change="${this._requestChangeHandler}"
    ></project-request>
    `;
  }

  protected renderEnvironment(item: ILayoutItem, visible: boolean): TemplateResult {
    const { key } = item;
    let schema = this.environmentSchemas.get(key);
    if (!schema) {
      const { project } = this;
      const env = project && project.findEnvironment(key);
      if (env) {
        schema = env.toJSON();
        this.environmentSchemas.set(key, schema);
      }
    }
    if (!schema) {
      return html`
      <p ?hidden="${!visible}" data-key="${key}" class="missing-data">The environment is no longer in the project.</p>
      `;
    }
    return html`
    <div class="environment-editor-content" ?hidden="${!visible}" data-key="${key}">
      <environment-editor .environment="${schema}"  data-key="${key}" @change="${this._environmentChangeHandler}"></environment-editor>
    </div>
    `;
  }
}
