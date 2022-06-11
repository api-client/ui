/* eslint-disable no-param-reassign */
import { css, CSSResult, html, PropertyValueMap, TemplateResult } from "lit";
import { property, query, state } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { StyleInfo, styleMap } from "lit/directives/style-map.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { EventUtils } from '@api-client/core/build/browser.js';
import '@anypoint-web-components/awc/dist/define/anypoint-icon-button.js';
import '../../define/api-icon.js';
import { IconType } from "../icons/Icons.js";
import ApiElement from "../ApiElement.js";

export interface ISelectDetail {
  /**
   * The key of the selected item
   */
  key: string;
  /**
   * THe kind of the selected item
   */
  kind: string;
  /**
   * Optionally, the parent odf the selected item, if any.
   */
  parent?: string;
}

export interface IListItemRenderOptions {
  draggable?: boolean;
  indent?: number;
  parent?: string;
  disabled?: boolean;
  /**
   * Only relevant for parent list item.
   * When set it forces this icon to be rendered next to the toggle button.
   */
  parentIcon?: IconType;
}

/**
 * A base class for navigation elements helping creating specific implementation of the view.
 * The implementations sets their own properties with the data that are used to generate the view.
 * 
 * The generated menu must have the following structure created by the implementations:
 * 
 * ```html
 * <ul aria-label="..." aria-multiselectable="false">
 *  <li role="treeitem" data-key="..." data-kind="..." data-draggable="true|false">
 *    <div class="list-item-content"><span class="item-label" title="...">...</span></div>
 *  </li>
 *  <li role="treeitem" data-key="..." data-kind="..." data-draggable="true|false" aria-expanded="true|false" class="parent-item">
 *    <div class="list-item-content">
 *      <api-icon icon="chevronRight" class="group-toggle-icon"></api-icon>
 *      <span class="item-label" title="...">...</span>
 *    </div>
 *    <ul role="group" data-parent="..." ?hidden aria-hidden="true|false">
 *      <li role="treeitem" data-key="..." data-parent="..." data-kind="..." data-draggable="true|false">
 *        <div class="list-item-content">
 *          <api-icon icon="..." class="item-icon"></api-icon>
 *          <span class="item-label" title="...">...</span>
 *        </div>
 *      </li>
 *    </ul>
 *  </li>
 * </ul>
 * ```
 * 
 * Assumptions when running the menu:
 * 
 * - all `li` items that do not have `aria-disabled` attribute are considered active tree items (learn more why not to use "disabled" attribute https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-disabled)
 * - all `li` elements have `data-key` and `data-kind` attributes set. Elements without these properties are ignored.
 * - all `ul` and `li` elements that have a parent also have `data-parent` with the value of the parent's key. When this is not set the element is considered a top level element.
 * - the implementations does not manage the `tabindex` of any item. Instead set the `_focusedItem` to the currently focused element and the base will manage the focus for you (after the update is complete).
 * 
 * @fires select - Custom, non bubbling event when a selection is made. It has the `key` and `kind` properties on the detail panel with optional `parent` id.
 */
