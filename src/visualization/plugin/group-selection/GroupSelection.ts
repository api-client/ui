/* eslint-disable class-methods-use-this */
import VizWorkspaceElement from '../../elements/VizWorkspaceElement.js';
import { Point } from '../../lib/Point.js';
import { getRelativeClickPoint, getObjectBoundingClientRect } from '../../lib/PositionUtils.js';

export const mouseDownHandler = Symbol('mouseDownHandler');
export const mouseUpHandler = Symbol('mouseUpHandler');
export const mouseMoveHandler = Symbol('mouseMoveHandler');
export const connectedValue = Symbol('connectedValue');

const CLS = 'selection-zone';

/**
 * A plugin that adds support for a group selection via pointer device on the visualization workspace.
 * 
 * This plugin draws a selection rectangle from the starting position until the pointer is released.
 * Each selectable element that is inside the rectangle is selected.
 * 
 * After the modeling workspace is created create instance of this class and call `connect()` function
 * to start listening for the events. Call `disconnect()` when the workspace is no longer in use.
 */
export class GroupSelection {
  [connectedValue]: boolean = false;

  /**
   * @returns True when the plug-in is listening for the input events.
   */
  get connected(): boolean {
    return this[connectedValue];
  }

  /**
   * Whether a selection is currently being made.
   */
  selecting: boolean = false;

  /**
   * The element that is being rendered as a selection box.
   */
  selectionZone: HTMLDivElement | null = null;

  /**
   * The click start point
   */
  startPoint: Point | null = null;

  /**
   * The position delta between the start and the current pointer position.
   */
  delta: Point | null = null;

  /**
   * @param target The target workspace element.
   */
  constructor(public target: VizWorkspaceElement) {
    this[mouseUpHandler] = this[mouseUpHandler].bind(this);
    this[mouseDownHandler] = this[mouseDownHandler].bind(this);
    this[mouseMoveHandler] = this[mouseMoveHandler].bind(this);
    this[connectedValue] = false;
  }

  connect(): void {
    this.target.addEventListener('mousedown', this[mouseDownHandler]);
    document.body.addEventListener('mouseup', this[mouseUpHandler]);
    document.body.addEventListener('mousemove', this[mouseMoveHandler]);
    this[connectedValue] = true;
  }

  disconnect(): void {
    this.target.removeEventListener('mousedown', this[mouseDownHandler]);
    document.body.removeEventListener('mouseup', this[mouseUpHandler]);
    document.body.removeEventListener('mousemove', this[mouseMoveHandler]);
    this[connectedValue] = false;
  }

  reset(): void {
    this.startPoint = null;
    this.delta = null;
    this.selectionZone = null;
    this.selecting = false;
  }

  [mouseDownHandler](e: MouseEvent): void {
    if (e.target !== this.target || e.button !== 0) {
      return;
    }
    // e.preventDefault();
    this.selecting = true;
    this.startPoint = this.pointFromEvent(e);
  }

  [mouseMoveHandler](e: MouseEvent): void {
    if (!this.selecting) {
      return;
    }
    if (!this.selectionZone) {
      this.appendSelectionZone(this.startPoint!);
    }
    const current = this.pointFromEvent(e);
    this.updateSelectionSize(current);
    // // See notes in this function.
    this.detectEdges(e);
    this.detectSelected();
    e.preventDefault();
  }

  [mouseUpHandler](e: MouseEvent): void {
    if (!this.selecting) {
      return;
    }
    this.clearWorkspace();
    this.reset();
    e.preventDefault();
  }

  /**
   * Removes the selection rectangle from the workspace
   */
  clearWorkspace(): void {
    const target = this.target.canvas!;
    const nodes = target.querySelectorAll(`.${CLS}`);
    Array.from(nodes).forEach((n) => target.removeChild(n));
  }

  /**
   * Handles the drop event on one of the children.
   * @returns coordinates of the click on the workspace as it would be
   * not scaled.
   */
  pointFromEvent(e: MouseEvent): Point {
    const { clientX, clientY } = e;
    return getRelativeClickPoint(clientX, clientY, this.target);
  }

