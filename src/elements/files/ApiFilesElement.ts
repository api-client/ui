/* eslint-disable no-continue */
/* eslint-disable class-methods-use-this */
/*
Copyright 2022 Pawel Psztyc
Licensed under the CC-BY 2.0
*/
import { html, TemplateResult, LitElement, CSSResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import {
  IListOptions, IBackendEvent, ProjectKind, IFile, WorkspaceKind, IFileCreateOptions, IUser,
} from '@api-client/core/build/browser.js';
import { Patch } from '@api-client/json';
import { AnypointListboxElement } from '@anypoint-web-components/awc';
import '@anypoint-web-components/awc/dist/define/anypoint-progress.js';
import '@anypoint-web-components/awc/dist/define/anypoint-icon-button.js';
import '@anypoint-web-components/awc/dist/define/anypoint-menu-button.js';
import '@anypoint-web-components/awc/dist/define/anypoint-listbox.js';
import '@anypoint-web-components/awc/dist/define/anypoint-icon-item.js';
import '@github/time-elements/dist/time-ago-element.js';
import '../../define/add-file-dialog.js';
import '../../define/share-file.js';
import '../../define/api-icon.js';
import { Events } from '../../events/Events.js';
import { EventTypes } from '../../events/EventTypes.js';
import styles from './ApiFilesElement.styles.js';
import layout from '../../pages/styles/global-styles.js';
import { IconsMap, DefaultNamesMap, AddLabelsMap } from './FileMaps.js';

interface SelectionInfo {
  key: string;
  kind: string;
}

const pageLimit = 100;

/**
 * An element that renders a list of files from the API store.
 * It can be configured to render different types of files via the `kinds` property.
 * 
 * ## Usage
 * 
 * The store requires to set the list of `kinds` of the files the application is requesting.
 * Regardless of the list, spaces are always returned by the store.
 * 
 * ```html
 * <api-files .kinds="${["Core#Project"]}"></api-files>
 * ```
 * 
 * Additionally, the element does not initialize observing for files change. The hosting screen
 * must call the store to start watching for file changes. The hosting screen is also responsible 
 * for closing the files observer.
 * 
 * The element observers the files state change event dispatched by the store bindings.
 * This allows to have a synchronized with the store list of files.
 * 
 * @fires open
 * @fires viewstatechange
 */
export default class ApiFilesElement extends LitElement {
  static get styles(): CSSResult[] {
    return [styles, layout];
  }

  /**
   * The list of file kinds to render in the view.
   * User spaces are always rendered.
   * @attribute
   */
  @property({ type: Array }) kinds?: string[];

  /**
   * Renders a button allowing to add a new file.
   * The list of options in the list depends on the `kinds` property.
   * 
   * Spaces are always included when this is enabled.
   * @attribute
   */
  @property({ type: Boolean }) allowAdd?: boolean;

  @property({ type: Boolean }) anypoint?: boolean;

  /**
   * The list title to render.
   * @default "Your files"
   * @attribute
   */
  @property({ type: String }) listTitle = 'Your files';

  @state() protected loadingFiles = false;

  @state() protected loadingFile = false;

  /**
   * The list type to render.
   * @default "grid"
   * @attribute
   */
  @property({ type: String }) viewType: 'grid' | 'list' = 'grid';

  /**
   * Allows to perform multi selection on the files list.
   */
  @property({ type: Boolean }) multiSelect = false;

  /**
   * Whether to allow to share selected file(s)
   * User may not be authorized to share a file.
   */
  @property({ type: Boolean }) canShare = false;

  /**
   * Whether to allow to trash selected file(s)
   * User may not be authorized to trash a file.
   */
  @property({ type: Boolean }) canTrash = false;

  /**
   * The type of view to render.
   * By default it renders the "owned" type which are the user files.
   * When set to shared it requests for files that has been shared with the user.
   */
  @property({ type: String }) type: 'owned' | 'shared' = 'owned';

  /**
   * The list of currently rendered files.
   */
  @state() protected files: IFile[] = [];

  /**
   * The page cursor for the files pagination.
   */
  protected filesCursor?: string;

  private _parent?: string;

  private _scrollTarget?: EventTarget;

  /**
   * Set on the element to add support for user scrolling through the list.
   * It is the reference to the parent element that is scrolling.
   * 
   * @default window
   */
  @property({ type: Object })
  get scrollTarget(): EventTarget | undefined {
    return this._scrollTarget;
  }

  set scrollTarget(value: EventTarget | undefined) {
    const old = this._scrollTarget;
    if (old === value) {
      return;
    }
    this._scrollTarget = value;
    if (old) {
      old.removeEventListener('scroll', this._scrollHandler);
    }
    if (value) {
      value.addEventListener('scroll', this._scrollHandler, { passive: true })
    }
  }

  /**
   * The currently rendered space key.
   * Setting the value will trigger reading files from the server.
   */
  @property({ type: String })
  get parent(): string | undefined {
    return this._parent;
  }

  set parent(value: string | undefined) {
    const old = this._parent;
    if (old === value) {
      return;
    }
    this._parent = value;
    this.cleanup();
    this.loadFiles();
    if (value) {
      this.loadFile(value);
    }
  }

  /**
   * A flag that prevents from requesting more files when the previous
   * file response returned no files.
   */
  private hasMoreFiles = true;

  /**
   * The file metadata for the `parent`
   */
  @state() protected file?: IFile;

  /**
   * The list of ids of currently selected files.
   */
  @state() protected selected: SelectionInfo[] = [];

  /**
   * Whether theres's a selection made in the file browser.
   */
  get hasSelection(): boolean {
    return this.selected.length > 0;
  }

  /**
   * The current user to pass to the share file component.
   */
  @property({ type: Object }) user?: IUser;

  constructor() {
    super();
    this._fileMetaHandler = this._fileMetaHandler.bind(this);
    this._scrollHandler = this._scrollHandler.bind(this);
    this.scrollTarget = window;
  }

  connectedCallback(): void {
    super.connectedCallback();
    if (!this.loadingFiles) {
      this.loadFiles();
    }
    if (this.parent && !this.loadingFile) {
      this.loadFile(this.parent);
    }
    window.addEventListener(EventTypes.Store.File.State.change, this._fileMetaHandler);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener(EventTypes.Store.File.State.change, this._fileMetaHandler);
    this.scrollTarget = undefined;
  }

  private cleanup(): void {
    this.files = [];
    this.filesCursor = undefined;
    this.file = undefined;
    this.hasMoreFiles = true;
    this.selected = [];
  }

  async loadFiles(): Promise<void> {
    if (!this.kinds || !this.hasMoreFiles) {
      return;
    }
    const { type, parent, filesCursor } = this;
    const kinds = this.kinds as any[];

    this.loadingFiles = true;
    const opts: IListOptions = {};
    if (filesCursor) {
      opts.cursor = filesCursor;
    } else {
      opts.limit = pageLimit;
      if (parent) {
        opts.parent = parent;
      }
    }
    const useShared = type === 'shared' && !parent;
    try {
      const result = useShared ?
        await Events.Store.File.listShared(kinds, opts) :
        await Events.Store.File.list(kinds, opts);
      if (result.data.length) {
        this.files = this.files.concat(result.data);
        if (result.data.length < pageLimit) {
          this.hasMoreFiles = false;
        }
      } else {
        this.hasMoreFiles = false;
      }
      this.filesCursor = result.cursor;
    } finally {
      this.loadingFiles = false;
    }
  }

  async loadFile(key: string): Promise<void> {
    this.loadingFile = true;
    try {
      const result = await Events.Store.File.read(key, false);
      this.file = result;
    } finally {
      this.loadingFile = false;
    }
  }

  _scrollHandler(e: Event): void {
    const target = e.target as HTMLElement;
    const { scrollTop, offsetHeight, scrollHeight } = target;
    const bottom = scrollTop + offsetHeight >= scrollHeight;
    if (bottom) {
      this.loadFiles();
    }
  }

  protected _fileMetaHandler(input: Event): void {
    const e = input as CustomEvent;
    const event = e.detail as IBackendEvent;
    switch (event.operation) {
      case 'created': this._handleMetaCreated(event); break;
      case 'deleted': this._handleMetaDeleted(event); break;
      case 'patch': this._handleMetaPatch(event); break;
      case 'access-granted': this._handleMetaAccessGranted(event); break;
      case 'access-removed': this._handleMetaAccessRemoved(event); break;
      default:

    }
  }

  protected _handleMetaCreated(event: IBackendEvent): void {
    const { parent, kind, data } = event;
    if (parent !== this.parent) {
      return;
    }
    if (![ProjectKind, WorkspaceKind].includes(kind)) {
      return;
    }
    this.files.push(data as IFile);
    this.requestUpdate();
  }

  protected _handleMetaDeleted(event: IBackendEvent): void {
    const { kind, id } = event;
    if (![ProjectKind, WorkspaceKind].includes(kind)) {
      return;
    }
    const index = this.files.findIndex(i => i.key === id);
    if (index >= 0) {
      this.files.splice(index, 1);
    }
    if (id === this.parent) {
      this.parent = undefined;
    }
  }

  protected _handleMetaPatch(event: IBackendEvent): void {
    const { kind, data, id } = event;
    if (![ProjectKind, WorkspaceKind].includes(kind)) {
      return;
    }
    const index = this.files.findIndex(i => i.key === id);
    if (index < 0) {
      return;
    }
    const patch = data as Patch.JsonPatch;
    const file = this.files[index];
    const result = Patch.apply(file, patch);
    this.files[index] = result.doc as IFile;
    this.requestUpdate();
  }

  protected async _handleMetaAccessGranted(event: IBackendEvent): Promise<void> {
    const { kind, id, parent } = event;
    if (parent !== this.parent) {
      return;
    }
    if (![ProjectKind, WorkspaceKind].includes(kind)) {
      return;
    }
    const has = this.files.find(i => i.key === id);
    if (has) {
      return;
    }
    const file = await Events.Store.File.read(id as string, false);
    // prohibits adding a shared file to the root of user files.
    const hasParents = !!file.parents && !!file.parents.length;
    if (hasParents) {
      return;
    }
    if (!hasParents && this.type === 'owned') {
      if (!this.user || file.owner !== this.user?.key) {
        // either the user is not an owner or we can't determine that.
        return;
      }
    }
    this.files.push(file);
    this.requestUpdate();
  }

  protected async _handleMetaAccessRemoved(event: IBackendEvent): Promise<void> {
    const { kind, id, parent } = event;
    if (parent !== this.parent) {
      return;
    }
    if (![ProjectKind, WorkspaceKind].includes(kind)) {
      return;
    }
    const index = this.files.findIndex(i => i.key === id);
    if (index >= 0) {
      this.files.splice(index, 1);
      this.requestUpdate();
    }
  }

  protected _addMenuHandler(e: Event): void {
    const list = e.target as AnypointListboxElement;
    const dialog = document.createElement('add-file-dialog');
    dialog.kind = String(list.selected);
    dialog.opened = true;
    document.body.appendChild(dialog);
    list.selected = undefined;

    dialog.addEventListener('closed', (ev: Event) => {
      const event = ev as CustomEvent;
      const { canceled, confirmed, value } = event.detail;
      if (!canceled && confirmed && value) {
        this.createFile(value, dialog.kind!);
      }
      document.body.removeChild(dialog);
    });
  }

  protected async createFile(name: string, kind: string): Promise<void> {
    const { parent } = this;
    const opts: IFileCreateOptions = {};
    if (parent) {
      opts.parent = parent;
    }
    await Events.Store.File.createDefault(name, kind, opts);
  }

  protected _removeFile(id: string): void {
    const filesIndex = this.files.findIndex(i => i.key === id);
    if (filesIndex < 0) {
      return;
    }
    this.files.splice(filesIndex, 1);
    const selectedIndex = this.selected.findIndex(i => i.key === id);
    if (selectedIndex >= 0) {
      this.selected.splice(selectedIndex, 1);
    }

    this.requestUpdate();
  }

  protected _toggleViewTypeHandler(): void {
    this.viewType = this.viewType === 'grid' ? 'list' : 'grid';
    this.dispatchEvent(new Event('viewstatechange'));
  }

  protected _filesKeydown(e: KeyboardEvent): void {
    if (e.key !== 'Enter') {
      return;
    }
    const node = e.target as HTMLElement;
    const item = this._getListTarget(node);
    if (!item) {
      return;
    }
    const id = item.dataset.key as string;
    this.notifyOpen(id);
  }

  /**
   * This handles helps to manage the selection state of the files.
   */
  protected _gridClickHandler(e: MouseEvent): void {
    const node = e.target as HTMLElement;
    const item = this._getListTarget(node);
    if (!item) {
      return;
    }

    const { ctrlKey, shiftKey, metaKey } = e;
    const { multiSelect = false } = this;
    const bulkSelection = multiSelect && shiftKey;
    const fineSelection = multiSelect && !bulkSelection && (ctrlKey || metaKey);
    const isSelection = multiSelect && bulkSelection || fineSelection;
    
    if (!isSelection && this.selected.length) {
      this.selected = [];
    }

    const id = item.dataset.key as string;
    const kind = item.dataset.kind as string;
    const info: SelectionInfo = {
      key: id,
      kind,
    };

    if (!isSelection || fineSelection) {
      this._toggleSelectedFile(info);
      return;
    }
    // the user is selecting files in bulk
    const last = this.selected[this.selected.length - 1];
    if (!last) {
      this._toggleSelectedFile(info);
      return;
    }
    if (last.key === info.key) {
      this._toggleSelectedFile(info);
      return;
    }
    this._selectGridSelectionRange(last, info)
  }

  protected _tableClickHandler(e: MouseEvent): void {
    const node = e.target as HTMLElement;
    const item = this._getListTarget(node);
    if (!item) {
      return;
    }
    const { ctrlKey, shiftKey, metaKey } = e;
    const { multiSelect = false } = this;
    const bulkSelection = multiSelect && shiftKey;
    const fineSelection = multiSelect && !bulkSelection && (ctrlKey || metaKey);
    const isSelection = multiSelect && bulkSelection || fineSelection;
    if (!isSelection && this.selected.length) {
      this.selected = [];
    }
    const id = item.dataset.key as string;
    const kind = item.dataset.kind as string;
    const info: SelectionInfo = {
      key: id,
      kind,
    };

    if (!isSelection || fineSelection) {
      this._toggleSelectedFile(info);
      return;
    }
    // the user is selecting files in bulk
    const last = this.selected[this.selected.length - 1];
    if (!last) {
      this._toggleSelectedFile(info);
      return;
    }
    if (last.key === info.key) {
      this._toggleSelectedFile(info);
      return;
    }
    this._selectTableSelectionRange(last, info);
  }

  protected _getListTarget(node: HTMLElement): HTMLElement | undefined {
    let current = node;
    while (current) {
      if (current.nodeType !== Node.ELEMENT_NODE) {
        current = current.parentElement as HTMLElement;
        continue;
      }
      if (current.dataset.key) {
        break;
      }
      current = current.parentElement as HTMLElement;
    }
    return current;
  }

  protected _toggleSelectedFile(info: SelectionInfo): void {
    const index = this.selected.findIndex(i => i.key === info.key);
    if (index >= 0) {
      this.selected.splice(index, 1);
    } else {
      this.selected.push(info);
    }
    this.requestUpdate();
  }

  /**
   * Selects all files between the `from` and `to`.
   * This detects whether selection should occur between the two grids.
   * 
   * @param from The from selection
   * @param to The to selection.
   */
  protected _selectGridSelectionRange(from: SelectionInfo, to: SelectionInfo): void {
    const fromElement = this.shadowRoot!.querySelector(`[data-key="${from.key}"]`) as HTMLElement;
    const toElement = this.shadowRoot!.querySelector(`[data-key="${to.key}"]`) as HTMLElement;
    const fromGrid = fromElement.parentElement as HTMLElement;
    const toGrid = toElement.parentElement as HTMLElement;
    const fromChildren = Array.from(fromGrid.children);
    const toChildren = Array.from(toGrid.children);
    const fromIndex = fromChildren.indexOf(fromElement);
    const toIndex = toChildren.indexOf(toElement);
    let children: Element[] = [];
    // the user selects files and folders
    if (from.kind !== to.kind) {
      if (from.kind === WorkspaceKind) {
        // the user selects from a space to a file
        const spaceItems = fromChildren.slice(fromIndex + 1);
        const fileItems = toChildren.slice(0, toIndex + 1);
        children = spaceItems.concat(fileItems);
      } else {
        // the user selects from a file to a space
        const fileItems = fromChildren.slice(0, fromIndex);
        const spaceItems = toChildren.slice(toIndex);
        children = spaceItems.concat(fileItems);
      }
    } else {
      // users selects either files or folders
      const toRight = fromIndex < toIndex;
      // Node, Array.splice's end is not included
      const startIndex = toRight ? fromIndex + 1 : toIndex;
      const endIndex = toRight ? toIndex + 1 : fromIndex;
      children = fromChildren.slice(startIndex, endIndex);
    }
    this._selectChildren(children);
  }

  protected _selectTableSelectionRange(from: SelectionInfo, to: SelectionInfo): void {
    const fromElement = this.shadowRoot!.querySelector(`[data-key="${from.key}"]`) as HTMLElement;
    const toElement = this.shadowRoot!.querySelector(`[data-key="${to.key}"]`) as HTMLElement;
    const table = this.shadowRoot!.querySelector('table')!;
    const children = Array.from(table.querySelectorAll('tbody tr'));
    const fromIndex = children.indexOf(fromElement);
    const toIndex = children.indexOf(toElement);
    const toBottom = fromIndex < toIndex;
    // Node, Array.splice's end is not included
    const startIndex = toBottom ? fromIndex + 1 : toIndex;
    const endIndex = toBottom ? toIndex + 1 : fromIndex;
    const items = children.slice(startIndex, endIndex);
    this._selectChildren(items);
  }

  protected _selectChildren(items: Element[]): void {
    const { selected } = this;
    items.forEach((child) => {
      const elm = child as HTMLElement;
      const id = elm.dataset.key as string;
      const kind = elm.dataset.kind as string;
      if (selected.some(i => i.key === id)) {
        return;
      }
      selected.push({ key: id, kind });
    });
    this.requestUpdate();
  }

  protected _gridDblHandler(e: MouseEvent): void {
    const node = e.target as HTMLElement;
    const item = this._getListTarget(node);
    if (!item) {
      return;
    }
    const id = item.dataset.key as string;
    this.notifyOpen(id);
  }

  /**
   * Notifies the parent that the user requested the "open" action.
   * 
   * @param key The key of the file
   */
  protected notifyOpen(key: string): void {
    const file = this.files.find(i => i.key === key);
    if (!file) {
      return;
    }
    this.dispatchEvent(new CustomEvent('open', {
      detail: file,
    }));
  }

  protected _shareHandler(): void {
    const [item] = this.selected;
    const file = this.files.find(i => i.key === item.key);
    if (!file) {
      return;
    }
    const dialog = document.createElement('share-file');
    dialog.file = file;
    dialog.user = this.user;
    dialog.opened = true;
    dialog.withBackdrop = true;
    document.body.appendChild(dialog);
    dialog.addEventListener('closed', () => {
      document.body.removeChild(dialog);
    });
  }

  render(): TemplateResult {
    const { listTitle, loadingFiles } = this;
    return html`
    ${loadingFiles ? html`<anypoint-progress indeterminate></anypoint-progress>` : ''}
    <div class="title-area">
      <h2 class="section-title text-selectable">${listTitle}</h2>
      <div class="right file-options">
        ${this.selectedToolbarTemplate()}
        ${this.spaceBaseControls()}
      </div>
    </div>
    ${this.filesTemplate()}
    `;
  }

  protected spaceBaseControls(): TemplateResult {
    const { viewType } = this;
    return html`
    ${this.addFileButtonTemplate()}
    <anypoint-icon-button title="Toggles between list and grid view" aria-label="Selected view is ${viewType}"
      @click="${this._toggleViewTypeHandler}">
      <api-icon icon="${viewType === 'grid' ? 'viewGrid' : 'viewList'}"></api-icon>
    </anypoint-icon-button>
    `;
  }

  protected addFileButtonTemplate(): TemplateResult | string {
    if (!this.allowAdd) {
      return '';
    }
    const { anypoint, kinds = [] } = this;
    const list = [WorkspaceKind, ...kinds];
    return html`
    <anypoint-menu-button dynamicAlign ?anypoint="${anypoint}" closeOnActivate>
      <anypoint-icon-button slot="dropdown-trigger" aria-label="Press to select a type of file to add"
        title="Add a new file or space. Press to select the type." ?anypoint="${anypoint}">
        <api-icon icon="add"></api-icon>
      </anypoint-icon-button>
      <anypoint-listbox class="dropdown-list-container" slot="dropdown-content" ?anypoint="${anypoint}"
        @select="${this._addMenuHandler}" attrForSelected="data-value">
        ${list.map(kind => this._addFileOptionTemplate(kind))}
      </anypoint-listbox>
    </anypoint-menu-button>
    `;
  }

  protected _addFileOptionTemplate(kind: string): TemplateResult {
    const icon = IconsMap[kind];
    const label = AddLabelsMap[kind];
    return html`
    <anypoint-icon-item ?anypoint="${this.anypoint}" data-value="${kind}" class="dropdown-option">
      <api-icon icon="${icon}" slot="item-icon"></api-icon>${label}
    </anypoint-icon-item>
    `;
  }

  protected filesTemplate(): TemplateResult {
    const { files, viewType } = this;
    if (!files || !files.length) {
      return html`
      <p class="empty-info">
        You have no files.
      </p>
      ${this.spacesIntroduction()}
      `;
    }
    const spaces = files.filter(i => i.kind === WorkspaceKind);
    const projects = files.filter(i => i.kind === ProjectKind);
    if (viewType === 'grid') {
      return this.filesGridTemplate(spaces, projects);
    }
    return this.fileListTemplate(spaces, projects);
  }

  protected filesGridTemplate(spaces: IFile[], projects: IFile[]): TemplateResult {
    return html`
    <section class="spaces-grid" @click="${this._gridClickHandler}" @dblclick="${this._gridDblHandler}"
      @keydown="${this._filesKeydown}">
      ${spaces.map((item) => this.spaceTileTemplate(item))}
    </section>
    <div class="files-section-title">Files</div>
    <section class="files-grid" @click="${this._gridClickHandler}" @dblclick="${this._gridDblHandler}"
      @keydown="${this._filesKeydown}">
      ${projects.map((item) => this.fileTileTemplate(item))}
    </section>
    `;
  }

  protected fileListTemplate(spaces: IFile[], projects: IFile[]): TemplateResult {
    return html`
    <table class="files-list" @click="${this._tableClickHandler}" @dblclick="${this._gridDblHandler}"
      @keydown="${this._filesKeydown}">
      <thead>
        <tr>
          <th class="name-column">Name</th>
          <th class="owner-column">Owner</th>
          <th class="updated-column">Updated</th>
        </tr>
      </thead>
      <tbody>
        ${spaces.map((item) => this.fileListItemTemplate(item))}
        ${projects.map((item) => this.fileListItemTemplate(item))}
      </tbody>
    </table>
    `;
  }

  protected fileListItemTemplate(file: IFile): TemplateResult {
    const { selected } = this;
    const { info, key, kind } = file;
    const title = info.name || DefaultNamesMap[kind];
    const icon = IconsMap[kind];
    const classes = {
      'selected-item': selected.some(i => i.key === key),
      'file-list-item': true,
    };
    const time = new Date(file.lastModified.time);
    return html`
    <tr class="${classMap(classes)}" data-key="${key}" data-kind="${kind}" tabindex="0">
      <td class="name-column" aria-label="${AddLabelsMap[kind] || 'File'}: ${title},">
        <api-icon icon="${icon}" class="icon"></api-icon>
        <div class="file-name">${title}</div>
      </td>
      <td class="owner-column" aria-label="Updated by: me,">me</td>
      <td class="updated-column">
        <time-ago datetime="${time.toISOString()}"></time-ago>
      </td>
    </tr>
    `;
  }

  protected spaceTileTemplate(item: IFile): TemplateResult {
    const { selected, type } = this;
    const { info, key, kind } = item;
    const title = info.name || DefaultNamesMap[kind];
    const classes = {
      'selected-item': selected.some(i => i.key === key),
      'space-tile': true,
    };
    const isShared = type === 'shared';
    return html`
    <div class="${classMap(classes)}" tabindex="0" data-key="${key}" data-kind="${kind}">
      <div class="space-icon">
        <api-icon icon="${isShared ? 'folderShared' : 'folder'}" class="icon"></api-icon>
      </div>
      <div class="space-label" aria-label="${AddLabelsMap[kind] || 'Folder'}: ${title}">${title}</div>
    </div>
    `;
  }

  protected fileTileTemplate(item: IFile): TemplateResult {
    const { selected } = this;
    const { info, key, kind } = item;
    const title = info.name || DefaultNamesMap[kind];
    const icon = IconsMap[kind];
    const classes = {
      'selected-item': selected.some(i => i.key === key),
      'file-tile': true,
    };
    return html`
    <div class="${classMap(classes)}" tabindex="0" data-key="${key}" data-kind="${item.kind}">
      <div class="file-thumb">
        <api-icon icon="${icon}" class="icon"></api-icon>
      </div>
      <div class="tile-label">
        <api-icon icon="${icon}" class="icon"></api-icon>
        <span class="file-label" aria-label="${AddLabelsMap[kind] || 'File'}: ${title}" title="${title}">${title}</span>
      </div>
    </div>
    `;
  }

  protected spacesIntroduction(): TemplateResult {
    return html`
    <div class="introduction">
      <b>Spaces</b> allow you to organize your work. When using a network store a space can be shared with
      other users.
    </div>
    `;
  }

  protected selectedToolbarTemplate(): TemplateResult | string {
    if (!this.hasSelection) {
      return '';
    }
    
    return html`
    ${this.shareButtonTemplate()}
    ${this.trashButtonTemplate()}
    <anypoint-icon-button title="File options">
      <api-icon icon="moreVert"></api-icon>
    </anypoint-icon-button>
    <span class="separator"></span>
    `;
  }

  protected shareButtonTemplate(): TemplateResult | string {
    if (!this.canShare) {
      return '';
    }
    // For simplicity, for now, we allow only one file share at the time.
    let canShare = this.selected.length === 1;
    if (canShare) {
      const [id] = this.selected;
      const file = this.files.find(i => i.key === id.key) as IFile;
      if (!file) {
        canShare = false;
      } else if (file.capabilities) {
        canShare = file.capabilities.canShare;
      } else {
        canShare = false;
      }
    }
    return html`
    <anypoint-icon-button title="Share file" ?disabled="${!canShare}" @click="${this._shareHandler}">
      <api-icon icon="personAdd"></api-icon>
    </anypoint-icon-button>
    `;
  }

  protected trashButtonTemplate(): TemplateResult | string {
    if (!this.canTrash) {
      return '';
    }
    return html`
    <anypoint-icon-button title="Trash file">
      <api-icon icon="deleteFile"></api-icon>
    </anypoint-icon-button>
    `;
  }
}
