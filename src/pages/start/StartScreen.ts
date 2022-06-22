import { html, TemplateResult, CSSResult } from 'lit';
import { Events as CoreEvents, ProjectKind, WorkspaceKind, IFile, DataFileKind } from '@api-client/core/build/browser.js';
import { Events } from '../../events/Events.js';
import { ApplicationScreen } from '../ApplicationScreen.js';
import { reactive, query } from '../../lib/decorators.js';
import { IRoute, IRouteResult } from '../../mixins/RouteMixin.js';
import { buildRoute, navigate } from '../../lib/route.js';
import styles from './HomeStyles.js';
import globalStyles from '../styles/global-styles.js';
import layout from '../styles/grid-hnmf.js';
import ApiFilesElement from '../../elements/files/ApiFilesElement.js'
import '../../define/app-settings-menu.js';
import '../../define/api-icon.js';
import '../../define/api-files.js';
import AppInfo from './AppInfo.js';

type NavigationPage = 'files' | 'recent' | 'shared' | 'apps';

export default class StartScreen extends ApplicationScreen {
  static get styles(): CSSResult[] {
    return [styles, globalStyles, layout];
  }

  static get routes(): IRoute[] {
    return [
      { pattern: '/recent', method: 'recentRoute', fallback: true, name: 'Recent', title: 'Recent projects' },
      { pattern: '/files', method: 'filesRoute', name: 'Projects', title: 'Your projects' },
      { pattern: '/shared', method: 'sharedRoute', name: 'Shared', title: 'Shared projects' },
      { pattern: '/apps', method: 'appsRoute', name: 'Apps', title: 'Suite applications' },
      { pattern: '/files/(?<key>.*)', method: 'spaceRoute', name: 'Space', title: 'A space' },
      { pattern: '/shared/(?<key>.*)', method: 'sharedFileRoute', name: 'Shared file', title: 'Shared space' },
      { pattern: '*', method: 'telemetryRoute' },
    ];
  }

  /**
   * The parent space to render in the file list.
   */
  @reactive() protected parent?: string;

  /**
   * The list type to render.
   * This is read from the config store and propagated down to the <api-files>.
   */
  @reactive() protected viewType?: 'grid' | 'list';

  /**
   * A reference to the `<main>` element which is a scroll target
   */
  @query('main', true)
  main?: HTMLElement;

  async initialize(): Promise<void> {
    if (!await this.isPlatformSupported()) {
      return;
    }
    await this.initializeStore();
    await this.readViewConfig();
    await this.observeFiles();
    this.initializeRouting();
    this.initialized = true;
    // async to the initialization
    this.loadUser();
  }

  async storeChanged(): Promise<void> {
    this.initialized = false;
    await this.unobserveFiles();
    await this.initializeStore();
    await this.observeFiles();
    await this.loadUser();
    this.initialized = true;
    navigate('files');
  }

  protected async readViewConfig(): Promise<void> {
    try {
      const type = await Events.Config.Local.get('view.list.type');
      if (type) {
        this.viewType = type as "grid" | "list" | undefined;
      }
    } catch (e) {
      const err = e as Error;
      CoreEvents.Telemetry.exception(err.message, false);
    }
  }

  protected resetRoute(): void {
    this.parent = undefined;
  }

  protected recentRoute(): void {
    this.resetRoute();
    this.page = 'recent';
  }

  protected filesRoute(): void {
    this.resetRoute();
    this.page = 'files';
  }

  protected sharedRoute(): void {
    if (this.isSingleUser) {
      navigate('files');
      return;
    }
    this.resetRoute();
    this.page = 'shared' as NavigationPage;
  }

  protected spaceRoute(info: IRouteResult): void {
    if (!info.params || !info.params.key) {
      throw new Error(`Invalid route configuration. Missing parameters.`);
    }
    this.resetRoute();
    const key = info.params.key as string;
    this.page = 'files' as NavigationPage;
    this.parent = key;
  }

  protected sharedFileRoute(info: IRouteResult): void {
    if (!info.params || !info.params.key) {
      throw new Error(`Invalid route configuration. Missing parameters.`);
    }
    this.resetRoute();
    const key = info.params.key as string;
    this.page = 'shared' as NavigationPage;
    this.parent = key;
  }

  protected appsRoute(): void {
    this.resetRoute();
    this.page = 'apps' as NavigationPage;
  }

  protected telemetryRoute(info: IRouteResult): void {
    CoreEvents.Telemetry.view(info.route.name || info.route.pattern || '/');
  }

  protected _fileOpenHandler(e: CustomEvent): void {
    const file = e.detail as IFile;
    if (file.kind === WorkspaceKind) {
      navigate(this.page || 'files', file.key);
    } else if (file.kind === ProjectKind) {
      Events.Navigation.App.runHttpProject({ key: file.key });
    } else if (file.kind === DataFileKind) {
      Events.Navigation.App.runSchemaDesigner({ key: file.key });
    }
  }

  protected _viewStateHandler(e: Event): void {
    const list = e.target as ApiFilesElement;
    const { viewType } = list;
    Events.Config.Local.set('view.list.type', viewType);
  }

  protected _openAppHandler(e: Event): void {
    const button = e.target as HTMLElement;
    const { kind } = button.dataset;
    switch (kind) {
      case 'http-client': Events.Navigation.App.runHttpClient(); break;
      default: 
    }
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
    return html`
    <header class="start-page-header">
      <h1 class="start-page-header-title">API Client</h1>
      <app-settings-menu .user="${this.user}"></app-settings-menu>
    </header>
    `;
  }

