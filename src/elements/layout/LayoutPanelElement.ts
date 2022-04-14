/* eslint-disable class-methods-use-this */
import { LitElement, html, TemplateResult, CSSResult, css } from 'lit';
import { property, state, eventOptions } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { LayoutPanel, DropRegion, ILayoutItem } from './LayoutManager.js';
import '../../define/api-icon.js';

export default class LayoutPanelElement extends LitElement {
  static get styles(): CSSResult {
    return css`
    :host {
      display: flex;
      position: relative;
      flex-direction: column;
      /* border: 1px red solid; */
    }

    .content {
      display: flex;
      flex: 1;
    }

    :host([layout=horizontal]) .content {
      flex-direction: row;
    }

    :host([layout=vertical]) .content {
      flex-direction: column;
    }

    :host ::slotted(*) {
      flex: 1;
      /* width: 100%;
      height: 100%; */
    }

    .drag-region {
      position: absolute;
      background-color: rgba(0,0,0,0.12);
    }

    .drag-region.center {
      top: 0;
      bottom: 0;
      left: 0;
      right:0;
    }

    .drag-region.west {
      top: 0;
      bottom: 0;
      left: 0;
      right: 50%;
    }

    .drag-region.east {
      top: 0;
      bottom: 0;
      left: 50%;
      right: 0;
    }

    .drag-region.north {
      top: 0;
      left: 0;
      right: 0;
      bottom: 50%;
    }

    .drag-region.south {
      top: 50%;
      left: 0;
      right: 0;
      bottom: 0;
    }

    .layout-tabs {
      display: flex;
      align-items: center;
    }

    .layout-tab {
      /* position: relative; */
      /* z-index: 1; */
      display: inline-flex;
      align-items: center;
      flex: 1 1 200px;
      max-width: 200px;
      min-width: 40px;
      width: 200px;
      height: 100%;
      font-size: 0.94rem;
      padding: 0px 12px;
      border-radius: 8px 8px 0 0;
      height: 40px; 
      color: var(--primary-text-color);
      outline: none;
      border-top:  1px transparent solid;
      justify-content: flex-start;
      text-transform: none;
    }

    .layout-tab.selected {
      /* z-index: 2; */
      background-color: var(--request-editor-url-area-background-color, #f6f6f6);
    }

    .layout-tab:not(.selected):hover {
      /* z-index: 3; */
      background-color: var(--anypoint-button-emphasis-low-hover-background-color, #fafafa);
    }

    .layout-tab:focus {
      border-top-color: var(--primary-color);
    }

    .close-icon {
      width: 16px;
      height: 16px;
      margin-left: auto;
    }
    `;
  }

  @property({ type: String, reflect: true }) layout: 'horizontal' | 'vertical' = 'horizontal';

  @property({ type: Number, reflect: true }) layoutId?: number;

  @property({ type: Array }) dragTypes?: string[];

  /**
   * Whether dragging is occurring over the element
   */
  @state() protected inDrag = false;

  /**
   * The region the drag is leaning to.
   */
  @state() protected dragRegion?: DropRegion = 'center';

  @property({ type: Object }) panel?: LayoutPanel;

  constructor() {
    super();
    this._dragEnterHandler = this._dragEnterHandler.bind(this);
    this._dragOverHandler = this._dragOverHandler.bind(this);
    this._dropHandler = this._dropHandler.bind(this);
    this._dragleaveHandler = this._dragleaveHandler.bind(this);
    this._dragendHandler = this._dragendHandler.bind(this);
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('dragenter', this._dragEnterHandler);
    this.addEventListener('dragover', this._dragOverHandler);
    this.addEventListener('drop', this._dropHandler);
    document.body.addEventListener('dragleave', this._dragleaveHandler);
    document.body.addEventListener('dragend', this._dragendHandler);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('dragenter', this._dragEnterHandler);
    this.removeEventListener('dragover', this._dragOverHandler);
    this.removeEventListener('drop', this._dropHandler);
    document.body.removeEventListener('dragleave', this._dragleaveHandler);
    document.body.removeEventListener('dragend', this._dragendHandler);
  }

  protected hasDropTypes(dt: DataTransfer): boolean {
    const { dragTypes } = this;
    if (!Array.isArray(dragTypes)) {
      return true;
    }
    return !dragTypes.some(type => !dt.types.includes(type));
  }

  protected panelCanDrop(e: DragEvent): boolean {
    if (e.defaultPrevented) {
      return false;
    }
    if (e.dataTransfer && !this.hasDropTypes(e.dataTransfer)) {
      return false;
    }
    const { panel } = this;
    if (!panel) {
      return true;
    }
    return panel.canDrop();
  }

  protected _dragEnterHandler(e: DragEvent): void {
    const { dataTransfer } = e;
    if (!dataTransfer || !this.panelCanDrop(e)) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    dataTransfer.dropEffect = 'copy';
  }

