/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable class-methods-use-this */
import { getRelativeClickPoint } from './PositionUtils.js';
import { anchorToPoint } from './AnchorUtils.js';
import { LineSketch } from './LineSketch.js';
import VizWorkspaceElement from '../elements/VizWorkspaceElement.js';
import { Point } from './Point.js';

const SvgNS = 'http://www.w3.org/2000/svg';

export const connectedValue = Symbol('connectedValue');
export const mouseDownHandler = Symbol('mouseDownHandler');
export const mouseMoveHandler = Symbol('mouseMoveHandler');
export const mouseUpHandler = Symbol('mouseUpHandler');
export const keydownHandler = Symbol('keydownHandler');

export interface EdgeCreateInfo {
  /** 
   * The slot name of the source object.
   */
  slot: string;
  /** 
  * The workspace coordinates of the staring point
  */
  point: Point;
  /** 
  * The domain element that is the source of the association.
  */
  source: HTMLElement;
}

export interface IEdgeUpdateInfo {
  /**
   * The name of the tip that is being dragged.
   * It's either `start` or `end`.
   */
  direction: string;
  /**
   * The association domain id.
   */
  id: string;
  /**
   * The start point of the line
   */
  sp: Point;
  /**
   * The end point of the line
   */
  ep: Point;
}

/**
 * A helper that allows to manually draw a line from one visualization object to another.
 * The visualization object has to have the `associationSlots` attribute set on the element
 * and the mouse event target having the `data-association-slot` attribute with the index of the slot.
 * 
 * The association line can be drawn to another object that has both attributes.
 * 
 * After the user finish a DOM event is dispatched from the visualization workspace.
 */
export class AssociationAnchors {
  [connectedValue] = false

  /** 
   * Whether a line is being constructed.
   */
  drawing = false;

  /** 
   * A reference to the currently injected SVG element.
   */
  lineElement?: SVGElement;

  /** 
   * Whether an association position is being updated. 
   * In such case it dispatches different event at the end.
   */
  updating: boolean = false;

  /** 
   * The processor used to draw lines
   */
  lineProcessor = new LineSketch();

  /** 
   * Set when a new association is being created
   */
  createInfo?: EdgeCreateInfo;

  /** 
   * Set when an association update is performed
   */
  updateInfo?: IEdgeUpdateInfo;


  constructor(public workspace: VizWorkspaceElement) {
    this.workspace = workspace;
    this[mouseDownHandler] = this[mouseDownHandler].bind(this);
    this[mouseMoveHandler] = this[mouseMoveHandler].bind(this);
    this[mouseUpHandler] = this[mouseUpHandler].bind(this);
    this[keydownHandler] = this[keydownHandler].bind(this);
  }

  /**
   * Starts listening for the user events
   */
  connect(): void {
    if (this[connectedValue]) {
      return;
    }
    this[connectedValue] = true;
    const { workspace } = this;
    // const { canvas } = workspace;
    workspace.addEventListener('mousedown', this[mouseDownHandler], true);
  }

  /**
   * Stops listening for the user events
   */
  disconnect(): void {
    this[connectedValue] = false;
    const { workspace } = this;
    // const { canvas } = workspace;
    workspace.removeEventListener('mousedown', this[mouseDownHandler], true);
  }

  findSlotParent(path: Node[]): Element {
    const element = path.find((node) => {
      if (node.nodeType !== Node.ELEMENT_NODE) {
        return false;
      }
      const typed = node as Element;
      return typed.hasAttribute('associationSlots') || typed.hasAttribute('data-association-slots');
    });
    return element as Element;
  }

  [mouseDownHandler](e: MouseEvent): void {
    if (e.button !== 0) {
      return;
    }
    let node = e.target as HTMLElement
    if (!e.composed || node.nodeType !== Node.ELEMENT_NODE) {
      return;
    }
    const [source] = e.composedPath() as HTMLElement[];
    if (node === source) {
      const parent = this.findSlotParent(e.composedPath() as Node[]);
      if (!parent) {
        return;
      }
      node = parent as HTMLElement;
    }
    const { dataset } = source;
    const isSvgDraggable = source.classList && source.classList.contains('association-draggable');
    if (isSvgDraggable) {
      e.preventDefault();
      e.stopPropagation();
      this.startUpdate(dataset.key!, dataset.dir!);
      return;
    }
    if (!node.hasAttribute('associationSlots') && !node.dataset.associationSlots) {
      return;
    }
    if (source.nodeType !== Node.ELEMENT_NODE) {
      return;
    }
    if (!dataset.associationSlot) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    const startPoint = anchorToPoint(source, this.workspace);
    this.start(node, dataset.associationSlot, startPoint);
  }

  [mouseMoveHandler](e: MouseEvent): void {
    if (!this.drawing) {
      return;
    }
    const { clientX, clientY } = e;
    const pos = getRelativeClickPoint(clientX, clientY, this.workspace);
    this.updateLinePosition(pos);
  }

  [mouseUpHandler](e: MouseEvent): void {
    if (!this.drawing) {
      return;
    }
    this.drawing = false;
    this.cancel();
    let node = e.target as HTMLElement;
    if (!e.composed || node.nodeType !== Node.ELEMENT_NODE) {
      this.cleanup();
      return;
    }
    if (!node.hasAttribute('associationSlots')) {
      const parent = this.findSlotParent(e.composedPath() as Node[]);
      if (!parent) {
        return;
      }
      node = parent as HTMLElement;
    }
    if (!node.hasAttribute('associationSlots') && !node.dataset.associationSlots) {
      this.cleanup();
      return;
    }
    const [source] = e.composedPath() as HTMLElement[];
    if (source.nodeType !== Node.ELEMENT_NODE) {
      this.cleanup();
      return;
    }
    const { dataset } = source;
    if (!dataset.associationSlot) {
      this.cleanup();
      return;
    }
    const { clientX, clientY } = e;
    const endPoint = getRelativeClickPoint(clientX, clientY, this.workspace);
    if (this.updating) {
      this.endUpdate(node.dataset.key!, dataset.associationSlot, endPoint);
    } else {
      this.end(node.dataset.key!, dataset.associationSlot, endPoint);
    }
  }