export default class AppNavigation extends ApiElement {
  static get styles(): CSSResult[] {
    return [
    css`
    :host {
      display: block;
    }

    ul {
      margin: 0;
      padding: 0;
      list-style-image: none;
    }

    .list-item-content {
      height: 40px;
      display: flex;
      align-items: center;
      padding: 0 20px;
      margin: 0;
      width: 100%;
      box-sizing: border-box;
    }

    .object-icon {
      width: 20px;
      height: 20px;
      margin-right: 8px;
      /* color: var(--accent-color); */
    }

    .opened > div > .group-toggle-icon {
      transform: rotate(90deg);
      margin-right: 8px;
    }

    :not([aria-disabled="true"]):not(.selected) .list-item-content:hover {
      background-color: var(--list-hover-background);
    }

    li {
      outline: none;
      list-style: none;
      /* 
        This will move the indented this way children to the right.
        Even though this is the default behavior probably this is not
        what you want. Your implementation has to indent each
        list item manually (by setting styles). Until the CSS's "attr()"
        function is not widely supported this element won't try to 
        do standardize the way to do this.
      */
      padding-left: 8px;
      padding-right: 8px;
    }
    
    .root > li {
      padding-left: 0;
    }

    *[aria-disabled="true"] {
      pointer-events: none;
      opacity: var(--disabled-opacity);
    }

    :host(:focus-within) li:focus > .list-item-content,
    :host(:focus-within) li.focused > .list-item-content {
      outline: 1px #000 solid;
    }
    
    :host(:not([noVisualSelection])) li.selected > .list-item-content {
      background: var(--list-active-background, #e3f2fd);
    }

    .item-label {
      font-size: medium;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    .name-change {
      height: 40px;
      display: flex;
      align-items: center;
      padding: 0px 20px;
      border-top: 1px rgba(0, 0, 0, var(--dark-divider-opacity)) solid;
      border-bottom: 1px rgba(0, 0, 0, var(--dark-divider-opacity)) solid;
    }

    .name-change input {
      flex: 1;
      height: 100%;
      margin: 0;
      padding: 0;
      border: 0;
      background-color: transparent;
      outline: none;
    }

    .list-item-content.empty {
      margin-left: 20px;
      width: calc(100% - 20px);
    }
    `];
  }

  /**
   * The list of keys of opened items with children. This should be clear each time 
   * when the main data property change.
   */
  protected _opened: string[] = [];

  /**
   * The key of the currently focused item.
   */
  protected _focused?: string;

  /**
   * The currently focused node.
   * In case there are headers in the list, this may not be a list item.
   */
  @state() protected _focusedItem?: HTMLElement;

  /**
   * To be set in the child class constructor to configure whether a name change is possible.
   */
  protected _allowRename?: boolean;

  /**
   * The currently selected navigation item.
   * @attr
   */
  @property({ type: String }) selected?: string;

  /**
   * When set it renders a name change input for the item.
   * This is the `key` of the object.
   * 
   * Note, when the user finish editing the name it calls the `_commitName(key, kind, name)` method.
   * This requires the `_allowRename` property to be set to `true` in the constructor.
   * @attr
   */
  @property({ type: String }) edited?: string;

  /**
   * When set it prohibits the element to make visual selection (via the css) when an item is selected.
   * This is helpful when one navigation can be visually references in multiple places (like split layout).
   * @attr
   */
  @property({ type: Boolean, reflect: true }) noVisualSelection?: boolean

  /**
   * A reference to the currently rendered name input, if any.
   */
  @query('.name-change input')
  protected _nameInput?: HTMLInputElement | null;

  connectedCallback(): void {
    super.connectedCallback();
    this.setAttribute('role', 'navigation');
    this.setAttribute('tabindex', '0');
  }

  protected willUpdate(cp: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
    super.willUpdate(cp);
    if (cp.has('selected') && !cp.get('selected') && this.selected) {
      this.ensureTreeVisibility(this.selected);
    }
  }

  protected updated(cp: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
    super.updated(cp);
    if (cp.has('edited') && this.edited) {
      const node = this._nameInput;
      if (node) {
        node.focus();
      }
    }
    if (cp.has('_focusedItem') && this._focusedItem) {
      const old = cp.get('_focusedItem') as HTMLElement | undefined;
      this._manageFocus(this._focusedItem, old);
    }
  }

  protected _reset(): void {
    this._opened = [];
    this._focused = undefined;
    this._focusedItem = undefined;
    this.edited = undefined;
  }

