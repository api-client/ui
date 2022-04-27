import { html, TemplateResult, CSSResult } from 'lit';
import { ApiError, HttpProject, IHttpProject, Events as CoreEvents, IBackendEvent, HttpProjectKind, IPatchRevision, ProjectFolderKind, ProjectFolder } from '@api-client/core/build/browser.js';
import { Patch } from '@api-client/json';
import { ApplicationScreen } from '../ApplicationScreen.js';
import { reactive, query } from '../../lib/decorators.js';
import styles from './styles.js';
import globalStyles from '../styles/global-styles.js';
import mainLayout from '../styles/grid-hnmf.js';
// import AppInfo from './AppInfo.js';
import { Events } from '../../events/Events.js';
import { navigate } from '../../lib/route.js';
import { EventTypes } from '../../events/EventTypes.js';
import { IRoute, IRouteResult } from '../../mixins/RouteMixin.js';
import NavElement from '../../elements/project/ProjectRunnerNavigationElement.js';
import { ILayoutItem, LayoutManager } from '../../elements/layout/LayoutManager.js';
import '../../define/project-runner-navigation.js';
import '../../define/project-runner.js';
import AppInfo from './AppInfo.js';

export default class HttpProjectScreen extends ApplicationScreen {
  static get styles(): CSSResult[] {
    return [styles, globalStyles, mainLayout];
  }

  static get routes(): IRoute[] {
    return [
      { pattern: '/default', method: 'defaultRoute', fallback: true, name: 'Project Runner', title: 'Project Runner home' },
      { pattern: '/folder/(?<key>.*)', method: 'folderRoute', name: 'HTTP Project home', title: 'Project Runner folder' },
      { pattern: '/404', method: 'e404Route', name: 'Not found', title: 'Not found' }
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
   * The key of the selected folder.
   */
  folder?: string;

  /**
   * The selected folder.
   */
  parent?: ProjectFolder;

  @query('project-runner-navigation')
  nav?: NavElement;

  protected layout = new LayoutManager({ 
    dragTypes: [ProjectFolderKind, 'text/kind', 'text/key'],
    autoStore: true,
  });

  async initialize(): Promise<void> {
    if (!await this.isPlatformSupported()) {
      return;
    }
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
    this.layout.opts.storeKey = `api-client.project-runner.layout.${key}`;
    await this.layout.initialize();
    this.ensureProjectLayout();
    this.initializeRouting();
    this.initialized = true;
    window.addEventListener(EventTypes.Store.File.State.fileChange, this._fileChangeHandler.bind(this));
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

  protected ensureProjectLayout(): void {
    const item = this.layout!.findItem(this.key!);
    if (item) {
      return;
    }
    this.layout.addItem({
      key: this.key!,
      kind: HttpProjectKind,
      label: 'Project',
      icon: 'project',
      persistent: true,
    });
  }

  protected resetRoute(): void {
    this.page = undefined;
    this.folder = undefined;
    this.parent = undefined;
  }

  protected defaultRoute(): void {
    this.resetRoute();
    this.page = 'default';
  }

  protected folderRoute(info: IRouteResult): void {
    if (!info.params || !info.params.key) {
      throw new Error(`Invalid route configuration. Missing parameters.`);
    }
    this.resetRoute();
    const key = info.params.key as string;
    this.page = 'folder';
    this.folder = key;
    const { project } = this;
    if (!project) {
      return;
    }
    this.parent =  project.findFolder(key);
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
      this.project = new HttpProject(media);
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

  protected _fileChangeHandler(event: Event): void {
    const e = event as CustomEvent;
    const info = e.detail as IBackendEvent;
    const { project } = this;
    if (!project) {
      return;
    }
    if (info.kind !== HttpProjectKind || info.operation !== 'patch') {
      return;
    }
    const iProject = project.toJSON();
    const rev = info.data as IPatchRevision;
    const result = Patch.apply(iProject, rev.patch);
    
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

  protected _nameLayoutItemHandler(event: Event): void {
    const { project } = this;
    if (!project) {
      return;
    }
    const item = (event as CustomEvent).detail as ILayoutItem;
    if (item.kind === ProjectFolderKind) {
      const folder = project.findFolder(item.key);
      if (folder && folder.info.name) {
        item.label = folder.info.name;
      } else {
        item.label = 'Folder';
      }
      item.icon = 'folder';
    } else if (item.kind === HttpProjectKind) {
      if (project.info.name) {
        item.label = project.info.name;
      } else {
        item.label = 'Project';
      }
    }
  }

  protected _navOpenHandler(event: Event): void {
    const e = event as CustomEvent;
    const key = e.detail.key as string;
    const kind = e.detail.kind as string;
    if (!key || !kind) {
      return;
    }
    if (kind !== ProjectFolderKind) {
      return;
    }
    this.layout.addItem({
      key,
      kind,
      label: 'New panel'
    });
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
    const title = projectTitle || 'Project Runner';
    return html`
    <header class="start-page-header">
      <h1 class="start-page-header-title">${title}</h1>
      <app-settings-menu .user="${this.user}" class="toolbar-action"></app-settings-menu>
    </header>
    `;
  }

  protected navigationTemplate(): TemplateResult {
    return html`
    <project-runner-navigation .project="${this.project}" class="project-nav" @select="${this._navOpenHandler}"></project-runner-navigation>
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
        <anypoint-button emphasis="high" @click="${this.openStart}">Back to start</anypoint-button>
      </div>
    </main>`;
  }

  protected renderLayout(): TemplateResult[] {
    const { layout } = this;
    return layout.render(this.renderItem.bind(this));
  }

  protected renderItem(item: ILayoutItem, visible: boolean): TemplateResult {
    switch (item.kind) {
      case ProjectFolderKind: return this.renderFolderRunner(item, visible);
      case HttpProjectKind: return this.renderProjectRunner(item, visible);
      default: return html`<p>Unsupported object: ${item.kind}</p>`;
    }
  }

  protected renderFolderRunner(item: ILayoutItem, visible: boolean): TemplateResult {
    const { key } = item;
    const { project } = this;
    const folder = project && project.findFolder(key);
    if (!folder) {
      return html`
      <p ?hidden="${!visible}" data-key="${key}" class="missing-data">The folder is no longer in the project.</p>
      `;
    }
    return html`
    <project-runner ?hidden="${!visible}" data-key="${key}" .project="${project}" .appInfo="${AppInfo}" folder="${key}"></project-runner>
    `;
  }

  protected renderProjectRunner(item: ILayoutItem, visible: boolean): TemplateResult {
    const { key } = item;
    return html`
    <project-runner ?hidden="${!visible}" data-key="${key}" .project="${this.project}" .appInfo="${AppInfo}"></project-runner>
    `;
  }
}
