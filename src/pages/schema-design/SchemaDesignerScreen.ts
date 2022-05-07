import { html, TemplateResult, CSSResult } from 'lit';
import { DataNamespace, IDataNamespace, ApiError, Events as CoreEvents, IBackendEvent, DataNamespaceKind, IPatchRevision, DataEntityKind, DataModelKind, DataModel, DataEntity } from '@api-client/core/build/browser.js';
import { JsonPatch, Patch } from '@api-client/json';
import { ApplicationScreen } from '../ApplicationScreen.js';
import { query, reactive } from '../../lib/decorators.js';
import styles from './styles.js';
import globalStyles from '../styles/global-styles.js';
import mainLayout from '../styles/grid-hnmf.js';
import { IRoute, IRouteResult } from '../../mixins/RouteMixin.js';
import { EventTypes } from '../../events/EventTypes.js';
import { Events } from '../../events/Events.js';
import { navigate } from '../../lib/route.js';
import { SchemaDesignerContextMenu } from './SchemaDesignerContextMenu.js';
import NavElement from '../../elements/schema-design/SchemaDesignNavigationElement.js';
import AppInfo from './AppInfo.js';
import { randomString } from '../../lib/Random.js';
import { ISelectDetail } from '../../elements/navigation/AppNavigationElement.js';
import '../../define/schema-design-navigation.js';
import '../../define/data-entity-editor.js';
import '../../define/viz-workspace.js';
import { DataModelLayout } from '../../visualization/plugin/positioning/DataModelLayout.js';

export default class SchemaDesignerScreen extends ApplicationScreen {
  static get styles(): CSSResult[] {
    return [styles, globalStyles, mainLayout];
  }

  static get routes(): IRoute[] {
    return [
      { pattern: '/default', method: 'defaultRoute', fallback: true, name: 'Schema Designer', title: 'Schema Designer Home home' },
      { pattern: '/404', method: 'e404Route', name: 'Not found', title: 'Not found' },
      // { pattern: '/namespace/(?<key>.*)', method: 'namespaceRoute', name: 'Namespace', title: 'A namespace' },
      { pattern: '/model/(?<key>.*)', method: 'modelRoute', name: 'Data model', title: 'A data model' },
      { pattern: '/entity/(?<key>.*)', method: 'entityRoute', name: 'Entity model', title: 'An entity model' },
    ];
  }

  /**
   * The schema file key.
   */
  key?: string;

  /**
   * The read data namespace.
   */
  @reactive() root?: DataNamespace;

  protected menu: SchemaDesignerContextMenu;

  @query('schema-design-navigation')
  nav?: NavElement;

  protected updatingSchema?: boolean;

  protected isDirty?: boolean;

  protected schema?: string;

  /**
   * Own patches sent to the server.
   * These are removed after the sever event is received.
   */
  protected pendingPatches = new Map<string, JsonPatch>();

  /**
   * The list of patches made by the current user and received from the server since the beginning of this session
   * or page reload.
   * This is to used to recognize own patches so it won't process a patch that is already applied to the project.
   */
  protected livePatches = new Map<string, IPatchRevision>();

  /**
   * The key of the selected item in the root namespace. It corresponds to the `page`.
   */
  @reactive() selected?: string;

  @reactive() current?: DataNamespace | DataModel | DataEntity;

  constructor() {
    super();
    this.menu = new SchemaDesignerContextMenu();
    this.menu.connect();
    this.menu.store.set('callback', this._contextMenuMutationCallback.bind(this));
  }

  async initialize(): Promise<void> {
    if (!await this.isPlatformSupported()) {
      return;
    }
    await this.initializeStore();
    const key = this.readFileKey();
    if (!key) {
      this.reportCriticalError('The project key is not set. Go back to the start page.');
      return;
    }
    this.key = key;
    const hasFile = await this.requestNamespaceFile(key);
    if (!hasFile) {
      this.initializeRouting();
      this.initialized = true;
      return;
    }
    this.loadUser();
    await this._startObservingProjectFile(key);
    this.initializeRouting();
    this.initialized = true;
    window.addEventListener(EventTypes.Store.File.State.fileChange, this._fileChangeHandler.bind(this));
    window.addEventListener(EventTypes.SchemaDesign.changed, this._contextMenuMutationCallback.bind(this));
  }

  protected async _startObservingProjectFile(key: string): Promise<void> {
    try {
      await Events.Store.File.observeFile(key, 'media');
    } catch (e) {
      this.reportCriticalError('Unable to observe the data namespace file changes.')
    }
  }

