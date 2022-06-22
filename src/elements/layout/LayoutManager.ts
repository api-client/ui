/* eslint-disable prefer-destructuring */
/* eslint-disable no-plusplus */
/* eslint-disable no-shadow */
/* eslint-disable no-use-before-define */
/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */

import { TemplateResult, html } from 'lit';
import { Events } from '../../events/Events.js';
import LayoutPanelElement from './LayoutPanelElement.js';
import '../../define/layout-panel.js';
import { IconType } from '../icons/Icons.js';

export type Direction = 'horizontal' | 'vertical';
export type DropRegion = 'center' | 'east' | 'west' | 'north' | 'south';

enum PanelState {
	Idle,
	Busy
}

export interface ILayoutItem {
  /**
   * The kind of opened item
   */
  kind: string;
  /**
   * The key of the opened item
   */
  key: string;
  /**
   * Optional parent information that helps location this object.
   */
  parent?: string;
  /**
   * The label to render in the tab.
   */
  label: string;
  /**
   * Whether the tab is pinned (cannot be closed or moved).
   */
  pinned?: boolean;
  /**
   * The tab index.
   */
  index?: number;
  /**
   * The icon defined in the internal library to render with the tab.
   */
  icon?: IconType;
  /**
   * A tab that is always present in the layout. The user can't close this tab.
   */
  persistent?: boolean;
  /**
   * A property to be used by the screen to indicate the property is being loaded
   * (from a data store, file, etc).
   */
  loading?: boolean;
  /**
   * Indicates the item has been changed and is out of sync with the data store.
   */
  isDirty?: boolean;
}

export interface ILayoutOptions {
  /**
   * The list of DataTransfer types to test against when handling drag and drop.
   * When set it checks whether all types are set on the dragged item.
   * If not set all items are allowed.
   */
  dragTypes?: string[];

  /**
   * The local store key to use with `autoStore`,
   */
  storeKey?: string;

  /**
   * Uses application's internal events system to store the layout data 
   * in the local store, when anything change.
   * This must be set with the `storeKey` property.
   * 
   * When this is set it also restores the state during initialization.
   */
  autoStore?: boolean;
}

export interface IPanelSplitOptions {
  layout?: Direction;
  itemsTarget?: 0 | 1;
}

export type ItemRenderCallback = (item: ILayoutItem, visible: boolean) => TemplateResult;

export interface ILayoutPanelState {
  id: number;
  layout: Direction;
  panels?: ILayoutPanelState[];
  items?: ILayoutItem[];
  selected?: string;
}

export interface ILayoutState {
  panels: ILayoutPanelState[];
}

export interface ILayoutItemAddOptions {
  /**
   * The region to add the item.
   * When other than `center` it splits the panel.
   */
  region?: DropRegion;
  /**
   * The index at which to put the item.
   * By default it is added as a last item.
   */
  index?: number;
}

let panelId = 0;

export class LayoutPanel {
  id = panelId++;

  parent?: LayoutPanel;
  
  manager: LayoutManager

  layout: Direction = 'horizontal';
  
  panels: LayoutPanel[] = [];

  items: ILayoutItem[] = [];

  /**
   * The current state of the panel.
   */
  state: PanelState = PanelState.Idle;

  /**
   * The item being rendered in the panel.
   */
  selected?: string;

  /**
   * The computed size value for each item.
   * The value of `undefined` means "auto".
   */
  sizes: string[] = [];

  get hasPanels(): boolean {
    return this.panels.length > 0;
  }

  get hasItems(): boolean {
    return this.items.length > 0;
  }

  static fromSchema(state: ILayoutPanelState, manager: LayoutManager, parent?: LayoutPanel): LayoutPanel {
    const panel = new LayoutPanel(manager, parent);
    panel.id = state.id;
    panel.selected = state.selected;
    panel.layout = state.layout;
    if (Array.isArray(state.items)) {
      panel.items = state.items.map(i => ({ ...i }));
    }
    if (Array.isArray(state.panels)) {
      panel.panels = state.panels.map(i => LayoutPanel.fromSchema(i, manager, panel));
    }
    return panel;
  }

  constructor(manager: LayoutManager, parent?: LayoutPanel) {
    this.manager = manager;
    this.state = PanelState.Idle;
    this.parent = parent;
  }

  /**
   * @returns Returns a **copy** of the items array sorted by index.
   */
  sortedItems(): ILayoutItem[] {
    const { items } = this;
    return [...items].sort((a, b) => (a.index || 0) - (b.index || 0));
  }

