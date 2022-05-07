import { Point } from '../Point.js';
import { IEdgeDirections } from '../types.js';
import { IAssociationTip, IVisualizationRectilinearLineShape } from '../VisualizationTypes.js';
import { TipArtist } from './TipArtist.js';

export class RectilinearTip extends TipArtist {
  line: IVisualizationRectilinearLineShape;
  
  constructor(position: 'start' | 'end', line: IVisualizationRectilinearLineShape, directions: IEdgeDirections) {
    super(position, line, directions);
    this.line = line;
  }

  /**
   * Draws an tip representing a parent.
   */
  parent(): IAssociationTip {
    const { line, directions, position } = this;
    const coordinates = line.coordinates!;
    const startPoint = position === 'start' ? coordinates[0] : coordinates[coordinates.length - 1];
    const { x, y } = startPoint;
    const tv = new Point(0, 0);
    const lv = new Point(0, 0);
    const rv = new Point(0, 0);
    tv.x = x;
    tv.y = y;
    lv.x = x - 8;
    lv.y = y + 16;
    rv.x = x + 8;
    rv.y = y + 16;
    const vertexes = [tv, lv, rv];
    const path = vertexes.map((item) => `${item.x},${item.y}`).join(' ');
    let rotate;
    switch (directions.end) {
      case 'east': rotate = 90; break;
      case 'west': rotate = 270; break;
      case 'south': rotate = 0; break;
      default: rotate = 180; break;
    }
    return {
      path,
      coordinates: vertexes,
      transformOrigin: `${x}px ${y}px`,
      rotate,
      svg: 'polygon',
      style: 'parent',
    };
  }

  /**
   * Draws an tip representing a direction to / from the point.
   * @returns {IAssociationTip}
   */
  direction(): IAssociationTip {
    const { line, directions, position } = this;
    const coordinates = line.coordinates!;
    const startPoint = position === 'start' ? coordinates[0] : coordinates[coordinates.length - 1];
    const { x, y } = startPoint;
    const tv = new Point(0, 0);
    const lv = new Point(0, 0);
    const rv = new Point(0, 0);
    tv.x = x;
    tv.y = y;
    lv.x = x - 8;
    lv.y = y - 16;
    rv.x = x + 8;
    rv.y = y - 16;
    const vertexes = [tv, lv, rv];
    const path = vertexes.map((item) => `${item.x},${item.y}`).join(' ');
    let rotate;
    const origin = position === 'start' ? directions.start : directions.end;
    switch (origin) {
      case 'east': rotate = position === 'start' ? 90 : 270; break;
      case 'west': rotate = position === 'start' ? 270 : 90; break;
      case 'south': rotate = 180; break;
      default: rotate = 0; break;
    }
    return {
      path,
      coordinates: vertexes,
      transformOrigin: `${x}px ${y}px`,
      rotate,
      svg: 'polygon',
      style: 'direction',
    };
  }

  /**
   * Draws an tip representing an association.
   * @param type The type of the association to draw.
   */
  association(type='default'): IAssociationTip {
    switch (type) {
      case 'default': return this.defaultAssociation();
      default: throw new Error(`Unsupported association type.`);
    }
  }

  /**
   * Draws an tip representing an association with a default style.
   */
  defaultAssociation(): IAssociationTip {
    const { line, directions, position } = this;
    const coordinates = line.coordinates!;
    const startPoint = position === 'start' ? coordinates[0] : coordinates[coordinates.length - 1];
    const { x, y } = startPoint;
    const tv = new Point(x - 8, y);
    const lv = new Point(x, y - 16);
    const rv = new Point(x + 8, y);
    const vertexes = [tv, lv, rv];
    const path = vertexes.map((item) => `${item.x} ${item.y}`).join(', ');
    let rotate;
    const origin = position === 'start' ? directions.start : directions.end;
    switch (origin) {
      case 'east': rotate = position === 'start' ? 90 : 270; break;
      case 'west': rotate = position === 'start' ? 270 : 90; break;
      case 'south': rotate = 180; break;
      default: rotate = 0; break;
    }
    return {
      path,
      coordinates: vertexes,
      transformOrigin: `${x}px ${y}px`,
      rotate,
      svg: 'polyline',
      style: 'association',
    };
  }
}
