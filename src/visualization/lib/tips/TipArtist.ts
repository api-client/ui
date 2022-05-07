/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable class-methods-use-this */
/* eslint-disable no-unused-vars */

import { IEdgeDirections } from "../types.js";
import { IAssociationTip, IVisualizationAssociationShape } from "../VisualizationTypes.js";

export class TipArtist {
  constructor(public position: 'start' | 'end', public line: IVisualizationAssociationShape, public directions: IEdgeDirections) {
  }

  /**
   * Draws an tip representing a parent.
   */
  parent(): IAssociationTip {
    throw new Error('Not implemented');
  }

  /**
   * Draws an tip representing a direction to / from the point.
   */
  direction(): IAssociationTip {
    throw new Error('Not implemented');
  }

  /**
   * Draws an tip representing an association.
   * @param type The type of the association to draw.
   */
  association(type: string = 'default'): IAssociationTip {
    throw new Error('Not implemented');
  }
}
