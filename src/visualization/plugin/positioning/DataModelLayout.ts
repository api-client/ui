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

    const selfEntities = entities.map(i => i.key);
    const addedEntities: string[] = [];

    // parents first
    entities.forEach((entity) => {
      if (!this.ensureAddEntity(g, entity.key)) {
        return;
      }
      addedEntities.push(entity.key);
      entity.parents.forEach((id) => {
        if (selfEntities.includes(id) || addedEntities.includes(id) || g.node(id)) {
          return;
        }
        this.ensureAddEntity(g, id);
        const config: EdgeConfig = {
          minLen: 1,
          weight: LayoutWeight.Parent,
        };
        g.setEdge(entity.key, id, config);
      });
      entity.associations.forEach((item) => {
        if (item.target) {
          this.ensureAddEntity(g, item.target);
          addedEntities.push(item.target);
        }
      });
    });
    // once all entities are set we can add edges
    entities.forEach((entity) => {
      entity.associations.forEach((item) => {
        if (!item.target) {
          return;
        }
        const isSelf = (item.getTarget() === entity)
        const config: EdgeConfig = {
          minLen: 2,
          weight: isSelf ? LayoutWeight.Self : LayoutWeight.Internal,
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

  ensureAddEntity(graph: Graph<GraphLabel, NodeConfig, EdgeConfig>, entityKey: string): boolean {
    if (graph.node(entityKey)) {
      return false;
    }
    const position = this.readDimensions(entityKey);
    if (!position) {
      return false;
    }
    this.addEntityNode(graph, entityKey, position);
    return true;
  }
}
