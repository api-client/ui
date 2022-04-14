/* eslint-disable no-continue */
/* eslint-disable class-methods-use-this */
import { LitElement, html, TemplateResult, CSSResult, PropertyValueMap } from 'lit';
import { property, query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { 
  HttpProject, ProjectFolder, ProjectRequest, ProjectFolderKind, ProjectRequestKind, 
  Environment, EnvironmentKind,
} from '@api-client/core/build/browser.js';
import '@anypoint-web-components/awc/dist/define/anypoint-icon-button.js'
import { Events } from '../../events/Events.js';
import '../../define/api-icon.js'
import styles from './ProjectNavigationStyles.js';

export default class ProjectNavigationElement extends LitElement {
  static get styles(): CSSResult[] {
    return [styles];
  }

  /**
   * The instance of the project to create the navigation for.
   */
  @property({ type: Object }) project?: HttpProject;

  /**
   * The list of keys of opened folder.
   */
  protected openedFolders: string[] = [];

  /**
   * The key of the currently focused item.
   */
  protected focused?: string;

  /**
   * The currently focused node.
   */
  protected focusedItem?: HTMLElement;

  /**
   * The currently selected navigation item.
   * This indicates which object is currently being rendered in the view.
   */
  @property({ type: String }) selected?: string;

  /**
   * When set it renders a name change input for the item.
   * This is the `key` of the object.
   */
  @property({ type: String }) edited?: string;

  /**
   * The list of objects that are selected for future processing
   * (like delete, copy, etc). This does not indicate the selected state.
   */
  protected secondarySelected: string[] = [];

  @query('.name-change input')
  protected nameInput?: HTMLInputElement | null;

  connectedCallback(): void {
    super.connectedCallback();
    this.setAttribute('role', 'navigation');
    this.setAttribute('aria-label', 'Project');
  }

  protected updated(cp: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
    super.updated(cp);
    if (cp.has('edited') && this.edited) {
      const node = this.nameInput;
      if (node) {
        node.focus();
      }
    }
  }

  protected _dblClickHandler(e: Event): void {
    const node = this._findClosestListItem(e);
    if (!node) {
      return;
    }
    this._itemEnterAction(node);
  }

  protected _clickHandler(e: Event): void {
    const node = this._findClosestListItem(e);
    if (!node) {
      return;
    }
    const { secondarySelected } = this;
    const key = node.dataset.key as string;
    this.focusListItem(node);
    if (!secondarySelected.includes(key)) {
      secondarySelected.push(key);
    }
    this.requestUpdate();
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
      if (elm.classList.contains('project-tree-item')) {
        return elm;
      }
    }
    return undefined;
  }

  /**
   * Performs the default action of the currently focused node. 
   * For parent nodes, it opens or closes the node. 
   * In single-select trees, if the node has no children, selects the current node 
   * if not already selected (which is the default action).
   */
  protected _itemEnterAction(node: HTMLElement): void {
    const key = node.dataset.key as string;
    const isFolder = node.classList.contains('folder-item');
    if (isFolder) {
      this.toggleFolder(key);
    } else {
      this.selected = key;
      this._notifySelection(key, node.dataset.kind as string);
    }
  }

  /**
   * 1. When focus is on a closed node, opens the node; focus does not move.
   * 2. When focus is on a open node, moves focus to the first child node.
   * 3. When focus is on an end node (a tree item with no children), does nothing.
   */
  protected _itemRightAction(node: HTMLElement): void {
    const kind = node.dataset.kind as string;
    if (kind !== ProjectFolderKind) {
      return;
    }
    const key = node.dataset.key as string;
    const opened = this.openedFolders.includes(key);
    if (!opened) {
      // #1
      this.openedFolders.push(key);
      this.requestUpdate();
      return;
    }
    const size = Number(node.dataset.size);
    if (Number.isNaN(size) || !size) {
      // #3
      return;
    }
    // #2
    this.focusFirstDescendant(node);
  }

  /**
   * 1. When focus is on an open node, closes the node.
   * 2. When focus is on a child node that is also either an end node or a closed node, moves focus to its parent node.
   * 3. When focus is on a closed `tree`, does nothing.
   */
  protected _itemLeftAction(node: HTMLElement): void {
    const kind = node.dataset.kind as string;
    const key = node.dataset.key as string;
    const isFolder = kind === ProjectFolderKind;
    if (isFolder) {
      const opened = this.openedFolders.includes(key);
      if (opened) {
        // #1
        const index = this.openedFolders.indexOf(key);
        this.openedFolders.splice(index, 1);
        this.requestUpdate();
        return;
      }
    }
    // #2
    this.focusFirstParent(node);
    // note, #3 won't happen here as the tree is always opened.
  }

  /**
   * Moves focus to the next node that is focusable without opening or closing a node.
   */
  protected _itemDownAction(node: HTMLElement): void {
    const kind = node.dataset.kind as string;
    const isFolder = kind === ProjectFolderKind;
    // try focusing on any child
    if (isFolder && this.focusFirstDescendant(node)) {
      return;
    }
    // try focus on any next item.
    if (this.focusNextSibling(node)) {
      return;
    }
    let parent = this.findParentListItem(node);
    while (parent) {
      if (this.focusNextSibling(parent)) {
        return;
      }
      parent = this.findParentListItem(parent);
    }
  }

  /**
   * Moves focus to the previous node that is focusable without opening or closing a node.
   */
  protected _itemUpAction(node: HTMLElement): void {
    if (this.focusPreviousSibling(node)) {
      return;
    }
    this.focusFirstParent(node);
  }

  protected _homeAction(): void {
    const first = this.shadowRoot!.querySelector('ul');
    if (!first) {
      return;
    }
    const children = Array.from(first.children) as HTMLElement[];
    for (const node of children) {
      if (this.focusListItem(node)) {
        return;
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
      if (this.focusListItem(node)) {
        return;
      }
    }
  }

  /**
   * Toggles folder opened.
   * @param key The key of the folder.
   */
  toggleFolder(key: string): void {
    const { openedFolders } = this;
    const index = openedFolders.indexOf(key);
    if (index >= 0) {
      openedFolders.splice(index, 1);
    } else {
      openedFolders.push(key);
    }
    this.requestUpdate();
  }

  /**
   * Focuses on the next node relative to the passed node.
   * 
   * @param node The node to use as a mark. When not set it uses the currently focused node.
   * @returns true when focused on any of the next siblings
   */
  focusNextSibling(node = this.focusedItem): boolean {
    if (!node) {
      return false;
    }
    let current = node.nextElementSibling as HTMLElement;
    while (current) {
      if (current.localName !== 'li' || current.hasAttribute('disabled')) {
        current = node.nextElementSibling as HTMLElement;
        continue;
      }
      if (this.focusListItem(current)) {
        return true;
      }
      current = node.nextElementSibling as HTMLElement;
    }
    return false;
  }

  /**
   * Focuses on the previous node relative to the passed node.
   * 
   * @param node The node to use as a mark. When not set it uses the currently focused node.
   * @returns true when focused on any of the previous siblings
   */
  focusPreviousSibling(node = this.focusedItem): boolean {
    if (!node) {
      return false;
    }
    let current = node.previousElementSibling as HTMLElement;
    while (current) {
      if (current.localName !== 'li' || current.hasAttribute('disabled')) {
        current = node.previousElementSibling as HTMLElement;
        continue;
      }
      // now we find the last descendant of this node.
      // if it doesn't have one, we focus on the node we have.
      const last = this.findLastDescendant(current);
      if (last) {
        this.focusListItem(last);
        return true;
      }
      if (this.focusListItem(current)) {
        return true;
      }
      current = node.previousElementSibling as HTMLElement;
    }
    return false;
  }

  /**
   * Focuses on a list descendant of a folder item.
   * It does nothing when the `node` is not a folder item or the folder has no selectable children.
   * 
   * @param node The node to use as a reference. The current focused node by default.
   * @returns true when focused on any of the descendants
   */
  focusFirstDescendant(node = this.focusedItem): boolean {
    if (!node) {
      return false;
    }
    const list = Array.from(node.children).find(n => n.localName === 'ul');
    if (!list || !list.children || list.hasAttribute('hidden')) {
      return false;
    }
    const children = Array.from(list.children);
    for (const child of children) {
      if (child.localName !== 'li' || child.hasAttribute('disabled')) {
        continue;
      }
      const typed = child as HTMLLIElement;
      if (this.focusListItem(typed)) {
        return true;
      }
    }
    return false;
  }
  
  /**
   * Focuses on a first list item that accepts focus relative to the given node.
   * 
   * @param node The node to use as a reference. The current focused node by default.
   * @returns true when focused on any of the parents
   */
  focusFirstParent(node = this.focusedItem): boolean {
    if (!node) {
      return false;
    }
    let parent = this.findParentListItem(node);
    while (parent) {
      if (this.focusListItem(parent)) {
        return true;
      }
      parent = this.findParentListItem(parent);
    }
    return false;
  }

  protected focusListItem(node: HTMLElement): boolean {
    node.focus();
    const owner = (node.getRootNode() || document) as Document | ShadowRoot;
    // just in case focus didn't work.
    const hasFocus = owner.activeElement === node;
    if (hasFocus) {
      this.focused = node.dataset.key as string;
      this.focusedItem = node;
      this.requestUpdate();
      node.scrollIntoView();
    }
    return hasFocus;
  }

  protected findParentListItem(node: HTMLElement): HTMLElement | undefined {
    let parent = node.parentElement as HTMLElement;
    while (parent) {
      if (parent === this) {
        break;
      }
      if (parent.localName === 'li' && !parent.hasAttribute('disabled')) {
        return parent;
      }
      parent = parent.parentElement as HTMLElement;
    }
    return undefined;
  }

  protected findLastDescendant(node: HTMLElement): HTMLElement | undefined {
    const list = Array.from(node.children).reverse().find(i => i.localName === 'ul') as HTMLElement | undefined;
    if (!list || list.hasAttribute('hidden')) {
      return undefined;
    }
    const li = Array.from(list.children).reverse().find(i => i.localName === 'li') as HTMLElement | undefined;
    if (!li) {
      return undefined;
    }
    const result = this.findLastDescendant(li);
    // either it has more children or we can return the current list
    if (result) {
      return result;
    }
    return li;
  }

  protected _notifySelection(key: string, kind: string): void {
    this.dispatchEvent(new CustomEvent('select', {
      detail: { key, kind },
    }));
  }

  protected _itemDragStartHandler(e: DragEvent): void {
    const node = this._findClosestListItem(e);
    const dt = e.dataTransfer;
    if (!dt || !node) {
      return;
    }
    dt.setData('text/kind', node.dataset.kind as string);
    dt.setData('text/key', node.dataset.key as string);
    dt.setData('text/source', this.localName);
    // dt.setData('text/httpproject', this.project!.key);
    dt.effectAllowed = 'copyMove';
  }

  protected _nameInputKeydown(e: KeyboardEvent): void {
    e.stopPropagation();
    if (e.key === 'Escape') {
      this.edited = undefined;
    } else if (e.key === 'Enter') {
      this._commitName();
    }
  }

  protected _commitName(): void {
    const { edited, project, nameInput } = this;
    if (!edited || !project || !nameInput) {
      return;
    }
    const { key, kind } = nameInput.dataset;
    if (!key || !kind) {
      return;
    }
    const newName = nameInput.value.trim();
    if (!newName) {
      return;
    }
    if (kind === ProjectFolderKind) {
      const object = project.findFolder(key);
      if (!object) {
        throw new Error(`Invalid state. Folder not found.`);
      }
      object.info.name = newName;
    } else if (kind === ProjectRequestKind) {
      const object = project.findRequest(key);
      if (!object) {
        throw new Error(`Invalid state. Request not found.`);
      }
      object.info.name = newName;
    } else if (kind === EnvironmentKind) {
      const object = project.getEnvironment(key);
      if (!object) {
        throw new Error(`Invalid state. Environment not found.`);
      }
      object.info.name = newName;
    } else {
      throw new Error(`Invalid state. Unknown kind.`);
    }
    this.edited = undefined;
    Events.HttpProject.changed(this);
    Events.HttpProject.State.nameChanged(key, kind, this);
  }

  render(): TemplateResult {
    const { project } = this;
    if (!project) {
      return html``;
    }
    const folders = project.listFolders();
    const requests = project.listRequests();
    const environments = project.listEnvironments();
    return html`
    <ul 
      role="tree" 
      aria-multiselectable="false" 
      @dblclick="${this._dblClickHandler}"
      @click="${this._clickHandler}"
      @keydown="${this._keydownHandler}"
    >
      ${folders.map(f => this.renderFolder(f))}
      ${environments.map(r => this.renderEnvironment(r))}
      ${requests.map(r => this.renderRequest(r))}
    </ul>
    `;
  }

  protected renderFolder(folder: ProjectFolder, parentKey?: string): TemplateResult {
    const { selected, focused, openedFolders, edited } = this;
    const { key } = folder;
    if (edited === key) {
      return this.renderNameInput(key, folder.kind, folder.info.name);
    }
    const project = this.project as HttpProject;
    const name = folder.info.name || 'Unnamed folder';
    const folders = project.listFolders({ folder: key });
    const requests = project.listRequests(key);
    const environments = folder.listEnvironments();
    const opened = openedFolders.includes(key);
    const classes = {
      'tree-parent': true,
      'folder-item': true,
      'project-tree-item': true,
      selected: selected === key,
      focused: focused === key,
      opened,
    };
    return html`
    <li 
      class="${classMap(classes)}" 
      role="treeitem" 
      tabindex="0" 
      aria-expanded="${opened ? 'true' : 'false'}"
      data-parent="${ifDefined(parentKey)}"
      data-key="${key}"
      data-kind="${ProjectFolderKind}"
      data-size="${requests.length + folders.length}"
    >
      <div class="list-item-content">
        <api-icon icon="chevronRight" class="object-icon open-icon"></api-icon>
        <span class="item-label">${name}</span>
      </div>
      <ul 
        role="group" 
        id="group${key}" 
        data-parent="${ifDefined(parentKey)}" 
        ?hidden="${!opened}" 
        aria-hidden="${opened ? 'false' : 'true'}"
      >
        ${folders.map(f => this.renderFolder(f, key))}
        ${environments.map(r => this.renderEnvironment(r))}
        ${requests.map(r => this.renderRequest(r, key))}
      </ul>
    </li>
    `;
  }

  protected renderRequest(request: ProjectRequest, parentKey?: string): TemplateResult {
    const { selected, focused, edited } = this;
    const { key } = request;
    if (edited === key) {
      return this.renderNameInput(key, request.kind, request.info.name);
    }
    const name = request.info.name || 'Unnamed request';
    const classes = {
      'request-item': true,
      'project-tree-item': true,
      selected: selected === key,
      focused: focused === key,
    };
    return html`
    <li 
      class="${classMap(classes)}" 
      role="treeitem" 
      tabindex="0" 
      data-parent="${ifDefined(parentKey)}"
      data-key="${key}"
      data-kind="${ProjectRequestKind}"
      draggable="true"
      @dragstart="${this._itemDragStartHandler}"
    >
      <div class="list-item-content">
        <api-icon icon="request" class="object-icon"></api-icon>
        <span class="item-label">${name}</span>
      </div>
    </li>
    `;
  }

  protected renderEnvironment(environment: Environment, parentKey?: string): TemplateResult {
    const { selected, focused, edited } = this;
    const { key } = environment;
    if (edited === key) {
      return this.renderNameInput(key, environment.kind, environment.info.name);
    }
    const name = environment.info.name || 'Unnamed environment';
    const classes = {
      'environment-item': true,
      'project-tree-item': true,
      selected: selected === key,
      focused: focused === key,
    };
    return html`
    <li 
      class="${classMap(classes)}" 
      role="treeitem" 
      tabindex="0" 
      data-parent="${ifDefined(parentKey)}"
      data-key="${key}"
      data-kind="${EnvironmentKind}"
      draggable="true"
      @dragstart="${this._itemDragStartHandler}"
    >
      <div class="list-item-content">
        <api-icon icon="environment" class="object-icon"></api-icon>
        <span class="item-label">${name}</span>
      </div>
    </li>
    `;
  }

  protected renderNameInput(key: string, kind: string, oldName?: string): TemplateResult {
    return html`
    <div class="name-change">
      <input type="text" .value=${oldName || ''} @keydown="${this._nameInputKeydown}" data-key="${key}" data-kind="${kind}"/>
      <anypoint-icon-button @click="${this._commitName}" aria-label="Confirm name change">
        <api-icon icon="check"></api-icon>
      </anypoint-icon-button>
    </div>
    `;
  }
}
