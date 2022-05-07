/* eslint-disable class-methods-use-this */
/* eslint-disable no-plusplus */
/* eslint-disable no-continue */
/* eslint-disable no-param-reassign */

import * as TouchSupport from './TouchSupport.js';
// import { cancelEvent } from './Utils.js';
import VizWorkspaceElement from '../elements/VizWorkspaceElement.js';
import { TouchMoveResult } from './TouchSupport.js';

const scrollSize = 25; // 25
const scaleFactor = .03; // 25

const xValue = Symbol('xValue');
const yValue = Symbol('yValue');

/**
 * A class that adds gestures support for the visualization workspace.
 * It controls the scrolling of the workspace canvas.
 */
export class WorkspaceGestures {
  [xValue]?: number;

  [yValue]?: number;

  /**
   * @return value The x-axis position value
   */
  get left(): number | null {
    return this[xValue] || null;
  }

  /**
   * @param value The x-axis position value
   */
  set left(value: number | null) {
    const localValue = Number(value);
    if (Number.isNaN(localValue)) {
      return;
    }
    const old = this[xValue];
    if (old === localValue) {
      return;
    }
    this[xValue] = localValue;
    this.workspace.requestUpdate('scrollLeft', old);
  }

  /**
   * @returns value The y-axis position value
   */
  get top(): number | null {
    return this[yValue] || null;
  }

  /**
   * @param value The y-axis position value
   */
  set top(value: number | null) {
    const localValue = Number(value);
    if (Number.isNaN(localValue)) {
      return;
    }
    const old = this[yValue];
    if (old === localValue) {
      return;
    }
    this[yValue] = localValue;
    this.workspace.requestUpdate('scrollTop', old);
  }

  constructor(public workspace: VizWorkspaceElement) {
    this.workspace = workspace;
    this.top = null;
    this.left = null;
    this.wheelHandler = this.wheelHandler.bind(this);
    this.touchstartHandler = this.touchstartHandler.bind(this);
    this.touchmoveHandler = this.touchmoveHandler.bind(this);
    this.touchendHandler = this.touchendHandler.bind(this);
    this.clickHandler = this.clickHandler.bind(this);
  }

  connect(): void {
    this.workspace.addEventListener('mousewheel', this.wheelHandler as EventListener, { passive: true });
    this.workspace.addEventListener('touchstart', this.touchstartHandler, { capture: false, passive: true });
    this.workspace.addEventListener('touchmove', this.touchmoveHandler, { passive: true });
    this.workspace.addEventListener('touchend', this.touchendHandler, { capture: false });
    this.workspace.addEventListener('touchcancel', this.touchendHandler);
    this.workspace.addEventListener('click', this.clickHandler as EventListener, { capture: false });
  }

  disconnect(): void {
    this.workspace.removeEventListener('mousewheel', this.wheelHandler as EventListener);
    this.workspace.removeEventListener('touchstart', this.touchstartHandler, { capture: true });
    this.workspace.removeEventListener('touchmove', this.touchmoveHandler);
    this.workspace.removeEventListener('touchend', this.touchendHandler);
    this.workspace.removeEventListener('touchcancel', this.touchendHandler, { capture: false });
    this.workspace.removeEventListener('click', this.clickHandler as EventListener, { capture: false });
  }

  /**
   * An event handler for the mouse wheel action.
   * Zooms in/out the workspace.
   */
  wheelHandler(e: WheelEvent): void {
    // cancelEvent(e);
    if (e.ctrlKey || e.metaKey) {
      this.handleZoomEvent(e);
    } else {
      this.scrollFromEvent(e);
    }
  }

  /**
   * Zooms in/out the workspace.
   */
  handleZoomEvent(e: WheelEvent): void {
    let { scale = 1 } = this.workspace;
    let pressure = e.deltaY;
    const max = 10;
    const mousePressure = 7;
    if (pressure < -max) {
      pressure = -mousePressure;
    } else if (pressure > max) {
      pressure = mousePressure;
    }
    scale += (pressure / 100);
    if (scale > 3) {
      scale = 3;
    }
    if (scale < 0.2) {
      scale = 0.2;
    }
    this.workspace.scale = scale;
    // const { zoom=0 } = this.workspace;
    // const zoomOut = e.deltaY > 0;
    // let factor = 1;
    // if (zoomOut) {
    //   factor = -1;
    // }
    // const value = zoom + factor;
    // if (value <= -31) {
    //   return;
    // }
    // this.workspace.zoom = zoom + factor;
    // this.workspace[notifyZoom]();
  }

