/* eslint-disable @typescript-eslint/no-explicit-any */
import { css, CSSResult, html, PropertyValueMap, TemplateResult, nothing } from "lit";
import { classMap } from "lit/directives/class-map.js";
import { property, state, eventOptions } from "lit/decorators.js";
import { 
  ContextListOptions, IAppRequest, AppProject, Events as CoreEvents, ErrorResponse, IResponse, AppProjectFolder, 
  AppProjectRequest, ContextStateUpdateEvent, ContextStateDeleteEvent, IAppProject, AppProjectFolderKind, AppProjectKind, AppProjectRequestKind, EnvironmentKind, Environment 
} from "@api-client/core/build/browser.js";
import '@anypoint-web-components/awc/dist/define/anypoint-icon-button.js';
import '@github/time-elements/dist/relative-time-element.js'
import AppNavigation from "../navigation/AppNavigationElement.js";
import theme from '../theme.js';
import { EventTypes } from '../../events/EventTypes.js';
import { Events } from '../../events/Events.js';
import { relativeDay } from "../../lib/time/Conversion.js";
import '../../define/api-icon.js';
import { statusIndicator, StatusStyles } from "../http/HttpStatus.js";
import { ModelStateDeleteEvent } from "../../events/http-client/models/BaseEvents.js";

interface IPageState {
  /**
   * The next page cursor.
   */
  cursor?: string;
  /**
   * Whether the last query resulted with an empty response.
   */
  ended?: boolean;
}

/**
 * Main app navigation for the HttpClient application.
 * 
 * @fires rail - Dispatched when the `rail` selection change
 * @fires minimized - Dispatched when the navigation's `minimized` value change.
 */
export default class HttpClientNavigationElement extends AppNavigation {
  static get styles(): CSSResult[] {
    return [
      ...AppNavigation.styles,
      theme,
      StatusStyles,
      css`
      :host {
        height: inherit;
      }

      .menu {
        display: flex;
        flex-direction: row;
        height: inherit;
        overflow: hidden;
        height: inherit;
      }

      .rail {
        width: 56px;
        display: flex;
        flex-direction: column;
        align-items: center;
        min-width: 56px;
        padding: 12px 0;
      }

      [hidden],
      .hidden {
        display: none !important;
      }

      .menu-item {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: 1px var(--rail-menu-icon-color, var(--accent-color)) solid;
        margin-bottom: 20px;
      }

      .menu-item api-icon {
        color: var(--rail-menu-icon-color, var(--accent-color));
      }

      .menu-item.selected {
        background-color: var(--rail-menu-icon-color, var(--accent-color));
      }

      .menu-item.selected api-icon {
        color: var(--rail-menu-icon-selected-color, #fff);
      }

      .menu-content {
        display: flex;
        flex: 1;
        flex-direction: column;
        height: inherit;
        overflow: hidden;
      }

      .menu > .content {
        border-left: 1px var(--menu-content-border-color, #e5e5e5) solid;
        border-right: 1px var(--menu-content-border-color, #e5e5e5) solid;
        display: flex;
        flex-direction: column;
        overflow: auto;
        flex: 1;
      }

      .menu-title {
        background-color: var(--menu-title-background-color);
        color: var(--menu-title-color);
        min-height: 56px;
        display: flex;
        align-items: center;
      }

      .menu-title-label {
        font-size: 20px;
        font-weight: 300;
        margin-left: 20px;
      }

      .history .list-item-content {
        min-height: var(--list-item-two-line-height, 72px);
        display: flex;
        flex-direction: column;
        align-items: start;
        justify-content: center;
        padding: 0px 20px;
        overflow: hidden;
      }

      .history .status-info::before, 
      .history .status-ok::before, 
      .history .status-redirect::before, 
      .history .status-client-error::before, 
      .history .status-server-error::before {
        width: 16px;
        height: 16px;
        min-width: 16px;
        min-height: 16px;
      }

      .request-info {
        display: flex;
        flex-direction: row;
        align-items: center;
        margin-bottom: 4px;
        overflow: hidden;
        width: inherit;
      }

      .request-info .method {
        margin-right: 8px;
        text-transform: uppercase;
      }

      .response-info {
        margin-top: 4px;
        font-size: var(--secondary-text-size);
        color: var(--secondary-text-color);
        margin-left: 24px;
        display: flex;
        align-self: stretch;
        overflow: hidden;
      }

      .response-status {
        margin-right: 12px;
      }

      .response-separator {
        width: 1px;
        background-color: var(--divider-color);
        margin: 0 12px;
      }

      .url {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .history-meta {
        font-size: var(--secondary-text-size);
        color: var(--secondary-text-color);
        display: flex;
        align-items: center;
        overflow: hidden;
        white-space: nowrap;
      }

      relative-time {
        margin-right: 4px;
      }

      .day-item[aria-disabled="true"] {
        opacity: 1;
      }
      
      .root .day-item {
        color: var(--secondary-text-color);
        display: flex;
        flex-direction: column;
        align-items: start;
        justify-content: center;
        padding: 8px 20px 0 20px;
        margin: 4px 0;
        border-top: 1px var(--divider-color) solid;
        text-transform: uppercase;
      }

      .empty-list {
        flex: 1;
        align-items: center;
        justify-content: center;
        display: flex;
        color: var(--secondary-text-color);
        font-size: 1.2rem;
        flex-direction: column;
        font-style: italic;
      }

      .empty-icon {
        width: 80px;
        height: 80px;
        margin-bottom: 20px;
        fill: inherit;
      }

      .empty-list.projects {
        fill: #ce93d8;
        color: #8e22a0;
      }

      .empty-list.history {
        fill: #a5d6a7;
        color: #246327;
      }

      .empty-list.saved {
        fill: #ffcc80;
        color: #804c00;
      }

      .empty-list p {
        text-align: center;
      }

      .empty-list .tip {
        color: var(--secondary-text-color);
        font-size: var(--secondary-text-size);
        margin: 20px;
      }

      .empty-button {
        margin: 20px;
      }
      `,
    ];
  }