  /**
   * This method is called when the `_focusedItem` property is updated.
   * It removes tabindex from the old element (if any) and sets tabindex and focuses on the new item (if any).
   * When there's no new item, it sets the `tabindex` on self.
   * 
   * @param current The new focused element, if any
   * @param old The old focused element, if any.
   */
  protected _manageFocus(current?: HTMLElement, old?: HTMLElement): void {
    if (old) {
      // don't set `-1` here as the item can have children which event with tabindex '0' won't be focusable.
      old.removeAttribute('tabindex');
    }
    if (current) {
      if (current.getAttribute('tabindex') !== '0') {
        current.setAttribute('tabindex', '0');
      }
      current.focus();
      // current.scrollIntoView();
      // remove tabindex from self so when the user returns to this navigation it will focus directly on
      // this item.
      if (this.hasAttribute('tabindex')) {
        this.removeAttribute('tabindex');
      }
    } else if (!this.hasAttribute('tabindex')) {
      // restore tabindex on self.
      this.setAttribute('tabindex', '0');
    }
  }

  /**
   * Makes sure the node represented by the passed key is visible in the UI.
   * This opens all parents on the way up to the root and scrolls to the node, when needed.
   * @param key The key of the object to ensure visibility for.
   */
  ensureTreeVisibility(key: string): void {
    const node = this.shadowRoot?.querySelector(`li[data-key="${key}"]`) as HTMLLIElement;
    if (!node) {
      return;
    }
    const { _opened } = this;
    let parent = this._findParentListItem(node);
    while (parent) {
      const id = parent.dataset.key as string;
      if (!_opened.includes(id)) {
        _opened.push(id);
      }
      parent = this._findParentListItem(parent);
    }
  }

  /**
   * Toggles a group of tree items.
   * 
   * @param key The key of the group parent.
   */
  toggleGroup(key: string): void {
    const { _opened: list } = this;
    const index = list.indexOf(key);
    if (index >= 0) {
      list.splice(index, 1);
    } else {
      list.push(key);
    }
    this.requestUpdate();
  }

  /**
   * Allows to programmatically open a folder.
   * It opens all parents if they are not opened.
   * @param key The key of the folder to open.
   */
  openGroup(key: string): void {
    const node = this.shadowRoot?.querySelector(`li[data-key="${key}"]`) as HTMLLIElement;
    if (!node) {
      return;
    }
    const { _opened: list } = this;
    if (list.includes(key)) {
      return;
    }
    list.push(key);
    // opens all parents

    let parent = this._findParentListItem(node);
    while (parent) {
      const parentKey = parent.dataset.key as string;
      if (!list.includes(parentKey)) {
        list.push(parentKey);
      }
      parent = this._findParentListItem(parent);
    }
    this.requestUpdate();
  }

  /**
   * Allows to programmatically close a folder.
   * @param key The key of the folder to open.
   */
  closeGroup(key: string): void {
    const { _opened: list } = this;
    const index = list.indexOf(key);
    if (index >= 0) {
      list.splice(index, 1);
      this.requestUpdate();
    }
  }

  /**
   * A function to determine whether the passed Element is an active list item.
   * 
   * @param node The Element to test
   * @returns true when the passed element is a `li` element and is not disabled.
   */
  protected _isValidListItem(node: Element): boolean {
    return node.localName === 'li' && node.getAttribute('aria-disabled') !== 'true' && node.hasAttribute('data-key') && node.hasAttribute('data-kind');
  }

  /**
   * Marks the item as currently focused. 
   * 
   * Note, focused item is not the same as selected item. Focus is reflected in the UI without changing the selection.
   * 
   * Also note, this only sets the `_focused` and `_focusedItem` properties. After the element renders 
   * the implementation should change the `tabindex` of the focused item to `0`.
   */
  protected _focusListItem(node: HTMLElement): void {
    this._focused = node.dataset.key;
    this._focusedItem = node;
  }

  /**
   * Finds a valid list item that is a parent to the current item.
   * 
   * @param node The current node located somewhere in the tree.
   * @returns The nearest parent list item or undefined when not found.
   */
  protected _findParentListItem(node: HTMLElement): HTMLLIElement | undefined {
    let parent = node.parentElement as HTMLElement;
    while (parent) {
      if (this._isValidListItem(parent)) {
        return parent as HTMLLIElement;
      }
      // when the `parentElement` is ShadowRoot then it's parent is `null` so the loop breaks.
      parent = parent.parentElement as HTMLElement;
    }
    return undefined;
  }

