/* eslint-disable class-methods-use-this */
import { RectilinearTip } from './tips/RectilinearTip.js';
import { TipArtist } from './tips/TipArtist.js';
import { IEdgeDirections } from './types.js';
import { IAssociationTip, IVisualizationAssociationShape, IVisualizationRectilinearLineShape } from './VisualizationTypes.js';

/**
 * A class that is responsible for sketching different kind of line tips.
 */
export class TipSketch {
  /**
   * Builds a tip at the **end** of the line (at the target position).
   * 
   * @param type The type of the tip to construct.
   * @param line The definition of the line that the tip is attached to
   * @param directions Computed line directions
   * @returns The definition of a tip pointing at the parent (the other end)
   */
  endMarker(type: string | 'parent' | 'parameterIn' | 'parameterOut' | 'association', line: IVisualizationAssociationShape, directions: IEdgeDirections): IAssociationTip {
    let artist: TipArtist;
    if (line.type === 'rectilinear') {
      artist = new RectilinearTip('end', line as IVisualizationRectilinearLineShape, directions);
    } else {
      throw new Error(`Unknown tip type: ${line.type}`);
    }
    let shape: IAssociationTip;
    switch (type) {
      case 'parent': shape = artist.parent(); break;
      case 'direction': shape = artist.direction(); break;
      case 'association': shape = artist.association(); break;
      default: throw new Error(`Unsupported association shape: ${type}.`);
    }
    if (!shape) {
      throw new Error(`Unable to create a tip shape.`);
    }
    return shape;
  }

  /**
   * Builds a tip at the **start** of the line (at the source position).
   * 
   * @param type The type of the tip to construct.
   * @param line The definition of the line that the tip is attached to
   * @param directions Computed line directions
   * @returns The definition of a tip pointing at the parent (the other end)
   */
  startMarker(type: string | 'parent' | 'parameterIn' | 'parameterOut', line: IVisualizationAssociationShape, directions: IEdgeDirections): IAssociationTip {
    let artist: TipArtist;
    if (line.type === 'rectilinear') {
      artist = new RectilinearTip('start', line as IVisualizationRectilinearLineShape, directions);
    } else {
      throw new Error(`Unknown tip type: ${line.type}`);
    }
    let shape: IAssociationTip;
    switch (type) {
      case 'parent': shape = artist.parent(); break;
      case 'direction': shape = artist.direction(); break;
      case 'association': shape = artist.association(); break;
      default: throw new Error(`Unsupported association shape: ${type}.`);
    }
    if (!shape) {
      throw new Error(`Unable to create a tip shape.`);
    }
    return shape;
  }
}