  /**
   * When set only the navigation rail is rendered.
   */
  @property({ type: Boolean, reflect: true }) minimized?: boolean;

  /**
   * The selected rail element.
   */
  @property({ type: String, reflect: true }) rail: string;

  @state() protected _sortedHistory?: IAppRequest[][];

  protected _history?: IAppRequest[];

  @state() protected projects: AppProject[] = [];

  @state() protected loading?: boolean;

  protected _pageInfo = new Map<'history' | 'projects', IPageState>();

  constructor() {
    super();
    this.rail = 'projects';
    this._modelDestroyedHandler = this._modelDestroyedHandler.bind(this);
    this._historyUpdatedHandler = this._historyUpdatedHandler.bind(this);
    this._historyDeletedHandler = this._historyDeletedHandler.bind(this);
    this._projectUpdatedHandler = this._projectUpdatedHandler.bind(this);
    this._projectDeletedHandler = this._projectDeletedHandler.bind(this);
  }

  connectedCallback(): void {
    super.connectedCallback();
    window.addEventListener(EventTypes.HttpClient.Model.destroyed, this._modelDestroyedHandler as EventListener);
    window.addEventListener(EventTypes.HttpClient.Model.History.State.update, this._historyUpdatedHandler as EventListener);
    window.addEventListener(EventTypes.HttpClient.Model.History.State.delete, this._historyDeletedHandler as EventListener);
    window.addEventListener(EventTypes.HttpClient.Model.Project.State.update, this._projectUpdatedHandler as EventListener);
    window.addEventListener(EventTypes.HttpClient.Model.Project.State.delete, this._projectDeletedHandler as EventListener);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener(EventTypes.HttpClient.Model.destroyed, this._modelDestroyedHandler as EventListener);
    window.removeEventListener(EventTypes.HttpClient.Model.History.State.update, this._historyUpdatedHandler as EventListener);
    window.removeEventListener(EventTypes.HttpClient.Model.History.State.delete, this._historyDeletedHandler as EventListener);
    window.removeEventListener(EventTypes.HttpClient.Model.Project.State.update, this._projectUpdatedHandler as EventListener);
    window.removeEventListener(EventTypes.HttpClient.Model.Project.State.delete, this._projectDeletedHandler as EventListener);
  }

