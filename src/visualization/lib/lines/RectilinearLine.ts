/* eslint-disable no-lonely-if */
import { findDirection } from '../PositionUtils.js';
import { Point } from '../Point.js';
import { ILineSketchOptions, IVisualizationRectilinearLineShape } from '../VisualizationTypes.js';
import { GeoDirection, IWorkspaceEdge } from '../types.js';

export const startWest = Symbol('startWest');
export const startEast = Symbol('startEast');
export const startSouth = Symbol('startSouth');
export const startNorth = Symbol('startNorth');
export const sketchEastEast = Symbol('sketchEastEast');
export const sketchEastWest = Symbol('sketchEastWest');
export const sketchEastSouth = Symbol('sketchEastSouth');
export const sketchEastNorth = Symbol('sketchEastNorth');
export const sketchNorthWest = Symbol('sketchNorthWest');
export const sketchNorthEast = Symbol('sketchNorthEast');
export const sketchNorthSouth = Symbol('sketchNorthSouth');
export const sketchNorthNorth = Symbol('sketchNorthNorth');
export const sketchWestSouth = Symbol('sketchWestSouth');
export const sketchWestWest = Symbol('sketchWestWest');
export const sketchWestEast = Symbol('sketchWestEast');
export const sketchWestNorth = Symbol('sketchWestNorth');
export const sketchSouthNorth = Symbol('sketchSouthNorth');
export const sketchSouthWest = Symbol('sketchSouthWest');
export const sketchSouthSouth = Symbol('sketchSouthSouth');
export const sketchSouthEast = Symbol('sketchSouthEast');

export const ElbowThreshold = 24;

/**
 * A class that draws a rectilinear line
 */
export class RectilinearLine {
  ep: Point;

  sp: Point;

  source: DOMRect;

  target: DOMRect;

  others?: IWorkspaceEdge[];

  /** 
   * The default padding to use when computing distance between the line and an object.
   */
  overlapPadding: number = 20;

  /** 
   * The list of all points (start + end + control points)
   */
  coordinates: Point[];

  /**
   * The list of all control points. 
   */
  controlPoints: Point[] = [];

  transformOrigin: string;

  /** 
   * The delta between Y coordinates
   */
  dx: number;
  
  /** 
   * The delta between Y coordinates
   */
  dy: number;

  /** 
   * Half distance between start.x and end.x
   */
  halfX: number;

  /** 
   * Half distance between start.y and end.y
   */
  halfY: number;

  constructor(config: ILineSketchOptions) {
    const { endPoint, target, startPoint, source, others } = config;
    this.ep = endPoint;
    this.sp = startPoint;
    this.source = source;
    this.target = target;
    this.others = others;
    this.coordinates = [startPoint];
    this.transformOrigin = `${startPoint.x}px ${endPoint.y}px`;
    this.dx = endPoint.x - startPoint.x;
    this.dy = endPoint.y - startPoint.y;
    this.halfX = Math.abs(this.dx) / 2;
    this.halfY = Math.abs(this.dy) / 2;
  }

  /**
   * Sketches a regular line.
   * @returns Computed model for the association.
   */
  sketch(): IVisualizationRectilinearLineShape | null {
    const { sp, ep, source, target } = this;
    if (!sp.validate() || !ep.validate()) {
      return null;
    }
    const directions = findDirection(sp, ep, source, target);
    const { start, end } = directions;
    // console.log(start, end);
    if (start === 'west') {
      this[startWest](end);
    } else if (start === 'south') {
      this[startSouth](end);
    } else if (start === 'east') {
      this[startEast](end);
    } else {
      this[startNorth](end);
    }

    const { coordinates, controlPoints, transformOrigin } = this;
    coordinates.push(this.ep);
    const path = coordinates.map((item) => `${item.x},${item.y}`).join(' ');
    const result: IVisualizationRectilinearLineShape = {
      controlPoints,
      transformOrigin,
      type: 'rectilinear',
      coordinates,
      rotate: 0,
      path,
      startPoint: sp,
      endPoint: ep,
    };
    return result;
  }

  /**
   * Adds a control point to the list of points.
   */
  addCP(x: number = 0, y: number = 0): Point {
    const cp = new Point(x, y);
    this.coordinates.push(cp);
    this.controlPoints.push(cp);
    return cp;
  }

  /**
   * Computes the line that starts on the west side of the source object 
   * and end in the `end`
   * @param end The direction where the line ends.
   */
  [startWest](end: GeoDirection): void {
    if (end === 'west') {
      this[sketchWestWest]();
    } else if (end === 'south') {
      this[sketchWestSouth]();
    } else if (end === 'east') {
      this[sketchWestEast]();
    } else {
      this[sketchWestNorth]();
    }
  }

