import { html, TemplateResult, CSSResult } from 'lit';
import { Events as CoreEvents, ProjectKind, WorkspaceKind, IFile } from '@api-client/core/build/browser.js';
import { Events } from '../../events/Events.js';
import { ApplicationScreen } from '../ApplicationScreen.js';
import { reactive, route, routeInitializer, query } from '../../lib/decorators.js';
import { IRouteResult } from '../../lib/decorators/route.js';
import { buildRoute, navigate } from '../../lib/route.js';
import styles from './HomeStyles.js';
import globalStyles from '../styles/global-styles.js';
import layout from '../styles/grid-hnmf.js';
import ApiFilesElement from '../../elements/files/ApiFilesElement.js'
import '../../define/user-avatar.js';
import '../../define/api-icon.js';
import '../../define/api-files.js';

type NavigationPage = 'files' | 'recent' | 'shared';

export default class HttpProjectHomeScreen extends ApplicationScreen {
  static get styles(): CSSResult[] {
    return [styles, globalStyles, layout];
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

  @routeInitializer()
  async initialize(): Promise<void> {
    await this.initializeStore();
    await this.readViewConfig();
    await this.observeFiles();
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

  protected async observeFiles(): Promise<void> {
    try {
      await Events.Store.File.observeFiles();
    } catch (e) {
      const err = e as Error;
      CoreEvents.Telemetry.exception(this.eventTarget, err.message, false);
    }
  }

  protected async unobserveFiles(): Promise<void> {
    try {
      await Events.Store.File.unobserveFiles();
    } catch (e) {
      const err = e as Error;
      CoreEvents.Telemetry.exception(this.eventTarget, err.message, false);
    }
  }

  protected async readViewConfig(): Promise<void> {
    try {
      const type = await Events.Config.Local.get('view.list.type');
      if (type) {
        this.viewType = type as any;
      }
    } catch (e) {
      const err = e as Error;
      CoreEvents.Telemetry.exception(this.eventTarget, err.message, false);
    }
  }

  protected resetRoute(): void {
    this.parent = undefined;
  }

  @route({ pattern: '/recent', fallback: true, name: 'Recent', title: 'Recent projects' })
  protected recentRoute(): void {
    this.resetRoute();
    this.page = 'recent';
  }

  @route({ pattern: '/files', name: 'Projects', title: 'Your projects' })
  protected projectsRoute(): void {
    this.resetRoute();
    this.page = 'files';
  }

  @route({ pattern: '/shared', name: 'Shared', title: 'Shared projects' })
  protected sharedRoute(): void {
    this.resetRoute();
    this.page = 'shared' as NavigationPage;
  }

  @route({ pattern: '/files/(?<key>.*)', name: 'Space', title: 'A space' })
  protected spaceRoute(info: IRouteResult): void {
    if (!info.params || !info.params.key) {
      throw new Error(`Invalid route configuration. Missing parameters.`);
    }
    this.resetRoute();
    const key = info.params.key as string;
    this.page = 'files';
    this.parent = key;
  }

  @route({ pattern: '*' })
  protected telemetryRoute(info: IRouteResult): void {
    CoreEvents.Telemetry.view(this.eventTarget || window, info.route.name || info.route.pattern || '/');
  }

  protected _fileOpenHandler(e: CustomEvent): void {
    const file = e.detail as IFile;
    if (file.kind === WorkspaceKind) {
      navigate('files', file.key);
    } else {
      Events.Navigation.HttpProject.open(file.key);
    }
  }

  protected _viewStateHandler(e: Event): void {
    const list = e.target as ApiFilesElement;
    const { viewType } = list;
    Events.Config.Local.set('view.list.type', viewType);
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
      <h1 class="start-page-header-title">HTTP Project</h1>
      <user-avatar .user="${this.user}"></user-avatar>
    </header>
    `;
  }

  protected navigationTemplate(): TemplateResult {
    const { page } = this;
    return html`
    <nav aria-label="Application sections">
      <ul class="navigation-list">
        <li class="navigation-item ${page === 'recent' ? 'selected' : ''}"><a href="${buildRoute('recent')}">Recent</a></li>
        <li class="navigation-item ${page === 'files' ? 'selected' : ''}"><a href="${buildRoute('files')}">Projects</a></li>
        <li class="navigation-item ${page === 'shared' ? 'selected' : ''}"><a href="${buildRoute('shared')}">Shared with me</a></li>
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
      default:
        template = this.recentTemplate(); break;
    }
    return html`
    <main aria-label="projects list">${template}</main>
    `;
  }

  protected recentTemplate(): TemplateResult {
    return html`
    <h2 class="section-title text-selectable">Recent projects</h2>
    `;
  }

  protected filesTemplate(): TemplateResult {
    const { parent, viewType } = this;
    const kinds = [ProjectKind];
    return html`
    <api-files 
      .parent="${parent}" 
      allowAdd 
      .kinds="${kinds}"
      .viewType="${viewType || 'list'}"
      .scrollTarget="${this.main}"
      listTitle="Your projects"
      @open="${this._fileOpenHandler}"
      @viewstatechange="${this._viewStateHandler}"
    ></api-files>
    `;
  }

  protected sharedTemplate(): TemplateResult {
    return html`
    <h2 class="section-title text-selectable">Shared spaces</h2>
    `;
  }
}
