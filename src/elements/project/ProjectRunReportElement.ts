/* eslint-disable prefer-destructuring */
/* eslint-disable class-methods-use-this */
import { PropertyValueMap, LitElement, TemplateResult, html, css, CSSResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ErrorResponse, IProjectExecutionIteration, IProjectExecutionLog, IRequestLog, IResponse } from '@api-client/core/build/browser.js';
import { statusTemplate, StatusStyles } from '../http/HttpStatus.js';
import '../../define/request-log.js';

/**
 * An element that renders the execution log of the project runner with the IProjectExecutionLog.
 */
export default class ProjectRunReportElement extends LitElement {
  static get styles(): CSSResult[] {
    return [
      StatusStyles,
      css`
      :host {
        display: block;
      }

      .container {
        display: grid;
        grid-template: "requests response" auto / minmax(200px, 2fr) 10fr;
      }

      .container.iterations {
        grid-template: "iterations requests response" auto / minmax(200px, 2fr) minmax(200px, 2fr) 10fr;
      }

      .iterations-list {
        grid-area: iterations;
      }

      .requests-list {
        grid-area: requests;
      }

      .response {
        grid-area: response;
        overflow: hidden;
        padding-left: 20px;
      }

      ol {
        margin: 0;
        padding: 0;
        border-right: 1px #e5e5e5 solid;
      }

      .list-item {
        min-height: var(--list-item-height, 40px);
        display: flex;
        align-items: center;
        padding: 0 20px;
      }

      .list-item.double {
        min-height: var(--list-item-two-line-height, 72px);
      }

      .active {
        background: var(--list-active-background, #e3f2fd);
      }

      .list-content {
        display: block;
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .list-contents {
        overflow: hidden;
      }

      .secondary {
        font-size: .875rem;
        color: var(--secondary-text-color);
        display: flex;
        align-items: center;
        overflow: hidden;
        white-space: nowrap;
      }

      .status-code {
        margin-right: 8px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      `
    ];
  }

  @property({ type: Object }) report?: IProjectExecutionLog;

  /**
   * A flag computed with the `report` property setter.
   * True when the log has more than one iteration.
   */
  @state() protected _hasManyIterations = false;

  /**
   * The index of the selected iteration, if any.
   */
  @state() protected _selectedIteration?: number;

  /**
   * The index of the selected request, if any
   */
  @state() protected _selectedRequest?: number;

  /**
   * @description The currently rendered iteration.
   * @protected
   * @type {IProjectExecutionIteration}
   */
  @state() protected _iteration?: IProjectExecutionIteration;

  @state() protected _request?: IRequestLog;

  protected updated(cp: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
    super.updated(cp);
    if (cp.has('report')) {
      this._processReport();
    }
  }

  protected _processReport(): void {
    const { report } = this;
    if (!report) {
      this._selectedIteration = undefined
      this._selectedRequest = undefined
      this._iteration = undefined
      this._request = undefined
      this._hasManyIterations = false;
      return;
    }
    this._hasManyIterations = report.iterations.length > 1;
    this._selectedIteration = 0;
    this._selectedRequest = undefined
    this._request = undefined
    this._iteration = report.iterations[0];
  }

  protected async _selectIteration(index: number): Promise<void> {
    const { report } = this;
    if (!report) {
      return;
    }
    const item = report.iterations[index];
    if (!item) {
      return;
    }
    this._selectedIteration = index;
    this._iteration = item;
    this._selectedRequest = undefined
    this._request = undefined
    await this.updateComplete;
    this._focusActive('interaction');
  }

  protected async _selectRequest(index: number): Promise<void> {
    const { _iteration } = this;
    if (!_iteration) {
      return;
    }
    const item = _iteration.executed[index];
    if (!item) {
      return;
    }
    this._selectedRequest = index;
    this._request = item;
    await this.updateComplete;
    this._focusActive('request');
  }

  protected _listClick(e: Event): void {
    const item = this._getListInfo(e);
    if (!item) {
      return;
    }
    if (item.type === 'interaction') {
      this._selectIteration(item.index);
    } else {
      this._selectRequest(item.index);
    }
  }

  /**
   * When this event is received then the list has no selection.
   * We focus on the first item depending which list is this.
   */
  protected _listFocus(e: Event): void {
    const list = e.currentTarget as HTMLOListElement;
    const type = list.dataset.type as 'interaction' | 'request';
    if (type === 'interaction') {
      this._selectIteration(0);
    } else {
      this._selectRequest(0);
    }
  }

  protected _listKeydown(e: KeyboardEvent): void {
    const item = this._getListInfo(e);
    if (!item) {
      return;
    }
    switch (e.key) {
      case 'ArrowRight': this._itemRightAction(item.type); break;
      case 'ArrowLeft': this._itemLeftAction(item.type); break;
      case 'ArrowDown': this._itemDownAction(item.type, item.index); break;
      case 'ArrowUp': this._itemUpAction(item.type, item.index); break;
      case 'Home': this._homeAction(item.type); break;
      case 'End': this._endAction(item.type); break;
      default:
    }
  }

  protected _focusActive(type: 'interaction' | 'request'): void {
    const query = `.active[data-type="${type}"]`;
    const element = this.shadowRoot?.querySelector(query);
    if (element) {
      (element as HTMLElement).focus();
    }
  }

  protected _itemRightAction(type: 'interaction' | 'request'): void {
    if (type === 'interaction') {
      if (!this._request) {
        this._selectRequest(0);
      } else {
        this._focusActive('request');
      }
    }
  }