  protected updated(cp: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
    super.updated(cp);
    if (cp.has('rail')) {
      this._requestData();
    }
  }

  protected _modelDestroyedHandler(e: ModelStateDeleteEvent): void {
    const { store } = e;
    if (store === 'History') {
      this._history = undefined;
      this._sortedHistory = undefined;
      this._pageInfo.delete('history');
    } else if (store === 'Projects') {
      this.projects = [];
      this._pageInfo.delete('projects');
    }
  }

  protected _historyUpdatedHandler(e: ContextStateUpdateEvent<IAppRequest>): void {
    const { key, item } = e.detail;
    if (!item) {
      return;
    }
    if (!this._history) {
      this._history = [item];
      this._sortedHistory = [[item]];
      return;
    }
    const current = this._history;
    const index = current.findIndex(i => i.key === key);
    if (index >= 0) {
      current[index] = item;
    } else {
      current.push(item);
    }
    this._computeHistory(current);
    this.requestUpdate();
  }

  protected _historyDeletedHandler(e: ContextStateDeleteEvent): void {
    const { key } = e.detail;
    const { _history, _sortedHistory } = this;

    if (!_history || !_sortedHistory) {
      return;
    }
    const index = _history.findIndex(i => i.key === key);
    if (index >= 0) {
      _history.splice(index, 1);
      this.requestUpdate();
    }
    for (const group of _sortedHistory) {
      const subIndex = group.findIndex(i => i.key === key);
      if (subIndex >= 0) {
        group.splice(subIndex, 1);
        this.requestUpdate();
        break;
      }
    }
  }

  protected _projectUpdatedHandler(e: ContextStateUpdateEvent<IAppProject>): void {
    const { key, item } = e.detail;
    if (!item) {
      return;
    }
    const current = this.projects;
    const index = current.findIndex(i => i.key === key);
    if (index >= 0) {
      current[index] = new AppProject(item);
    } else {
      current.push(new AppProject(item));
    }
    this.requestUpdate();
  }

  protected _projectDeletedHandler(e: ContextStateDeleteEvent): void {
    const { key } = e.detail;
    const current = this.projects;
    const index = current.findIndex(i => i.key === key);
    if (index >= 0) {
      current.splice(index, 1);
      this.requestUpdate();
    }
  }

  protected async _requestData(): Promise<void> {
    const { rail } = this;
    if (!['history', 'projects'].includes(rail)) {
      return;
    }
    if (rail === 'history' && !this._sortedHistory) {
      await this.getHistoryPage();
    } else if (rail === 'projects' && !this.projects.length) {
      await this.getProjectsPage();
    }
  }

  protected async _nextPage(): Promise<void> {
    const { rail, loading } = this;
    if (loading) {
      return;
    }
    if (rail === 'history') {
      await this.getHistoryPage();
    } else if (rail === 'projects') {
      await this.getProjectsPage();
    }
  }

  protected async getHistoryPage(): Promise<void> {
    const info = this._pageInfo.get('history');
    if (info && info.ended) {
      return;
    }
    this.loading = true;
    const opts: ContextListOptions = {};
    if (info && info.cursor) {
      opts.nextPageToken = info.cursor;
    } else {
      opts.limit = 100;
    }
    try {
      const data = await Events.HttpClient.Model.History.list(opts, this);
      if (data) {
        if (data.nextPageToken) {
          this._pageInfo.set('history', { cursor: data.nextPageToken });
        }
        if (data.items.length) {
          this._addHistoryList(data.items);
        } else {
          this._pageInfo.set('history', { ended: true });
        }
      }
    } catch (e) {
      const err = e as Error;
      CoreEvents.Telemetry.exception(err.message, false, this);
    } finally {
      this.loading = false;
    }
  }