  protected _dragOverHandler(e: DragEvent): void {
    const { dataTransfer } = e;
    if (!dataTransfer || !this.panelCanDrop(e)) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    const region = this.getDropRegionFromEvent(e);
    if (!region) {
      this.inDrag = false;
      return;
    }
    dataTransfer.dropEffect = 'copy';
    this.inDrag = true;
    this.dragRegion = region;
  }

  protected _dropHandler(e: DragEvent): void {
    const { dataTransfer } = e;
    if (!dataTransfer || !this.panelCanDrop(e)) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    const kind = dataTransfer.getData('text/kind');
    const key = dataTransfer.getData('text/key');
    if (!kind || !key) {
      return;
    }
    this.inDrag = false;
    const { panel } = this;
    let dispatch = true;
    if (panel) {
      dispatch = panel.addItem({ key, kind, label: 'New tab' }, { region: this.dragRegion });
    }
    if (dispatch) {
      this.dispatchEvent(new CustomEvent('datadrop', {
        detail: { kind, key, region: this.dragRegion },
        composed: true,
        bubbles: true,
        cancelable: true,
      }));
    }
    this.requestUpdate();
  }

  protected _dragleaveHandler(e: DragEvent): void {
    const elm = this.findLayout(e);
    if (!elm || elm !== this) {
      this.inDrag = false;
      this.dragRegion = 'center';
    }
  }

  protected _dragendHandler(): void {
    this.inDrag = false;
    this.dragRegion = 'center';
  }

  protected getDropRegionFromEvent(e: DragEvent): DropRegion | undefined {
    const layout = this.findLayout(e);
    if (!layout) {
      return undefined;
    }
    return this.getDropRegion(layout, e);
  }

  getDropRegion(element: HTMLElement, e: DragEvent): DropRegion | undefined {
    const { pageX, pageY } = e;
    const rect = element.getBoundingClientRect();
    const quarterWidth = rect.width / 4;
    const quarterHeight = rect.height / 4;
    if (pageX < rect.left + quarterWidth) {
      return 'west';
    }
    if (pageX > rect.right - quarterWidth) {
      return 'east';
    }
    if (pageY < rect.top + quarterHeight) {
      return 'north';
    }
    if (pageY > rect.bottom - quarterHeight) {
      return 'south';
    }
    const withingCenterX = (pageX >= rect.left + quarterWidth) && (pageX <= rect.right - quarterWidth);
    const withingCenterY = (pageY >= rect.top + quarterHeight) && (pageY <= rect.bottom - quarterHeight);
    if (withingCenterX && withingCenterY) {
      return 'center';
    }
    return undefined;
  }

  protected findLayout(e: Event): LayoutPanelElement | undefined {
    const path = e.composedPath();
    while (path.length) {
      const node = path.shift() as Element;
      if (node.nodeType !== Node.ELEMENT_NODE) {
        continue;
      }
      if (node.localName === this.localName) {
        return node as LayoutPanelElement;
      }
    }
    return undefined;
  }

  protected _tabSelectHandler(e: Event): void {
    if (!this.panel) {
      return;
    }
    const key = (e.currentTarget as HTMLElement).dataset.key as string;
    if (!key) {
      return;
    }
    this.panel.selected = key;
    this.panel.manager.changed();
    this.requestUpdate();
  }

  /**
   * Closes a panel with right pointer configuration
   */
  protected _tabPointerDownHandler(e: PointerEvent): void {
    // the configuration of a middle button click which is 
    // equal to 3 fingers click on a track pad.
    if (e.button === 1 && e.buttons === 4) {
      e.preventDefault();
      e.stopPropagation();
      const key = (e.target as HTMLElement).dataset.key as string;
      this.closeTab(key);
    }
  }

  protected _tabCloseHandler(e: Event): void {
    const icon = e.target as HTMLElement;
    const button = icon.parentElement as HTMLElement;
    const key = button.dataset.key as string;
    if (key) {
      e.preventDefault();
      e.stopPropagation();
      this.closeTab(key);
    }
  }

  @eventOptions({ passive: true })
  protected _tabTouchStartHandler(e: TouchEvent): void {
    if (e.targetTouches.length === 3) {
      e.preventDefault();
      e.stopPropagation();
      const key = (e.target as HTMLElement).dataset.key as string;
      this.closeTab(key);
    }
  }

  protected closeTab(key: string): void {
    if (this.panel) {
      this.panel.removeItem(key);
      this.requestUpdate();
    } else {
      this.dispatchEvent(new CustomEvent('closetab', {
        bubbles: true,
        cancelable: true,
        composed: true,
        detail: key,
      }));
    }
  }

  protected _tabKeydownHandler(e: KeyboardEvent): void {
    if (e.key === 'Enter') {
      this._tabSelectHandler(e);
    }
  }

