/* eslint-disable class-methods-use-this */
import { LitElement, html, TemplateResult, css, CSSResult, PropertyValueMap } from "lit";
import { IRequestLog, RequestLog, SentRequest, Response, ErrorResponse, Headers } from "@api-client/core/build/browser.js";
import { property, state } from "lit/decorators.js";
import { classMap } from 'lit/directives/class-map.js';
import { statusTemplate, StatusStyles } from "./HttpStatus.js";

/**
 * An element that renders summary headers view for an HTTP response.
 */
export default class LogHeadersElement extends LitElement {
  static get styles(): CSSResult[] {
    return [
      StatusStyles,
      css`
      :host {
        display: block;
      }

      .tree {
        list-style: none;
        padding: 0 0 4px 0;
        margin: 0;
      }

      .tree-parent {
        list-style: none;
        font-weight: 600;
        min-height: 32px;
        display: flex;
        align-items: center;
        user-select: none;
      }

      .tree-parent::before {
        user-select: none;
        margin-right: 8px;
        font-size: small;
        content: "\\25B8";
      }

      .tree-parent.closed::before {
        margin-left: 4px;
        margin-right: 8px;
      }
      
      .tree-parent.opened::before {
        content: "\\25BC";
      }

      .tree-item {
        min-height: var(--headers-list-item-min-height, 20px);
        user-select: text;
        word-break: break-all;
        font-family: var(--arc-font-code-family);
        list-style: none;
        margin: 0px;
        display: flex;
        align-items: start;
        min-height: 32px;
        box-sizing: border-box;
        padding: 8px 0px 0px 16px;
      }

      .tree-item > span {
        display: inline-block;
      }

      .tree-item-name {
        white-space: nowrap;
        margin-right: 8px;
      }

      .auto-link {
        color: var(--link-color);
      }

      .children {
        border-bottom: 1px #e5e5e5 solid;
        padding-bottom: 8px;
        padding-left: 0;
        margin-bottom: 8px;
      }

      .children.collapsed {
        display: none;
      }

      .active {
        background: var(--list-active-background, #e3f2fd);
      }
      `
    ];
  }

  private _httpLog?: IRequestLog | RequestLog;

  /**
   * @description This property is set when the `httpLog` is set. It always represent an instance of the `RequestLog` (or undefined) regardless of the input format.
   * @protected
   * @type {RequestLog}
   */
  @state() protected _log?: RequestLog;

  /**
   * @description The request log to render. When not set it renders nothing.
   * @type {(IRequestLog | RequestLog)}
   */
  @property({ type: Object })
  get httpLog(): IRequestLog | RequestLog | undefined {
    return this._httpLog;
  }

  set httpLog(value: IRequestLog | RequestLog | undefined) {
    const old = this._httpLog;
    if (old === value) {
      return;
    }
    this._httpLog = value;
    if (value) {
      if (typeof (value as RequestLog).toJSON === 'function') {
        this._log = value as RequestLog;
      } else {
        this._log = new RequestLog(value as IRequestLog);
      }
    } else {
      this._log = undefined;
    }
    this._parseHeaders();
  }

  @state() protected _activeItem?: string;

  @state() protected _focusedItem?: string;

  /**
   * The currently focused node.
   */
  protected _focusedElement?: HTMLElement;

  /**
   * @description Parsed request headers, when the request is set.
   * @protected
   * @type {Headers}
   */
  @state() protected _requestHeaders?: Headers;

  /**
   * @description Parsed response headers, when the response is set.
   * @protected
   * @type {Headers}
   */
  @state() protected _responseHeaders?: Headers;

  /**
   * @description The list of ids of tree parents that are opened.
   * @protected
   * @type {string []}
   */
  protected _parentsOpened: string [] = ['general', 'response-headers', 'request-headers'];

  constructor() {
    super();
    this._keydownHandler = this._keydownHandler.bind(this);
    this._clickHandler = this._clickHandler.bind(this);
    this._focusHandler = this._focusHandler.bind(this);
    this._dblclickHandler = this._dblclickHandler.bind(this);
  }