  protected async getProjectsPage(): Promise<void> {
    const info = this._pageInfo.get('projects');
    if (info && info.ended) {
      return;
    }
    this.loading = true;
    const opts: ContextListOptions = {};
    if (info && info.cursor) {
      opts.nextPageToken = info.cursor;
    } else {
      opts.limit = 100;
    }
    try {
      const data = await Events.HttpClient.Model.Project.list(opts, this);
      if (data) {
        if (data.nextPageToken) {
          this._pageInfo.set('projects', { cursor: data.nextPageToken });
        }
        if (data.items.length) {
          const instances = data.items.map(i => new AppProject(i));
          this.projects = this.projects.concat(instances);
        } else {
          this._pageInfo.set('projects', { ended: true });
        }
      }
    } catch (e) {
      const err = e as Error;
      CoreEvents.Telemetry.exception(err.message, false, this);
    } finally {
      this.loading = false;
    }
  }

  protected _addHistoryList(list: IAppRequest[]): void {
    // this.history = this.history.concat(data.items);
    const { _history } = this;
    if (_history) {
      const updated = _history.concat(list);
      this._history = updated;
      this._computeHistory(updated);
    } else {
      this._history = list;
      this._computeHistory(list);
    }
  }

  protected _computeHistory(history: IAppRequest[]): void {
    if (!Array.isArray(history) || !history.length) {
      return;
    }
    const result: IAppRequest[][] = [];
    const now = Date.now();
    history.forEach((current) => {
      const { midnight = now } = current;
      const index = result.findIndex(i => i[0].midnight === midnight);
      if (index >= 0) {
        this._pushSorted(result[index], current);
      } else if (result[0] && result[0][0].midnight as number < midnight) {
        result.unshift([current]);
      } else {
        result.push([current]);
      }
    });
    this._sortedHistory = result;
  }

  /**
   * Allows to push a history item into a right index depending on the `created` property
   * so the data processor can skip sorting each group after mutation.
   * 
   * The item is inserted before an item that is older (has lower `created` property). 
   * 
   * @param list The list to insert the item to
   * @param item The item to insert.
   */
  protected _pushSorted(list: IAppRequest[], item: IAppRequest): void {
    const older = list.findIndex(i => (i.created || 0) < (item.created || 0));
    if (older >= 0) {
      list.splice(older, 0, item);
    } else {
      // this item is the oldest
      list.push(item);
    }
  }

  protected _railClickHandler(e: Event): void {
    const node = e.currentTarget as HTMLElement;
    const { type } = node.dataset;
    if (!type) {
      return;
    }
    if (this.selected === type) {
      this.minimized = !this.minimized;
      this._notifyMinimized();
      return;
    }
    this.rail = type;
    this._notifyRailSelection();
    if (this.minimized) {
      this.minimized = false;
      this._notifyMinimized();
    }
  }

  protected _notifyMinimized(): void {
    this.dispatchEvent(new Event('minimized'));
  }

  protected _notifyRailSelection(): void {
    this.dispatchEvent(new Event('rail'));
  }

  @eventOptions({ passive: true })
  protected _listScrollHandler(e: Event): void {
    const node = e.target as HTMLElement;
    const { scrollTop, offsetHeight, scrollHeight } = node;
    if (scrollTop + offsetHeight >= scrollHeight - 148) {
      this._nextPage();
    }
  }

  protected _createProjectHandler(): void {
    const project = AppProject.fromName('New project');
    Events.HttpClient.Model.Project.update(project.toJSON(), this);
  }

  protected _findProjectParentItem(key: string): HTMLLIElement | null | undefined {
    const node = this.shadowRoot?.querySelector(`li[data-key="${key}"]`) as HTMLLIElement | null;
    if (!node) {
      return undefined;
    }
    let current = node.parentElement as HTMLElement;
    while (current) {
      if (current.nodeType !== Node.ELEMENT_NODE) {
        current = current.parentElement as HTMLElement
        continue;
      }
      if (current.nodeName !== 'li' || current.dataset.kind !== AppProjectKind) {
        current = current.parentElement as HTMLElement
        continue;
      }
      break;
    }
    return current as HTMLLIElement;
  }

