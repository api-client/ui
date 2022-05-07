import { svg, SVGTemplateResult } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { IEdgeDirections, IWorkspaceEdge } from './types.js';
import { IAssociationLabelShape, AssociationShapeType, IAssociationTip, IVisualizationRectilinearLineShape } from './VisualizationTypes.js';
import { Point } from './Point.js';

/**
 * A class that builds templates for lines, tips, and labels.
 */
export class ShapeArtist {
  /**
   * @param info The definition of the line to visualize
   * @param debug Whether debugging is enabled.
   * @return The template for an association line
   */
  static line(info: IWorkspaceEdge, debug: boolean = false): SVGTemplateResult | string {
    const { line } = info.shape;
    switch (line.type) {
      case 'rectilinear': return ShapeArtist.rectilinearLine(info, debug);
      default: return '';
    }
  }

  /**
   * @param info The line to visualize
   * @param debug Whether debugging is enabled.
   * @returns The template for an association line
   */
  static rectilinearLine(info: IWorkspaceEdge, debug: boolean): SVGTemplateResult {
    const { id, shape, directions, positionChange } = info;
    const { line, label, tips, selection = {}, style, } = shape;
    const { transformOrigin, coordinates, path, controlPoints, type } = line as IVisualizationRectilinearLineShape;
    const groupStyle = {
      transformOrigin,
    };
    const groupClass: Record<string, boolean> = {
      selected: !!selection.primary,
      selectedSecondary: !!selection.secondary,
      hovered: !!selection.hover,
      hidden: !!selection.hidden,
      'association-group': true,
    };
    if (style) {
      groupClass[style] = true;
    }
    const [startPoint] = coordinates!;
    const endPoint = coordinates![coordinates!.length - 1];
    return svg`
    <g 
      data-id="${id}" 
      data-type="association" 
      class="${classMap(groupClass)}"
      style="${styleMap(groupStyle)}"
    >
      <circle cx="${startPoint.x}" cy="${startPoint.y}" r="4" class="edge-vertex"/>
      <circle cx="${endPoint.x}" cy="${endPoint.y}" r="4" class="edge-vertex"/>
      <polyline 
        points="${path}"
        class="association-line-area"
        data-type="association"
        data-id="${id}"
      />
      <polyline 
        points="${path}"
        class="association-line"
        data-type="association"
        data-id="${id}"
      />
      ${tips && tips.start ? ShapeArtist.edgeTipTemplate(tips.start) : ''}
      ${tips && tips.end ? ShapeArtist.edgeTipTemplate(tips.end) : ''}
      ${selection.primary && positionChange ? ShapeArtist.associationDraggable(id, startPoint, endPoint, directions) : ''}
      ${debug ? ShapeArtist.controlPointsDebugTemplate(type, startPoint, endPoint, controlPoints) : ''}
      ${ShapeArtist.edgeLabelTemplate(label!, id)}
    </g>`;
  }

  /**
   * @param tip The parent line to visualize
   * @returns The template for the parent line tip
   */
  static edgeTipTemplate(tip: IAssociationTip): SVGTemplateResult {
    const { rotate, path, style, transformOrigin, svg: elementType } = tip;
    const transform = `rotate(${rotate}deg)`;
    const styles = {
      transform,
      transformOrigin,
    };
    if (elementType === 'polyline') {
      return svg`
      <polyline
        points="${path}"
        class="edge-tip ${style}"
        style="${styleMap(styles)}"
      />
      `;
    }
    return svg`
      <polygon
        points="${path}"
        class="edge-tip ${style}"
        style="${styleMap(styles)}"
      />
    `;
  }

  /**
   * @param id The key of the association.
   * @returns The template for the association drag handlers on the tips.
   */
  static associationDraggable(id: string, start: Point, end: Point, directions: IEdgeDirections): SVGTemplateResult {
    const size = 12;
    const half = size / 2;
    const padding = 4;
    let sx = start.x;
    let sy = start.y;
    let ex = end.x;
    let ey = end.y;
    if (directions.start === 'west') {
      sx -= (size + padding);
      sy -= half;
    } else if (directions.start === 'north') {
      sx -= half;
      sy -= (size + padding);
    } else if (directions.start === 'east') {
      sx += padding;
      sy -= half;
    } else {
      sx -= half;
      sy += padding;
    }
    if (directions.end === 'west') {
      ex += padding;
      ey -= half;
    } else if (directions.end === 'north') {
      ex -= half;
      ey -= (size + padding);
    } else if (directions.end === 'east') {
      ex -= (size + padding);
      ey -= half;
    } else {
      ex -= half;
      ey += padding;
    }
    return svg`
    <rect x="${sx}" y="${sy}" width="${size}" height="${size}" rx="3" data-key="${id}" data-dir="start" class="association-draggable"/>
    <rect x="${ex}" y="${ey}" width="${size}" height="${size}" rx="3" data-key="${id}" data-dir="end" class="association-draggable"/>
    `;
  }

  /**
   * @param parentId The association key
   * @returns The template for a text label for an association
   */
  static edgeLabelTemplate(label: IAssociationLabelShape, parentId: string): SVGTemplateResult | string {
    if (!label || !label.value) {
      return '';
    }
    const { value, transformOrigin, rotate, x, y, anchor } = label;
    const transform = `rotate(${rotate}deg)`;
    const textStyles = {
      transform,
      transformOrigin,
    };
    return svg`
    <text
      x="${x}"
      y="${y}"
      data-id="${parentId}"
      style="${styleMap(textStyles)}"
      class="association-label"
      text-anchor=${ifDefined(anchor)}
    >${value}</text>
    `;
  }

  /**
   * Draws a debug control points positions for the given line type.
   * @param start The start of the line 
   * @param end The end of the line 
   * @param cp Control points on the line
   */
  static controlPointsDebugTemplate(type: AssociationShapeType, start: Point, end: Point, cp: Point[]): SVGTemplateResult | string {
    switch (type) {
      case 'rectilinear': return ShapeArtist.rectilinearPathDebugTemplate(start, end, cp);
      default: return '';
    }
  }

  static rectilinearPathDebugTemplate(start: Point, end: Point, controlPoints: Point[]): SVGTemplateResult | string {
    if (!controlPoints || !controlPoints.length) {
      return '';
    }
    const [firstCp] = controlPoints;
    const lastCp = controlPoints[controlPoints.length - 1];
    return svg`
    ${controlPoints.map((cp, i) => svg`<circle cx="${cp.x}" cy="${cp.y}" r="4" fill="red" title="CP ${i}"/>`)}
    <line x1="${firstCp.x}" y1="${firstCp.y}" x2="${start.x}" y2="${start.y}" style="stroke:red;stroke-width:2;stroke-dasharray: 6;" />
    <line x1="${lastCp.x}" y1="${lastCp.y}" x2="${end.x}" y2="${end.y}" style="stroke:red;stroke-width:2;stroke-dasharray: 6;" />

    <circle cx="${start.x}" cy="${start.y}" r="4" fill="yellow"/>
    <circle cx="${end.x}" cy="${end.y}" r="4" fill="yellow"/>
    `;
  }
}
