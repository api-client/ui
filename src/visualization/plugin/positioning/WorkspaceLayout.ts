/* eslint-disable class-methods-use-this */
/* eslint-disable no-plusplus */
/* eslint-disable no-continue */
/* eslint-disable no-param-reassign */

import { Graph, NodeIdentifier } from '@api-client/graph';
import { EdgeConfig, NodeConfig, GraphLabel, RankDirOptions, AlignOptions, RankerOptions, AcyclicerOptions } from '@api-client/graph/src/layout/types';
import VizWorkspaceElement from '../../elements/VizWorkspaceElement.js';
import { getObjectBoundingClientRect } from '../../lib/PositionUtils.js';

export interface PositionedEdge {
  /**
   * The width of the label
   */
  width?: number;
  /**
   * The height of the label
   */
  height?: number;
  /**
   * The Id of the originating node
   */
  id: string;
  /**
   * The id of the target node
   */
  target: string;
  /**
   * Edge's weight, if possible to determine
   */
  weight?: number;
}

export interface PositionResult {
  id: NodeIdentifier;
  node: NodeConfig;
}

export interface PositioningResult {
  graph: Graph<GraphLabel, NodeConfig, EdgeConfig>;
  nodes: PositionResult[];
}

// 01 - external association
// 10 - association (internal)
// 20 - parent association
// 40 - self association
export enum LayoutWeight {
  External = 1,
  Internal = 10,
  Parent = 40,
  Self = 80,
};

/**
 * A helper library that computes positioning of a data model
 * in the visualization workspace.
 */
export class WorkspaceLayout {
  readPositions: Record<string, DOMRect> = {};

  /**
   * Direction for rank nodes. Can be TB, BT, LR, or RL, where T = top, B = bottom, L = left, and R = right.
   */
  rankDir?: RankDirOptions;

  /**
   * Alignment for rank nodes. Can be UL, UR, DL, or DR, where U = up, D = down, L = left, and R = right.
   */
  align?: AlignOptions;

  /**
   * Type of algorithm to assign a rank to each node in the input graph.
   */
  ranker?: RankerOptions;

  /**
   * If set to greedy, uses a greedy heuristic for finding a feedback arc set for a graph. A feedback arc set is a set of edges that can be removed to make a graph acyclic.
   */
  acyclicer?: AcyclicerOptions;

  /**
   * Number of pixels that separate edges horizontally in the layout.
   */
  edgeSeparation: number = 20;

  /**
   * Number of pixels between each rank in the layout.
   */
  rankSeparation: number = 60; // 80

  /**
   * Number of pixels that separate nodes horizontally in the layout.
   */
  nodeSeparation: number = 60; // 80

  /**
   * Graph margin LR
   */
  marginX: number = 40;

  /**
   * Graph margin TB
   */
  marginY: number = 40;

  constructor(public workspace: VizWorkspaceElement) {}

  /**
   * Reads workspace object dimensions
   * @param {string} id Domain id of the object
   * @returns {DOMRect}
   */
  readDimensions(id: string): DOMRect | undefined {
    if (this.readPositions[id]) {
      return this.readPositions[id];
    }
    const element = this.workspace.querySelector(`[data-key="${id}"]`);
    if (!element) {
      return undefined;
    }
    const rect = getObjectBoundingClientRect(element, this.workspace);
    this.readPositions[id] = rect;
    return rect;
  }

  initGraph(): Graph<GraphLabel, NodeConfig, EdgeConfig> {
    const g = new Graph<GraphLabel, NodeConfig, EdgeConfig>();
    const { rankDir, align, ranker, acyclicer, edgeSeparation, rankSeparation, nodeSeparation, marginX, marginY } = this;
    g.setGraph({
      edgeSeparation,
      rankSeparation,
      nodeSeparation,
      rankDir,
      align,
      ranker,
      acyclicer,
      marginX,
      marginY,
    });
    // eslint-disable-next-line arrow-body-style
    // g.setDefaultEdgeLabel(() => { return {}; });
    return g;
  }
}
