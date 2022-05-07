import { xPositionOrCoord } from "./types.js";

/**
 * An object representing a point in a 2-d space (Euclidean space)
 */
export class Point {
  x: number;

  y: number;

  /**
   * @param x The x coordinate or the array with x and y position values
   * @param y Optional when the `x` is an array. The y position of the point
   */
  constructor(x: xPositionOrCoord, y?: number) {
    let xValue;
    let yValue;
    if (Array.isArray(x)) {
      [xValue, yValue] = x;
    } else {
      xValue = x;
      yValue = y;
    }
    this.x = xValue;
    this.y = yValue!;
  }

  /**
   * Copies the current point as new object
   * @return A copy of the object
   */
  copy(): Point {
    return new Point(this.x, this.y);
  }

  /**
   * Validates the point value.
   * @return True if the point has valid values.
   */
  validate(): boolean {
    const { x, y } = this;
    return !Number.isNaN(x) && !Number.isNaN(y);
  }

  /**
   * Adds another point to this point and returns a new point.
   * @param v Point or a number to add.
   * @returns Created new point
   */
  add(v: Point | number): Point {
    if (v instanceof Point) {
      return new Point(this.x + v.x, this.y + v.y);
    }
    return new Point(this.x + v, this.y + v);
  }

  /**
   * Subtracts another point from this point and returns a new point.
   * @param v Point or a number to add.
   * @returns Created new point
   */
  subtract(v: Point | number): Point {
    if (v instanceof Point) {
      return new Point(this.x - v.x, this.y - v.y);
    }
    return new Point(this.x - v, this.y - v);
  }

  /**
   * Multiplies this point by another point or a number and returns a new point.
   * @param v Point or a number to add.
   * @returns Created new point
   */
  multiply(v: Point | number): Point {
    if (v instanceof Point) {
      return new Point(this.x * v.x, this.y * v.y);
    }
    return new Point(this.x * v, this.y * v);
  }

  /**
   * Divides this point by another point or a number and returns a new point.
   * @param v Point or a number to add.
   * @returns Created new point
   */
  divide(v: Point | number): Point {
    if (v instanceof Point) {
      return new Point(this.x / v.x, this.y / v.y)
    };
    return new Point(this.x / v, this.y / v);
  }

  /**
   * Subtracts another point to this point and returns a new point.
   * @param v Point or a number to add.
   * @returns True when points are equal
   */
  equals(v: Point): boolean {
    return this.x === v.x && this.y === v.y;
  }

  /**
   * Computes an angle to another point in radians.
   * @param v Point or a number to add.
   * @returns True when points are equal
   */
  angle(v: Point): number {
    return Math.atan2(v.y - this.y, v.x - this.x);
  }

  /**
  * Computes an angle to another point in degrees.
  * @param v Point or a number to add.
  * @returns True when points are equal
  */
  degrees(v: Point): number {
    return this.angle(v) * 180 / Math.PI;
  }

  /**
   * Computes the distance to the other point.
   */
  distance(other: Point): number {
    return Math.sqrt(
      (this.x - other.x) ** 2 + (this.y - other.y) ** 2
    );
  }

  /**
   * Computes the distance between two points.
   */
  static distance(p1: Point, p2: Point): number {
    return p1.distance(p2);
  }
}