  updateScale(): void {
    const { zoom } = this.workspace;
    const scale = 1 + zoom * scaleFactor;
    this.workspace.scale = scale;
    this.workspace.requestUpdate();
  }

  /**
   * @returns true when there is an element that is draggable in the event's path.
   */
  hasDraggable(e: TouchEvent): boolean {
    const path = e.composedPath();
    let current = path.shift();
    while (current) {
      const typedNode = current as Node;
      if (typedNode.nodeType !== Node.ELEMENT_NODE) {
        current = path.shift();
        continue;
      }
      const element = current as HTMLElement;
      if (element.draggable) {
        return true;
      }
      current = path.shift();
    }
    return false;
  }

  touchstartHandler(e: TouchEvent): void {
    if (this.hasDraggable(e)) {
      return;
    }
    TouchSupport.add(e);
  }

  touchmoveHandler(e: TouchEvent): void {
    if (this.hasDraggable(e)) {
      return;
    }
    const moves = TouchSupport.move(e);
    if (moves.length === 1) {
      this.scrollFromTouch(moves[0]);
    } else if (moves.length === 2) {
      this.zoomFromTouch(moves);
    }
  }

  touchendHandler(e: TouchEvent): void {
    if (this.hasDraggable(e)) {
      return;
    }
    TouchSupport.end(e);
  }

  /**
   * Dispatches the `scroll` event on the workspace.
   */
  notifyScroll(): void {
    this.workspace.dispatchEvent(new Event('scroll'));
  }

  /**
   * Handles scrolling from a touch event
   */
  async zoomFromTouch(moves: TouchMoveResult[]): Promise<void> {
    const [m1, m2] = moves;
    const { scale } = this.workspace;
    // I needed to come up with a number that would make the move a little bit more natural
    // and I came up with this..
    const anArbitraryNumber = 300;
    if (m1.dy > 0 && m2.dy < 0) {
      const factor = m1.dy - m2.dy;
      // zoom in
      this.workspace.scale = scale + scale * factor / anArbitraryNumber;
      this.workspace.requestUpdate();
    } else if (m1.dy < 0 && m2.dy > 0) {
      // zoom out
      const factor = -m1.dy + m2.dy;
      this.workspace.scale = scale - scale * factor / anArbitraryNumber;
      this.workspace.requestUpdate();
    }
  }

  /**
   * Scrolls the current viewport to a given location.
   * @param forward Defines whether to scroll forward or backward.
   * For the `x` (the `left` value) axis it means going right when true and going left when false.
   * For the `y` (the `top` value) axis this means going down when true and up when false.
   * @param axis Scroll axis. Either `x` or `y`.
   */
  scroll(forward: boolean, axis: 'top' | 'left'): void {
    const { workspace } = this;
    const { scale } = workspace;
    const value = this[axis] || 0;
    const scaledSize = scrollSize / scale;
    const newValue = forward ? value - scaledSize : value + scaledSize;
    this[axis] = newValue;
    this.notifyScroll();
  }

  /**
   * Scrolls the view if the position defined by `x` and `y` arguments requires
   * the view to be moved.
   *
   * @param x The x coordinate of the point
   * @param y The y coordinate of the point
   * @returns true if the workspace was moved
   */
  scrollIfNeeded(x: number, y: number): boolean {
    const { workspace } = this;
    const { bottom, top, right, left } = workspace.getBoundingClientRect();
    const scrollMargin = 40
    if (y - scrollMargin < top) {
      // requires workspace' viewport to scroll up
      this.scroll(false, 'top');
      this.notifyScroll();
      return true;
    }
    if (y + scrollMargin > bottom) {
      // requires workspace' viewport to scroll down
      this.scroll(true, 'top');
      this.notifyScroll();
      return true;
    }
    if (x - scrollMargin < left) {
      // requires workspace' viewport to scroll left
      this.scroll(false, 'left');
      this.notifyScroll();
      return true;
    }
    if (x + scrollMargin > right) {
      // requires workspace' viewport to scroll right
      this.scroll(true, 'left');
      this.notifyScroll();
      return true;
    }
    return false;
  }

