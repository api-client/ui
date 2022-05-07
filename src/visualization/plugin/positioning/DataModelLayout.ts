/* eslint-disable class-methods-use-this */
import { DataModel } from "@api-client/core/build/browser.js";
import { Graph, layout } from "@api-client/graph";
import { EdgeConfig, GraphLabel, NodeConfig } from "@api-client/graph/src/layout/types";
import { LayoutWeight, PositioningResult, PositionResult, WorkspaceLayout } from "./WorkspaceLayout.js";

export class DataModelLayout extends WorkspaceLayout {
  layout(model: DataModel): PositioningResult | null {
    const { entities } = model;
    if (!entities.length) {
      return null
    }
    this.readPositions = {};
    const g = this.initGraph();

    // parents first
    entities.forEach((entity) => {
      const position = this.readDimensions(entity.key);
      if (!position) {
        return;
      }
      this.addEntityNode(g, entity.key, position);
      entity.getComputedParents().forEach(parent => {
        this.ensureAddEntity(g, parent.key);
        const config: EdgeConfig = {
          minLen: 1,
          weight: LayoutWeight.Parent,
        };
        g.setEdge(entity.key, parent.key, config);
      });
      entity.associations.forEach((item) => {
        if (item.target) {
          this.ensureAddEntity(g, item.target);
        }
      });
    });
    // once all entities are set we can add edges
    entities.forEach((entity) => {
      entity.associations.forEach((item) => {
        if (!item.target) {
          return;
        }
        const config: EdgeConfig = {
          minLen: 1,
          weight: LayoutWeight.Internal,
        };
        g.setEdge(entity.key, item.target, config);
      });
    });

    layout(g);

    const nodes: PositionResult[] = [];
    g.nodes().forEach((id) => {
      const def = g.node(id);
      if (!def) {
        return;
      }
      const result: NodeConfig = { ...def };
      result.x! -= Math.round(result.width! / 2);
      result.y! -= Math.round(result.height! / 2);
      nodes.push({
        id,
        node: result,
      });
    });
    return {
      graph: g,
      nodes,
    };
  }

  addEntityNode(graph: Graph<GraphLabel, NodeConfig, EdgeConfig>, key: string, rect: DOMRect): void {
    const { width, height } = rect;
    graph.setNode(key, {
      width,
      height,
    });
  }

  ensureAddEntity(graph: Graph<GraphLabel, NodeConfig, EdgeConfig>, entityKey: string): void {
    if (graph.node(entityKey)) {
      return;
    }
    const position = this.readDimensions(entityKey);
    if (!position) {
      return;
    }
    this.addEntityNode(graph, entityKey, position);
  }
}