  /**
   * @returns True when the panel accepts drop events.
   */
  canDrop(): boolean {
    if (this.hasItems) {
      return true;
    }
    return !this.hasPanels;
  }

  nextIndex(): number {
    let result = 0;
    if (!this.items.length) {
      return result;
    }
    this.items.forEach((item) => {
      const { index = 0 } = item;
      if (result < index) {
        result = index;
      }
    });
    return result + 1;
  }

  /**
   * Adds an item to the layout.
   * 
   * @param item The item to add
   * @param opts Layout adding item options
   * @returns Whether a new item was added to the layout. false when the item is already in the layout panel.
   */
  addItem(item: ILayoutItem, opts: ILayoutItemAddOptions = {}): boolean {
    const { region = 'center' } = opts;
    const hasItem = region === 'center' && this.items.some(i => i.key === item.key);
    if (hasItem) {
      this.selected = item.key;
      this.manager.changed();
      return false;
    }

    const hasIndex = typeof opts.index === 'number';
    const index = !hasIndex ? this.nextIndex() : opts.index as number;
    
    if (region === 'center' || (!this.hasItems && !this.hasPanels)) {
      if (hasIndex) {
        this.increaseIndex(index + 1);
      }
      this.manager.nameItem(item);
      this.items.push({ ...item, index });
      this.selected = item.key;
      this.manager.changed();
      return true;
    } 
    let panel: LayoutPanel;
    if (region === 'east') {
      panel = this.split({
        layout: 'horizontal',
        itemsTarget: 0,
      })[1];
    } else if (region === 'west') {
      panel = this.split({
        layout: 'horizontal',
        itemsTarget: 1,
      })[0];
    } else if (region === 'south') {
      panel = this.split({
        layout: 'vertical',
        itemsTarget: 0,
      })[1];
    } else {
      panel = this.split({
        layout: 'horizontal',
        itemsTarget: 1,
      })[0];
    }
    panel.addItem(item, { index });
    this.manager.changed();
    return true;
  }

  /**
   * Splits this panel into 2 panels.
   * This to be used when the panel has no other panels. Only items are allowed.
   * It produces 2 new panels and moves the items to the first one leaving the other one available.
   */
  split(opts: IPanelSplitOptions = {}): LayoutPanel[] {
    const { layout = 'horizontal', itemsTarget = 0 } = opts;
    if (this.hasPanels) {
      throw new Error(`Invalid state. Panels can be split only when containing items only.`);
    }
    this.layout = layout;
    const { items, selected } = this;
    this.items = [];
    this.selected = undefined;
    const p1 = new LayoutPanel(this.manager, this);
    const p2 = new LayoutPanel(this.manager, this);
    this.panels = [p1, p2];
    this.panels[itemsTarget].items = items;
    this.panels[itemsTarget].selected = selected;
    this.manager.changed();
    return this.panels;
  }

  unsplit(): void {
    const { items, selected } = this.panels[0];
    this.panels = [];
    this.items = items;
    this.selected = selected;
    this.manager.changed();
  }

  /**
   * Decreases items index by 1 to all items with index at least equal to `fromIndex`.
   * @param fromIndex The minimal index to affect.
   */
  decreaseIndex(fromIndex: number): void {
    for (const item of this.items) {
      const { index = 0 } = item;
      if (index >= fromIndex && index > 0) {
        (item.index as number) -= 1;
      }
    }
  }

  /**
   * Increases items index by 1 to all items with index at least equal to `fromIndex`.
   * @param fromIndex The minimal index to affect.
   */
  increaseIndex(fromIndex: number): void {
    for (const item of this.items) {
      const { index = 0 } = item;
      if (index >= fromIndex) {
        (item.index as number) += 1;
      }
    }
  }

  /**
   * Removes an item from the layout
   * @param key The key of the item.
   * @returns The removed item, if any.
   */
  removeItem(key: string): ILayoutItem | undefined {
    const index = this.items.findIndex(i => i.key === key);
    if (index < 0) {
      return undefined;
    }
    const removed = this.items[index];
    this.items.splice(index, 1);
    this.decreaseIndex(removed.index || 0);

    if (this.items.length === 0) {
      // remove panel
      if (this.parent) {
        this.parent.removePanel(this.id);
      }
    }
    if (this.selected === key) {
      let nextKey: string | undefined;
      if (this.items[index]) {
        nextKey = this.items[index].key;
      } else if (this.items[index - 1]) {
        nextKey = this.items[index - 1].key;
      }
      this.selected = nextKey;
    }
    this.manager.dispatchEvent(new CustomEvent('closetab', {
      bubbles: true,
      cancelable: true,
      composed: true,
      detail: key,
    }));
    this.manager.changed();
    this.manager.forceUpdateLayout(this.id);
    return removed;
  }

