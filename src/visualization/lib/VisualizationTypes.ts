// new visualization types

import { Point } from "./Point.js";
import { IWorkspaceEdge } from "./types.js";

export interface IShapeOrientation {
 /**
   * The transformation origin of the shape. It consists of `x y` coordinates 
   * expressed in pixel unit.
   * E.g. "20px 100px" meaning that all transformations applied to the shape are relative to this point.
   */
 transformOrigin: string;
 /**
  * The rotation of the object relative to the workspace.
  * It may not be set for shapes that are not rotated (like lines).
  */
 rotate?: number;
}

/**
 * A base class for a shape present in the SVG part of the visualization workspace.
 */
export interface IVisualizationShape extends IShapeOrientation {
  /**
   * For the shapes that supports this. It is a value to be added to SVG's element `points` or `d` attribute.
   */
  path?: string;
  /**
   * The list of points that describe the shape.
   * For a line this would be the start and end coordinates of the shape.
   * For a triangle these are the coordinates of each vertex of it.
   */
  coordinates?: Point[];
}

/**
 * Represents the selection state of the shape.
 */
export interface IVisualizationShapeSelection {
  /**
   * Whether the shape has the primary selection state.
   * @default false;
   */
  primary?: boolean;
  /**
   * Whether the shape has the secondary selection state.
   * Using primary and the secondary selection is discouraged.
   * @default false;
   */
  secondary?: boolean;
  /**
   * When set the shape should be hidden.
   */
  hidden?: boolean;
  /**
   * Whether the item is currently hovered.
   */
  hover?: boolean;
}

export interface ISelectableShape {
  /**
   * The selection state of the shape.
   */
  selection?: IVisualizationShapeSelection;
}

export type AssociationShapeType = 'linear' | 'rectilinear';

/**
 * A base class for association related shapes
 */
export interface IVisualizationAssociationShape extends IVisualizationShape {
  /**
   * The type of the line. This is defined in `lib/LineSketch`.
   */
  type: AssociationShapeType;
  startPoint: Point;
  endPoint: Point;
}

/**
 * Association description for rectilinear style line.
 */
export interface IVisualizationRectilinearLineShape extends IVisualizationAssociationShape {
  /**
   * The list of points where the line breaks.
   */
  controlPoints: Point[];
}

/**
 * Cubic Bezier curve control points.
 */
export interface ICubicControlPoints {
  /**
   * Coordinates of the first control point
   */
  cp1: Point;
  /**
   * Coordinates of the second control point
   */
  cp2: Point;
}

/**
 * The definition of an SVG shape that represents an association (edge) line between 
 * two other shapes.
 */
export interface IAssociationShape extends ISelectableShape {
  /**
   * Name of a CSS class to add to the line class attribute
   */
  style?: string;
  /**
   * The association label. May not be set when the association object does not have a label.
   */
  label?: IAssociationLabelShape;
  /**
   * The definition of the line start and end tips.
   */
  tips?: ILineTips;
  /**
   * Name of the slots to use when calculating the association line's start and end points.
   */
  slots?: IAssociationSlots;
  /**
   * The line definition for the shape.
   */
  line: IVisualizationAssociationShape;
}

export interface IAssociationLabelShape extends IShapeOrientation {
  /**
   * The x coordinate of the label
   */
  x: number;
  /**
   * The y coordinate of the label
   */
  y: number;
  /**
   * The label's text value
   */
  value: string;
  /**
   * The value to set on the `text-anchor` attribute of the `<text>`'s element.
   */
  anchor?: string;
}

export interface IAssociationTip extends IVisualizationShape {
  /**
   * Name of a CSS class to add to the tip's class attribute
   */
  style?: string;
  /**
   * The name of the SVG element to use to visualize the tip. 
   * @default polygon
   */
  svg?: string;
}

/**
 * Dictionary for a line tips.
 */
export interface ILineTips {
  /**
   * The tip placed where the line starts.
   */
  start?: IAssociationTip;
  /**
   * The tip placed where the line ends.
   */
  end?: IAssociationTip;
}

/**
 * Definition of slots used by an association
 */
export interface IAssociationSlots {
  /**
   * The name of the slot in the source object
   */
  source?: string;
  /**
   * The name of the slot in the target object
   */
  target?: string;
}

export interface IAssociationVertexes {
  /**
   * The line's start position
   */
  start?: Point;
  /**
   * The line's end position
   */
  end?: Point;
}

/**
 * A definition used by the `lib/LineSketch` class sketch a line
 */
export interface ILineSketchOptions {
  /**
   * The computation of `DOMRect` for the source element.
   */
  source: DOMRect;
  /**
   * The computation of `DOMRect` for the target element.
   */
  target: DOMRect;
  /**
   * The position where the line starts
   */
  startPoint: Point;
  /**
   * The position where the line ends
   */
  endPoint: Point;
  /**
   * The type of the line to draw. Depending on the type the result of the computation can be different.
   * Uses the default when missing
   */
  type?: AssociationShapeType;
  /**
   * Other associations already built between the two objects.
   */
  others?: IWorkspaceEdge[];
}