  protected async _commitName(key: string, kind: string, name: string): Promise<void> {
    if (!name) {
      return;
    }
    switch (kind) {
      case AppProjectFolderKind: await this._commitFolderName(key, name); break;
      case AppProjectRequestKind: await this._commitRequestName(key, name); break;
      case EnvironmentKind: await this._commitProjectEnvironmentName(key, name); break;
      case AppProjectKind: await this._commitProjectName(key, name); break;
      default:
    }
  }

  protected async _commitFolderName(key: string, name: string): Promise<void> {
    const node = this.shadowRoot?.querySelector(`li[data-key="${key}"]`) as HTMLLIElement | null;
    const pid = node?.dataset?.root;
    if (!pid) {
      return;
    }
    const schema = await Events.HttpClient.Model.Project.read(pid, this);
    if (!schema) {
      return;
    }
    const project = new AppProject(schema);
    const folder = project.findFolder(key);
    if (!folder) {
      return;
    }
    folder.info.name = name;
    await Events.HttpClient.Model.Project.update(project.toJSON(), this);
    this.edited = undefined;
  }

  protected async _commitRequestName(key: string, name: string): Promise<void> {
    const node = this.shadowRoot?.querySelector(`li[data-key="${key}"]`) as HTMLLIElement | null;
    const pid = node?.dataset?.root;
    if (!pid) {
      return;
    }
    const schema = await Events.HttpClient.Model.Project.read(pid, this);
    if (!schema) {
      return;
    }
    const project = new AppProject(schema);
    const request = project.findRequest(key);
    if (!request) {
      return;
    }
    request.info.name = name;
    await Events.HttpClient.Model.Project.update(project.toJSON(), this);
    this.edited = undefined;
  }

  protected async _commitProjectEnvironmentName(key: string, name: string): Promise<void> {
    const node = this.shadowRoot?.querySelector(`li[data-key="${key}"]`) as HTMLLIElement | null;
    const pid = node?.dataset?.root;
    if (!pid) {
      return;
    }
    const schema = await Events.HttpClient.Model.Project.read(pid, this);
    if (!schema) {
      return;
    }
    const project = new AppProject(schema);
    const env = project.findEnvironment(key);
    if (!env) {
      return;
    }
    env.info.name = name;
    await Events.HttpClient.Model.Project.update(project.toJSON(), this);
    this.edited = undefined;
  }

  protected async _commitProjectName(key: string, name: string): Promise<void> {
    const schema = await Events.HttpClient.Model.Project.read(key, this);
    if (!schema) {
      return;
    }
    const project = new AppProject(schema);
    project.info.name = name;
    await Events.HttpClient.Model.Project.update(project.toJSON(), this);
    this.edited = undefined;
  }

  render(): TemplateResult {
    return html`
    <div class="menu">
      ${this._railTemplate()}
      ${this._panelsTemplate()}
    </div>
    `;
  }

  protected _railTemplate(): TemplateResult {
    const { anypoint, rail } = this;

    return html`
    <div class="rail">
      <anypoint-icon-button
        title="Select projects"
        ?anypoint="${anypoint}"
        class=${classMap({'menu-item': true, selected: rail === 'projects'})}
        data-type="projects"
        @click="${this._railClickHandler}"
      >
        <api-icon icon="collectionsBookmark"></api-icon>
      </anypoint-icon-button>

      <anypoint-icon-button
        title="Select history"
        ?anypoint="${anypoint}"
        class=${classMap({'menu-item': true, selected: rail === 'history'})}
        data-type="history"
        @click="${this._railClickHandler}"
      >
        <api-icon icon="history"></api-icon>
      </anypoint-icon-button>

      <anypoint-icon-button
        title="Select saved"
        ?anypoint="${anypoint}"
        class=${classMap({'menu-item': true, selected: rail === 'saved'})}
        data-type="saved"
        @click="${this._railClickHandler}"
      >
        <api-icon icon="save"></api-icon>
      </anypoint-icon-button>

      <anypoint-icon-button
        title="Select REST APIs"
        ?anypoint="${anypoint}"
        class=${classMap({'menu-item': true, selected: rail === 'rest-apis'})}
        data-type="rest-apis"
        @click="${this._railClickHandler}"
      >
        <api-icon icon="cloud"></api-icon>
      </anypoint-icon-button>
    </div>`;
  }