  /**
   * @param key The key of the item to perform a relative operation from.
   * @param dir The direction to which close other items. Default to both directions leaving only the `key` item
   */
  relativeClose(key: string, dir: 'left' | 'right' | 'both' = 'both'): void {
    const index = this.items.findIndex(i => i.key === key);
    if (index < 0) {
      return;
    }
    const item = this.items[index];
    if (dir === 'both') {
      this.items = [item];
      this.selected = item.key;
    } else if (dir === 'left') {
      this.items = this.items.splice(index);
      this.selected = item.key;
    } else {
      this.items = this.items.splice(0, index + 1);
      this.selected = item.key;
    }
    this.manager.changed();
    this.manager.forceUpdateLayout(this.id);
  }

  removePanel(id: number): void {
    const index = this.panels.findIndex(p => p.id === id);
    if (index < 0) {
      return;
    }
    this.panels.splice(index, 1);
    if (this.panels.length === 1) {
      this.unsplit();
    }
    this.manager.changed();
    this.manager.forceUpdateLayout(this.id);
  }

  /**
   * Moves an item to a new index.
   * 
   * @param key The item key
   * @param toIndex The new index. When not set it moves the item to the end.
   */
  moveItem(key: string, toIndex?: number): void {
    const item = this.items.find(i => i.key === key);
    if (!item) {
      return;
    }
    const hasIndex = typeof toIndex === 'number';
    if (hasIndex && item.index === toIndex) {
      return;
    }
    let hasTargetAtTarget = false;
    if (hasIndex) {
      hasTargetAtTarget = !!this.items[toIndex];
    }
    if (item.index !== undefined) {
      this.decreaseIndex(item.index);
    }
    const finalIndex = hasIndex ? toIndex as number : this.nextIndex();
    if (hasTargetAtTarget) {
      this.increaseIndex(finalIndex);
    }
    item.index = finalIndex;
    this.manager.changed();
    this.manager.forceUpdateLayout(this.id);
  }

  rename(key: string, label: string): void {
    const item = this.items.find(i => i.key === key);
    if (!item) {
      return;
    }
    item.label = label;
    this.manager.changed();
    this.manager.forceUpdateLayout(this.id);
  }

  toJSON(): ILayoutPanelState {
    const result:ILayoutPanelState = {
      id: this.id,
      layout: this.layout,
    };
    if (this.items.length) {
      result.items = this.items.map(i => ({ ...i }));
    }
    if (this.panels) {
      result.panels = this.panels.map(i => i.toJSON());
    }
    if (this.selected) {
      result.selected = this.selected;
    }
    return result;
  }

  panelTemplate(panel: LayoutPanel, itemCallback: ItemRenderCallback): TemplateResult {
    const { layout, panels, items, selected } = panel;
    const { manager } = this;
    const { dragTypes } = manager.opts;
    let content: TemplateResult[];
    if (panels.length) {
      content = panels.map(p => this.panelTemplate(p, itemCallback));
    } else {
      content = items.map(p => this.itemTemplate(p, p.key === selected, itemCallback));
    }
    return html`
    <layout-panel 
      layout="${layout}" 
      .dragTypes="${dragTypes}" 
      .panel="${panel}"
      .layoutId="${panel.id}"
    >
      ${content}
    </layout-panel>
    `;
  }

  itemTemplate(item: ILayoutItem, visible: boolean, itemCallback: ItemRenderCallback): TemplateResult {
    return itemCallback(item, visible);
  }

  render(itemCallback: ItemRenderCallback): TemplateResult {
    return this.panelTemplate(this as LayoutPanel, itemCallback);
  }
}

/**
 * Layout manager for API Client apps.
 * 
 * Supports:
 * - layout splitting depending on the selected region (east, west, north, south)
 * - drag and drop of items into the layout
 * - auto storing and restoring layout state from the application local storage.
 * - adding items to the last focused panel
 * 
 * Limitations
 * - the rendered content has to be focusable (tabindex must be set) in order to detect active panel
 */
