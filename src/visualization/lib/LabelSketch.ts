/* eslint-disable class-methods-use-this */
import { IEdgeDirections } from './types.js';
import { IAssociationLabelShape, IVisualizationAssociationShape, IVisualizationRectilinearLineShape } from './VisualizationTypes.js';

/**
 * A class that specializes in sketching a label (association label) on the workspace.
 */
export class LabelSketch {
  /**
   * Computes sketch of the label.
   */
  sketch(lineShape: IVisualizationAssociationShape, value: string, directions: IEdgeDirections): IAssociationLabelShape | null {
    switch (lineShape.type) {
      case 'rectilinear': return this.sketchRectilinear(lineShape as IVisualizationRectilinearLineShape, value, directions);
      default: return null;
    }
  }

  /**
   * Computes sketch of the label on a rectilinear shape.
   */
  sketchRectilinear(lineShape: IVisualizationRectilinearLineShape, value: string, directions: IEdgeDirections): IAssociationLabelShape | null {
    const [position] = lineShape.coordinates!;
    const point = position.copy();
    const transformOrigin = `${position.x}px ${position.y}px`;
    const { start } = directions;
    let anchor = 'start';
    if (start === 'south') {
      point.x += 8;
      point.y += 20;
    } else if (start === 'east') {
      point.x += 8;
      point.y -= 8;
    } else if (start === 'north') {
      point.x += 8;
      point.y -= 24;
    } else {
      point.x -= 8;
      point.y -= 8;
      anchor = 'end';
    }

    return {
      x: point.x,
      y: point.y,
      value,
      transformOrigin,
      rotate: 0,
      anchor,
    };
  }
}