  [keydownHandler](e: KeyboardEvent): void {
    if (e.code !== 'Escape') {
      return;
    }
    this.cancel();
    this.cleanup();
  }

  /**
   * Cancels the operation.
   */
  cancel(): void {
    this.unlistenDargEvents();
    this.removeLine();
    if (this.updating) {
      const model = this.workspace.edges.get(this.updateInfo!.id)!;
      model.shape.selection!.hidden = false;
      this.workspace.requestUpdate();
    }
  }

  /**
   * Clears variables set in the `start()` function.
   */
  cleanup(): void {
    this.createInfo = undefined;
    this.updateInfo = undefined;
    this.updating = false;
    this.drawing = false;
  }

  start(domainObject: HTMLElement, slot: string, startPoint: Point): void {
    this.drawing = true;
    this.createInfo = {
      slot,
      point: startPoint,
      source: domainObject,
    };
    this.addLine(startPoint, startPoint);
    this.listenDargEvents();
  }

  /**
   * @param key The domain id of the association being updated
   * @param dir The name of the tip that is being dragged.
   */
  startUpdate(key: string, dir: string): void {
    const model = this.workspace.edges.get(key);
    if (!model) {
      throw new Error(`The edge is not prepared.`);
    }
    model.shape.selection!.hidden = true;
    const { coordinates } = model.shape.line;
    const [sp] = coordinates!;
    const ep = coordinates![coordinates!.length - 1];
    const startPoint = dir === 'end' ? sp : ep;
    const endPoint = dir === 'end' ? ep : sp;
    this.updating = true;
    this.updateInfo = {
      direction: dir,
      ep: endPoint,
      sp: startPoint,
      id: key,
    };
    this.drawing = true;
    this.addLine(startPoint, endPoint);
    this.listenDargEvents();
    this.workspace.requestUpdate();
  }

  end(id: string, slot: string, endPoint: Point): void {
    const { createInfo } = this;
    if (!createInfo) {
      throw new Error(`updateInfo is not set.`);
    }
    const detail = {
      source: {
        id: createInfo.source.dataset.key,
        point: createInfo.point,
        slot: createInfo.slot,
      },
      target: {
        id, // : domainObject.dataset.key,
        point: endPoint,
        slot,
      },
    };
    createInfo.source.dispatchEvent(new CustomEvent('anchorassociationcreate', {
      composed: true,
      cancelable: true,
      bubbles: true,
      detail,
    }));
    this.cleanup();
  }

  endUpdate(id: string, slot: string, endPoint: Point): void {
    const { updateInfo } = this;
    if (!updateInfo) {
      throw new Error(`updateInfo is not set.`);
    }
    const detail = {
      source: {
        associationId: updateInfo.id,
        direction: updateInfo.direction,
      },
      target: {
        id, // : domainObject.dataset.key,
        point: endPoint,
        slot,
      },
    };
    const model = this.workspace.edges.get(updateInfo.id)!;
    const eventTarget = this.workspace.querySelector(`[data-key="${model.source}"]`)!;
    this.cleanup();
    eventTarget.dispatchEvent(new CustomEvent('anchorassociationupdate', {
      composed: true,
      cancelable: true,
      bubbles: true,
      detail,
    }));
  }

  /**
   * Insets a child with a line definition into the workspace's SVG element.
   * @param start The starting point of the line
   * @param end The ending point of the line
   */
  addLine(start: Point, end: Point): void {
    const line = document.createElementNS(SvgNS, 'line');
    line.setAttribute('x1', `${start.x}`);
    line.setAttribute('y1', `${start.y}`);
    line.setAttribute('x2', `${end.x}`);
    line.setAttribute('y2', `${end.y}`);
    line.classList.add('association-line');
    const { associationSvg } = this.workspace;
    associationSvg.append(line);
    this.lineElement = line;
  }

  /**
   * Removes the previously added line from the SVG
   */
  removeLine(): void {
    const { lineElement } = this;
    if (!lineElement) {
      return;
    }
    const { associationSvg } = this.workspace;
    associationSvg.removeChild(lineElement);
    this.lineElement = undefined;
  }

  /**
   * Updates the end position of the line.
   * @param {Point} point
   */
  updateLinePosition(point: Point): void {
    const { lineElement } = this;

    if (!lineElement) {
      return;
    }

    // lineElement.setAttribute('d', definition.path);
    lineElement.setAttribute('x2', `${point.x}`);
    lineElement.setAttribute('y2', `${point.y}`);
  }

  /**
   * Listens for the mouse move and mouse up events to draw the line and finish the operation.
   * This is only initialized when starting drawing a line.
   */
  listenDargEvents(): void {
    const { workspace } = this;
    workspace.addEventListener('mousemove', this[mouseMoveHandler]);
    workspace.addEventListener('mouseup', this[mouseUpHandler]);
    window.addEventListener('keydown', this[keydownHandler]);
  }

  /**
   * Removes previously registered events.
   */
  unlistenDargEvents(): void {
    const { workspace } = this;
    workspace.removeEventListener('mousemove', this[mouseMoveHandler]);
    workspace.removeEventListener('mouseup', this[mouseUpHandler]);
    window.removeEventListener('keydown', this[keydownHandler]);
  }
}
