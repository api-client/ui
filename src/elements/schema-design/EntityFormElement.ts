import { css, CSSResult, html, PropertyValueMap, TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { DataEntity, DataNamespace, EventUtils } from "@api-client/core/build/browser.js";
import { AnypointInputElement } from "@anypoint-web-components/awc";
import '@anypoint-web-components/awc/dist/define/anypoint-input.js';
import '@anypoint-web-components/awc/dist/define/anypoint-icon-button.js';
import ApiElement from "../ApiElement.js";
import EditorCommon from './CommonStyles.js';
import theme from '../theme.js';

/**
 * An editor for a data entity.
 * 
 * @fires change - When the entity has changed.
 * @fires namechange - When a name of the entity has changed.
 */
export default class EntityFormElement extends ApiElement {
  static get styles(): CSSResult[] {
    return [
      theme,
      EditorCommon,
      css`
      :host {
        display: block;
      }

      .no-info {
        margin: 12px 20px;
      }

      .parents-list {
        margin: 0;
        padding: 0;
      }

      .parent-item {
        list-style: none;
        height: var(--list-item-height, 40px);
        display: flex;
        align-items: center;
        padding: 0 20px;
      }

      .parent-item.two-line {
        height: var(--list-item-two-line-height);
      }

      .parent-item-wrapper {
        flex: 1;
      }
      `
    ]
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
   * When set it activates the drop zone in the parents list to support drag and drop.
   */
  @property({ type: Boolean }) parentDropZone?: boolean;

  /**
   * The computed entity when the key or root change.
   */
  @state() protected _entity?: DataEntity;

  protected willUpdate(cp: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
    if (cp.has('key')) {
      this._computeEntity();
    }
  }

  /**
   * Adds a parent entity to this entity.
   * @param parentKey The key of the parent to add.
   */
  addParent(parentKey: string): void {
    const { key, _entity } = this;
    if (!parentKey || parentKey === key || !_entity) {
      return;
    }
    if (!_entity.parents.includes(parentKey)) {
      _entity.parents.push(parentKey);
    }
    this._notifyChanged();
  }

  protected _notifyChanged(): void {
    this.dispatchEvent(new Event('change'));
  }

  /**
   * Computes the view value for the property.
   * This should be called before the update is complete so this won't trigger another update.
   */
  protected _computeEntity(): void {
    const { root, key } = this;
    if (!root || !key) {
      this._entity = undefined;
      return;
    }
    this._entity = root.definitions.entities.find(i => i.key === key);
  }

  protected _infoChangeHandler(e: Event): void {
    const { _entity } = this;
    if (!_entity) {
      return;
    }
    const node = e.target as AnypointInputElement;
    const { name, value } = node;
    if (!['name', 'description'].includes(name as string)) {
      return;
    }
    if (name === 'name' && !value) {
      return;
    }
    _entity.info[name as 'name' | 'description'] = value;
    this._notifyChanged();
    if (name === 'name') {
      this.dispatchEvent(new Event('namechange'));
    }
  }

  protected _dragoverHandler(e: DragEvent): void {
    e.preventDefault();
    e.preventDefault();
    e.dataTransfer!.dropEffect = "copy";
  }

  protected _dropHandler(e: DragEvent): void {
    const node = e.target as HTMLElement;
    const { type } = node.dataset;
    if (type === 'entity-parent') {
      e.preventDefault();
      this.parentDropZone = false;
      const key = e.dataTransfer!.getData('text/key');
      this.addParent(key);
    }
  }

  protected _parentRemoveHandler(e: Event): void {
    const node = e.currentTarget as HTMLElement;
    if (node.dataset.key) {
      this.removeParent(node.dataset.key);
    }
  }

  /**
   * Removes a parent with the given key.
   * @param key The key of the parent to remove.
   */
  removeParent(key: string): void {
    const { _entity } = this;
    if (!key || !_entity) {
      return;
    }
    const index = _entity.parents.indexOf(key);
    if (index < 0) {
      return;
    }
    _entity.parents.splice(index, 1);
    this._notifyChanged();
    this.requestUpdate();
  }

  protected render(): TemplateResult {
    const { _entity: item } = this;
    if (!item) {
      return html``;
    }

    const { info } = item;
    return html`
    <form name="entity" @submit="${EventUtils.cancelEvent}" data-key="${item.key}">
      <anypoint-input class="input" name="name" .value="${info.name}" label="Entity name" @change="${this._infoChangeHandler}"></anypoint-input>
      <anypoint-input class="input" name="description" .value="${info.description}" label="Entity description (optional)" @change="${this._infoChangeHandler}"></anypoint-input>

      <div class="editor-separator"></div>
      ${this._parentsEditorTemplate(item)}
    </form>
    `
  }

  protected _parentsEditorTemplate(entity: DataEntity): TemplateResult {
    return html`
    <div class="section-title">Parents</div>
    ${this.parentDropZone ? this._parentDropZoneTemplate() : this._parentsTemplate(entity)}
    `;
  }

  protected _parentDropZoneTemplate(): TemplateResult {
    return html`<div 
      class="drop-zone" 
      data-type="entity-parent" 
      @dragover="${this._dragoverHandler}" 
      @drop="${this._dropHandler}">
      Drop a parent entity here.
    </div>`;
  }

  protected _parentsTemplate(entity: DataEntity): TemplateResult {
    const parents = entity.getComputedParents();
    return html`
    ${parents.length ? this._parentsListTemplate(parents) : html`<p class="no-description no-info">No parent entities</p>`}
    `;
  }

  protected _parentsListTemplate(parents: DataEntity[]): TemplateResult {
    return html`
    <ul class="parents-list">
      ${parents.map(p => this._parentItemTemplate(p))}
    </ul>
    `;
  }

  protected _parentItemTemplate(item: DataEntity): TemplateResult {
    const parent = item.getParent();
    const label = item.info.name || item.key;
    return html`
    <li class="parent-item${parent ? ' two-line' : ''}" data-key="${item.key}">
      <div class="parent-item-wrapper">
        <span class="parent-label">${label}</span>
        ${parent ? html`<div class="secondary">From data model: ${parent.info.name}</div>` : ''}
      </div>
      <anypoint-icon-button aria-label="Remove this parent" title="Remove this parent"  data-key="${item.key}" @click="${this._parentRemoveHandler}">
        <api-icon icon="remove" aria-hidden="true"></api-icon>
      </anypoint-icon-button>
    </li>
    `;
  }
}