export class LayoutManager extends EventTarget {
  opts: ILayoutOptions;

  panels: LayoutPanel[] = [];

  protected isDirty = false;

  protected storing = false;

  private _activePanel?: LayoutPanel;

  /**
   * An active panel
   */
  get activePanel(): LayoutPanel | undefined {
    if (!this._activePanel) {
      this._activePanel = this.findFirstItemsPanel();
    }
    return this._activePanel;
  }

  constructor(opts: ILayoutOptions = {}) {
    super();
    this.opts = opts;
  }

  /**
   * @param itemCallback The callback called when rendering an item in layout view.
   * @returns The template for the page layout.
   */
  render(itemCallback: ItemRenderCallback): TemplateResult[] {
    return this.panels.map(p => p.render(itemCallback));
  }

  /**
   * Initializes the manager.
   * 
   * @param restore Previously stored layout state, if any.
   */
  async initialize(restore?: ILayoutState): Promise<void> {
    if (restore) {
      this.restore(restore);
    } else if (this.opts.storeKey && this.opts.autoStore) {
      await this.restoreLayout(this.opts.storeKey);
    } 
    
    if (!this.panels.length) {
      this.panels.push(new LayoutPanel(this));
    }

    document.body.addEventListener('focusin', this._focusInHandler.bind(this));
  }

  protected restore(restore: ILayoutState): void {
    if (Array.isArray(restore.panels)) {
      this.panels = restore.panels.map(i => LayoutPanel.fromSchema(i, this));
    }
  }

  /**
   * Informs the screen that something has changed
   */
  changed(): void {
    this.dispatchEvent(new Event('change'));
    this.autoStore();
  }

  /**
   * Dispatches the `nameitem` event.
   * The detail object has the item to be added to the items.
   * The event handler can manipulate properties of the item, except for the index which will be set by the manager.
   * 
   * @param item The item to notify.
   */
  nameItem(item: ILayoutItem): void {
    this.dispatchEvent(new CustomEvent('nameitem', {
      detail: item,
    }));
  }

  /**
   * Serializes the layout state to a JSON safe object.
   * This is automatically called when passing this object to `JSON.stringify()`.
   */
  toJSON(): ILayoutState {
    const result: ILayoutState = {
      panels: this.panels.map(i => i.toJSON()),
    };
    return result;
  }

  protected autoStore(): void {
    const { autoStore, storeKey } = this.opts;
    if (!autoStore || !storeKey) {
      return;
    }
    this.storeLayout(storeKey);
  }

  protected async storeLayout(key: string): Promise<void> {
    if (this.storing) {
      this.isDirty = true;
      return;
    }
    this.storing = true;
    try {
      await Events.Config.Local.set(key, this.toJSON());
    } finally {
      this.storing = false;
    }
    if (this.isDirty) {
      this.isDirty = false;
      await this.storeLayout(key);
    }
  }

  protected async restoreLayout(key: string): Promise<void> {
    try {
      const data = await Events.Config.Local.get(key) as ILayoutState;
      if (data) {
        this.restore(data);
      }
    } catch (e) {
      // 
    }
  }

  protected _focusInHandler(e: Event): void {
    const layout = this.findLayout(e);
    if (layout) {
      const id = Number(layout.dataset.panel);
      const { activePanel } = this;
      if (activePanel && activePanel.id === id) {
        return;
      }
      this._activePanel = this.findPanel(id);
    }
  }

  protected findLayout(e: Event, last=true): LayoutPanelElement | undefined {
    const path = e.composedPath();
    if (!last) {
      path.reverse();
    }
    while (path.length) {
      const node = path.shift() as Element;
      if (node.nodeType !== Node.ELEMENT_NODE) {
        continue;
      }
      if (node.localName === 'layout-panel') {
        return node as LayoutPanelElement;
      }
    }
    return undefined;
  }

  /**
   * Finds a panel by id.
   * 
   * @param id The id of the panel.
   * @param parent THe parent panel to start searching from
   * @returns The panel if found
   */
  findPanel(id: number, parent?: LayoutPanel): LayoutPanel | undefined {
    const panels = parent && parent.panels || this.panels;

    for (const p of panels) {
      if (p.id === id) {
        return p;
      }
      const child = this.findPanel(id, p);
      if (child) {
        return child;
      }
    }

    return undefined;
  }