  [sketchWestSouth](): void {
    const { target, sp, ep, overlapPadding, dx, dy } = this;
    if (dx >= 0) {
      if (dy < 0) {
        // go around the source to the right
        const cp1 = this.addCP(sp.x - overlapPadding, sp.y);
        const cp2 = this.addCP(cp1.x, target.bottom + overlapPadding);
        this.addCP(ep.x, cp2.y);
      } else {
        const cp1 = this.addCP(sp.x - overlapPadding, sp.y);
        const cp2 = this.addCP(cp1.x, target.bottom + overlapPadding);
        this.addCP(ep.x, cp2.y);
      }
    } else if (dy < 0) {
      this.addCP(ep.x, sp.y);
    } else {
      const cp1 = this.addCP(sp.x - overlapPadding, sp.y);
      const cp2 = this.addCP(cp1.x, target.bottom + overlapPadding);
      this.addCP(ep.x, cp2.y);
    }
  }

  [sketchWestWest](): void {
    const { source, target, sp, ep, overlapPadding, halfX, dy } = this;
    const overlap = source.left < target.right;
    if (overlap) {
      const cp1 = this.addCP(sp.x - overlapPadding, sp.y);
      const cp2 = this.addCP(cp1.x, source.top - overlapPadding);
      const cp3 = this.addCP(Math.max(target.right, source.right) + overlapPadding, cp2.y);
      this.addCP(cp3.x, ep.y);
    } else {
      // draw a straight line when distance between the two is below the threshold
      if (Math.abs(dy) > ElbowThreshold) {
        this.addCP(sp.x - halfX, sp.y);
        this.addCP(ep.x + halfX, ep.y);
      }
    }
  }

  [sketchWestEast](): void {
    const { source, target, sp, ep, overlapPadding } = this;
    const overlap = source.left < target.left;
    if (overlap) {
      const cp1 = this.addCP(sp.x - overlapPadding, sp.y);
      this.addCP(cp1.x, ep.y);
    } else {
      const cp1 = this.addCP(ep.x - overlapPadding, sp.y);
      this.addCP(cp1.x, ep.y);
    }
  }

  [sketchWestNorth](): void {
    const { source, target, sp, ep, overlapPadding } = this;
    const overlap = source.left < target.right;
    if (overlap) {
      const cp1 = this.addCP(sp.x - overlapPadding, sp.y);
      const cp2 = this.addCP(cp1.x, ep.y - overlapPadding);
      this.addCP(ep.x, cp2.y);
    } else {
      this.addCP(ep.x, sp.y);
    }
  }


  /**
   * Computes the line that starts on the west side of the source object 
   * and end in the `end`
   * @param end The direction where the line ends.
   */
  [startSouth](end: GeoDirection): void {
    if (end === 'west') {
      this[sketchSouthWest]();
    } else if (end === 'south') {
      this[sketchSouthSouth]();
    } else if (end === 'east') {
      this[sketchSouthEast]();
    } else {
      this[sketchSouthNorth]();
    }
  }

  [sketchSouthNorth](): void {
    const { source, target, sp, ep, halfY, overlapPadding, dx } = this;
    const overlapping = source.bottom + overlapPadding > target.top - overlapPadding; 
    if (overlapping) {
      const cp1 = this.addCP(sp.x, sp.y + overlapPadding);
      let cp2;
      if (source.right < target.left) {
        // the target is on the right
        cp2 = this.addCP(target.left - overlapPadding, cp1.y);
      } else {
        // the target is on the left
        cp2 = this.addCP(target.right + overlapPadding, cp1.y);
      }
      const cp3 = this.addCP(cp2.x, target.top - overlapPadding);
      this.addCP(ep.x, cp3.y);
    } else {
      // draw a straight line instead of the elbow when the distance is below the threshold
      if (Math.abs(dx) > ElbowThreshold) {
        const cp1 = this.addCP(sp.x, sp.y + halfY);
        this.addCP(ep.x, cp1.y);
      }
    }
  }