  protected _tabDragStart(e: DragEvent): void {
    const dt = e.dataTransfer;
    if (!dt || this.layoutId === undefined) {
      return;
    }
    
    dt.effectAllowed = 'copyMove';
    dt.dropEffect = 'move';
    const node = e.target as HTMLElement;
    dt.setData('text/kind', node.dataset.kind as string);
    dt.setData('text/key', node.dataset.key as string);
    dt.setData('text/source', this.localName);
    dt.setData('layout/id', String(this.layoutId));
  }

  protected _tabsDragEnterHandler(e: DragEvent): void {
    const dt = e.dataTransfer;
    if (!dt || !this.panelCanDrop(e)) {
      return;
    }
    e.stopPropagation();
    e.preventDefault();
    dt.effectAllowed = 'move';
    dt.dropEffect = 'move';
  }
  
  protected _tabsDragoverHandler(e: DragEvent): void {
    const dt = e.dataTransfer;
    if (!dt || !this.panelCanDrop(e)) {
      return;
    }
    e.stopPropagation();
    e.preventDefault();
    dt.effectAllowed = 'move';
    dt.dropEffect = 'move';
  }

  protected _tabsDrop(e: DragEvent): void {
    const dt = e.dataTransfer;
    if (!dt || !this.panelCanDrop(e) || this.layoutId === undefined) {
      return;
    }
    e.stopPropagation();
    e.preventDefault();
    const src = dt.getData('text/source');
    const key = dt.getData('text/key');
    const kind = dt.getData('text/kind');
    const lid = dt.getData('layout/id');
    const movingTab = src === this.localName;

    const overTab = this.findTab(e);
    const toIndex = overTab ? Number(overTab.dataset.index) : undefined;

    if (movingTab) {
      if (!lid) {
        return;
      }
      const srcPanel = Number(lid);
      if (Number.isNaN(srcPanel)) {
        return;
      }
      this.moveTab(srcPanel, this.layoutId, key, toIndex);
    } else {
      let dispatch = true;
      if (this.panel) {
        dispatch = this.panel.addItem({ key, kind, label: 'New tab' }, { index: toIndex });
      }
      if (dispatch) {
        this.dispatchEvent(new CustomEvent('datadrop', {
          detail: { kind, key, index: toIndex },
          composed: true,
          bubbles: true,
          cancelable: true,
        }));
      }
      this.requestUpdate();
    }
  }

  protected moveTab(fromLayout: number, toLayout: number, key: string, toIndex?: number): void {
    const { panel } = this;
    if (panel) {
      panel.manager.moveTab(fromLayout, toLayout, key, toIndex);
    }
  }

  protected findTab(e: Event): HTMLElement | undefined {
    const path = e.composedPath();
    while (path.length) {
      const node = path.shift() as Element;
      if (node.nodeType !== Node.ELEMENT_NODE) {
        continue;
      }
      if (node.classList.contains('layout-tab')) {
        return node as HTMLElement;
      }
    }
    return undefined;
  }

  render(): TemplateResult {
    return html`
    ${this.dragRegionTemplate()}
    ${this.tabsTemplate()}
    <div class="content">
      <slot></slot>
    </div>
    `;
  }

  protected dragRegionTemplate(): TemplateResult | string {
    const { inDrag, dragRegion } = this;
    if (!inDrag) {
      return '';
    }
    return html`
    <div class="drag-region ${dragRegion}"></div>
    `;
  }

  protected tabsTemplate(): TemplateResult | string {
    const { panel } = this;
    if (!panel) {
      return '';
    }
    const items = panel.sortedItems();
    if (!items) {
      return '';
    }
    return html`
    <div 
      class="layout-tabs" 
      role="tablist" 
      @dragenter="${this._tabsDragEnterHandler}" 
      @dragover="${this._tabsDragoverHandler}" 
      @drop="${this._tabsDrop}"
    >
    ${items.map(tab => this.tabTemplate(tab))}
    </div>
    `;
  }

  protected tabTemplate(item: ILayoutItem): TemplateResult {
    const { key, kind, label, index=0 } = item;
    const { panel } = this;
    const selected = !!panel && panel.selected === key;
    const classes = {
      'layout-tab': true,
      selected,
    };
    return html`
    <div 
      data-key="${key}" 
      data-kind="${kind}"
      data-index="${index}"
      role="tab"
      class="${classMap(classes)}" 
      draggable="true"
      @dragstart="${this._tabDragStart}"
      @click="${this._tabSelectHandler}" 
      @pointerdown="${this._tabPointerDownHandler}"
      @touchstart="${this._tabTouchStartHandler}"
      @keydown="${this._tabKeydownHandler}"
      tabindex="0"
    >
      ${label}
      <api-icon icon="cancelFilled" class="close-icon" @click="${this._tabCloseHandler}"></api-icon>
    </div>
    `;
  }
}