  connectedCallback(): void {
    super.connectedCallback();
    this._manageTabindex();
    this.addEventListener('keydown', this._keydownHandler);
    this.addEventListener('click', this._clickHandler);
    this.addEventListener('dblclick', this._dblclickHandler);
    this.addEventListener('focus', this._focusHandler);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('keydown', this._keydownHandler);
    this.removeEventListener('click', this._clickHandler);
    this.removeEventListener('dblclick', this._dblclickHandler);
    this.removeEventListener('focus', this._focusHandler);
  }

  protected updated(cp: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
    super.updated(cp);
    if (cp.has('_focusedItem')) {
      this._manageTabindex();
    }
  }

  /**
   * Manages the state of the tabindex attribute of the element.
   * When the user changes the focus in the tree then the tabindex is removed from the element 
   * and moved to the focused element.
   * When there's no focused element, the tabindex is again set on the element.
   */
  protected _manageTabindex(): void {
    const id = this._focusedItem;
    if (id && this.hasAttribute('tabindex')) {
      this.removeAttribute('tabindex');
    } else if (!id && !this.hasAttribute('tabindex')) {
      this.setAttribute('tabindex', '0');
    }
    if (id) {
      const node = this.shadowRoot?.querySelector(`[data-id="${id}"]`) as HTMLElement | null;
      if (node) {
        node.focus();
      }
    }
  }

  /**
   * Processes the request and response headers when the setter is invoked.
   * This way we can cache results instead of generating the headers in the 
   * template.
   */
  protected _parseHeaders(): void {
    const { _log } = this;
    if (!_log) {
      this._requestHeaders = undefined;
      this._responseHeaders = undefined;
      return;
    }
    const { request, response } = _log;
    if (request && request.headers) {
      this._requestHeaders = new Headers(request.headers);
    }
    if (response && response.headers) {
      this._responseHeaders = new Headers(response.headers);
    }
  }

  protected _focusHandler(): void {
    let node: HTMLLIElement | undefined | null;
    if (this._focusedItem) {
      node = this.shadowRoot!.querySelector(`[data-id="${this._focusedItem}"]`) as HTMLLIElement;
    } else {
      node = this.shadowRoot!.querySelector(`[data-id="general"]`) as HTMLLIElement;
    }
    if (node) {
      node.focus();
    }
  }

  protected _keydownHandler(e: KeyboardEvent): void {
    const node = this._findClosestListItem(e);
    if (!node) {
      return;
    }
    switch (e.key) {
      case 'ArrowRight': this._itemRightAction(node); break;
      case 'ArrowLeft': this._itemLeftAction(node); break;
      case 'ArrowDown': this._itemDownAction(node); break;
      case 'ArrowUp': this._itemUpAction(node); break;
      case 'Home': this._homeAction(); break;
      case 'End': this._endAction(); break;
      case 'Enter': this._itemEnterAction(node); break;
      default:
    }
  }

  protected _clickHandler(e: Event): void {
    const node = this._findClosestListItem(e);
    if (!node) {
      return;
    }
    this._focusListItem(node);
  }

  protected _dblclickHandler(e: Event): void {
    const node = this._findClosestListItem(e);
    if (!node) {
      return;
    }
    if (!node.classList.contains('tree-parent')) {
      return;
    }
    const key = node.dataset.id as string;
    this.toggleParent(key);
    this.requestUpdate();
  }

  protected toggleParent(key: string): void {
    const index = this._parentsOpened.indexOf(key);
    if (index >= 0) {
      this._parentsOpened.splice(index, 1);
    } else {
      this._parentsOpened.push(key);
    }
  }

  protected _findClosestListItem(e: Event): HTMLElement | undefined {
    const path = e.composedPath();
    while (path.length) {
      const target = path.shift() as Node;
      if (!target) {
        break;
      }
      if (target.nodeType !== Node.ELEMENT_NODE) {
        continue;
      }
      const elm = target as HTMLElement;
      if (elm.classList.contains('tree-item') || elm.classList.contains('tree-parent')) {
        return elm;
      }
    }
    return undefined;
  }