  [sketchSouthWest](): void {
    const { sp, ep, dx, dy, halfY, halfX, overlapPadding } = this;
    if (dx >= 0) {
      if (dy < 0) {
        const cp1 = this.addCP(sp.x, sp.y + overlapPadding);
        const cp2 = this.addCP(ep.x + overlapPadding, cp1.y);
        this.addCP(cp2.x, ep.y);
      } else {
        const cp1 = this.addCP(sp.x, sp.y + halfY);
        const cp2 = this.addCP(ep.x + overlapPadding, cp1.y);
        this.addCP(cp2.x, ep.y);
      }
    } else if (dy < 0) {
      const cp1 = this.addCP(sp.x, sp.y + overlapPadding);
      const cp2 = this.addCP(ep.x + halfX, cp1.y);
      this.addCP(cp2.x, ep.y);
    } else {
      this.addCP(sp.x, ep.y);
    }
  }

  [sketchSouthSouth](): void {
    const { source, target, sp, ep, overlapPadding } = this;
    if ((source.bottom + 2 * overlapPadding) > target.bottom) {
      const cp1 = this.addCP(sp.x, sp.y + overlapPadding);
      this.addCP(ep.x, cp1.y);
    } else {
      const cp1 = this.addCP(sp.x, ep.y + overlapPadding);
      this.addCP(ep.x, cp1.y);
    }
  }

  [sketchSouthEast](): void {
    const { source, sp, ep, dx, dy, overlapPadding, halfX, halfY } = this;
    if (dx >= 0) {
      if (dy < 0) {
        const cp1 = this.addCP(sp.x, sp.y + overlapPadding);
        let c2x = sp.x + halfX;
        if (c2x < source.right + overlapPadding) {
          c2x = ep.x - overlapPadding;
        }
        const cp2 = this.addCP(c2x, cp1.y);
        this.addCP(cp2.x, ep.y);
      } else {
        this.addCP(sp.x, ep.y);
      }
    } else if (dy < 0) {
      const cp1 = this.addCP(sp.x, sp.y + overlapPadding);
      const cp2 = this.addCP(ep.x - overlapPadding, cp1.y);
      this.addCP(cp2.x, ep.y);
    } else {
      const cp1 = this.addCP(sp.x, sp.y + halfY);
      const cp2 = this.addCP(ep.x - overlapPadding, cp1.y);
      this.addCP(cp2.x, ep.y);
    }
  }

  /**
   * Computes the line that starts on the west side of the source object 
   * and end in the `end`
   * @param end The direction where the line ends.
   */
  [startEast](end: GeoDirection): void {
    if (end === 'west') {
      this[sketchEastWest]();
    } else if (end === 'east') {
      this[sketchEastEast]();
    } else if (end === 'south') {
      this[sketchEastSouth]();
    } else {
      this[sketchEastNorth]();
    }
  }

  [sketchEastEast](): void {
    const { source, target, sp, ep, overlapPadding, halfX, dy } = this;

    if (sp.x + 2 * overlapPadding > target.x) {
      const cp1 = this.addCP(sp.x + overlapPadding, sp.y);
      const cp2 = this.addCP(cp1.x, source.top - overlapPadding);
      const cp3 = this.addCP(ep.x - overlapPadding, cp2.y);
      this.addCP(cp3.x, ep.y);
    } else {
      // draw a straight line when distance between the two is below the threshold
      if (Math.abs(dy) > ElbowThreshold) {
        const cp1 = this.addCP(sp.x + halfX, sp.y);
        this.addCP(cp1.x, ep.y);
      }
    }
  }

  [sketchEastWest](): void {
    const { source, target, sp, ep, overlapPadding, dx } = this;
    if (dx >= 0) {
      // target on the right
      if (sp.y > target.top - overlapPadding && sp.y < target.bottom + overlapPadding) {
        // line is going through the target object
        const targetAbove = ep.y < sp.y;
        const cp1 = this.addCP(target.left - overlapPadding, sp.y);
        const cp2 = this.addCP(cp1.x);
        if (targetAbove) {
          cp2.y = target.bottom + overlapPadding;
        } else {
          cp2.y = target.top - overlapPadding;
        }
        const cp3 = this.addCP(ep.x + overlapPadding, cp2.y);
        this.addCP(cp3.x, ep.y);
      } else {
        const cp1 = this.addCP(ep.x + overlapPadding, sp.y);
        this.addCP(cp1.x, ep.y);
      }
    } else {
      // target on the left
      const cp1 = this.addCP(sp.x + overlapPadding, sp.y);
      if (ep.y > source.top - overlapPadding && ep.y < source.bottom + overlapPadding) {
        // line is going through the source object
        const targetAbove = ep.y < sp.y;
        const cp2 = this.addCP(cp1.x);
        if (targetAbove) {
          cp2.y = source.top - overlapPadding;
        } else {
          cp2.y = source.bottom + overlapPadding;
        }
        const cp3 = this.addCP(source.left - overlapPadding, cp2.y);
        this.addCP(cp3.x, ep.y);
      } else {
        this.addCP(cp1.x, ep.y);
      }
    }
  }

