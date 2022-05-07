import { Point } from "./Point.js";
import { closetsPair } from "./PositionUtils.js";

export const anchorPadding = 40;

/**
 * Creates an array of pots that can be placed on the East side of a rectangular object.
 * 
 * | ------ | o
 * |        |
 * |        | o
 * |        |
 * | ------ | o
 * 
 * @param rect The object DOMRect
 * @param padding The padding from the top/bottom
 */
export function readEastAnchorPoints(rect: DOMRect, padding: number): Point[] {
  const { right, top, bottom, height } = rect;
  const middle = height / 2;
  const p1 = new Point(right, top + padding);
  const p2 = new Point(right, top + middle);
  const p3 = new Point(right, bottom - padding);
  return [p1, p2, p3];
}

/**
 * Creates an array of pots that can be placed on the West side of a rectangular object.
 * 
 * o | ------ |
 *   |        |
 * o |        |
 *   |        |
 * o | ------ |
 * 
 * @param {DOMRect} rect The object DOMRect
 * @param {number} padding The padding from the top/bottom
 * @returns {Point[]}
 */
export function readWestAnchorPoints(rect: DOMRect, padding: number): Point[] {
  const { left, top, bottom, height } = rect;
  const middle = height / 2;
  const p1 = new Point(left, top + padding);
  const p2 = new Point(left, top + middle);
  const p3 = new Point(left, bottom - padding);
  return [p1, p2, p3];
}

/**
 * Creates an array of pots that can be placed on the North side of a rectangular object.
 * 
 * o    o    o
 * | ------- |
 * |         |
 * |         |
 * |         |
 * | ------- |
 * 
 * @param rect The object DOMRect
 * @param padding The padding from the left/right
 */
export function readNorthAnchorPoints(rect: DOMRect, padding: number): Point[] {
  const { left, top, width, right } = rect;
  const middle = width / 2;
  const p1 = new Point(left + padding, top);
  const p2 = new Point(left + middle, top);
  const p3 = new Point(right - padding, top);
  return [p1, p2, p3];
}

/**
 * Creates an array of pots that can be placed on the South side of a rectangular object.
 * 
 * | ------- |
 * |         |
 * |         |
 * |         |
 * | ------- |
 * o    o    o
 * 
 * @param rect The object DOMRect
 * @param padding The padding from the left/right
 */
export function readSouthAnchorPoints(rect: DOMRect, padding: number): Point[] {
  const { left, bottom, width, right } = rect;
  const middle = width / 2;
  const p1 = new Point(left + padding, bottom);
  const p2 = new Point(left + middle, bottom);
  const p3 = new Point(right - padding, bottom);
  return [p1, p2, p3];
}

/**
 * Finds a pair of virtual (created on the shape based on the size) anchor points.
 * 
 * @param padding The padding from the left/right/top/bottom
 */
export function findClosestAnchors(source: DOMRect, target: DOMRect, padding: number): Point[] {
  const sources = [
    ...readEastAnchorPoints(source, padding),
    ...readWestAnchorPoints(source, padding),
    ...readNorthAnchorPoints(source, padding),
    ...readSouthAnchorPoints(source, padding),
  ];
  const targets = [
    ...readEastAnchorPoints(target, padding),
    ...readWestAnchorPoints(target, padding),
    ...readNorthAnchorPoints(target, padding),
    ...readSouthAnchorPoints(target, padding),
  ];
  return closetsPair(sources, targets) as Point[];
}