  protected _panelsTemplate(): TemplateResult {
    return html`
    <div class="content" ?hidden="${this.minimized}" @scroll="${this._listScrollHandler}">
      ${this._historyTemplate()}
      ${this._savedTemplate()}
      ${this._projectsTemplate()}
      ${this._restApisTemplate()}
    </div>
    `;
  }

  protected _historyTemplate(): TemplateResult | typeof nothing {
    if (this.rail !== 'history') {
      return nothing;
    }
    const { _sortedHistory } = this;
    const hasHistory = !!_sortedHistory && !!_sortedHistory.length;
    return html`
    <div class="menu-title">
      <span class="menu-title-label">History</span>
    </div>
    ${hasHistory ? this._historyList(_sortedHistory) : this._emptyHistory()}
    `;
  }

  protected _historyList(items: IAppRequest[][]): TemplateResult {
    const content = items.map(i => this._historyListItemsTemplate(i));
    return this._outerListTemplate(content);
  }

  protected _historyListItemsTemplate(items: IAppRequest[]): TemplateResult {
    const { midnight = 0 } = items[0];
    const name = relativeDay(midnight);
    return html`
    <li aria-disabled="true" aria-label="Day ${name}" class="day-item" data-time="${midnight}">
      ${name}
    </li>
    ${items.map(i => this._historyListItemTemplate(i))}
    `;
  }

  protected _historyListItemTemplate(item: IAppRequest): TemplateResult | typeof nothing {
    const { log, key, kind } = item;
    if (!log) {
      return nothing;
    }
    const { request, response } = log;
    const method = request && request.method;
    const url = request && request.url;
    if (!method || !url) {
      return nothing;
    }

    const error = !response || ErrorResponse.isErrorResponse(response);
    const active = key === this.selected;
    const focused = key === this._focused;

    const classes = {
      error,
      active,
      focused,
      selected: this.selected === key,
      history: true,
    };

    let status = 0;
    let statusText: string | undefined;
    let duration = 0;
    if (!error) {
      const typed = response as IResponse;
      status = typed.status;
      statusText = typed.statusText;
      duration = typed.loadingTime;
    }
    return html`
    <li 
      role="treeitem"
      class="${classMap(classes)}" 
      data-key="${key}" 
      data-kind="${kind}"
    >
      <div class="list-item-content" style="padding-left: 20px">
        <div class="request-info">
          ${statusIndicator(status)}
          <span class="method">${method}</span>
          <span class="url">${url}</span>
        </div>
        <div class="response-info">
          <span class="response-status">${status}</span>
          <span class="response-reason">${statusText}</span>
          <span class="response-separator"></span>
          <span class="response-duration">${duration}ms</span>
        </div>
      </div>
    </li>
    `;
  }

  protected _emptyHistory(): TemplateResult {
    return html`
    <div class="empty-list history">
      <api-icon icon="timeline" class="empty-icon"></api-icon>
      <p>You have no history.</p>
      <p class="tip">Send a request in the editor to record the history.</p>
    </div>
    `;
  }

  protected _projectsTemplate(): TemplateResult | typeof nothing {
    if (this.rail !== 'projects') {
      return nothing;
    }
    const { projects } = this;
    const hasProjects = !!projects && !!projects.length;
    return html`
    <div class="menu-title">
      <span class="menu-title-label">Projects</span>
    </div>
    ${hasProjects ? this._projectsList(projects) : this._emptyProjects()}
    `;
  }