  /**
   * From a `<li>` it finds the last `<li>` descendant in the tree.
   * 
   * ```html
   * <ul>
   *  <li> <-- this is the current node
   *    <div>...</div>
   *    <ul>
   *       <li>...</li>
   *       <li>  <-- this is the last list item.
   *          <div>...</div>
   *          <ul hidden> <- this is ignored.
   *            <li></li>
   *            <li></li>  <-- this is not the last list item because the parent list is hidden.
   *          </ul>
   *      </li>
   *    </ul>
   *  </li>
   * </ul>
   * ```
   * 
   * @param node The current list item to find the last descendant for.
   * @returns The last list item or undefined.
   */
  protected _findLastDescendant(node: HTMLElement): HTMLElement | undefined {
    const list = Array.from(node.children).reverse().find(i => i.localName === 'ul' && !i.hasAttribute('hidden')) as HTMLElement | undefined;
    if (!list) {
      return undefined;
    }
    const li = Array.from(list.children).reverse().find(i => this._isValidListItem(i)) as HTMLElement | undefined;
    if (!li) {
      return undefined;
    }
    const result = this._findLastDescendant(li);
    // either it has more children or we can return the current list
    if (result) {
      return result;
    }
    return li;
  }

  /**
   * Focuses on a list descendant of a folder item.
   * It does nothing when the `node` is not a folder item or the folder has no selectable children.
   * 
   * @param node The node to use as a reference. The current focused node by default.
   * @returns true when focused on any of the descendants
   */
  protected _focusFirstDescendant(node = this._focusedItem): boolean {
    if (!node) {
      return false;
    }
    const list = Array.from(node.children).find(n => n.localName === 'ul' && (!n.hasAttribute('aria-hidden') || n.getAttribute('aria-hidden') === 'false'));
    if (!list || !list.children) {
      return false;
    }
    const children = Array.from(list.children);
    for (const child of children) {
      if (!this._isValidListItem(child)) {
        continue;
      }
      const typed = child as HTMLLIElement;
      this._focusListItem(typed);
      return true;
    }
    return false;
  }

  /**
   * Focuses on the next node relative to the passed node.
   * 
   * @param node The node to use as a starting point. When not set it uses the currently focused node.
   * @returns true when focused on any of the next siblings
   */
  focusNextSibling(node = this._focusedItem): boolean {
    if (!node) {
      return false;
    }
    let current = node.nextElementSibling as HTMLElement;
    while (current) {
      if (!this._isValidListItem(current)) {
        current = current.nextElementSibling as HTMLElement;
        continue;
      }
      this._focusListItem(current);
      return true;
    }
    return false;
  }

  /**
   * Focuses on the previous node relative to the passed node.
   * 
   * @param node The node to use as a starting point. When not set it uses the currently focused node.
   * @returns true when focused on any of the previous siblings
   */
  focusPreviousSibling(node = this._focusedItem): boolean {
    if (!node) {
      return false;
    }
    let current = node.previousElementSibling as HTMLElement;
    while (current) {
      if (!this._isValidListItem(current)) {
        current = current.previousElementSibling as HTMLElement;
        continue;
      }
      // now we find the last descendant of this node.
      // if it doesn't have one, we focus on the node we have.
      const last = this._findLastDescendant(current);
      if (last) {
        this._focusListItem(last);
        return true;
      }
      this._focusListItem(current)
      return true;
    }
    return false;
  }

  /**
   * Focuses on a first list item that accepts focus relative to the given node.
   * 
   * @param node The node to use as a reference. The current focused node by default.
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

  protected _findClosestListItem(e: Event): HTMLLIElement | undefined {
    const path = e.composedPath();
    while (path.length) {
      const target = path.shift() as Node;
      if (!target) {
        break;
      }
      if (target.nodeType !== Node.ELEMENT_NODE) {
        continue;
      }
      if (!this._isValidListItem(target as Element)) {
        continue;
      }
      return target as HTMLLIElement;
    }
    return undefined;
  }

  /**
   * Dispatched the `select` custom event with the `key` and `kind` on the detail.
   * 
   * @param key The key of the selected item.
   * @param kind The kind of the selected item
   * @param parent Optional parent item.
   */
  protected _notifySelection(key: string, kind: string, parent?: string): void {
    this.dispatchEvent(new CustomEvent<ISelectDetail>('select', {
      detail: { key, kind, parent },
    }));
  }

