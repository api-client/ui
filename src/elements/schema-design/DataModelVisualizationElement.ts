import { DataAssociation, DataEntity, DataModel, DataNamespace, DataProperty } from "@api-client/core/build/browser.js";
import { html, PropertyValueMap, TemplateResult, nothing, CSSResult, css } from "lit";
import { property, query, state } from "lit/decorators.js";
import { styleMap } from "lit/directives/style-map.js";
import { classMap } from "lit/directives/class-map.js";
import { ifDefined } from "lit/directives/if-defined.js";
import ApiElement from "../ApiElement.js";
import VizWorkspaceElement from "../../visualization/elements/VizWorkspaceElement.js";
import { DataModelLayout } from "../../visualization/plugin/positioning/DataModelLayout.js";
import '../../define/viz-workspace.js';
import '../../define/viz-association.js';
import '../../define/api-icon.js';

interface VizModel {
  entity: DataEntity;
  type: 'parent' | 'association' | 'internal' | 'external' | 'self';
  x?: number;
  y?: number;
}

export default class DataModelVisualizationElement extends ApiElement {
  static get styles(): CSSResult[] {
    return [
      css`
      :host {
        display: block;
      }

      viz-workspace {
        flex: 1;
        height: 100%;
      }

      [data-selectable][data-selected] {
        border: 2px var(--selection-color) solid;
      }

      [data-selectable][data-secondary-selected] {
        border: 2px var(--secondary-selection-color) solid;
      }

      .data-entity {
        border: 2px #9e9e9e solid;
        border-radius: 8px;
        background-color: #fff;
        min-width: 240px;
      }

      .title {
        display: flex;
        align-items: center;
        margin: 12px 20px;
      }

      .title .label {
        padding: 0;
        margin: 0;
        font-weight: 300;
        font-size: 1.25rem;
        margin-left: 8px;
      }

      .properties {
        margin: 20px 0;
        padding: 0;
        list-style: none;
      }

      .property {
        padding: 0 20px;
        height: 36px;
        display: flex;
        align-items: center;
      }

      .property.primary,
      .property.index {
        font-weight: 500;
      }

      .data-type {
        margin-left: auto;
      }
      `,
    ];
  }

  /**
   * The key of the entity to edit.
   */
  @property({ type: String, reflect: true }) key?: string;

  /**
   * The read data namespace.
   */
  @property({ type: Object }) root?: DataNamespace;

  /**
   * The computed entity when the key or root change.
   */
  @state() protected _model?: DataModel;

  @state() protected _data?: VizModel[];

  @query('viz-workspace') protected _workspace?: VizWorkspaceElement;

  protected willUpdate(cp: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
    if (cp.has('key')) {
      this._computeModel();
    }
  }

  /**
   * Reloads the generated view model, runs the auto layout, and updated the view.
   * Note, this is very expensive operation. It updates the view at least twice.
   * THe layout computation can be very complex.
   */
  async refresh(): Promise<void> {
    this._createVizData();
    await this.updateComplete;
    await this._runLayout();
  }

  /**
   * Computes the view value for the property.
   * This should be called before the update is complete so this won't trigger another update.
   */
  protected _computeModel(): void {
    const { root, key } = this;
    if (!root || !key) {
      this._model = undefined;
      return;
    }
    this._model = root.definitions.models.find(i => i.key === key);
    this.refresh();
  }

  protected async _runLayout(): Promise<void> {
    const { _workspace: workspace, _model: dm, _data: list } = this;
    if (!workspace || !dm || !list) {
      return;
    }
    const layout = new DataModelLayout(workspace);
    layout.nodeSeparation = 80;
    layout.rankSeparation = 80;

    const result = layout.layout(dm);
    if (!result) {
      return;
    }
    result.nodes.forEach((info) => {
      const item = list.find(i => i.entity.key === info.id);
      if (!item) {
        return;
      }
      item.x = info.node.x;
      item.y = info.node.y;
    });
    this.requestUpdate();
    await this.updateComplete;
    workspace.edges.recalculate();
  }

  protected _createVizData(): void {
    const { _model: dm, root } = this;
    if (!dm || !root) {
      this._data = undefined;
      return;
    }
    const result: VizModel[] = [];

    dm.entities.forEach((entity) => {
      result.push({ entity, type: 'internal' });

      entity.parents.forEach(id => {
        if (result.some(i => i.entity.key === id) || dm.entities.some(i => i.key === id)) {
          // don't add a parent that is already added.
          return;
        }
        const parent = root.definitions.entities.find(i => i.key === id);
        if (parent) {
          result.push({ entity: parent, type: 'parent' });
        }
      });

      entity.associations.forEach((assoc) => {
        if (!assoc.target) {
          // ignore associations without a target
          return;
        }
        if (result.some(i => i.entity.key === assoc.target) || dm.entities.some(i => i.key === assoc.target)) {
          return;
        }
        const target = assoc.getTarget();
        if (target) {
          const isSelf = entity === target;
          result.push({ 
            entity: target, 
            type: isSelf ? 'self' : 'association',
          });
        }
      });
    });

    this._data = result;
  }

  protected render(): TemplateResult {
    return html`
    <viz-workspace>${this._modelContents()}</viz-workspace>
    `;
  }

  protected _modelContents(): TemplateResult[] | typeof nothing {
    const { _data: list } = this;
    if (!list || !list.length) {
      return nothing;
    }
    return list.map(e => this._entityVisualization(e));
  }

  protected _entityVisualization(model: VizModel): TemplateResult {
    const { entity, x = 0, y = 0, type } = model;
    const { info, key, associations, parents } = entity;
    const styles = {
      transform: `translate(${x}px, ${y}px)`,
    };
    return html`
    <div class="data-entity" data-key="${key}" data-type="${type}" data-selectable="true" style="${styleMap(styles)}">
      <div class="content">
        <div class="title">
          <api-icon icon="schemaEntity"></api-icon>
          <p class="label">${info.renderLabel}</p>
        </div>
        ${this._propertiesListTemplate(entity)}
      </div>
      ${associations.map(assoc => this._associationTemplate(assoc))}
      ${parents.map(id => this._parentAssociationTemplate(id))}
    </div>
    `;
  }

  protected _propertiesListTemplate(entity: DataEntity): TemplateResult {
    const { properties } = entity;
    return html`
    <ul class="properties">
      ${properties.map(p => this._propertyItemTemplate(p))}
    </ul>
    `;
  }

  protected _propertyItemTemplate(item: DataProperty): TemplateResult {
    const { key, info, type, deprecated = false, primary = false, index = false } = item;
    const classes = {
      property: true,
      deprecated,
      primary,
      index,
    };
    return html`
    <li data-key="${key}" class="${classMap(classes)}">
      <span class="label">${info.renderLabel}</span>
      <span class="data-type">${type}</span>
    </li>
    `;
  }

  protected _associationTemplate(item: DataAssociation): TemplateResult {
    const { key, info, target } = item;
    return html`<viz-association 
      data-key="${key}" 
      data-target="${ifDefined(target)}"
      title="${info.renderLabel}"
      data-selectable
      data-marker-start="association"
    ></viz-association>`;
  }

  protected _parentAssociationTemplate(id: string): TemplateResult {
    return html`<viz-association 
      data-key="child-${id}" 
      data-target="${ifDefined(id)}"
      data-selectable
        data-marker-end="parent"
    ></viz-association>`;
  }
}
