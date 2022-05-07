/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable class-methods-use-this */
import { CSSResult, html, LitElement, PropertyValueMap, svg, SVGTemplateResult, TemplateResult } from "lit";
import { property } from "lit/decorators.js";
import { styleMap } from "lit/directives/style-map.js";
import { AssociationAnchors } from "../lib/AssociationAnchors.js";
import { SelectionManager } from "../lib/SelectionManager.js";
import { ShapeArtist } from "../lib/ShapeArtist.js";
import { WorkspaceEdges } from "../lib/WorkspaceEdges.js";
import { WorkspaceGestures } from "../lib/WorkspaceGestures.js";
import { WorkspaceSizing } from "../lib/WorkspaceSizing.js";
import elementStyles from './WorkspaceStyles.js';

const defaultCanvasWidth = 3840;
const defaultCanvasHeight = 2160;

export const canvasRef = Symbol('canvasRef');
export const svgRef = Symbol('svgRef');
export const attributeTypeEditHandler = Symbol('attributeTypeEditHandler');
export const attributeTypeDropdownClosedHandler = Symbol('attributeTypeDropdownClosedHandler');
export const attributeTypeSelectHandler = Symbol('attributeTypeSelectHandler');
export const geometryChangeHandler = Symbol('geometryChangeHandler');
export const widthValue = Symbol('widthValue');
export const heightValue = Symbol('heightValue');
export const autoResizeValue = Symbol('autoResizeValue');
export const zoomValue = Symbol('zoomValue');
export const notifyZoom = Symbol('notifyZoom');
export const zoomTimeout = Symbol('zoomTimeout');

export default class VizWorkspaceElement extends LitElement {
  static get styles(): CSSResult[] {
    return [elementStyles];
  }

  [zoomValue]?: number;

  /**
   * The zoom level of the current visualization
   */
  @property({ type: Number, reflect: true })
  get zoom(): number {
    return this[zoomValue] || 0;
  }

  set zoom(value: number) {
    const localValue = Number(value);
    if (Number.isNaN(localValue)) {
      return;
    }
    const old = this[zoomValue];
    if (old === localValue) {
      return;
    }
    this[zoomValue] = localValue;
    this.gestures.updateScale();
    this.requestUpdate('zoom', old);
  }

  /**
   * Gets or sets the number of pixels that an element's content is scrolled horizontally.
   * Unlike regular HTML elements, this can be a negative value as it is possible to
   * scroll outside the working area.
   */
  @property({ type: Number })
  get scrollLeft(): number {
    const s = this.gestures;
    return s && s.left || 0;
  }

  /**
   * @param value The x-axis position value
   */
  set scrollLeft(value: number) {
    this.gestures.left = value;
  }

  /**
   * Gets or sets the number of pixels that an element's content is scrolled vertically.
   * Unlike regular HTML elements, this can be a negative value as it is possible to
   * scroll outside the working area.
   */
  @property({ type: Number })
  get scrollTop(): number {
    const s = this.gestures;
    return s && s.top || 0;
  }

  /**
   * @param value The y-axis position value
   */
  set scrollTop(value: number) {
    this.gestures.top = value;
  }

  [canvasRef]?: HTMLDivElement;

  get canvas(): HTMLDivElement | null {
    if (!this[canvasRef]) {
      this[canvasRef] = this.shadowRoot?.querySelector('.canvas') as HTMLDivElement;
    }
    return this[canvasRef] as HTMLDivElement;
  }

  [svgRef]?: SVGElement;

  get associationSvg(): SVGElement {
    if (!this[svgRef]) {
      this[svgRef] = this.shadowRoot?.querySelector('.association') as SVGElement;
    }
    return this[svgRef] as SVGElement;
  }

  [widthValue]?: number;

  /**
   * The width of the canvas element, in pixels
   */
  @property({ type: Number })
  get width(): number {
    return this[widthValue] || defaultCanvasWidth;
  }

  set width(value: number) {
    const old = this[widthValue];
    if (old === value) {
      return;
    }
    if (!value || Number.isNaN(value)) {
      this[widthValue] = undefined;
    } else {
      this[widthValue] = value;
    }
    this.requestUpdate('width', old);
  }

  [heightValue]?: number;

  /**
   * The height of the canvas element, in pixels
   */
  @property({ type: Number })
  get height(): number {
    return this[heightValue] || defaultCanvasHeight;
  }

  set height(value: number) {
    const old = this[heightValue];
    if (old === value) {
      return;
    }
    if (!value || Number.isNaN(value)) {
      this[heightValue] = undefined;
    } else {
      this[heightValue] = value;
    }
    this.requestUpdate('height', old);
  }

  [autoResizeValue] = false;

  /** 
   * When set it instruct the visualization workspace to grow over the currently set `width` and `height` 
   * when a new added item is placed outside the bounds of the workspace.
   */
  @property({ type: Number, reflect: true })
  get autoResize(): boolean {
    return this[autoResizeValue];
  }

  set autoResize(value: boolean) {
    const old = this[autoResizeValue];
    if (old === value) {
      return;
    }
    this[autoResizeValue] = value;
    this.requestUpdate('autoResize', old);
    if (value === true) {
      this.sizing.connect();
    } else if (this.sizing.connected) {
      this.sizing.disconnect();
    }
  }

