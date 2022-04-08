/* eslint-disable lit-a11y/no-autofocus */
import { html, TemplateResult, CSSResult } from 'lit';
import { Events as CoreEvents, ProjectKind, WorkspaceKind, IFile } from '@api-client/core/build/browser.js';
import { Events } from '../../events/Events.js';
import { ApplicationScreen } from '../ApplicationScreen.js';
import { reactive, route, routeInitializer } from '../../lib/decorators.js';
import { IRouteResult } from '../../lib/decorators/route.js';
import { buildRoute, navigate } from '../../lib/route.js';
import styles from './HomeStyles.js';
import layout from '../styles/layout.js';
import '../../define/user-avatar.js';
import '../../define/api-icon.js';
import '../../define/api-files.js';

type NavigationPage = 'files' | 'recent' | 'shared';

export default class HttpProjectHomeScreen extends ApplicationScreen {
  static get styles(): CSSResult[] {
    return [styles, layout];
  }

  /**
   * The parent space to render in the file list.
   */
  @reactive() protected parent?: string;

  @routeInitializer()
  async initialize(): Promise<void> {
    await this.initializeStore();
    await this.observeFiles();
    this.initialized = true;
    // async to the initialization
    this.loadUser();
  }

  async observeFiles(): Promise<void> {
    try {
      await Events.Store.File.observeFiles();
    } catch (e) {
      const err = e as Error;
      CoreEvents.Telemetry.exception(this, err.message, false);
    }
  }

  protected resetRoute(): void {
    this.parent = undefined;
  }

  @route({ pattern: '/recent', fallback: true, name: 'Recent', title: 'Recent projects' })
  recentRoute(): void {
    this.resetRoute();
    this.page = 'recent';
  }

  @route({ pattern: '/files', name: 'Projects', title: 'Your projects' })
  projectsRoute(): void {
    this.resetRoute();
    this.page = 'files';
  }

  @route({ pattern: '/shared', name: 'Shared', title: 'Shared projects' })
  sharedRoute(): void {
    this.resetRoute();
    this.page = 'shared' as NavigationPage;
  }

  @route({ pattern: '/files/(?<key>.*)', name: 'Space', title: 'A space' })
  spaceRoute(info: IRouteResult): void {
    if (!info.params || !info.params.key) {
      throw new Error(`Invalid route configuration. Missing parameters.`);
    }
    this.resetRoute();
    const key = info.params.key as string;
    this.page = 'files';
    this.parent = key;
  }

  @route({ pattern: '*' })
  telemetryRoute(info: IRouteResult): void {
    CoreEvents.Telemetry.view(this.eventTarget, info.route.name || info.route.pattern || '/');
  }

  protected _fileOpenHandler(e: CustomEvent): void {
    const file = e.detail as IFile;
    if (file.kind === WorkspaceKind) {
      navigate('files', file.key);
    } else {
      Events.Navigation.HttpProject.open(file.key);
    }
  }

  pageTemplate(): TemplateResult {
    const { initialized } = this;
    if (!initialized) {
      return super.pageTemplate();
    }
    return html`
      ${this.headerTemplate()}
      <div class="page-content navigation">
        ${this.navigationTemplate()}
        ${this.mainTemplate()}
      </div>
    `;
  }

  headerTemplate(): TemplateResult {
    return html`
    <header class="start-page-header">
      <h1 class="start-page-header-title">HTTP Project</h1>
      <user-avatar .user="${this.user}"></user-avatar>
    </header>
    `;
  }

  navigationTemplate(): TemplateResult {
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

  mainTemplate(): TemplateResult {
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

  recentTemplate(): TemplateResult {
    return html`
    <h2 class="section-title text-selectable">Recent projects</h2>
    `;
  }

  filesTemplate(): TemplateResult {
    const { parent } = this;
    const kinds = [ProjectKind];
    return html`
    <api-files 
      .parent="${parent}" 
      allowAdd 
      .kinds="${kinds}"
      listTitle="Your projects"
      @open="${this._fileOpenHandler}"
    ></api-files>
    `;
  }

  sharedTemplate(): TemplateResult {
    return html`
    <h2 class="section-title text-selectable">Shared spaces</h2>
    `;
  }
}