  /**
   * Scrolls the element by the given amount.
   * @param xCoordOrOptions The horizontal pixel value that you want to scroll by
   * or the scroll options. When passed value is the `ScrollToOptions` interface then
   * the second argument is ignored.
   * @param yCoord The vertical pixel value that you want to scroll by.
   */
  scrollBy(xCoordOrOptions: number | ScrollToOptions, yCoord?: number): void {
    const [byX, byY] = this.getScrollOptionsSafe(xCoordOrOptions, yCoord);
    let [x, y] = this.getXYSafe();
    x -= byX;
    y -= byY;
    this.left = x;
    this.top = y;
    this.notifyScroll();
  }

  /**
   * Scrolls to a particular set of coordinates inside the element.
   *
   * @param xCoordOrOptions The pixel along the horizontal axis of the element
   * that you want displayed in the upper left. When passed value is the `ScrollToOptions` interface then
   * the second argument is ignored.
   * @param yCoord The pixel along the vertical axis of the element that you want displayed in the upper left.
   */
  scrollTo(xCoordOrOptions: number | ScrollToOptions, yCoord?: number): void {
    const [x, y] = this.getScrollOptionsSafe(xCoordOrOptions, yCoord);
    this.left = x;
    this.top = y;
    this.notifyScroll();
  }

  /**
   * Scrolls from the event values.
   */
  scrollFromEvent(e: WheelEvent): void {
    let [x, y] = this.getXYSafe();
    const factor = (1 / this.workspace.scale); // 1;
    let dx = e.deltaX;
    let dy = e.deltaY;
    if (e.shiftKey && e.deltaX === 0) {
      // Under linux (possibly windows too) when shift is pressed
      // then the `e.deltaX` is not populated as it happens on MacOS.
      // This sets dx value to the dy and resets dy.
      dx = dy;
      dy = -0;
    }
    x -= dx * factor;
    y -= dy * factor;
    this.left = x;
    this.top = y;
    this.notifyScroll();
  }

  /**
   * Handles scrolling from a touch event
   */
  scrollFromTouch(move: TouchMoveResult): void {
    let [x, y] = this.getXYSafe();
    const factor = 1;
    const { dx, dy } = move;
    x -= dx * factor;
    y -= dy * factor;
    this.left = x;
    this.top = y;
    this.notifyScroll();
  }

  /**
   * Reads the `x` and `y` point from the parameters that can be just a `xy` pair
   * or arguments or a value of the `ScrollToOptions` interface.
   *
   * @param xCoordOrOptions The horizontal pixel value or the scroll options.
   * When passed value is the `ScrollToOptions` interface then the second argument is ignored.
   * @param yCoord The vertical pixel value
   *
   * @returns A point of the X and Y read from the options with default values.
   */
  getScrollOptionsSafe(xCoordOrOptions: ScrollToOptions | number, yCoord?: number): number[] {
    const typedX = Number(xCoordOrOptions);
    const typedY = Number(yCoord);
    let byX;
    let byY;
    if (Number.isNaN(typedX) && Number.isNaN(typedY)) {
      const { top = 0, left = 0 } = xCoordOrOptions as ScrollToOptions;
      byX = Number(left);
      byY = Number(top);
    } else {
      byX = typedX || 0;
      byY = typedY || 0;
    }
    return [byX, byY];
  }

  /**
   * Reads current left and top values and returns the numbers, even when not defined.
   *
   * @returns A point of the left and top position of the workspace.
   */
  getXYSafe(): number[] {
    let { left = 0, top = 0 } = this;
    if (left === null) {
      left = 0;
    }
    if (top === null) {
      top = 0;
    }
    return [left, top];
  }

  clickHandler(e: PointerEvent): void {
    if (e.detail === 3) {
      this.workspace.zoom = 0;
      this.scrollTo(0, 0);
      // this.center();
    }
  }
}