  /**
   * 1. When focus is on a closed node, opens the node; focus does not move.
   * 2. When focus is on a open node, moves focus to the first child node.
   * 3. When focus is on an end node (a tree item with no children), does nothing.
   */
  protected _itemRightAction(node: HTMLElement): void {
    // #3
    if (!node.classList.contains('tree-parent')) {
      return;
    }
    const key = node.dataset.id as string;
    const opened = this._parentsOpened.includes(key);
    if (!opened) {
      // #1
      this._parentsOpened.push(key);
      this.requestUpdate();
      return;
    }
    // #2
    const list = node.nextElementSibling as HTMLOListElement | null;
    if (list) {
      this._focusFirstDescendant(list);
    }
  }

  /**
   * 1. When focus is on an open node, closes the node.
   * 2. When focus is on a child node that is also either an end node or a closed node, moves focus to its parent node.
   * 3. When focus is on a closed `tree`, does nothing.
   */
  protected _itemLeftAction(node: HTMLElement): void {
    const isParent = node.classList.contains('tree-parent');
    const key = node.dataset.id as string;
    if (isParent) {
      const opened = this._parentsOpened.includes(key);
      if (opened) {
        // #1
        const index = this._parentsOpened.indexOf(key);
        this._parentsOpened.splice(index, 1);
        this.requestUpdate();
        return;
      }
      // #3
      return;
    }
    const list = node.parentElement as HTMLOListElement | null;
    if (!list) {
      return;
    }
    // #2
    const item = list.previousElementSibling as HTMLLIElement | null;
    if (item) {
      this._focusListItem(item);
    }
  }

  /**
   * Moves focus to the next node that is focusable without opening or closing a node.
   */
   protected _itemDownAction(node: HTMLElement): void {
    const isParent = node.classList.contains('tree-parent');
    if (!isParent) {
      if (this._focusNextSibling(node)) {
        return;
      }
      // focus on the next parent
      const myParent = this._findParentListItem(node);
      if (!myParent) {
        return;
      }
      let firstParent: HTMLLIElement | undefined;
      let current = myParent.nextElementSibling as HTMLElement | null;
      while (current) {
        const isList = current.localName === 'li';
        if (isList) {
          firstParent = current as HTMLLIElement;
          break;
        }
        current = current.nextElementSibling as HTMLElement | null;
      }
      if (firstParent) {
        this._focusListItem(firstParent);
      }
      return;
    }
    const key = node.dataset.id as string;
    // if we are opened then we focus on the first child.
    // otherwise we focus on the next parent
    const opened = this._parentsOpened.includes(key);
    if (opened && this._focusFirstDescendant(node.nextElementSibling as HTMLOListElement)) {
      return;
    }
    this._focusNextSibling(node);
  }

  /**
   * Moves focus to the previous node that is focusable without opening or closing a node.
   */
  protected _itemUpAction(node: HTMLElement): void {
    const isParent = node.classList.contains('tree-parent');
    if (isParent) {
      // focuses on a last item of the first opened previous parent
      // or when the parent is closed then just on the parent.
      let firstParent: HTMLLIElement | undefined;
      let current = node.previousElementSibling as HTMLElement | null;
      while (current) {
        if (current.localName === 'li') {
          firstParent = current as HTMLLIElement;
          break;
        }
        current = current.previousElementSibling as HTMLElement | null;
      }
      if (firstParent) {
        if (firstParent.classList.contains('opened') && this._focusLastDescendant(firstParent.nextElementSibling as HTMLOListElement)) {
          return;
        }
        this._focusListItem(firstParent);
      }
      return;
    }
    if (this._focusPreviousSibling(node)) {
      return;
    }
    this._focusFirstParent(node);
  }

  protected _homeAction(): void {
    const node = this.shadowRoot?.querySelector(`[data-id="general"]`) as HTMLLIElement | null;
    if (!node) {
      return;
    }
    this._focusListItem(node);
  }

