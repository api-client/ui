import { ErrorResponse, HttpHistoryKind, IHttpHistory, IResponse, IRequestLog, RequestLog } from "@api-client/core/build/browser.js";
import { CSSResult, LitElement, css, TemplateResult, html, PropertyValueMap } from "lit";
import { property, state } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
// import { Chart, registerables } from 'chart.js';
import { HttpHistoryChart, chartStyles } from '../../lib/chart/HttpHistoryChart.js';
import { relativeDay } from "../../lib/time/Conversion.js";
import { statusTemplate, StatusStyles } from '../http/HttpStatus.js';
import '@anypoint-web-components/awc/dist/define/anypoint-icon-button.js';
import '@github/time-elements/dist/local-time-element.js'
import '@github/time-elements/dist/relative-time-element.js'
import '../../define/api-icon.js';

export const GroupKind = 'UI#HistoryGroup';

// Chart.register(...registerables);

/**
 * An element that renders HTTP history for a configured list of requests.
 * This element is just a view and contains no logic related to store communication 
 * or user interactions. Use the dispatched events to handle user interactions.
 */
export default class RequestHistoryBrowserElement extends LitElement {
  static get styles(): CSSResult[] {
    return [
      StatusStyles,
      chartStyles,
      css`
      :host {
        display: block;
        height: 100%;
      }

      menu {
        margin: 0;
        padding: 0;
      }

      li {
        margin: 0;
        padding: 0;
        list-style: none;
      }

      .rail {
        width: 72px;
        display: flex;
        flex-direction: column;
        align-items: center;
        border-right: 1px var(--divider-color) solid;
      }

      .rail > .button {
        margin: 12px 0;
        width: 40px;
        height: 40px;
        border: none;
        border-radius: 50%;
        background: transparent;
      }

      .rail > .button.active {
        background: var(--accent-color);
      }

      .content {
        height: inherit;
        display: flex;
      }

      .history-list {
        border-right: 1px var(--divider-color) solid;
        height: inherit;
        overflow: auto;
        flex: 2 1 0%;
      }

      .response-content {
        overflow: hidden;
        flex: 10 1 0%;
        /* margin-right: 20px; */
      }

      menu {
        overflow: auto;
      }

      .history-list-header {
        min-height: var(--list-item-height);
        background: var(--history-list-header-background, var(--secondary-background-color, #f6f6f6));
        display: flex;
        align-items: center;
      }

      .history-list-header.focused {
        outline: var(--outline-color, #000) auto 1px;
      }

      .list-item {
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

      local-time {
        margin-left: 4px;
      }

      .active {
        background: var(--list-active-background, #e3f2fd);
        font-weight: 500;
      }

      .list-item:not(.active):hover {
        background-color: var(--list-hover-background);
      }

      .list-item:not(.active).focused {
        background-color: var(--list-focus-background);
      }

      .list-item.active:not(.focused) {
        outline: none;
      }

      .opened > .toggle-icon {
        transform: rotate(90deg);
      }

      .chart {
        flex: 1;
        height: 400px;
        overflow-x: auto;
        overflow-y: hidden;
      }

      .no-data {
        display: flex;
        height: 100%;
        width: 100%;
        align-items: center;
        justify-content: center;
      }
      `,
    ];
  }

  /**
   * The history list to render.
   */
  @property({ type: Array }) history?: IHttpHistory[];

  /**
   * A sorted list of history items by the `midnight` property.
   */
  @state() protected _sortedHistory?: IHttpHistory[][];

  /**
   * The key of the selected request, if any
   */
  @state() protected _selectedItem?: string;

  /**
   * The key of the selected item.
   * Focused item may be a header which doesn't correspond to any item.
   */
  @state() protected _focusedItem?: string;

  /**
   * The currently rendered item.
   */
  @state() protected _item?: IHttpHistory | IRequestLog | RequestLog;

  @state() protected _closedGroups: string[] = [];

  @state() protected _view: number = 0;

  protected willUpdate(cp: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
    if (cp.has('history')) {
      this._computeHistory();
    } 
    if (cp.has('_selectedItem')) {
      this._computeSelectedItem();
    }
    if (cp.has('current') && !this._selectedItem) {
      this._selectedItem = 'current';
      this._computeSelectedItem();
    }
  }

  /**
   * Adds a new history to the list.
   * This is used instead of re-assigning the entire array and triggering initial computations.
   * @param item The history item to add
   * @param select When true it makes this item selected,
   */
  addHistory(item: IHttpHistory, select?: boolean): void {
    const { _sortedHistory: list } = this;
    if (!list) {
      this._sortedHistory = [[item]];
      return;
    }
    const { midnight = Date.now() } = item;
    const index = list.findIndex(i => i[0].midnight === midnight);
    if (index >= 0) {
      this._pushSorted(list[index], item);
    } else {
      const position = list.findIndex(i => (i[0].midnight || 0) < midnight);
      list.splice(position, 0, [item]);
    }
    if (select && item.key) {
      this._selectedItem = item.key;
    }
    this.requestUpdate();
  }