  [sketchEastSouth](): void {
    const { source, target, sp, ep, overlapPadding } = this;
    const targetAround = ep.y > sp.y;
    const sourceAround = sp.x > ep.x;
    
    if (targetAround && sourceAround) {
      const cp1 = this.addCP(sp.x + overlapPadding, sp.y);
      const cp2 = this.addCP(cp1.x, Math.max(ep.y, source.bottom) + overlapPadding);
      this.addCP(ep.x, cp2.y);
    } else if (targetAround) {
      const overlapping = sp.x + overlapPadding > target.left;
      if (overlapping) {
        const cp1 = this.addCP(sp.x + overlapPadding, sp.y);
        const cp2 = this.addCP(cp1.x, target.bottom + overlapPadding);
        const cp3 = this.addCP(target.left - overlapPadding, cp2.y);
        const cp4 = this.addCP(cp3.x, ep.y - overlapPadding);
        this.addCP(ep.x, cp4.y);
      } else {
        const cp1 = this.addCP(target.left - overlapPadding, sp.y);
        const cp2 = this.addCP(cp1.x, ep.y + overlapPadding);
        this.addCP(ep.x, cp2.y);
      }
    } else if (sourceAround) {
      const cp1 = this.addCP(sp.x + overlapPadding, sp.y);
      const cp2 = this.addCP(cp1.x, source.bottom + overlapPadding);
      const cp3 = this.addCP(target.right + overlapPadding, cp2.y);
      const cp4 = this.addCP(cp3.x, target.bottom + overlapPadding);
      this.addCP(ep.x, cp4.y);
    } else {
      this.addCP(ep.x, sp.y);
    }
  }

  [sketchEastNorth](): void {
    const { source, target, sp, ep, overlapPadding, dx, dy } = this;
    if (dx >= 0) {
      if (dy < 0) {
        const cp1 = this.addCP(target.right + overlapPadding, sp.y);
        const cp2 = this.addCP(cp1.x, target.top - overlapPadding);
        this.addCP(ep.x, cp2.y);
      } else if (source.right > (target.left - overlapPadding)) {
        // go around the source 
        const cp1 = this.addCP(sp.x + overlapPadding, sp.y);
        const cp2 = this.addCP(cp1.x, source.bottom + overlapPadding);
        const cp3 = this.addCP(target.left - overlapPadding, cp2.y);
        const cp4 = this.addCP(cp3.x, target.bottom + overlapPadding);
        this.addCP(ep.x, cp4.y);
      } else {
        this.addCP(ep.x, sp.y);
      }
    } else if ((source.bottom + 2*overlapPadding) < target.top ) {
      const cp1 = this.addCP(sp.x + overlapPadding, sp.y);
      const cp2 = this.addCP(cp1.x, source.bottom + overlapPadding);
      this.addCP(ep.x, cp2.y);
    } else {
      const cp1 = this.addCP(sp.x + overlapPadding, sp.y);
      const cp2 = this.addCP(cp1.x, Math.min(target.top, source.top) - overlapPadding);
      this.addCP(ep.x, cp2.y);
    }
  }

  /**
   * Computes the line that starts on the west side of the source object 
   * and end in the `end`
   * @param end The direction where the line ends.
   */
  [startNorth](end: GeoDirection): void {
    if (end === 'west') {
      this[sketchNorthWest]();
    } else if (end === 'north') {
      this[sketchNorthNorth]()
    } else if (end === 'east') {
      this[sketchNorthEast]();
    } else {
      this[sketchNorthSouth]();
    }
  }

  [sketchNorthWest](): void {
    const { source, target, sp, ep, overlapPadding, dx, dy } = this;
    if (dx >= 0) {
      if (dy < 0) {
        if (target.bottom + 2*overlapPadding > sp.y) {
          // go above the target
          const cp1 = this.addCP(sp.x, target.top - overlapPadding);
          const cp2 = this.addCP(ep.x + overlapPadding, cp1.y);
          this.addCP(cp2.x, ep.y);
        } else {
          // go below the target
          const cp1 = this.addCP(sp.x, target.bottom + overlapPadding);
          const cp2 = this.addCP(ep.x + overlapPadding, cp1.y);
          this.addCP(cp2.x, ep.y);
        }
      } else {
        const cp1 = this.addCP(sp.x, Math.min(sp.y, target.top) - overlapPadding);
        const cp2 = this.addCP(Math.max(ep.x, source.right) + overlapPadding, cp1.y);
        this.addCP(cp2.x, ep.y);
      }
    } else if (dx < 0) {
      if (ep.y < sp.y - overlapPadding) {
        this.addCP(sp.x, ep.y);
      } else {
        const cp1 = this.addCP(sp.x, Math.min(sp.y, target.top) - overlapPadding);
        if (ep.x + 2*overlapPadding > source.left) {
          const cp2 = this.addCP(source.left - overlapPadding, cp1.y);
          const cp3 = this.addCP(cp2.x, target.top - overlapPadding);
          const cp4 = this.addCP(target.right + overlapPadding, cp3.y);
          this.addCP(cp4.x, ep.y);
        } else {
          const cp2 = this.addCP(Math.min(ep.x, source.left) + overlapPadding, cp1.y);
          this.addCP(cp2.x, ep.y);
        }
      }
    }
  }

