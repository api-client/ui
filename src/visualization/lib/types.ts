import { IAssociationShape } from './VisualizationTypes.js';
import { Point } from './Point.js';

export type xPositionOrCoord = number | number[];
export type GeoDirection = 'south' | 'west' | 'north' | 'east';

/**
 * A workspace element edge definition.
 * This model is being visualized in the view.
 */
export interface IWorkspaceEdge {
  /**
   * An unique id of the association.
   * Usually it is the domain id of the domain object, but it may be any value.
   */
  id: string;
  /**
   * The domain id of the association's source 
   */
  source: string;
  /**
   * The domain id of the association's source 
   */
  target: string;
  /**
   * When true then the user is allowed to change the potion of the association in the source and the target.
   */
  positionChange: boolean;
  /**
   * The directions of the end of the association line.
   */
  directions: IEdgeDirections;
  /**
   * The computed shape of the association.
   */
  shape: IAssociationShape;
}

export interface IEdgeDirections {
  /**
   * The direction the edge is pointing to when attached to the target of an association.
   */
  start: GeoDirection;
  /**
   * The direction the edge is pointing at the beginning of the association.
   */
  end: GeoDirection;
}

/**
 * An interface describing a structure of a selected domain object in the workspace.
 * This is used when reading value of `selection.selected` of the workspace element.
 */
export interface ISelectedDomain {
  /**
   * The domain id of the selected object.
   */
  id: string;
  /**
   * The HTML element name of the selected object.
   */
  name: string;
  /**
   * A reference to the selected node.
   */
  node: Element;
}

/**
 * A definition used by the `WorkspaceEdges` class to compute the visualization line representing an association.
 */
export interface ICalculateEdgeOptions {
  /**
   * The visualization object that is the source of the association.
   */
  sourceElement: HTMLElement;
  /**
   * The visualization object that is the target of the association.
   */
  targetElement: HTMLElement;
  /**
   * The association domain id. Can be a random string not really being a domain id (parent visualization, for example)
   */
  id: string;
  /**
   * The name of the association (rendered label)
   */
  name?: string;
  /**
   * If supported by the source object, the name of the slot to use to start the line.
   */
  sourceSlot?: string;
  /**
   * If supported by the target object, the name of the slot to use to end the line at.
   */
  targetSlot?: string;
  /**
   * Other associations already built between the two objects.
   */
  others?: IWorkspaceEdge[];
}

export interface IWorkspaceRenderingOptions {
  /**
   * The domain if of the currently rendered object
   */
  id: string;
  /**
   * The type of the currently rendered object. This is helpful for APIs where different views are possible.
   */
  type?: any;
  /**
   * Whether to render Anypoint compatibility view.
   */
  anypoint?: boolean;
}


export interface IAnchorAssociationCreateEventDetail {
  source: {
    /**
     * The domain id of the association source
     */
    id: string;
    /**
     * The workspace coordinates of the staring point
     */
    point: Point;
    /**
     * The slot name of the source object
     */
    slot: string;
  }

  target: {
    /**
     * The domain id of the association target
     */
    id: string;
    /**
     * The workspace coordinates of the end point
     */
    point: Point;
    /**
     * The slot name of the target object
     */
    slot: string;
  }
}

export interface IAnchorAssociationUpdateEventDetail {
  source: {
    /**
     * The domain id of the association
     */
    associationId: string;
    /** 
     * The direction where the association changed (at the end changing the target or at the beginning changing the source)
     */
    direction: 'start' | 'end';
  }

  target: {
    /**
     * The domain id of the new target/source (depending on the source.direction)
     */
    id: string;
    /**
     * The workspace coordinates of the start/end point (depending on the source.direction)
     */
    point: Point;
    /**
     * The slot name to use
     */
    slot: string;
  }
}