  protected _computeHistory(): void {
    const { history } = this;
    this._closedGroups = [];
    this._selectedItem = undefined;
    this._item = undefined;
    this._focusedItem = undefined;

    if (!Array.isArray(history) || !history.length) {
      this._sortedHistory = undefined;
      return;
    }
    const result: IHttpHistory[][] = [];
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
    if (result.length) {
      this._selectedItem = result[0][0].key;
    }
  }

  protected _computeSelectedItem(): void {
    const { history, _selectedItem } = this;
    this._item = undefined;
    if (!_selectedItem || !Array.isArray(history)) {
      return;
    }
    this._item = history.find(i => i.key === _selectedItem);
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
  protected _pushSorted(list: IHttpHistory[], item: IHttpHistory): void {
    const older = list.findIndex(i => i.created < item.created);
    if (older >= 0) {
      list.splice(older, 0, item);
    } else {
      // this item is the oldest
      list.push(item);
    }
  }

  protected _listClick(e: Event): void {
    const node = this._findEventListItem(e);
    if (!node) {
      return;
    }
    const { key, kind } = node.dataset;
    if (!key || !kind) {
      return;
    }
    if (kind === HttpHistoryKind || kind === 'Core#ResponseLog') {
      this._selectedItem = key;
      this._focusedItem = key;
      return;
    }
    this.toggleGroup(key);
  }

  protected _listKeydown(e: KeyboardEvent): void {
    const node = this._findEventListItem(e);
    if (!node) {
      return;
    }
    const { key, kind } = node.dataset;
    if (!key || !kind) {
      return;
    }
    switch (e.code) {
      case 'ArrowRight': this._itemRightAction(); break;
      case 'ArrowLeft': this._itemLeftAction(); break;
      case 'ArrowDown': this._itemDownAction(); break;
      case 'ArrowUp': this._itemUpAction(); break;
      // case 'Home': this._homeAction(item.type); break;
      // case 'End': this._endAction(item.type); break;
      case 'Space':
      case 'Enter': this._enterAction(e); break;
      default:
    }
  }

  /**
   * Moves the focus down to the next item relative to the current focus or selected (if missing.)
   */
  protected _itemDownAction(): void {
    const { _focusedItem, _selectedItem } = this;
    const currentKey = _focusedItem || _selectedItem;
    if (!currentKey) {
      this.selectFirst();
      return;
    }
    const current = this.shadowRoot?.querySelector(`li[data-key="${currentKey}"]`) as HTMLLIElement | null;
    if (!current) {
      return;
    }
    const isHeader = current.dataset.kind === GroupKind;
    if (isHeader) {
      if (!this._closedGroups.includes(currentKey)) {
        // first try to focus on any child.
        const availableChild = current.querySelector('li[data-key]') as HTMLLIElement | null;
        if (availableChild) {
          this._select(availableChild.dataset.key!);
          return;
        }
      }
      const next = current.nextElementSibling as HTMLLIElement | null;
      if (next) {
        this._focus(next.dataset.key!);
      }

      return;
    }
    const next = current.nextElementSibling as HTMLLIElement | null;
    if (next && next.dataset.key) {
      this._select(next.dataset.key);
      return;
    }
    const parent = this._findParentListItem(current);
    if (!parent) {
      return;
    }
    const nextParent = parent.nextElementSibling as HTMLLIElement | null;
    if (nextParent && nextParent.dataset.key) {
      this._focus(nextParent.dataset.key);
    }
  }

  protected _itemUpAction(): void {
    const { _focusedItem, _selectedItem } = this;
    const currentKey = _focusedItem || _selectedItem;
    if (!currentKey) {
      return;
    }
    const current = this.shadowRoot?.querySelector(`li[data-key="${currentKey}"]`) as HTMLLIElement | null;
    if (!current) {
      return;
    }
    const isHeader = current.dataset.kind === GroupKind;
    if (isHeader) {
      // jump to the previous header
      // if it's opened, select last item,
      // otherwise focus on the header.
      const previous = current.previousElementSibling as HTMLLIElement | null;
      if (!previous) {
        // we are the first
        return;
      }
      if (previous.dataset.key === 'current') {
        this._select(previous.dataset.key);
        return;
      }
      if (this._closedGroups.includes(previous.dataset.key!)) {
        this._focus(previous.dataset.key!);
        return;
      }
      const items = Array.from(previous.querySelectorAll('li[data-key]')) as HTMLLIElement[];
      if (!items.length) {
        this._focus(previous.dataset.key!);
        return;
      }
      const last = items[items.length -1];
      this._select(last.dataset.key!);
      return;
    }
    // select previous item or focus on the parent
    const previous = current.previousElementSibling as HTMLLIElement | null;
    if (previous) {
      this._select(previous.dataset.key!);
      return;
    }
    const parent = this._findParentListItem(current);
    if (!parent) {
      return;
    }
    this._focus(parent.dataset.key!);
  }

  protected _itemLeftAction(): void {
    const { _focusedItem, _selectedItem } = this;
    const currentKey = _focusedItem || _selectedItem;
    if (!currentKey) {
      return;
    }
    const current = this.shadowRoot?.querySelector(`li[data-key="${currentKey}"]`) as HTMLLIElement | null;
    if (!current) {
      return;
    }
    if (current.dataset.kind === GroupKind) {
      this.closeGroup(current.dataset.key!);
      return;
    }
    const parent = this._findParentListItem(current);
    if (parent) {
      this._focus(parent.dataset.key!);
    }
  }

  protected _itemRightAction(): void {
    const { _focusedItem, _selectedItem } = this;
    const currentKey = _focusedItem || _selectedItem;
    if (!currentKey) {
      return;
    }
    const current = this.shadowRoot?.querySelector(`li[data-key="${currentKey}"]`) as HTMLLIElement | null;
    if (!current) {
      return;
    }
    if (current.dataset.kind !== GroupKind) {
      return;
    }
    if (this._closedGroups.includes(current.dataset.key!)) {
      this.openGroup(current.dataset.key!);
      return;
    }
    const availableChild = current.querySelector('li[data-key]') as HTMLLIElement | null;
    if (availableChild) {
      this._select(availableChild.dataset.key!);
    }
  }

  /**
   * This is reserved to toggling section items.
   */
  protected _enterAction(e: Event): void {
    const { _focusedItem } = this;
    if (!_focusedItem) {
      return;
    }
    e.preventDefault();
    const node = this.shadowRoot?.querySelector(`li[data-key="${_focusedItem}"]`) as HTMLLIElement | null;
    if (!node) {
      return;
    }
    const { key, kind } = node.dataset;
    if (kind !== GroupKind || !key) {
      return;
    }
    this.toggleGroup(key);
  }

  async selectFirst(): Promise<void> {
    const query = '.history-list menu[aria-hidden="false"] li';
    const element = this.shadowRoot?.querySelector(query) as HTMLLIElement;
    if (!element) {
      return;
    }
    const { key } = element.dataset;
    if (!key) {
      return;
    }
    this._select(key);
  }

  protected async _select(key: string): Promise<void> {
    this._selectedItem = key;
    this._focus(key);
  }

  protected async _focus(key: string): Promise<void> {
    this._focusedItem = key;
    await this.updateComplete;
    let node = this.shadowRoot?.querySelector(`li[data-key="${key}"] .history-list-header`) as HTMLLIElement | null;
    if (!node) {
      node = this.shadowRoot?.querySelector(`li[data-key="${key}"]`) as HTMLLIElement | null;
    }
    if (node) {
      node.focus();
    }
  }

  protected _findEventListItem(e: Event): HTMLLIElement | undefined {
    let current = e.target as HTMLElement;
    while (current) {
      if (current.localName === 'li')  {
        return current as HTMLLIElement;
      }
      current = current.parentElement as HTMLElement;
    }
    return undefined;
  }

  protected _findParentListItem(node: HTMLElement): HTMLElement | undefined {
    let parent = node.parentElement as HTMLElement;
    while (parent) {
      if (parent === this) {
        break;
      }
      if (parent.localName === 'li') {
        return parent;
      }
      parent = parent.parentElement as HTMLElement;
    }
    return undefined;
  }

  /**
   * Toggles a history group by its key.
   * @param key The group key. Can be read from group's list item's `data-key` attribute.
   */
  toggleGroup(key: string): void {
    const { _closedGroups: list } = this;
    const index = list.indexOf(key);
    if (index >= 0) {
      list.splice(index, 1);
    } else {
      list.push(key);
    }
    this.requestUpdate();
  }

  openGroup(key: string): void {
    const { _closedGroups: list } = this;
    const index = list.indexOf(key);
    if (index >= 0) {
      list.splice(index, 1);
      this.requestUpdate();
    }
  }

  closeGroup(key: string): void {
    const { _closedGroups: list } = this;
    if (list.includes(key)) {
      return;
    }
    list.push(key);
    this.requestUpdate();
  }

  protected _railHandler(e: Event): void {
    const button = e.currentTarget as HTMLElement;
    const i = Number(button.dataset.index);
    if (Number.isNaN(i)) {
      return;
    }
    this._view = i;
  }

  protected render(): TemplateResult | string {
    const { _sortedHistory: history } = this;
    if (!history) {
      return this._emptyTemplate();
    }
    return html`
    <div class="content">
      ${this._railTemplate()}
      ${this._contentTemplate()}
    </div>
    `;
  }

  protected _emptyTemplate(): TemplateResult {
    return html`
    <div class="no-data">
      No response data to render in this view.
    </div>
    `;
  }

  protected _railTemplate(): TemplateResult {
    const { _view: view } = this;
    return html`
    <div class="rail">
      <button class="button ${view === 0 ? 'active' : ''}" data-index="0" @click="${this._railHandler}" aria-label="History list view"  title="History list view">
        <api-icon icon="history" role="presentation"></api-icon>
      </button>
      <button class="button ${view === 1 ? 'active' : ''}" data-index="1" @click="${this._railHandler}" aria-label="History analysis view" title="History analysis view">
        <api-icon icon="leaderBoard" role="presentation"></api-icon>
      </button>
    </div>
    `;
  }

  protected _contentTemplate(): TemplateResult | string {
    const { _view: view } = this;
    if (view === 1) {
      return this._analysisView();
    }
    return this._historyView();
  }

  protected _historyView(): TemplateResult | string {
    const { _sortedHistory: history } = this;
    if (!history) {
      return '';
    }
    return html`
    <div class="history-list">${this._listTemplate(history)}</div>
    <div class="response-content">${this._selectedItemTemplate()}</div>
    `;
  }

  protected _selectedItemTemplate(): TemplateResult | string {
    const { _item: info } = this;
    if (!info) {
      return '';
    }
    const typed = info as IHttpHistory;
    const data = typed.log ? typed.log : info as IRequestLog | RequestLog;
    return html`
    <request-log .httpLog="${data}"></request-log>
    `;
  }

  protected _listTemplate(items: IHttpHistory[][]): TemplateResult {
    return html`
    <menu aria-label="History list" tabindex="${this._selectedItem ? '-1' : '0'}" @click="${this._listClick}" @keydown="${this._listKeydown}">
    ${items.map(group => this._listItemsTemplate(group))}
    </menu>
    `;
  }

  protected _listItemsTemplate(items: IHttpHistory[]): TemplateResult {
    const key = String(items[0].midnight);
    const opened = !this._closedGroups.includes(key);
    return html`
    <li data-kind="${GroupKind}" data-key="${key}">
      ${this._groupHeaderTemplate(key, opened, items[0])}
      ${this._groupItemsTemplate(opened, items)}
    </li>
    `;
  }

  protected _groupHeaderTemplate(key: string, opened: boolean, item: IHttpHistory): TemplateResult {
    const { midnight = 0 } = item;
    const focused = key === this._focusedItem;
    const classes = {
      'history-list-header': true,
      focused,
      opened,
    };
    return html`
    <div class="${classMap(classes)}" tabindex="${focused ? '0' : '-1'}">
      <anypoint-icon-button tabindex="-1" aria-label="Toggle this section" class="toggle-icon">
        <api-icon icon="chevronRight" role="presentation"></api-icon>
      </anypoint-icon-button>
      ${relativeDay(midnight)}
    </div>
    `;
  }

  protected _groupItemsTemplate(opened: boolean, items: IHttpHistory[]): TemplateResult {
    return html`
    <menu 
      ?hidden="${!opened}" 
      aria-hidden="${opened ? 'false' : 'true'}"
    >
    ${items.map(item => this._listItemTemplate(item))}
    </menu>
    `;
  }

  protected _listItemTemplate(item: IHttpHistory): TemplateResult | string {
    const { log, created, key, kind } = item;
    const { request, response } = log;
    const method = request && request.method;
    const url = request && request.url;
    if (!method || !url) {
      return '';
    }
    const error = !response || ErrorResponse.isErrorResponse(response);
    const active = key === this._selectedItem;
    const focused = key === this._focusedItem;
    const classes = {
      'list-item': true,
      error,
      active,
      focused,
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
    <li class="${classMap(classes)}" data-key="${key!}" data-kind="${kind}" tabindex="${focused ? '0' : '-1'}">
      <div class="history-request">
        ${statusTemplate(status, statusText)}
        ${duration}ms
      </div>
      <div class="history-meta">
        <relative-time datetime="${isoTime}"></relative-time> at <local-time datetime="${isoTime}" hour="2-digit" minute="2-digit" second="2-digit"></local-time>
      </div>
    </li>
    `;
  }

  protected _analysisView(): TemplateResult | string {
    const { _sortedHistory: history } = this;
    if (!history) {
      return '';
    }
    const chart = new HttpHistoryChart(history);
    return chart.durationPlot();
  }
}