  /**
   * A handler for the `dragstart` event dispatched when the item is draggable.
   * Calls the `_setupDataTransfer()` if has valid target.
   */
  protected _itemDragStartHandler(e: DragEvent): void {
    const node = this._findClosestListItem(e);
    const dt = e.dataTransfer;
    if (!dt || !node) {
      return;
    }
    this._setupDataTransfer(node, dt);
  }

  /**
   * Sets the common properties on the `DataTransfer`. Implementations can override this method to add
   * own properties.
   */
  protected _setupDataTransfer(item: HTMLLIElement, dt: DataTransfer): void {
    const kind = item.dataset.kind as string;
    dt.setData('text/kind', kind);
    dt.setData(kind, '');
    dt.setData('text/key', item.dataset.key as string);
    dt.setData('text/source', this.localName);
    dt.effectAllowed = 'copyMove';
  }

  protected _nameInputKeydown(e: KeyboardEvent): void {
    e.stopPropagation();
    if (e.key === 'Escape') {
      this.edited = undefined;
    } else if (e.key === 'Enter') {
      const input = e.target as HTMLInputElement;
      const { key, kind } = input.dataset;
      if (!key || !kind) {
        return;
      }
      this._commitName(key, kind, input.value.trim());
    }
  }

  protected _commitNameHandler(e: Event): void {
    e.preventDefault();
    const input = (e.target as HTMLElement).previousElementSibling as HTMLInputElement;
    if (!input || input.localName !== 'input') {
      return;
    }
    const { key, kind } = input.dataset;
    if (!key || !kind) {
      return;
    }
    this._commitName(key, kind, input.value.trim());
  }

  /**
   * This should be overwritten by the implementation that support name change.
   * Method called when the user request to change a name of an item.
   * 
   * @param key The key of the item.
   * @param kind The kind of the item.
   * @param name THe new name.
   */
  protected _commitName(key: string, kind: string, name: string): void | Promise<void> {
    // eslint-disable-next-line no-console
    console.warn(`The commit name method is not set in the child class for ${key}, ${kind}, and ${name}.`);
  }

  protected _dblClickHandler(e: Event): void {
    if (e.defaultPrevented) {
      return;
    }
    const node = this._findClosestListItem(e);
    if (!node) {
      return;
    }
    this._itemEnterAction(node);
  }

  protected _clickHandler(e: Event): void {
    if (e.defaultPrevented) {
      return;
    }
    const node = this._findClosestListItem(e);
    if (!node) {
      return;
    }
    const key = node.dataset.key as string;
    if (node.classList.contains('parent-item')) {
      const target = e.target as HTMLElement;
      if (target.localName === 'api-icon' && target.classList.contains('group-toggle-icon')) {
        this.toggleGroup(key);
        return;
      }
    }
    this._focusListItem(node);
    this.requestUpdate();
  }

  protected _keydownHandler(e: KeyboardEvent): void {
    const node = this._findClosestListItem(e);
    if (!node) {
      return;
    }
    switch (e.key) {
      case 'ArrowRight': this._itemRightAction(node); e.preventDefault(); break;
      case 'ArrowLeft': this._itemLeftAction(node); e.preventDefault(); break;
      case 'ArrowDown': this._itemDownAction(node); e.preventDefault(); break;
      case 'ArrowUp': this._itemUpAction(node); e.preventDefault(); break;
      case 'Home': this._homeAction(); e.preventDefault(); break;
      case 'End': this._endAction(); e.preventDefault(); break;
      case 'Enter': this._itemEnterAction(node); e.preventDefault(); break;
      default:
    }
  }