  /** 
   * Enables some limited debugging information.
   */
  @property({ type: Boolean, reflect: true }) debug?: boolean;

  /** 
   * The current scale of the visualization
   */
  @property({ type: Number }) scale: number = 1;

  [zoomTimeout]?: any;

  gestures = new WorkspaceGestures(this);

  selection = new SelectionManager(this);

  edges = new WorkspaceEdges(this);

  anchors = new AssociationAnchors(this);

  sizing = new WorkspaceSizing(this);

  constructor() {
    super();
    this.addEventListener('geometrychange', this[geometryChangeHandler].bind(this));
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.gestures.connect();
    this.selection.connect();
    this.edges.connect();
    this.anchors.connect();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.gestures.disconnect();
    this.selection.disconnect();
    this.edges.disconnect();
    this.anchors.disconnect();
  }

  protected firstUpdated(cp: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
    super.firstUpdated(cp);
    const { top, left } = this.gestures;
    if (top === null || left === null) {
      this.gestures.scrollTo(0, 0);
      // this.center();
    }
    this.edges.listenContent();
  }

  /**
   * Clears the state of the workspace.
   */
  clear(): void {
    this.edges.clear();
    this.selection.deselectAll();
  }

  /**
   * Centers the workspace.
   */
  center(): void {
    const { width: cWidth = defaultCanvasWidth, height: cHeight = defaultCanvasHeight } = this;
    const { height, width } = this.getBoundingClientRect();
    const midWidth = cWidth / 2;
    const midHeight = cHeight / 2;
    const left = midWidth - width / 2;
    const top = midHeight - height / 2;
    this.gestures.left = -left;
    this.gestures.top = -top;
  }

  [notifyZoom](): void {
    if (this[zoomTimeout]) {
      clearTimeout(this[zoomTimeout]);
    }
    this[zoomTimeout] = setTimeout(() => {
      this.dispatchEvent(new Event('zoomchange'));
    }, 1);
  }

  async [geometryChangeHandler](e: Event): Promise<void> {
    const source = e.target as HTMLElement;
    await this.edges.update(source.dataset.key!);
  }

  scrollBy(options: ScrollToOptions): void;

  scrollBy(x: number, y: number): void;

  /**
   * Scrolls the element by the given amount.
   * @param {ScrollToOptions|number} xCoordOrOptions The horizontal pixel value that you want to scroll by
   * or the scroll options. When passed value is the `ScrollToOptions` interface then
   * the second argument is ignored.
   * @param {number=} yCoord The vertical pixel value that you want to scroll by.
   */
  scrollBy(xCoordOrOptions: ScrollToOptions | number, yCoord?: number | undefined): void {
    this.gestures.scrollBy(xCoordOrOptions, yCoord);
  }

  scrollTo(options: ScrollToOptions): void;

  scrollTo(x: number, y: number): void;

  /**
   * Scrolls to a particular set of coordinates inside the element.
   *
   * @param xCoordOrOptions The pixel along the horizontal axis of the element
   * that you want displayed in the upper left. When passed value is the `ScrollToOptions` interface then
   * the second argument is ignored.
   * @param yCoord The pixel along the vertical axis of the element that you want displayed in the upper left.
   */
  scrollTo(xCoordOrOptions: ScrollToOptions | number, yCoord?: number): void {
    this.gestures.scrollTo(xCoordOrOptions, yCoord);
  }

  /**
   * Scrolls the view if the position defined by `x` and `y` arguments requires
   * the view to be moved.
   *
   * @param x The x coordinate of the point
   * @param y The y coordinate of the point
   * @returns true if the canvas was moved
   */
  scrollIfNeeded(x: number, y: number): boolean {
    return this.gestures.scrollIfNeeded(x, y);
  }

  render(): TemplateResult {
    const { scale, scrollLeft, scrollTop } = this;
    const styles = {
      transform: `scale(${scale}) translate(${scrollLeft}px, ${scrollTop}px)`,
      width: `${this.width}px`,
      height: `${this.height}px`,
    };
    return html`
      <div
        class="content canvas"
        style="${styleMap(styles)}"
      >
        ${this.renderLinesTemplate()}
        <slot></slot>
      </div>
    `;
  }

  /**
   * @return {SVGTemplateResult} The template for the associations
   */
  renderLinesTemplate(): SVGTemplateResult {
    const { debug } = this;
    const { edges } = this.edges;
    const primarySelected: (string | SVGTemplateResult)[] = [];
    const secondarySelected: (string | SVGTemplateResult)[] = [];
    const hovered: (string | SVGTemplateResult)[] = [];
    const rest: (string | SVGTemplateResult)[] = [];
    edges.forEach((item) => {
      const line = ShapeArtist.line(item, debug);
      const { shape } = item;
      const { selection = {} } = shape;
      if (selection.primary) {
        primarySelected.push(line);
      } else if (selection.secondary) {
        secondarySelected.push(line);
      } else if (selection.hover) {
        hovered.push(line);
      } else {
        rest.push(line);
      }
    });
    const edgesResult = primarySelected.concat(secondarySelected).concat(hovered).concat(rest).reverse();
    return svg`
    <svg width="100%" height="100%" class="association">
    ${edgesResult.length ? edgesResult : ''}
    </svg>`;
  }
}