  protected _emptyProjects(): TemplateResult {
    return html`
    <div class="empty-list projects">
      <api-icon icon="collectionsBookmark" class="empty-icon"></api-icon>
      <p>You have no projects.</p>
      <p class="tip">Create a project to structure your API calls.</p>

      <anypoint-button emphasis="medium" flat class="empty-button" @click="${this._createProjectHandler}">Add project</anypoint-button>
    </div>
    `;
  }

  protected _projectsList(projects: AppProject[]): TemplateResult {
    const content = projects.map(p => this._projectItemTemplate(p));
    return this._outerListTemplate(content);
  }

  protected _projectItemTemplate(project: AppProject): TemplateResult {
    const { kind, key } = project;
    const content = this._renderParentChildrenTemplate(project, key);
    const name = project.info.name || 'Unnamed project';
    return this._parentListItemTemplate(key, kind, name, content, {
      parentIcon: 'cloudFilled',
    });
  }

  protected _renderParentChildrenTemplate(parent: AppProject | AppProjectFolder, root: string): TemplateResult | string {
    const { key } = parent;
    const folders = parent.listFolders();
    const requests = parent.listRequests();
    const isProject = parent.getProject() === undefined;
    const environments = parent.listEnvironments();
    const isEmpty = !folders.length && !environments.length && !requests.length;
    if (isEmpty) {
      return html`<p class="list-item-content empty" aria-disabled="true">Empty folder</p>`;
    }
    return html`
    ${folders.map(f => this.renderFolder(f, root, isProject ? undefined : key))}
    ${environments.map(r => this.renderEnvironment(r, root, isProject ? undefined : key))}
    ${requests.map(r => this.renderRequest(r, root, isProject ? undefined : key))}
    `;
  }

  protected renderFolder(folder: AppProjectFolder, root: string, parentKey?: string): TemplateResult | string {
    const content = this._renderParentChildrenTemplate(folder, root);
    const name = folder.info.name || 'Unnamed folder';
    const { kind, key } = folder;
    return this._parentListItemTemplate(key, kind, name, content, {
      parent: parentKey,
      parentIcon: 'folderFilled',
      root,
    });
  }

  protected renderRequest(request: AppProjectRequest, root: string, parentKey?: string): TemplateResult | string {
    const name = request.info.name || 'Unnamed request';
    const { key, kind } = request;
    const content = this._itemContentTemplate('request', name);
    return this._listItemTemplate(key, kind, name, content, {
      parent: parentKey,
      draggable: true,
      root,
    });
  }

  protected renderEnvironment(environment: Environment, root: string, parentKey?: string): TemplateResult | string {
    const name = environment.info.name || 'Unnamed environment';
    const { key, kind } = environment;
    const content = this._itemContentTemplate('environment', name);
    return this._listItemTemplate(key, kind, name, content, {
      parent: parentKey,
      draggable: true,
      root,
    });
  }

  protected _restApisTemplate(): TemplateResult | typeof nothing {
    const menuOpened = this.rail === 'rest-apis';
    if (!menuOpened) {
      return nothing;
    }
    return html`
    <div class="menu-title">
      <span class="menu-title-label">Rest Apis</span>
    </div>
    <div class="empty-list rest-apis">
      <api-icon icon="apps" class="empty-icon"></api-icon>
      <p>The "REST APIs" have moved.</p>
      <p class="tip">API Consumer is now a separate application. Open it through the application menu.</p>
    </div>
    `;
  }

  protected _savedTemplate(): TemplateResult | typeof nothing {
    const menuOpened = this.rail === 'saved';
    if (!menuOpened) {
      return nothing;
    }
    return html`
    <div class="menu-title">
      <span class="menu-title-label">Saved</span>
    </div>
    <div class="empty-list saved">
      <api-icon icon="save" class="empty-icon"></api-icon>
      <p>The "saved" have moved.</p>
      <p class="tip">You will find your previously saved HTTP requests in the project “Saved requests”</p>
    </div>
    `;
  }
}