  protected _itemLeftAction(type: 'interaction' | 'request'): void {
    if (type === 'request') {
      this._focusActive('interaction');;
    }
  }

  protected _itemDownAction(type: 'interaction' | 'request', index: number): void {
    this._moveSelectionUpDown(type, index, 1);
  }

  protected _itemUpAction(type: 'interaction' | 'request', index: number): void {
    this._moveSelectionUpDown(type, index, -1);
  }

  protected _moveSelectionUpDown(type: 'interaction' | 'request', index: number, dir: -1 | 1): void {
    const { report } = this;
    if (!report) {
      return;
    }
    const list = (type === 'interaction' ? report.iterations : this._iteration && this._iteration.executed) as any[] | undefined;
    if (!list) {
      return;
    }
    const item = list[index + dir];
    if (!item) {
      return;
    }
    if (type === 'interaction') {
      this._selectIteration(index + dir);
    } else {
      this._selectRequest(index + dir);
    }
  }

  protected _homeAction(type: 'interaction' | 'request'): void {
    if (type === 'interaction') {
      this._selectIteration(0);
    } else {
      this._selectRequest(0);
    }
  }

  protected _endAction(type: 'interaction' | 'request'): void {
    const { report, _iteration } = this;
    if (!report) {
      return;
    }
    if (type === 'interaction') {
      const items = report.iterations;
      if (!items || !items.length) {
        return;
      }
      this._selectIteration(items.length - 1);
    } else {
      if (!_iteration) {
        return;
      }
      const items = _iteration.executed;
      if (!items || !items.length) {
        return;
      }
      this._selectRequest(items.length - 1);
    }
  }

  protected _getListInfo(e: Event): { index: number, type: 'interaction' | 'request' } | undefined {
    const item = this._findEventListItem(e);
    if (!item) {
      return undefined;
    }
    const { type } = item.dataset;
    if (!['interaction', 'request'].includes(type!)) {
      return undefined;
    }
    const index = Number(item.dataset.index);
    if (!Number.isInteger(index)) {
      return undefined;
    }
    return {
      index,
      type: type as 'interaction' | 'request',
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

  protected render(): TemplateResult {
    const { report, _hasManyIterations } = this;
    if (!report) {
      return html``;
    }
    const classes = {
      container: true,
      iterations: _hasManyIterations,
    };
    return html`
    <div class="${classMap(classes)}">
      ${_hasManyIterations ? this._interactionsListTemplate(report.iterations) : ''}
      ${this._requestsListTemplate()}
      ${this._responseTemplate()}
    </div>
    `;
  }

  protected _interactionsListTemplate(iterations: IProjectExecutionIteration[]): TemplateResult {
    const hasSelection = typeof this._selectedIteration === 'number';
    return html`
    <ol class="iterations-list" tabindex="${hasSelection ? '-1' : '0'}" @click="${this._listClick}" @keydown="${this._listKeydown}" data-type="interaction">
      ${iterations.map((item, index) => this._interactionListItem(item, index))}
    </ol>
    `;
  }

  protected _interactionListItem(item: IProjectExecutionIteration, index: number): TemplateResult {
    const active = index === this._selectedIteration;
    const classes = {
      'list-item': true,
      active,
      errored: !!item.error,
    };
    return html`
    <li class="${classMap(classes)}" data-index="${index}" data-type="interaction" tabindex="${active ? '0' : '-1'}">
      <span class="list-content">Iteration #${index + 1}</span>
    </li>
    `;
  }

  protected _requestsListTemplate(): TemplateResult {
    const { _iteration } = this;
    let content: TemplateResult | TemplateResult[];
    if (!_iteration) {
      content = this._emptyRequestsListTemplate();
    } else if (!_iteration.executed || !_iteration.executed.length) {
      content = this._emptyRequestsListTemplate();
    } else {
      content = _iteration.executed.map((item, index) => this._requestsListItemTemplate(item, index));
    }
    const hasSelection = typeof this._selectedRequest === 'number';
    return html`<ol class="requests-list" tabindex="${hasSelection ? '-1' : '0'}" @click="${this._listClick}" @keydown="${this._listKeydown}" @focus="${this._listFocus}" data-type="request">${content}</ol>`;
  }

  protected _emptyRequestsListTemplate(): TemplateResult {
    return html`<p>No requests to list...</p>`;
  }

  protected _requestsListItemTemplate(item: IRequestLog, index: number): TemplateResult {
    const title = item.request && item.request.url || `Request #${index}`;
    const active = index === this._selectedRequest;
    const error = !item.response || ErrorResponse.isErrorResponse(item.response);
    const classes = {
      'list-item': true,
      double: true,
      error,
      active,
    };

    let status = 0;
    let statusText: string | undefined;
    let duration = 0;
    if (!error) {
      const typed = item.response as IResponse;
      status = typed.status;
      statusText = typed.statusText;
      duration = typed.loadingTime;
    }
    
    return html`
    <li class="${classMap(classes)}" data-index="${index}" data-type="request" tabindex="${active ? '0' : '-1'}">
      <div class="list-contents">
        <div class="list-content">${title}</div>
        <div class="secondary">
          ${statusTemplate(status, statusText)}
          ${duration}ms
        </div>
      </div>
    </li>`;
  }

  protected _responseTemplate(): TemplateResult {
    const { _request } = this;
    return html`
    <div class="response">
      ${_request ? html`<request-log .httpLog="${_request}"></request-log>` : ''}
    </div>
    `;
  }
}