  /**
   * Performs the default action of the currently focused node. 
   * For parent nodes, it opens or closes the node. 
   * In single-select trees, if the node has no children, selects the current node 
   * if not already selected (which is the default action).
   */
  protected _itemEnterAction(node: HTMLElement): void {
    const key = node.dataset.key as string;
    const isFolder = node.classList.contains('parent-item');
    if (isFolder) {
      this.toggleGroup(key);
    }
    // don't guard this with checking whether the selection changed.
    // In a tabbed / split layout the item can be closed while the navigation item still can 
    // be selected.
    this.selected = key;
    this._notifySelection(key, node.dataset.kind as string);
  }

  /**
   * 1. When focus is on a closed node, opens the node; focus does not move.
   * 2. When focus is on a open node, moves focus to the first child node.
   * 3. When focus is on an end node (a tree item with no children), does nothing.
   */
  protected _itemRightAction(node: HTMLElement): void {
    const isFolder = node.classList.contains('parent-item');
    if (!isFolder) {
      return;
    }
    const key = node.dataset.key as string;
    const opened = this._opened.includes(key);
    if (!opened) {
      // #1
      this._opened.push(key);
      this.requestUpdate();
      return;
    }
    const size = Number(node.dataset.size);
    if (Number.isNaN(size) || !size) {
      // #3
      return;
    }
    // #2
    this._focusFirstDescendant(node);
  }

  /**
   * 1. When focus is on an open node, closes the node.
   * 2. When focus is on a child node that is also either an end node or a closed node, moves focus to its parent node.
   * 3. When focus is on a closed `tree`, does nothing.
   */
  protected _itemLeftAction(node: HTMLElement): void {
    const key = node.dataset.key as string;
    const isFolder = node.classList.contains('parent-item');
    if (isFolder) {
      const opened = this._opened.includes(key);
      if (opened) {
        // #1
        const index = this._opened.indexOf(key);
        this._opened.splice(index, 1);
        this.requestUpdate();
        return;
      }
    }
    // #2
    this._focusFirstParent(node);
    // note, #3 won't happen here as the outer tree is always opened.
  }

  /**
   * Moves focus to the next node that is focusable without opening or closing a node.
   */
  protected _itemDownAction(node: HTMLElement): void {
    const isFolder = node.classList.contains('parent-item');
    // try focusing on any child
    if (isFolder && this._focusFirstDescendant(node)) {
      return;
    }
    // try focus on any next item.
    if (this.focusNextSibling(node)) {
      return;
    }
    let parent = this._findParentListItem(node);
    while (parent) {
      if (this.focusNextSibling(parent)) {
        return;
      }
      parent = this._findParentListItem(parent);
    }
  }

  /**
   * Moves focus to the previous node that is focusable without opening or closing a node.
   */
  protected _itemUpAction(node: HTMLElement): void {
    if (this.focusPreviousSibling(node)) {
      return;
    }
    this._focusFirstParent(node);
  }

  protected _homeAction(): void {
    const first = this.shadowRoot!.querySelector('ul');
    if (!first) {
      return;
    }
    const children = Array.from(first.children) as HTMLElement[];
    for (const node of children) {
      if (this._isValidListItem(node)) {
        this._focusListItem(node);
      }
    }
  }

  protected _endAction(): void {
    const first = this.shadowRoot!.querySelector('ul');
    if (!first) {
      return;
    }
    const children = Array.from(first.children).reverse() as HTMLElement[];
    for (const node of children) {
      if (this._isValidListItem(node)) {
        this._focusListItem(node);
      }
    }
  }
  
  /**
   * 
   * @param contents The children contents.
   * @returns A predefined template for the outer list element.
   */
  protected _outerListTemplate(contents: TemplateResult | TemplateResult[] | string): TemplateResult {
    return html`
    <ul 
      role="tree" 
      aria-multiselectable="false" 
      @dblclick="${this._dblClickHandler}"
      @click="${this._clickHandler}"
      @keydown="${this._keydownHandler}"
      class="root"
    >
      ${contents}
    </ul>
    `;
  }