  protected resetRoute(): void {
    this.page = undefined;
    this.selected = undefined;
    this.current = undefined;
  }

  protected defaultRoute(): void {
    this.resetRoute();
    this.page = 'default';
  }

  protected e404Route(): void {
    this.resetRoute();
    this.page = '404';
  }

  // protected namespaceRoute(info: IRouteResult): void {
  //   if (!info.params || !info.params.key) {
  //     throw new Error(`Invalid route configuration. Missing parameters.`);
  //   }
  //   this.resetRoute();
  //   const key = info.params.key as string;
  //   this.page = 'namespace';
  //   this.selected = key;
  //   const { root } = this;
  //   if (!root) {
  //     return;
  //   }
  //   this.current = root.findNamespace(key);
  // }

  protected async modelRoute(info: IRouteResult): Promise<void> {
    if (!info.params || !info.params.key) {
      throw new Error(`Invalid route configuration. Missing parameters.`);
    }
    this.resetRoute();
    const key = info.params.key as string;
    this.page = 'model';
    this.selected = key;
    const { root } = this;
    if (!root) {
      return;
    }
    this.current = root.findDataModel(key);
    await this.updateComplete;
    requestAnimationFrame(() => {
      this._positionDataModel();
    });
  }

  protected _positionDataModel(): void {
    const workspace = document.querySelector('viz-workspace');
    if (!workspace || !this.current) {
      return;
    }
    const layout = new DataModelLayout(workspace);
    const result = layout.layout(this.current as DataModel);
    result?.nodes.forEach((info) => {
      const node = document.querySelector(`[data-key="${info.id}"]`) as HTMLElement;
      if (node) {
        node.style.transform = `translate(${info.node.x}px, ${info.node.y}px)`;
      }
    });
    workspace.edges.recalculate()
  }

  protected entityRoute(info: IRouteResult): void {
    if (!info.params || !info.params.key) {
      throw new Error(`Invalid route configuration. Missing parameters.`);
    }
    this.resetRoute();
    const key = info.params.key as string;
    this.page = 'entity';
    this.selected = key;
  }

  protected readFileKey(): string | undefined {
    const url = new URL(window.location.href);
    const key = url.searchParams.get('key');
    return key || undefined;
  }

