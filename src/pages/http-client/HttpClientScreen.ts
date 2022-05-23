import { html, TemplateResult, CSSResult } from 'lit';
// import { 
//   Events as CoreEvents, HttpProject, IHttpProject, IBackendEvent, HttpProjectKind, ProjectRequestKind, ProjectFolderKind,
//   EnvironmentKind, ApiError, IPatchRevision,
// } from '@api-client/core/build/browser.js';
// import { Patch, JsonPatch, ApplyResult } from '@api-client/json';
import { ApplicationScreen } from '../ApplicationScreen.js';
// import { Events } from '../../events/Events.js';
// import { EventTypes } from '../../events/EventTypes.js';
import styles from './HttpClientStyles.js';
import globalStyles from '../styles/global-styles.js';
import mainLayout from '../styles/grid-hnmf.js';
import { HttpClientContextMenu } from './HttpClientContextMenu.js';
import '../../define/layout-panel.js';
import { LayoutManager, ILayoutItem } from '../../elements/layout/LayoutManager.js';
import { IRoute } from '../../mixins/RouteMixin.js';
// import { randomString } from '../../lib/Random.js';
// import { navigate } from '../../lib/route.js';
// import AppInfo from './AppInfo.js';

export default class HttpProjectScreen extends ApplicationScreen {
  static get styles(): CSSResult[] {
    return [styles, globalStyles, mainLayout];
  }

  static get routes(): IRoute[] {
    return [
      { pattern: '/default', method: 'defaultRoute', fallback: true, name: 'HTTP Client home', title: 'HTTP Client home' },
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
    storeKey: 'api-client.http-client.layout',
  });

  constructor() {
    super();
    this.menu = new HttpClientContextMenu();
    this.menu.connect();
    this._contextMenuMutationCallback = this._contextMenuMutationCallback.bind(this);
    this.menu.store.set('callback', this._contextMenuMutationCallback);
    this.menu.store.set('layout', this.layout);
  }

  async initialize(): Promise<void> {
    if (!await this.isPlatformSupported()) {
      return;
    }
    const key = this.readWorkspaceKey();
    this.key = key;
    await this.requestWorkspace(key);
    this.layout.opts.storeKey = `api-client.http-client.layout.${key}`;
    await this.layout.initialize();
    this.initializeRouting();
    this.initialized = true;
    this.layout.addEventListener('change', this._renderHandler.bind(this));
    this.layout.addEventListener('nameitem', this._nameLayoutItemHandler.bind(this));
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

  protected readWorkspaceKey(): string {
    const url = new URL(window.location.href);
    const key = url.searchParams.get('key');
    return key || 'default';
  }

  /**
   * An event handler that renders the view on request.
   */
  protected _renderHandler(): void {
    this.render();
  }

  /**
   * A reference to this function is passed to the context menu
   * and it is called when a project mutates.
   */
  protected _contextMenuMutationCallback(): void {
    this.render();
    // this.updateProject();
    // const { nav } = this;
    // if (nav) {
    //   nav.requestUpdate();
    // }
  }

  protected _nameLayoutItemHandler(event: Event): void {
    // const item = (event as CustomEvent).detail as ILayoutItem;
    // if (item.kind === ProjectFolderKind) {
    //   const folder = this.project?.findFolder(item.key);
    //   if (folder && folder.info.name) {
    //     item.label = folder.info.name;
    //   } else {
    //     item.label = 'Folder';
    //   }
    //   item.icon = 'folder';
    // } else if (item.kind === ProjectRequestKind) {
    //   const request = this.project?.findRequest(item.key);
    //   if (request && request.info.name && request.info.name !== 'http://') {
    //     item.label = request.info.name;
    //   } else if (request && request.expects.url) {
    //     item.label = request.expects.url;
    //   } else {
    //     item.label = 'HTTP request';
    //   }
    //   item.icon = 'request';
    // } else if (item.kind === EnvironmentKind) {
    //   const env = this.project?.getEnvironment(item.key);
    //   if (env && env.info.name) {
    //     item.label = env.info.name;
    //   } else {
    //     item.label = 'Environment';
    //   }
    //   item.icon = 'environment';
    // }
  }

  // protected _requestChangeHandler(e: Event): void {
  //   const node = e.target as HTMLElement;
  //   const key = node.dataset.key as string;
  //   if (!key) {
  //     return;
  //   }
  //   this.layout.requestNameUpdate(key);
  // }

  protected async requestWorkspace(key: string): Promise<void> {
    // ...
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
    return html`
    <div class="project-nav">Todo</div>
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
          The workspace you are trying to open does not exist or was removed.
        </p>
      </div>
    </main>`;
  }

  protected renderLayout(): TemplateResult[] {
    const { layout } = this;
    return layout.render(this.renderItem.bind(this));
  }

  protected renderItem(item: ILayoutItem, visible: boolean): TemplateResult {
    switch (item.kind) {
      default: return html`<p ?hidden="${!visible}" data-key="${item.key}" >Unsupported object: ${item.kind}</p>`;
    }
  }
}
