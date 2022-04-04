/* eslint-disable lit-a11y/no-autofocus */
import { html, TemplateResult, CSSResult } from 'lit';
import { IWorkspace, IListOptions, IUser, Events as CoreEvents, Workspace, IBackendEvent, IHttpProjectListItem, ISpaceCreateOptions, HttpProject } from '@api-client/core/build/browser.js';
import { AnypointInputElement } from '@anypoint-web-components/awc';
import '@anypoint-web-components/awc/dist/define/anypoint-button.js';
import '@anypoint-web-components/awc/dist/define/anypoint-progress.js';
import '@anypoint-web-components/awc/dist/define/anypoint-dialog.js';
import '@anypoint-web-components/awc/dist/define/anypoint-input.js';
import '@github/time-elements/dist/time-ago-element.js';
import { Events } from '../../events/Events.js';
import { ApplicationScreen } from '../ApplicationScreen.js';
import { reactive, route, routeInitializer } from '../../lib/decorators.js';
import { IRouteResult } from '../../lib/decorators/route.js';
import { HttpStore } from '../../store/HttpStore.js';
import { buildRoute, navigate } from '../../lib/route.js';
import styles from './HomeStyles.js';
import layout from '../styles/layout.js';
import '../../../define/user-avatar.js';
import '../../../define/api-icon.js';

export default class HttpProjectHomeScreen extends ApplicationScreen {
  static get styles(): CSSResult[] {
    return [styles, layout];
  }

  @reactive() protected loadingSpaces = false;

  @reactive() protected loadingSpaceProjects = false;

  @reactive() protected loadingSpace = false;

  @reactive() protected loadingUser = false;

  @reactive() protected creatingProject = false;

  protected store?: HttpStore;

  @reactive() protected user?: IUser;

  /**
   * The list of currently rendered workspaces.
   */
  @reactive() protected spaces: IWorkspace[] = [];

  /**
   * The list of projects in a space.
   */
  @reactive() protected projects: IHttpProjectListItem[] = [];

  /**
   * THe spaces page cursor.
   */
  protected spacesCursor?: string;

  /**
   * THe projects page cursor.
   */
  protected projectsCursor?: string;

  /**
   * Whether the add space dialog is rendered.
   */
  @reactive() protected addSpaceDialogOpened = false;

  /**
   * The currently rendered space key.
   * It is only available with the `space` page.
   */
  protected spaceKey?: string;

  /**
   * The space definition for the `spaceKey`
   */
  protected space?: IWorkspace;

  @routeInitializer()
  async initialize(): Promise<void> {
    const store = await this.initializeStore();
    this.store = store;
    await this.observeSpaces(store);
    this.initialized = true;
    // async to the initialization
    this.loadUser();
  }

  async loadSpaces(): Promise<void> {
    this.loadingSpaces = true;
    const opts: IListOptions = {};
    if (this.spacesCursor) {
      opts.cursor = this.spacesCursor;
    }
    try {
      const result = await this.store!.sdk.space.list(opts);
      this.spaces = result.data as IWorkspace[];
      this.spacesCursor = result.cursor;
    } finally {
      this.loadingSpaces = false;
    }
  }

  async loadSpace(key: string): Promise<void> {
    this.loadingSpace = true;
    try {
      const result = await this.store!.sdk.space.read(key);
      this.space = result;
    } finally {
      this.loadingSpace = false;
    }
  }

  async loadUser(): Promise<void> {
    this.loadingUser = true;
    try {
      this.user = await this.store!.sdk.user.me();
    } finally {
      this.loadingUser = false;
    }
  }

  async observeSpaces(store: HttpStore): Promise<void> {
    try {
      const client = await store.sdk.space.observeSpaces() as WebSocket;
      client.addEventListener('message', this._spacesHandler.bind(this));
    } catch (e) {
      const err = e as Error;
      CoreEvents.Telemetry.exception(this.eventTarget, err.message, false);
    }
  }

  async loadSpaceProjects(key: string): Promise<void> {
    this.loadingSpaceProjects = true;
    try {
      const result = await this.store!.sdk.project.list(key);
      this.projects = result.data as IHttpProjectListItem[];
      this.projectsCursor = result.cursor;
    } finally {
      this.loadingSpaceProjects = false;
    }
  }

  async loadSpaceSpaces(key: string): Promise<void> {
    this.loadingSpaces = true;
    const opts: IListOptions = {
      parent: key,
    };
    if (this.spacesCursor) {
      opts.cursor = this.spacesCursor;
    }
    try {
      const result = await this.store!.sdk.space.list(opts);
      this.spaces = result.data as IWorkspace[];
      this.spacesCursor = result.cursor;
    } finally {
      this.loadingSpaces = false;
    }
  }

  private cleanupRoute(): void {
    this.spaces = [];
    this.projects = [];
    this.spacesCursor = undefined;
    this.projectsCursor = undefined;
    this.spaceKey = undefined;
    this.page = undefined;
  }