  protected _parentListItemTemplate(key: string, kind: string, label: string, children: TemplateResult | TemplateResult[] | string, opts: IListItemRenderOptions = {}): TemplateResult {
    const { selected, _focused, edited } = this;
    const opened = this._opened.includes(key);
    const classes = {
      'parent-item': true,
      selected: selected === key,
      focused: _focused === key,
      opened,
    };
    const styles: StyleInfo = {};
    if (typeof opts.indent === 'number') {
      styles['padding-left'] = `${this._computeIndent(opts.indent)}px`;
    }
    return html`
    <li 
      class="${classMap(classes)}" 
      role="treeitem" 
      aria-expanded="${opened ? 'true' : 'false'}"
      data-parent="${ifDefined(opts.parent)}"
      data-key="${key}"
      data-kind="${kind}"
      draggable="${opts.draggable ? 'true' : 'false'}"
      @dragstart="${this._itemDragStartHandler}"
      aria-disabled="${opts.disabled ? 'true' : 'false'}"
    >
      ${edited === key ? this._nameInputTemplate(key, kind, label) : this.parentListItemContentTemplate(label, opts)}
      <ul 
        role="group" 
        id="group${key}" 
        data-parent="${ifDefined(opts.parent)}" 
        ?hidden="${!opened}" 
        aria-hidden="${opened ? 'false' : 'true'}"
      >
        ${children}
      </ul>
    </li>
    `;
  }

  protected parentListItemContentTemplate(label: string, opts: IListItemRenderOptions = {}): TemplateResult {
    const styles: StyleInfo = {};
    if (typeof opts.indent === 'number') {
      styles['padding-left'] = `${this._computeIndent(opts.indent)}px`;
    }
    return html`
    <div class="list-item-content" style="${styleMap(styles)}">
      <api-icon icon="chevronRight" class="group-toggle-icon"></api-icon>
      ${opts.parentIcon ? html`<api-icon icon="${opts.parentIcon}" class="object-icon"></api-icon>` : ''}
      <span class="item-label" title="${label}">${label}</span>
    </div>
    `;
  }

  protected _listItemTemplate(key: string, kind: string, label: string, content: TemplateResult | TemplateResult[] | string, opts: IListItemRenderOptions = {}): TemplateResult {
    const { selected, _focused, edited } = this;
    if (edited === key) {
      return this._nameInputTemplate(key, kind, label);
    }
    const classes = {
      selected: selected === key,
      focused: _focused === key,
    };
    const styles: StyleInfo = {};
    if (typeof opts.indent === 'number') {
      styles['padding-left'] = `${this._computeIndent(opts.indent)}px`;
    }
    return html`
    <li 
      class="${classMap(classes)}" 
      role="treeitem" 
      data-parent="${ifDefined(opts.parent)}"
      data-key="${key}"
      data-kind="${kind}"
      draggable="${opts.draggable ? 'true' : 'false'}"
      @dragstart="${this._itemDragStartHandler}"
      aria-disabled="${opts.disabled ? 'true' : 'false'}"
    >
      <div class="list-item-content" style="${styleMap(styles)}">${content}</div>
    </li>
    `;
  }

  protected _nameInputTemplate(key: string, kind: string, oldName?: string): TemplateResult {
    return html`
    <div class="name-change" @click="${EventUtils.cancelEvent}" @keydown="${EventUtils.cancelEvent}" @dblclick="${EventUtils.cancelEvent}">
      <input type="text" .value=${oldName || ''} @keydown="${this._nameInputKeydown}" data-key="${key}" data-kind="${kind}"/>
      <anypoint-icon-button @click="${this._commitNameHandler}" aria-label="Confirm name change">
        <api-icon icon="check"></api-icon>
      </anypoint-icon-button>
    </div>
    `;
  }

  protected _itemContentTemplate(icon: IconType, label: string): TemplateResult {
    return html`
    <api-icon icon="${icon}" class="object-icon"></api-icon>
    <span class="item-label" title="${label}">${label}</span>
    `;
  }

  protected _computeIndent(indent = 0): number {
    return indent * 8 + 20;
  }
}