  protected _endAction(): void {
    const first = this.shadowRoot?.querySelector('ol');
    if (!first) {
      return;
    }
    const children = Array.from(first.children).reverse() as HTMLElement[];
    for (const node of children) {
      if (node.localName === 'li') {
        if (this._focusLastDescendant(node.nextElementSibling as HTMLOListElement)) {
          return;
        }
        this._focusListItem(node);
        return;
      }
    }
  }

  /**
   * Performs the default action of the currently focused node. 
   * For parent nodes, it opens or closes the node. 
   * In single-select trees, if the node has no children, selects the current node 
   * if not already selected (which is the default action).
   */
  protected _itemEnterAction(node: HTMLElement): void {
    const isParent = node.classList.contains('tree-parent');
    if (!isParent) {
      return;
    }
    const key = node.dataset.id as string;
    this.toggleParent(key);
    this.requestUpdate();
  }

  /**
   * Focuses on the first descendant of a folder item.
   * 
   * @param node The list containing children to focus on.
   * @returns true when focused on any of the descendants
   */
  protected _focusFirstDescendant(node: HTMLOListElement): boolean {
    if (!node) {
      return false;
    }
    const items = Array.from(node.children).filter(n => n.localName === 'li') as HTMLLIElement[];
    if (!items || !items.length) {
      return false;
    }
    for (const child of items) {
      if (child.hasAttribute('disabled')) {
        continue;
      }
      this._focusListItem(child);
      return true;
    }
    return false;
  }

  /**
   * Focuses on the last descendant of a folder item.
   * 
   * @param node The list containing children to focus on.
   * @returns true when focused on any of the descendants
   */
  protected _focusLastDescendant(node: HTMLOListElement): boolean {
    if (!node) {
      return false;
    }
    const items = Array.from(node.children).filter(n => n.localName === 'li') as HTMLLIElement[];
    if (!items || !items.length) {
      return false;
    }
    items.reverse();
    for (const child of items) {
      if (child.hasAttribute('disabled')) {
        continue;
      }
      this._focusListItem(child);
      return true;
    }
    return false;
  }

  protected _focusListItem(node: HTMLElement): void {
    node.focus();
    this._activeItem = node.dataset.id as string;
    this._focusedItem = node.dataset.id as string;
    this._focusedElement = node;
    node.scrollIntoView();
  }

  /**
   * Focuses on the next node relative to the passed node.
   * 
   * @param node The node to use as a mark. When not set it uses the currently focused node.
   * @returns true when focused on any of the next siblings
   */
  protected _focusNextSibling(node: HTMLElement): boolean {
    if (!node) {
      return false;
    }
    let current = node.nextElementSibling as HTMLElement;
    while (current) {
      if (current.localName !== 'li' || current.hasAttribute('disabled')) {
        current = current.nextElementSibling as HTMLElement;
        continue;
      }
      this._focusListItem(current);
      return true;
    }
    return false;
  }

  protected _focusPreviousSibling(node: HTMLElement): boolean {
    if (!node) {
      return false;
    }
    let current = node.previousElementSibling as HTMLElement;
    while (current) {
      if (current.localName !== 'li' || current.hasAttribute('disabled')) {
        current = current.previousElementSibling as HTMLElement;
        continue;
      }
      this._focusListItem(current);
      return true;
    }
    return false;
  }

  /**
   * Focuses on a first parent list item that accepts focus relative to the given node.
   * 
   * @param node The node to use as a reference.
   * @returns true when focused on any of the parents
   */
  protected _focusFirstParent(node: HTMLElement): boolean {
    if (!node) {
      return false;
    }
    const parent = this._findParentListItem(node);
    if (parent) {
      this._focusListItem(parent);
      return true;
    }
    return false;
  }

  protected _findParentListItem(node: HTMLElement): HTMLLIElement | undefined {
    let parent = node.parentElement as HTMLElement;
    while (parent) {
      if (parent === this) {
        return undefined;
      }
      if (parent.localName === 'ol') {
        const item = parent.previousElementSibling as HTMLLIElement | null;
        return item || undefined;
      }
      parent = parent.parentElement as HTMLElement;
    }
    return undefined;
  }