  /**
   * Finds a first panel that can accept items.
   * This will be a panel that has no other panels.
   */
  findFirstItemsPanel(parent?: LayoutPanel): LayoutPanel | undefined {
    const panels = parent && parent.panels || this.panels;

    for (const p of panels) {
      if (!p.hasPanels) {
        return p;
      }
      const child = this.findFirstItemsPanel(p);
      if (child) {
        return child;
      }
    }

    return undefined;
  }

  /**
   * Finds a panel for the item.
   * @param key the key of the item to find.
   */
  findItemPanel(key: string, parent?: LayoutPanel): LayoutPanel | undefined {
    const panels = parent && parent.panels || this.panels;

    for (const p of panels) {
      const { items } = p;
      for (const i of items) {
        if (i.key === key) {
          return p;
        }
      }
      const deep = this.findItemPanel(key, p);
      if (deep) {
        return deep;
      }
    }

    return undefined;
  }

  /**
   * Finds a layout item.
   * @param key the key of the item to find.
   */
  findItem(key: string, parent?: LayoutPanel): ILayoutItem | undefined {
    const panels = parent && parent.panels || this.panels;

    for (const p of panels) {
      const { items } = p;
      for (const i of items) {
        if (i.key === key) {
          return i;
        }
      }
      const deep = this.findItem(key, p);
      if (deep) {
        return deep;
      }
    }

    return undefined;
  }

  /**
   * Adds an item to the active panel.
   * 
   * @param item The item to add.
   */
  addItem(item: ILayoutItem): void {
    const { activePanel } = this;
    if (!activePanel) {
      throw new Error(`Unable to determine an active panel.`);
    }
    activePanel.addItem(item);
    this.forceUpdateLayout();
  }

  /**
   * Removes an item from layout.
   * @param key The key of the item to remove.
   */
  removeItem(key: string): void {
    const panel = this.findItemPanel(key);
    if (panel) {
      panel.removeItem(key);
    }
  }

  /**
   * @param key The key of the item to perform a relative operation from.
   * @param dir The direction to which close other items. Default to both directions leaving only the `key` item
   */
  relativeClose(key: string, dir: 'left' | 'right' | 'both' = 'both'): void {
    const panel = this.findItemPanel(key);
    if (panel) {
      panel.relativeClose(key, dir);
    }
  }

  /**
   * Requests an update on a layout.
   * 
   * @param id The id of the panel. When not set it uses the active panel
   */
  forceUpdateLayout(id?: number): void {
    let key;
    if (id === undefined) {
      const panel = this.activePanel;
      if (!panel) {
        return;
      }
      key = panel.id;
    } else {
      key = id;
    }
    const layout = document.querySelector(`layout-panel[layoutId="${key}"]`) as LayoutPanelElement | undefined;
    if (!layout) {
      return;
    }
    layout.requestUpdate();
  }

  /**
   * Moves a tab between panels or inside a panel
   * 
   * @param fromPanel The id of the source panel of the item
   * @param toPanel The id of the target panel of the item
   * @param key The key of the item
   * @param toIndex The index to which add the item. Default as the last.
   */
  moveTab(fromPanel: number, toPanel: number, key: string, toIndex?: number): void {
    const singlePanel = fromPanel === toPanel;
    const from = this.findPanel(fromPanel);
    if (!from) {
      throw new Error(`The source layout panel not found.`);
    }
    if (singlePanel) {
      from.moveItem(key, toIndex);
    } else {
      const to = this.findPanel(toPanel);
      if (!to) {
        throw new Error(`The target layout panel not found.`);
      }
      const removed = from.removeItem(key);
      if (!removed) {
        return;
      }
      to.addItem(removed, { index: toIndex })
    }
    this.changed();
  }

  /**
   * Finds the item's panel and renames the item.
   * 
   * @param key The item's key
   * @param label The new label
   */
  rename(key: string, label: string): void {
    const panel = this.findItemPanel(key);
    if (panel) {
      panel.rename(key, label);
      this.changed();
      this.forceUpdateLayout(panel.id);
    }
  }

  /**
   * Requests to dispatch the `nameitem` event so the application can update the name of the tab.
   * 
   * @param key The key of the item.
   */
  requestNameUpdate(key: string): void {
    const item = this.findItem(key);
    if (!item) {
      return;
    }
    const before = item.label;
    this.nameItem(item);
    if (before !== item.label) {
      const panel = this.findItemPanel(key);
      if (panel) {
        this.forceUpdateLayout(panel.id);
      }
    }
  }
}
