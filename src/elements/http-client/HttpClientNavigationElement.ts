/* eslint-disable @typescript-eslint/no-explicit-any */
import { css, CSSResult, html, PropertyValueMap, TemplateResult, nothing } from "lit";
import { classMap } from "lit/directives/class-map.js";
import { StyleInfo, styleMap } from "lit/directives/style-map.js";
import { property, state } from "lit/decorators.js";
import { ContextListOptions, IAppRequest, AppProject, Events as CoreEvents, ErrorResponse, IResponse, AppProjectFolder, AppProjectRequest } from "@api-client/core/build/browser.js";
import '@anypoint-web-components/awc/dist/define/anypoint-icon-button.js';
import '@github/time-elements/dist/relative-time-element.js'
import AppNavigation from "../navigation/AppNavigationElement.js";
import theme from '../theme.js';
// import { EventTypes } from '../../events/EventTypes.js';
import { Events } from '../../events/Events.js';
import { relativeDay } from "../../lib/time/Conversion.js";
import '../../define/api-icon.js';
import { StatusStyles, statusTemplate } from "../http/HttpStatus.js";

/**
 * Main app navigation for the HttpClient application.
 */
export default class HttpClientNavigationElement extends AppNavigation {
  static get styles(): CSSResult[] {
    return [
      ...AppNavigation.styles,
      theme,
      StatusStyles,
      css`
      .menu {
        display: flex;
        flex-direction: row;
        height: inherit;
        overflow: hidden;
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
        overflow: hidden;
        flex: 1;
      }

      .menu-title {
        background-color: var(--menu-title-background-color);
        color: var(--menu-title-color);
        height: 56px;
        display: flex;
        align-items: center;
      }

      .menu-title-label {
        font-size: 20px;
        margin-left: 24px;
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

      .history-request {
        display: block;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-bottom: 4px;
      }

      .history-meta {
        font-size: 0.875rem;
        color: var(--secondary-text-color);
        display: flex;
        align-items: center;
        overflow: hidden;
        white-space: nowrap;
      }

      relative-time {
        margin-right: 4px;
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

  protected _pageInfo = new Map<'history' | 'projects', string>();

  constructor() {
    super();
    this.rail = 'history';
  }

  protected updated(cp: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
    super.updated(cp);
    if (cp.has('rail')) {
      this._requestData();
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

  protected async getHistoryPage(): Promise<void> {
    this.loading = true;
    const opts: ContextListOptions = {};
    const token = this._pageInfo.get('history');
    if (token) {
      opts.nextPageToken = token;
    } else {
      opts.limit = 100;
    }
    try {
      const data = await Events.HttpClient.Model.History.list(opts, this);
      if (data) {
        if (data.nextPageToken) {
          this._pageInfo.set('history', data.nextPageToken);
        }
        if (data.items.length) {
          this._addHistoryList(data.items);
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
    this.loading = true;
    const opts: ContextListOptions = {};
    const token = this._pageInfo.get('projects');
    if (token) {
      opts.nextPageToken = token;
    } else {
      opts.limit = 100;
    }
    try {
      const data = await Events.HttpClient.Model.Project.list(opts, this);
      if (data) {
        if (data.nextPageToken) {
          this._pageInfo.set('projects', data.nextPageToken);
        }
        if (data.items.length) {
          const instances = data.items.map(i => new AppProject(i));
          this.projects = this.projects.concat(instances);
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
      this._computeHistory(_history.concat(list));
    } else {
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
    this._notifySelection();
    if (this.minimized) {
      this.minimized = false;
      this._notifyMinimized();
    }
  }

  protected _notifyMinimized(): void {
    this.dispatchEvent(new Event('minimized'));
  }

  protected _notifySelection(): void {
    this.dispatchEvent(new Event('selected'));
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
        title="Select history"
        ?anypoint="${anypoint}"
        class=${classMap({'menu-item': true, selected: rail === 'history'})}
        data-type="history"
        @click="${this._railClickHandler}"
      >
        <api-icon icon="history"></api-icon>
      </anypoint-icon-button>

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
    <div class="content" ?hidden="${this.minimized}">
      ${this._historyTemplate()}
      ${this._savedTemplate()}
      ${this._projectsTemplate()}
      ${this._restApisTemplate()}
    </div>
    `;
  }

  protected _savedTemplate(): TemplateResult {
    const menuOpened = this.rail === 'saved';
    return html`
    <div class="menu-title" ?hidden=${!menuOpened}>
      <span class="menu-title-label">Saved</span>
    </div>
    <div class="menu-content" ?hidden=${!menuOpened}>
      <p>The "saved" have moved.</p>
      <p>Your previously saved request are now in the "Saved requests" project.</p>
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
    const key = String(midnight);
    // const opened = !this._opened.includes(key);
    const name = relativeDay(midnight);
    const content = items.map(i => this._historyListItemTemplate(i));
    return this._parentListItemTemplate(key, 'HttpClient#HistoryHeader', name, html`${content}`);
  }

  protected _historyListItemTemplate(item: IAppRequest): TemplateResult | typeof nothing {
    const { log, created = 0, key, kind } = item;
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
    const d = new Date(created);
    const isoTime = d.toISOString();

    return html`
    <li 
      role="treeitem"
      class="${classMap(classes)}" 
      data-key="${key}" 
      data-kind="${kind}">
      <div class="list-item-content" style="padding-left: 28px">
        <div class="history-request">
          ${statusTemplate(status, statusText)}
          ${duration}ms
        </div>
        <div class="history-meta">
          <relative-time datetime="${isoTime}"></relative-time> at <local-time datetime="${isoTime}" hour="2-digit" minute="2-digit" second="2-digit"></local-time>
        </div>
      </div>
    </li>
    `;
  }

  protected _emptyHistory(): TemplateResult {
    return html`
    <div class="empty-list">You have no history.</div>
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
    <div class="empty-list">You have no projects.</div>
    `;
  }

  protected _projectsList(projects: AppProject[]): TemplateResult {
    const content = projects.map(p => this._projectItemTemplate(p));
    return this._outerListTemplate(content);
  }

  protected _projectItemTemplate(project: AppProject): TemplateResult {
    const content = this._renderParentChildrenTemplate(project);
    const name = project.info.name || 'Unnamed project';
    const { kind, key } = project;
    return this._parentListItemTemplate(key, kind, name, content, {
      parentIcon: 'cloud',
    });
  }

  protected _renderParentChildrenTemplate(parent: AppProject | AppProjectFolder, indent = 0): TemplateResult | string {
    const { key } = parent;
    const folders = parent.listFolders();
    const requests = parent.listRequests();
    const isProject = parent.getProject() === undefined;
    const isEmpty = !folders.length && !requests.length;
    if (isEmpty) {
      const styles: StyleInfo = {
        'padding-left': `${this._computeIndent(indent)}px`,
      };
      return html`<p class="list-item-content empty" style="${styleMap(styles)}" aria-disabled="true">Empty folder</p>`;
    }
    return html`
    ${folders.map(f => this.renderFolder(f, indent, isProject ? undefined : key))}
    ${requests.map(r => this.renderRequest(r, indent, isProject ? undefined : key))}
    `;
  }

  protected renderFolder(folder: AppProjectFolder, indent: number, parentKey?: string): TemplateResult | string {
    const content = this._renderParentChildrenTemplate(folder, indent + 1);
    const name = folder.info.name || 'Unnamed folder';
    const { kind, key } = folder;
    return this._parentListItemTemplate(key, kind, name, content, {
      parent: parentKey,
      indent,
      parentIcon: 'folder',
    });
  }

  protected renderRequest(request: AppProjectRequest, indent: number, parentKey?: string): TemplateResult | string {
    const name = request.info.name || 'Unnamed request';
    const { key, kind } = request;
    const content = this._itemContentTemplate('request', name);
    return this._listItemTemplate(key, kind, name, content, {
      parent: parentKey,
      indent,
      draggable: true,
    });
  }

  protected _restApisTemplate(): TemplateResult {
    const menuOpened = this.rail === 'rest-apis';
    return html`
    <div class="menu-title" ?hidden=${!menuOpened}>
      <span class="menu-title-label">Rest Apis</span>
    </div>
    <div class="menu-content" ?hidden=${!menuOpened}>
      <p>The "REST APIs" have moved.</p>
      <p>APIs are now available as a separate application.</p>
    </div>
    `;
  }
}