  protected async requestNamespaceFile(key: string): Promise<boolean> {
    try {
      const media = await Events.Store.File.read(key, true) as IDataNamespace;
      this.schema = JSON.stringify(media);
      this.root = new DataNamespace(media);
      this.menu.store.set('schema', this.root);
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
   * A reference to this function is passed to the context menu
   * and it is called when a project mutates.
   */
  protected _contextMenuMutationCallback(): void {
    this.render();
    this.updateSchema();
    const { nav } = this;
    if (nav) {
      nav.requestUpdate();
    }
  }

  protected _fileChangeHandler(event: Event): void {
    const e = event as CustomEvent;
    const info = e.detail as IBackendEvent;
    const { schema, root } = this;
    if (!schema || !root) {
      return;
    }
    if (info.kind !== DataNamespaceKind || info.operation !== 'patch') {
      return;
    }
    const iData = JSON.parse(schema);
    const rev = info.data as IPatchRevision;
    const { id } = rev;
    const ownPatch = this.pendingPatches.get(id);
    if (ownPatch) {
      this.livePatches.set(id, rev);
      this.pendingPatches.delete(id);
      return;
    }
    const result = Patch.apply(iData, rev.patch);
    this.schema = JSON.stringify(result.doc);
    this.root?.new(result.doc as IDataNamespace);
    this.render();
    const { nav } = this;
    if (nav) {
      nav.requestUpdate();
    }
  }

  async updateSchema(): Promise<void> {
    if (this.updatingSchema) {
      this.isDirty = true;
      return;
    }

    const { schema, root } = this;
    if (!root || !schema) {
      // eslint-disable-next-line no-console
      console.warn(`Trying to update the schema but none is set.`);
      return;
    }

    const newSchema = root.toJSON();
    const diff = Patch.diff(JSON.parse(schema), newSchema);
    if (!diff.length) {
      // eslint-disable-next-line no-console
      console.warn(`Expected to detect changes to the data schema.`);
      return;
    }
    this.updatingSchema = true;
    // gives 2.092279e+13 permutations.
    const id = randomString(16);
    this.pendingPatches.set(id, diff);
    try {
      await Events.Store.File.patch(root.key, id, diff, AppInfo, true);
      this.schema = JSON.stringify(newSchema);
    } catch (e) {
      const cause = e as Error;
      CoreEvents.Telemetry.exception(window, cause.message, true);
      this.reportCriticalError(cause.message);
    } finally {
      this.updatingSchema = false;
      if (this.isDirty) {
        this.updateSchema();
      }
    }
  }

  protected _navigationSelectionHandler(e: CustomEvent): void {
    const { key, kind } = e.detail as ISelectDetail;
    const base = this._kindToRoute(kind);
    if (base) {
      navigate(base, key);
    }
  }

  protected _kindToRoute(kind: string): string | undefined {
    switch (kind) {
      case DataEntityKind: return 'entity';
      case DataModelKind: return 'model';
      default: return undefined;
      // default: return 'namespace';
    }
  }

  protected _entityChangeHandler(): void {
    this.updateSchema();
  }

  protected _entityNameChangeHandler(): void {
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
    const { root } = this;
    const rootTitle = root && root.info && root.info.name;
    const title = rootTitle || 'Schema Designer';
    return html`
    <header class="start-page-header">
      <h1 class="start-page-header-title">${title}</h1>
      <app-settings-menu .user="${this.user}" class="toolbar-action"></app-settings-menu>
    </header>
    `;
  }

  protected navigationTemplate(): TemplateResult {
    return html`
    <schema-design-navigation .root="${this.root}" .selected="${this.selected}" @select="${this._navigationSelectionHandler}"></schema-design-navigation>
    `;
  }

  protected mainTemplate(): TemplateResult {
    const { page } = this;
    if (page === '404') {
      return this.e404Template();
    }
    return html`
    <main>
    ${this.renderPage()}
    </main>`;
  }

  protected e404Template(): TemplateResult {
    return html`
    <main>
      <div class="full-error">
        <h2>Not found</h2>
        <p class="description">
          The schema you are trying to open does not exist, was removed,
          or you lost access to it.
        </p>
        <anypoint-button emphasis="high" @click="${this.openStart}">Back to start</anypoint-button>
      </div>
    </main>`;
  }

  protected renderPage(): TemplateResult {
    switch (this.page) {
      // case 'namespace': return this._namespaceTemplate();
      case 'model': return this._dataModelTemplate();
      case 'entity': return this._entityTemplate();
      default: return this._emptySelectionTemplate();
    }
  }

  protected _emptySelectionTemplate(): TemplateResult {
    return html`
    <div class="empty-state">
      Schema designer allows you to design data and translate them into schemas which then can be used in other tools 
      to generate HTTP payloads and examples.

      <p style="color: red">Please, fix me, style me.</p>
    </div>
    `;
  }

  // protected _namespaceTemplate(): TemplateResult {
  //   return html`
  //   <p>TODO: Namespace view for ${this.selected}</p>
  //   `;
  // }

  protected _dataModelTemplate(): TemplateResult {
    return html`
    <viz-workspace>${this._dataModelVisualizationContent()}</viz-workspace>
    `;
  }

  protected _dataModelVisualizationContent(): TemplateResult | string {
    const { selected, root } = this;
    if (!selected || !root) {
      return '';
    }
    const dm = root.findDataModel(selected);
    if (!dm) {
      return '';
    }
    const all = dm.entities;
    all.forEach((item) => {
      item.parents.forEach(id => {
        if (all.some(i => i.key === id)) {
          return;
        }
        const parent = dm.getParent()!.root!.definitions.entities.find(i => i.key === id);
        if (parent) {
          all.push(parent);
        }
      });
      item.associations.forEach(assoc => {
        if (!assoc.target) {
          return;
        }
        if (all.some(i => i.key === assoc.target)) {
          return;
        }
        const entity = assoc.getTarget();
        if (entity) {
          all.push(entity);
        }
      });
    });

    return html`
    ${all.map(item => this._entityVisualization(item))}
    `;
  }

  protected _entityVisualization(entity: DataEntity): TemplateResult {
    return html`
    <div class="entity" data-key="${entity.key}" style="width: 250px; height: 400px;    background-color: #03a9f46b;" data-selectable="true">
      <div>${entity.info.renderLabel}</div>
      ${entity.associations.map(assoc => html`<viz-association data-key="${assoc.key}" data-target="${assoc.target!}"></viz-association>`)}
    </div>
    `;
  }

  protected _entityTemplate(): TemplateResult {
    return html`
    <data-entity-editor .root="${this.root}" .selected="${this.selected}" @change="${this._entityChangeHandler}" @namechange="${this._entityNameChangeHandler}"></data-entity-editor>
    `;
  }
}