  @route({ pattern: '/recent', fallback: true, name: 'Recent', title: 'Recent projects' })
  recentRoute(): void {
    this.cleanupRoute();
    this.page = 'recent';
  }

  @route({ pattern: '/projects', name: 'Projects', title: 'Your projects' })
  projectsRoute(): void {
    this.cleanupRoute();
    this.page = 'projects';
    if (!this.spaces || !this.spaces.length) {
      this.loadSpaces();
    }
  }

  @route({ pattern: '/shared', name: 'Shared', title: 'Shared projects' })
  sharedRoute(): void {
    this.cleanupRoute();
    this.page = 'shared';
  }

  @route({ pattern: '/spaces/(?<key>.*)', name: 'Space', title: 'A space' })
  spaceRoute(info: IRouteResult): void {
    this.cleanupRoute();
    if (!info.params || !info.params.key) {
      throw new Error(`Invalid route configuration. Missing parameters.`);
    }
    const key = info.params.key as string;
    const space = this.spaces.find(i => i.key === key);
    this.page = 'space';
    this.spaceKey = key;
    this.loadSpaceProjects(this.spaceKey);
    this.loadSpaceSpaces(this.spaceKey);
    if (space) {
      this.space = space;
    } else {
      this.loadSpace(key);
    }
  }

  @route({ pattern: '*' })
  telemetryRoute(info: IRouteResult): void {
    CoreEvents.Telemetry.view(this.eventTarget, info.route.name || info.route.pattern || '/');
  }

  protected _addSpaceHandler(): void {
    this.addSpaceDialogOpened = true;
  }

  protected _dialogCloseHandler(e: CustomEvent): void {
    const { canceled, confirmed } = e.detail;
    if (!canceled && confirmed) {
      const input = document.querySelector('.space-name') as AnypointInputElement;
      if (!input.validate()) {
        return;
      }
      const { value } = input;
      this.createSpace(value, this.spaceKey);
      input.value = '';
    }
    this.addSpaceDialogOpened = false;
  }

  /**
   * Creates a new workspace in the store.
   * @param name The name of the space to create
   */
  protected async createSpace(name: string, parent?: string): Promise<void> {
    const opts: ISpaceCreateOptions = {};
    if (parent) {
      opts.parent = parent;
    }
    const space = Workspace.fromName(name);
    await this.store!.sdk.space.create(space, opts);
  }

  protected _spacesHandler(e: MessageEvent): void {
    const data = JSON.parse(e.data) as IBackendEvent;
    if (data.operation === 'created') {
      const space = data.data as IWorkspace;
      if (!this.spaces) {
        this.spaces = [];
      }
      this.spaces.push(space);
      this.render();
    } else if (data.operation === 'deleted') {
      const id = data.id as string;
      const index = (this.spaces || []).findIndex(i => i.key === id);
      if (index >= 0) {
        this.spaces.splice(index, 1);
        this.render();
      }
    }
  }

  protected _spaceKeydown(e: KeyboardEvent): void {
    if (e.key !== 'Enter') {
      return;
    }
    const node = e.target as HTMLElement;
    const { key, type } = node.dataset;
    if (!key || !type) {
      return;
    }
    if (type === 'space') {
      this.enterSpace(key);
    } else {
      Events.Navigation.HttpProject.open(key);
    }
  }

  protected _spaceClick(e: MouseEvent): void {
    const grid = e.currentTarget as HTMLElement;
    let node = e.target as HTMLElement;
    if (node === grid) {
      return;
    }
    while (node) {
      if (node.dataset.key) {
        if (node.dataset.type === 'space') {
          this.enterSpace(node.dataset.key);
        } else if (node.dataset.type === 'project') {
          Events.Navigation.HttpProject.open(node.dataset.key);
        }
        return;
      }
      if (node.parentElement === grid) {
        break;
      }
      node = node.parentElement as HTMLElement;
    }
  }

  protected enterSpace(key: string): void {
    navigate('spaces', key);
  }

  /**
   * A handler for the project create button click.
   * It creates a new HTTP project and opens the project in a new window.
   */
  protected _addProjectHandler(): void {
    this.createProject();
  }