  protected render(): TemplateResult {
    const { _log } = this;
    if (!_log) {
      return html``;
    }
    const { request, response } = _log;
    return html`
    <ol role="tree" tabindex="-1" class="tree" aria-multiselectable="false">
    ${this._requestGeneralTemplate(request, response)}
    ${this._responseHeadersTemplate()}
    ${this._requestHeadersTemplate()}
    </ol>
    `;
  }

  protected _treeItemTemplate(name: string, value: string | TemplateResult, id: string): TemplateResult {
    const active = this._activeItem === id;
    const focused = this._focusedItem === id;
    const classes = {
      active,
      'tree-item': true,
    };
    return html`
    <li role="treeitem" class="${classMap(classes)}" data-id="${id}" tabindex="${focused ? '0' : '-1'}" aria-selected="${active ? 'true' : 'false'}">
      <span class="tree-item-name">${name}: </span>
      <span class="tree-item-value">${value}</span>
    </li>
    `;
  }

  protected _parentListItemTemplate(label: string, id: string): TemplateResult {
    const active = this._activeItem === id;
    const focused = this._focusedItem === id;
    const opened = this._parentsOpened.includes(id);
    const classes = {
      active,
      opened,
      closed: !opened,
      focused,
      'tree-parent': true,
    };
    return html`
    <li 
      title="${label}" 
      class="${classMap(classes)}" 
      data-id="${id}" 
      role="treeitem" 
      tabindex="${focused ? '0' : '-1'}" 
      aria-expanded="${opened ? 'true' : 'false'}" 
      aria-selected="${active ? 'true' : 'false'}"
    >
      <span class="tree-element-title">${label}</span>
    </li>
    `;
  }

  protected _childrenItemsTemplate(id: string, items: TemplateResult | TemplateResult[]): TemplateResult {
    const opened = this._parentsOpened.includes(id);
    const classes = {
      expanded: opened,
      collapsed: !opened,
      children: true,
    };
    return html`
    <ol class="${classMap(classes)}" role="group">
      ${items}
    </ol>
    `;
  }

  protected _requestGeneralTemplate(sent?: SentRequest, response?: Response | ErrorResponse): TemplateResult {
    if (!sent) {
      return html``;
    }
    const id = 'general';
    const items = html`
    ${this._treeItemTemplate('Request URL', sent.url, `${id}-request-url`)}
    ${this._treeItemTemplate('Request Method', sent.method, `${id}-request-method`)}
    ${this._responseStatusListItem(id, response)}
    `;
    return html`
    ${this._parentListItemTemplate('General', id)}
    ${this._childrenItemsTemplate(id, items)}
    `;
  }

  protected _responseStatusListItem(id: string, response?: Response | ErrorResponse): TemplateResult | string {
    if (!response) {
      return '';
    }
    const { status = 0, statusText = '' } = response;
    const tpl = statusTemplate(status, statusText);
    return this._treeItemTemplate('Status Code', tpl, `${id}-status-code`);
  }

  protected _requestHeadersTemplate(): TemplateResult {
    const id = 'request-headers';
    return html`
    ${this._parentListItemTemplate('Request headers', id)}
    ${this._childrenItemsTemplate(id, this._headersListTemplate(id, this._requestHeaders))}
    `;
  }

  protected _responseHeadersTemplate(): TemplateResult {
    const id = 'response-headers';
    return html`
    ${this._parentListItemTemplate('Response headers', id)}
    ${this._childrenItemsTemplate(id, this._headersListTemplate(id, this._responseHeaders))}
    `;
  }

  protected _headersListTemplate(prefix: string, headers?: Headers): TemplateResult {
    if (!headers) {
      return html`<p class="no-data">No headers</p>`;
    }
    let i = 0;
    const templates = headers.map((value: string, name: string) => {
      const id = `${prefix}-${i}`;
      i += 1;
      return this._treeItemTemplate(name, value, id);
    });
    return html`${templates}`;
  }
}