  [sketchNorthEast](): void {
    const { source, target, sp, ep, overlapPadding, dx, dy } = this;
    const cp1 = this.addCP(sp.x, sp.y - overlapPadding);
    if (dx >= 0) {
      if (dy < 0) {
        this.addCP(sp.x, ep.y);
      } else if (source.right > (target.left - overlapPadding)) {
        const cp2 = this.addCP(source.right + overlapPadding, cp1.y);
        const cp3 = this.addCP(cp2.x, source.bottom + overlapPadding);
        const cp4 = this.addCP(ep.x - overlapPadding, cp3.y);
        this.addCP(cp4.x, ep.y);
      } else {
        const cp2 = this.addCP(ep.x - overlapPadding, cp1.y);
        this.addCP(cp2.x, ep.y);
      }
    } else {
      if (cp1.y > target.top - overlapPadding && cp1.y < target.bottom + overlapPadding) {
        const cp2 = this.addCP(target.right + overlapPadding, cp1.y);
        const posy = ep.y < sp.y ? target.bottom + overlapPadding : target.top - overlapPadding;
        const cp3 = this.addCP(cp2.x, posy);
        this.addCP(ep.x - overlapPadding, cp3.y);
      } else {
        const overlapping = ep.x - overlapPadding > source.left;
        if (overlapping) {
          const cp2 = this.addCP(source.left - overlapPadding, cp1.y);
          this.addCP(cp2.x, ep.y);
        } else {
          this.addCP(ep.x - overlapPadding, cp1.y);
        }
      }
      this.addCP(ep.x - overlapPadding, ep.y);
    }
    
  }

  [sketchNorthSouth](): void {
    const { source, target, sp, ep, overlapPadding, dy, dx, halfY } = this;
    // (dy < 0) - the source is below target
    // (ep.y + 2*overlapPadding < sp.y) - there is a room to render the line between the boxes
    if (dy < 0 && ep.y + 2*overlapPadding < sp.y) {
      // draw a straight line instead of the elbow when the distance is below the threshold
      if (Math.abs(dx) > ElbowThreshold) {
        const cp1 = this.addCP(sp.x, ep.y + halfY); // ep.y + overlapPadding
        this.addCP(ep.x, cp1.y);
      }
    } else {
      const cp1 = this.addCP(sp.x, sp.y - overlapPadding);
      let cp2;
      if (sp.x < ep.x) {
        // to the left
        cp2 = this.addCP(Math.max(target.left - overlapPadding, source.right + overlapPadding), cp1.y);
      } else {
        // to the right
        cp2 = this.addCP(Math.min(target.right + overlapPadding, source.left - overlapPadding), cp1.y);
      }
      const cp3 = this.addCP(cp2.x, ep.y - overlapPadding);
      this.addCP(ep.x, cp3.y);
    }
  }

  [sketchNorthNorth](): void {
    const { source, target, sp, ep, overlapPadding, dy } = this;
    if (dy < 0 && ep.y + 2*overlapPadding < sp.y) {
      const cp1 = this.addCP(sp.x, ep.y - overlapPadding);
      this.addCP(ep.x, cp1.y);
    } else {
      const cp1 = this.addCP(sp.x, sp.y - overlapPadding);
      let cp2;
      if (sp.x < ep.x) {
        // to the left
        cp2 = this.addCP(Math.max(target.left - overlapPadding, source.right + overlapPadding), cp1.y);
      } else {
        // to the right
        cp2 = this.addCP(Math.min(target.right + overlapPadding, source.left - overlapPadding), cp1.y);
      }
      const cp3 = this.addCP(cp2.x, ep.y - overlapPadding);
      this.addCP(ep.x, cp3.y);
    }
  }
}
