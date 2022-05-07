/* eslint-disable no-restricted-properties */
import VizWorkspaceElement from '../elements/VizWorkspaceElement.js';
import { Point } from './Point.js';
import { IEdgeDirections, GeoDirection } from './types.js';

/**
 * Computes a point from the `x` and `y` coordinates of the viewport and applies
 * the current scale to it to correctly position the click coordinates.
 *
 * @param wrapper The relatively positioned wrapper
 * @param container The absolutely positioned container
 * @param scale The current scale applied to the container
 * @returns A point with x and y scaled coordinates.
 */
export function clickPoint(x: number, y: number, wrapper: HTMLElement, container: HTMLElement, scale: number): Point {
  const { left: vLeft, top: vTop } = wrapper.getBoundingClientRect();
  const { left: cLeft, top: cTop } = container.getBoundingClientRect();
  const workspaceRelativeX = cLeft - vLeft;
  const workspaceRelativeY = cTop - vTop;
  const viewportRelativeXClick = x - vLeft;
  const viewportRelativeYClick = y - vTop;
  const realWorkspaceXClick = viewportRelativeXClick - workspaceRelativeX;
  const realWorkspaceYClick = viewportRelativeYClick - workspaceRelativeY;
  const relativeXClick = realWorkspaceXClick / scale;
  const relativeYClick = realWorkspaceYClick / scale;
  return new Point(relativeXClick, relativeYClick);
}

/**
 * Computes a point from the `x` and `y` coordinates of the viewport and applies
 * the current scale to it to correctly position the click coordinates.
 *
 * @param workspace The workspace element
 * @returns A point with x and y scaled coordinates.
 */
export function getRelativeClickPoint(x: number, y: number, workspace: VizWorkspaceElement): Point {
  const { scale, canvas } = workspace;
  return clickPoint(x, y, workspace, canvas!, scale);
  // const { left: vLeft, top: vTop } = workspace.getBoundingClientRect();
  // const { left: cLeft, top: cTop } = workspace.canvas.getBoundingClientRect();
  // const workspaceRelativeX = cLeft - vLeft;
  // const workspaceRelativeY = cTop - vTop;
  // const viewportRelativeXClick = x - vLeft;
  // const viewportRelativeYClick = y - vTop;
  // const realWorkspaceXClick = viewportRelativeXClick - workspaceRelativeX;
  // const realWorkspaceYClick = viewportRelativeYClick - workspaceRelativeY;
  // const relativeXClick = realWorkspaceXClick / scale;
  // const relativeYClick = realWorkspaceYClick / scale;
  // return new Point(relativeXClick, relativeYClick);
}

/**
 * Computes the direction for both start and end points relative to their
 * shapes. 
 * The `end` property describes the direction of an abstract arrow would be pointing to.
 * The `start` is the direction facing the beginning of the path.
 * 
 * @param sp The start point to calculate the direction from
 * @param ep The end point to calculate the direction to
 * @param sBox DOM rectangle of the source
 * @param eBox DOM rectangle of the target
 */
export function findDirection(sp: Point, ep: Point, sBox: DOMRect, eBox: DOMRect): IEdgeDirections {
  const padding = 10;
  let end: GeoDirection;
  let start: GeoDirection;
  if (Math.abs(eBox.left - ep.x) < padding) {
    end = 'east';
  } else if (Math.abs(eBox.right - ep.x) < padding) {
    end = 'west';
  } else if (Math.abs(eBox.bottom - ep.y) < padding) {
    end = 'south';
  } else {
    end = 'north';
  }

  if (Math.abs(sBox.left - sp.x) < padding) {
    start = 'west';
  } else if (Math.abs(sBox.right - sp.x) < padding) {
    start = 'east';
  } else if (Math.abs(sBox.top - sp.y) < padding) {
    start = 'north';
  } else {
    start = 'south';
  }

  return {
    end,
    start,
  };
}

// /**
//  * @param {Point} p1 
//  * @param {Point} p2 
//  * @param {Point} p3 
//  * @param {Point} p4 
//  * @returns {boolean} True when the pair of points (p1, p2) and (p3, p4) are the same on any order.
//  */
// export function theSamePair(p1, p2, p3, p4) {
//   if (p1.x === p3.x && p1.y === p3.y && p2.x === p4.x && p2.y === p4.y) {
//     return true;
//   }
//   if (p1.x === p4.x && p1.y === p4.y && p2.x === p3.x && p2.y === p3.y) {
//     return true;
//   }
//   return false;
// }

/**
 * Finds a pair of points closest to each other but from both sets.
 * This is a brut force method. These objects have up to 12 anchor points so it 
 * doesn't really matter as much. Though, when generating a complex diagram
 * with auto-layout it may process a number of items which would require 
 * finding a better algorithm.
 * 
 * @param s1 First set.
 * @param s2 Second set.
 * @param avoid1 Avoid these points (when possible) from the set1
 * @param avoid2 Avoid these points (when possible) from the set2
 * @returns A list of two points closest to each other or null if there were no points in the set.
 */
export function closetsPair(s1: Point[], s2: Point[], avoid1: Point[] = [], avoid2: Point[] = []): Point[] | null {
  let distance = Number.MAX_SAFE_INTEGER;
  let p: Point | undefined;
  let q: Point | undefined;
  s1.forEach((sp) => {
    if (avoid1.some(i => i.x === sp.x && i.y === sp.y)) {
      return;
    }
    s2.forEach((sq) => {
      if (avoid2.some(i => i.x === sq.x && i.y === sq.y)) {
        return;
      }
      const d = sp.distance(sq);
      if (d < distance) {
        distance = d;
        p = sp;
        q = sq;
      }
    });
  });
  if (!p && !!(avoid1.length || avoid2.length)) {
    return closetsPair(s1, s2);
  }
  if (!p) {
    return null;
  }
  if (q) {
    return [p, q];
  }
  return [p];
}

/**
 * Filters out invalid points
 */
export function filterPoints(points: Point[]): Point[] {
  return points.filter((v) => v.validate());
}

/**
 * Computes a point of the click inside the workspace element (not the content wrapper).
 * This then can be used to position elements that are not inside the visualization
 * workspace.
 *
 * @param workspace The workspace element
 * @returns A point with x and y scaled coordinates.
 */
export function getWorkspaceClick(x: number, y: number, workspace: VizWorkspaceElement): Point {
  const { left, top } = workspace.getBoundingClientRect();
  const workspaceX = x - left;
  const workspaceY = y - top;
  return new Point(workspaceX, workspaceY);
}

export function getObjectBoundingClientRect(element: Element, workspace: VizWorkspaceElement): DOMRect {
  const box = element.getBoundingClientRect();
  const { x, y } = getRelativeClickPoint(box.x, box.y, workspace);
  const { scale } = workspace;
  return new DOMRect(x, y, box.width / scale, box.height / scale);
}

/**
 * Dispatches the `positionchange` custom event on an element that has been positioned.
 * 
 * @param dx The difference in the `x` position in relation to the object position before the move
 * @param dy The difference in the `y` position in relation to the object position before the move
 */
export function notifyMoved(element: EventTarget, dx: number, dy: number): void {
  const e = new CustomEvent('positionchange', {
    composed: true,
    cancelable: true,
    bubbles: true,
    detail: {
      dx, dy,
    },
  });
  element.dispatchEvent(e);
}