  protected async createProject(): Promise<void> {
    const { spaceKey } = this;
    if (!spaceKey) {
      throw new Error(`The space key is missing.`);
    }
    const project = new HttpProject();
    const id = await this.store!.sdk.project.create(spaceKey, project);
    Events.Navigation.HttpProject.open(id);
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
      ${this.addSpaceDialog()}
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
        <li class="navigation-item ${page === 'projects' ? 'selected' : ''}"><a href="${buildRoute('projects')}">Projects</a></li>
        <li class="navigation-item ${page === 'shared' ? 'selected' : ''}"><a href="${buildRoute('shared')}">Shared with me</a></li>
      </ul>
    </nav>
    `;
  }

  mainTemplate(): TemplateResult {
    let template: TemplateResult;
    switch (this.page) {
      case 'projects': template = this.spacesTemplate(); break;
      case 'shared': template = this.sharedTemplate(); break;
      case 'space': template = this.spaceTemplate(); break;
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

  spacesTemplate(): TemplateResult {
    return html`
    <div class="title-area">
      <h2 class="section-title text-selectable">Your spaces</h2>
      <anypoint-button 
        emphasis="high" 
        class="right" 
        ?disabled="${this.loadingSpaces}"
        @click="${this._addSpaceHandler}"
      >
        <api-icon icon="add"></api-icon>
        Add new space
      </anypoint-button>
    </div>
    ${this.spacesGridTemplate()}
    `;
  }

  spacesGridTemplate(): TemplateResult {
    const { spaces, loadingSpaces } = this;
    if (loadingSpaces) {
      return html`
      <anypoint-progress indeterminate></anypoint-progress>
      `;
    }
    if (!spaces || !spaces.length) {
      return html`
      <p class="empty-info">
        You have no spaces.
      </p>
      ${this.spacesIntroduction()}
      `;
    }
    return html`
    <section class="spaces-grid" @keydown="${this._spaceKeydown}" @click="${this._spaceClick}">
      ${spaces.map((item) => this.spaceTileTemplate(item))}
    </section>
    `;
  }

  spaceTileTemplate(item: IWorkspace): TemplateResult {
    return html`
    <div class="space-tile" tabindex="0" data-key="${item.key}" data-type="space">
      <div class="space-icon">
        <api-icon icon="folder" class="icon"></api-icon>
      </div>
      <div class="space-label">${item.info.name}</div>
    </div>
    `;
  }

  spacesIntroduction(): TemplateResult {
    return html`
    <div class="introduction">
      <b>Spaces</b> allow you to organize your work. When using a network store a space can be shared with 
      other users.
    </div>
    `;
  }

  sharedTemplate(): TemplateResult {
    return html`
    <h2 class="section-title text-selectable">Shared spaces</h2>
    `;
  }

  addSpaceDialog(): TemplateResult {
    return html`
    <anypoint-dialog ?opened="${this.addSpaceDialogOpened}" @closed="${this._dialogCloseHandler}" class="add-space-dialog">
      <h2>Add a new space</h2>
      <section>
        <anypoint-input 
          class="space-name"
          type="text"
          name="name"
          infoMessage="The name for the space"
          invalidMessage="The space name is required. Please, enter space name."
          required
          autoValidate
          autofocus
        >
          <label slot="label">Space name</label>
        </anypoint-input>
      </section>
      <div class="buttons">
        <anypoint-button data-dialog-dismiss>Cancel</anypoint-button>
        <anypoint-button data-dialog-confirm>Confirm</anypoint-button>
      </div>
    </anypoint-dialog>
    `;
  }

  spaceTemplate(): TemplateResult {
    const { spaces, projects, space, loadingSpaceProjects, loadingSpaces } = this;
    return html`
    <div class="title-area">
      <h2 class="section-title text-selectable">${space ? space.info.name : 'loading...'}</h2>
      <div class="right">
        <anypoint-button 
          emphasis="medium"
          ?disabled="${this.loadingSpaces}"
          @click="${this._addSpaceHandler}"
        >
          <api-icon icon="add"></api-icon>
          New space
        </anypoint-button>
        <anypoint-button 
          emphasis="medium"
          ?disabled="${this.loadingSpaceProjects || this.creatingProject}"
          @click="${this._addProjectHandler}"
        >
          <api-icon icon="add"></api-icon>
          New project
        </anypoint-button>
      </div>
    </div>
    ${this.spacesGridTemplate2(spaces, loadingSpaces)}
    ${this.projectsGridTemplate2(projects, loadingSpaceProjects)}
    `;
  }

  spacesGridTemplate2(spaces: IWorkspace[], loading = false): TemplateResult {
    return html`
    ${loading ? html`<anypoint-progress indeterminate></anypoint-progress>` : ''}
    <section class="spaces-grid" @keydown="${this._spaceKeydown}" @click="${this._spaceClick}">
      ${spaces.map((item) => this.spaceTileTemplate(item))}
    </section>
    `;
  }

  projectsGridTemplate2(projects: IHttpProjectListItem[], loading = false): TemplateResult {
    return html`
    ${loading ? html`<anypoint-progress indeterminate></anypoint-progress>` : ''}
    <section class="projects-grid" @keydown="${this._spaceKeydown}" @click="${this._spaceClick}">
      ${projects.map((item) => this.projectTileTemplate(item))}
    </section>
    `;
  }

  projectTileTemplate(item: IHttpProjectListItem): TemplateResult {
    return html`
    <div class="project-tile">
      <div class="project-label">${item.name}</div>
      <div class="updated-label">Updated: <time-ago datetime="${new Date(item.updated).toISOString()}"></time-ago></div>
      <div class="project-tile-actions">
        <anypoint-button aria-label="Open project ${item.name}">Open</anypoint-button>
      </div>
    </div>
    `;
  }
}
