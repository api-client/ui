/* eslint-disable class-methods-use-this */
import { RectilinearLine } from './lines/RectilinearLine.js';
import { ILineSketchOptions, IVisualizationAssociationShape, IVisualizationRectilinearLineShape } from './VisualizationTypes.js';

/**
 * A class that is responsible for sketching different kind of lines.
 * It computes list of points and other properties so the visualization workspace can
 * use this definition in the SVG drawing.
 */
export class LineSketch {
  /**
   * Creates an association line for the given configuration.
   * @param config The line building options
   * @returns Computed model for the association.
   */
  sketch(config: ILineSketchOptions): IVisualizationAssociationShape | null {
    const { type } = config;
    switch (type) {
      case 'linear':
        return this.computeLine(config);
      case 'rectilinear':
        return this.computeRectilinearLine(config);
      default: return null;
    }
  }

  /**
   * Sketches a regular line.
   * @returns Computed model for the association.
   */
  computeLine(config: ILineSketchOptions): IVisualizationAssociationShape | null {
    const { startPoint, endPoint, type } = config;
    if (!startPoint.validate() || !endPoint.validate()) {
      return null;
    }
    const coordinates = [startPoint, endPoint];
    const transformOrigin = `${startPoint.x}px ${endPoint.y}px`;
    return {
      transformOrigin,
      coordinates,
      rotate: 0,
      type: type!,
      startPoint,
      endPoint,
    };
  }

  /**
   * Sketches a regular line.
   * 
   * @returns Computed model for the association.
   */
  computeRectilinearLine(config: ILineSketchOptions): IVisualizationRectilinearLineShape | null {
    const artist = new RectilinearLine(config);
    return artist.sketch();
  }
}