  /**
   * Adds a selection box in the place of the click.
   * @param position The starting position of the element.
   */
  appendSelectionZone(position: Point): void {
    const selectionZone = document.createElement('div');
    selectionZone.classList.add(CLS);
    const { x, y } = position;
    selectionZone.style.top = `${y}px`;
    selectionZone.style.left = `${x}px`;
    this.target.canvas!.append(selectionZone);
    this.selectionZone = selectionZone;
  }

  /**
   * Moves the workspace if needed.
   */
  detectEdges(e: MouseEvent): void {
    const { clientX, clientY } = e;
    this.target.scrollIfNeeded(clientX, clientY);
  }

  /**
   * Redraws the selection rectangle to current point
   * @param {Point} current
   */
  updateSelectionSize(current: Point): void {
    const { x: x1, y: y1 } = this.startPoint!;
    const { x: x2, y: y2 } = current;
    const dx = x2 - x1;
    const dy = y2 - y1;
    if (dx >= 0) {
      this.selectionZone!.style.width = `${dx}px`;
    } else {
      this.selectionZone!.style.width = `${Math.abs(dx)}px`;
      const xPos = x1 + dx;
      this.selectionZone!.style.left = `${xPos}px`;
    }
    if (dy >= 0) {
      this.selectionZone!.style.height = `${dy}px`;
    } else {
      this.selectionZone!.style.height = `${Math.abs(dy)}px`;
      const yPos = y1 + dy;
      this.selectionZone!.style.top = `${yPos}px`;
    }
  }

  detectSelected(): void {
    const selectionManager = this.target.selection;
    const items = selectionManager.selectable;
    if (!items.length) {
      return;
    }
    const selected: Element[] = [];
    const rect = this.getSelectionRect();
    items.forEach((node) => {
      const box = getObjectBoundingClientRect(node, this.target);
      if (this.collide(rect, box)) {
        selected.push(node);
      }
    });
    const targetSelected: Element[] = [];
    selectionManager.selected.forEach((i) => {
      if (selectionManager.isSelectable(i.node)) {
        targetSelected.push(i.node);
      }
    });
    if (selected.length === targetSelected.length) {
      // This is a possible optimization to reduce number of computations.
      // Assumption is being made that the actual change can only be made
      // when adding or removing a selection (one by one) as the selection
      // would have to at the same time select a rectangle and deselect another
      // which probably is impossible (?).
      return;
    }
    if (selected.length > 0) {
      targetSelected.forEach((node) => {
        if (!selected.includes(node) && selectionManager.isSelected(node)) {
          selectionManager.setUnselected(node);
        }
      });
      selected.forEach((node) => {
        if (!selectionManager.isSelected(node)) {
          selectionManager.setSelected(node);
        }
      });
    } else if (targetSelected.length) {
      targetSelected.forEach((node) => selectionManager.setUnselected(node));
    }
  }

  /**
   * Reads scaled selection rectangle
   * @return A DOMRect object for the selection rectangle
   */
  getSelectionRect(): DOMRect {
    const node = this.selectionZone!;
    const top = this.getSafeStyleValue(node, 'top');
    const left = this.getSafeStyleValue(node, 'left');
    const width = this.getSafeStyleValue(node, 'width');
    const height = this.getSafeStyleValue(node, 'height');
    return new DOMRect(left, top, width, height);
  }

  /**
   * @param node The node to read the style property from.
   * @param prop The name of the css property to read
   * @returns The value of the property or 0 if not found.
   */
  getSafeStyleValue(node: HTMLElement, prop: string): number {
    let value = node.style.getPropertyValue(prop);
    if (!value) {
      return 0;
    }
    value = value.replace('px', '');
    const result = Number(value);
    if (Number.isNaN(result)) {
      return 0;
    }
    return result;
  }

  /**
   * Tests whether a current node collides with the selection rectangle.
   * @param selectionRect The selection computed rectangle
   * @param rect The Rect of the target element.
   * @returns True if the selection rectangle collides with `node`
   */
  collide(selectionRect: DOMRect, rect: DOMRect): boolean {
    const { x: x1, y: y1, width: w1, height: h1 } = selectionRect;
    const { x: x2, y: y2, width: w2, height: h2 } = rect;
    if (x1 < x2 + w2 &&
      x1 + w1 > x2 &&
      y1 < y2 + h2 &&
      y1 + h1 > y2) {
      return true;
    }
    return false;
  }
}