  protected navigationTemplate(): TemplateResult {
    const { page } = this;
    return html`
    <nav aria-label="main">
      <ul class="navigation-list">
        <li class="navigation-item ${page === 'recent' ? 'selected' : ''}"><a href="${buildRoute('recent')}">Recent</a></li>
        <li class="navigation-item ${page === 'files' ? 'selected' : ''}"><a href="${buildRoute('files')}">Files</a></li>
        ${this.isSingleUser ? '' : html`<li class="navigation-item ${page === 'shared' ? 'selected' : ''}"><a href="${buildRoute('shared')}">Shared with me</a></li>`}
        <div class="nav-separator"></div>
        <li class="navigation-item ${page === 'apps' ? 'selected' : ''}"><a href="${buildRoute('apps')}">Applications</a></li>
      </ul>
    </nav>
    `;
  }

  protected mainTemplate(): TemplateResult {
    let template: TemplateResult;
    const p = this.page as NavigationPage;
    switch (p) {
      case 'files': template = this.filesTemplate(); break;
      case 'shared': template = this.sharedTemplate(); break;
      case 'apps': template = this.appsTemplate(); break;
      default:
        template = this.recentTemplate(); break;
    }
    return html`
    <main aria-label="projects list">${template}</main>
    `;
  }

  protected recentTemplate(): TemplateResult {
    return html`
    <h2 class="section-title text-selectable">Recent</h2>
    `;
  }

  protected filesTemplate(): TemplateResult {
    const { parent, viewType } = this;
    return html`
    <api-files 
      .parent="${parent}" 
      .appInfo="${AppInfo}"
      allowAdd 
      .viewType="${viewType || 'list'}"
      .scrollTarget="${this.main}"
      .user="${this.user}"
      listTitle="Your files"
      multiSelect
      canShare
      canTrash
      @open="${this._fileOpenHandler}"
      @viewstatechange="${this._viewStateHandler}"
    ></api-files>
    `;
  }

  protected sharedTemplate(): TemplateResult {
    const { parent, viewType } = this;
    return html`
    <api-files 
      .parent="${parent}" 
      .appInfo="${AppInfo}"
      .viewType="${viewType || 'list'}"
      .scrollTarget="${this.main}"
      .user="${this.user}"
      listTitle="Shared spaces"
      type="shared"
      @open="${this._fileOpenHandler}"
      @viewstatechange="${this._viewStateHandler}"
    ></api-files>
    `;
  }

  protected appsTemplate(): TemplateResult {
    return html`
    <h2 class="section-title text-selectable">Applications</h2>

    <div class="apps">
      <ul>
        <li>
          <figure>
            <api-icon icon="api"></api-icon>
            <figcaption><h3>HTTP Client</h3></figcaption>
          </figure>
          <p>Makes HTTP calls while developing an API</p>
          <div class="actions">
            <anypoint-button emphasis="low" data-kind="http-client" @click="${this._openAppHandler}">Open</anypoint-button>
            <anypoint-button emphasis="low">Learn more</anypoint-button>
          </div>
        </li>
        <li>
          <figure>
            <api-icon icon="cloud"></api-icon>
            <figcaption><h3>HTTP Project</h3></figcaption>
          </figure>
          <p>Define and share API calls bundled in a project.</p>
          <div class="actions">
            <anypoint-button emphasis="low">Open</anypoint-button>
            <anypoint-button emphasis="low">Learn more</anypoint-button>
          </div>
        </li>
        <li>
          <figure>
            <api-icon icon="schema"></api-icon>
            <figcaption><h3>Schema Builder</h3></figcaption>
          </figure>
          <p>Design domain data and use them when working with the suite.</p>
          <div class="actions">
            <anypoint-button emphasis="low">Open</anypoint-button>
            <anypoint-button emphasis="low">Learn more</anypoint-button>
          </div>
        </li>

        <li class="inactive" aria-disabled="true">
          <figure>
            <api-icon icon="api"></api-icon>
            <figcaption><h3>API Composer</h3></figcaption>
          </figure>
          <p>Use the designed schemas to easily define an API without coding.</p>
          <div class="actions">
            This is a planned application.
          </div>
        </li>

        <li class="inactive" aria-disabled="true">
          <figure>
            <api-icon icon="api"></api-icon>
            <figcaption><h3>API Console</h3></figcaption>
          </figure>
          <p>Read any API specification and render a documentation for it.</p>
          <div class="actions">
            This is a planned application.
          </div>
        </li>
        
        <li class="inactive" aria-disabled="true">
          <figure>
            <api-icon icon="api"></api-icon>
            <figcaption><h3>API Project</h3></figcaption>
          </figure>
          <p>Gather requirements and comments about the API you are working on.</p>
          <div class="actions">
            This is a planned application.
          </div>
        </li>
        
        <li class="inactive" aria-disabled="true">
          <figure>
            <api-icon icon="api"></api-icon>
            <figcaption><h3>API Documentalist</h3></figcaption>
          </figure>
          <p>Focus on what's important to your end-users: a beautiful and meaningful documentation for your APIs.</p>
          <div class="actions">
            This is a planned application.
          </div>
        </li>
        
        <li class="inactive" aria-disabled="true">
          <figure>
            <api-icon icon="api"></api-icon>
            <figcaption><h3>Tests designer</h3></figcaption>
          </figure>
          <p>Define API test scenarios based on API specification.</p>
          <div class="actions">
            This is a planned application.
          </div>
        </li>

        <li class="inactive" aria-disabled="true">
          <figure>
            <api-icon icon="api"></api-icon>
            <figcaption><h3>Tests runner</h3></figcaption>
          </figure>
          <p>Execute tests designed in the Tests designer.</p>
          <div class="actions">
            This is a planned application.
          </div>
        </li>
      </ul>
    </div>
    `;
  }
}
