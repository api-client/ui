import { css, CSSResult, html, LitElement, PropertyValueMap, TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { DataEntity, DataEntityKind, DataNamespace, DataProperty } from "@api-client/core/build/browser.js";
import '@anypoint-web-components/awc/dist/define/anypoint-input.js';
import '@anypoint-web-components/awc/dist/define/anypoint-button.js';
import '@anypoint-web-components/awc/dist/define/anypoint-icon-button.js';
import { AnypointInputElement } from "@anypoint-web-components/awc";
import theme from '../theme.js';
import schemaCommon from './schemaCommon.js';
import '../../define/api-icon.js';

/**
 * The DataEntity editor UI and logic.
 * 
 * @fires change - When the entity has changed and the parent element / app should update the value in the store.
 * @fires namechange - When a name of the data entity has changed. This triggers a render in the navigation. This is fired after the `change` event.
 */
export default class DataEntityEditorElement extends LitElement {
  static get styles(): CSSResult[] {
    return [
      theme,
      schemaCommon,
      css`
      :host {
        display: block;
        height: 100%;
      }

      .container {
        display: flex;
        flex-direction: row;
        height: inherit;
      }

      .structure {
        flex: 8;
        padding-top: 20px;
        padding-left: 20px;
        overflow: hidden;
      }

      .editor {
        flex: 4;
        background: var(--data-editor-background, #fafafa);
        border-left: 1px var(--divider-color) solid;
      }

      .entity-header {
        margin-bottom: 20px;
      }

      .entity-header .label {
        font-size: 1.2rem;
        margin: 1.2rem 0;
      }

      .no-description {
        font-style: italic;
      }

      .editor-title {
        margin: 1.2rem 20px;
      }

      .editor-section-title {
        margin: 0.89rem 20px;
      }

      .input {
        margin: 28px 20px;
        width: auto;
        display: block;
      }

      .editor-separator {
        margin: 28px 20px;
        background-color: var(--divider-color);
        height: 1px;
      }

      .no-info {
        margin: 12px 20px;
      }

      code {
        white-space: pre-wrap;
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

      .add-property-section {
        margin-top: 20px;
      }
      `,
    ];
  }

  /**
   * The read data namespace.
   */
  @property({ type: Object }) root?: DataNamespace;

  /**
   * The selected entity.
   */
  @property({ type: String }) selected?: string;

  /**
   * The read data entity when the "selected" change.
   */
  @state() protected _entity?: DataEntity;

  /**
   * The key of the selected property being edited. When not set the entity editor is rendered.
   */
  @property({ type: String }) selectedProperty?: string;

  @state() protected _highlightEntityDropZone?: boolean;

  constructor() {
    super();
    this.addEventListener('dragenter', this._dragEnterHandler.bind(this));
    this.addEventListener('dragleave', this._dragLeaveHandler.bind(this));
  }

  willUpdate(cp: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
    if (cp.has('selected')) {
      this._computeSelectedEntity();
    }
  }

  /**
   * Adds a parent entity to this entity.
   * @param key The key of the parent to add.
   */
  addParent(key: string): void {
    const { selected, _entity } = this;
    if (!key || key === selected || !_entity) {
      return;
    }
    if (!_entity.parents.includes(key)) {
      _entity.parents.push(key);
    }
    this._notifyChanged();
    this.requestUpdate();
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

  removeProperty(key: string): void {
    const { _entity } = this;
    if (!key || !_entity) {
      return;
    }
    _entity.removeProperty(key);
    this._notifyChanged();
    this.requestUpdate();
  }

  protected _notifyChanged(): void {
    this.dispatchEvent(new Event('change'));
  }

  /**
   * Computes the view value for the entity.
   * This should be called before the update is complete so this won't trigger another update.
   */
  protected _computeSelectedEntity(): void {
    const { root, selected } = this;
    this.selectedProperty = undefined;
    if (!root || !selected) {
      this._entity = undefined;
      return;
    }
    this._entity = root.definitions.entities.find(i => i.key === selected);
  }

  protected _dragEnterHandler(e: DragEvent): void {
    const { dataTransfer: dt } = e;
    if (!dt) {
      return;
    }
    if (![...dt.types].includes(DataEntityKind.toLowerCase())) {
      return;
    }
    this._highlightEntityDropZone = true;
  }

  protected _dragLeaveHandler(e: DragEvent): void {
    const { dataTransfer: dt } = e;
    if (!dt) {
      return;
    }
    if (![...dt.types].includes(DataEntityKind.toLowerCase())) {
      return;
    }
    this._highlightEntityDropZone = false;
  }

  protected _dropHandler(e: DragEvent): void {
    const node = e.target as HTMLElement;
    const { type } = node.dataset;
    if (type === 'entity-parent') {
      e.preventDefault();
      this._highlightEntityDropZone = false;
      const key = e.dataTransfer!.getData('text/key');
      this.addParent(key);
    }
  }

  protected _dragoverHandler(e: DragEvent): void {
    e.preventDefault();
    e.preventDefault();
    e.dataTransfer!.dropEffect = "copy";
  }

  protected _findParentKeyedElement(node: HTMLElement): HTMLElement | null {
    let target: HTMLElement | null = node;
    while (target) {
      if (target.nodeType !== Node.ELEMENT_NODE || !target.dataset) {
        target = target.parentElement;
        continue;
      }
      if (target.dataset.key) {
        return target;
      }
      target = target.parentElement;
    }
    return null;
  }

  protected _parentRemoveHandler(e: Event): void {
    const node = this._findParentKeyedElement(e.target as HTMLElement);
    if (node) {
      this.removeParent(node.dataset.key as string);
    }
  }

  protected _propertyRemoveHandler(e: Event): void {
    const node = this._findParentKeyedElement(e.target as HTMLElement);
    if (node) {
      this.removeProperty(node.dataset.key as string);
    }
  }

  protected _propertyEditHandler(e: Event): void {
    const node = this._findParentKeyedElement(e.target as HTMLElement);
    if (node) {
      this.selectedProperty = node.dataset.key as string;
    }
  }

  protected _addPropertyHandler(): void {
    const { _entity } = this;
    if (!_entity) {
      return;
    }
    _entity.addNamedProperty('New property');
    this._notifyChanged();
    this.requestUpdate();
  }

  protected _infoChangeHandler(e: Event): void {
    const node = e.target as AnypointInputElement;
    const { name, value } = node;
    if (!['name', 'description'].includes(name as string)) {
      return;
    }
    if (name === 'name' && !value) {
      return;
    }
    const { _entity } = this;
    if (!_entity) {
      return;
    }
    _entity.info[name as 'name' | 'description'] = value;
    this._notifyChanged();
    if (name === 'name') {
      this.dispatchEvent(new Event('namechange'));
    }
    this.requestUpdate();
  }

  protected _propertyInfoChangeHandler(e: Event): void {
    const node = e.target as AnypointInputElement;
    const { name, value } = node;
    if (!['name', 'description'].includes(name as string)) {
      return;
    }
    if (name === 'name' && !value) {
      return;
    }
    const { _entity, selectedProperty } = this;
    if (!_entity || !selectedProperty) {
      return;
    }
    const item = _entity.properties.find(i => i.key === selectedProperty);
    if (!item) {
      return;
    }
    item.info[name as 'name' | 'description'] = value;
    this._notifyChanged();
    this.requestUpdate();
  }

  protected render(): TemplateResult {
    const { _entity } = this;
    if (!_entity) {
      return html``;
    }
    return html`
    <div class="container">
      ${this._structureTemplate(_entity)}
      ${this._editorTemplate(_entity)}
    </div>
    `;
  }

  protected _structureTemplate(entity: DataEntity): TemplateResult {
    return html`
    <div class="structure">
      ${this._entityHeaderTemplate(entity)}
      ${this._entityPropertiesTemplate(entity)}
      ${this._entityParentsProperties(entity.getComputedParents())}
      ${this._addPropertyButtonTemplate()}
    </div>
    `;
  }

  protected _entityHeaderTemplate(entity: DataEntity): TemplateResult {
    const label = entity.info.name || 'Unnamed data entity';
    return html`
    <div class="entity-header">
      <div class="label">${label}</div>
      <div class="description">
        ${entity.info.description ?
        html`<pre><code>${entity.info.description}</code></pre>` :
        html`<span class="no-description">No schema description provided.</span>`}
      </div>
    </div>
    `;
  }

  protected _entityPropertiesTemplate(entity: DataEntity): TemplateResult {
    const { properties, associations } = entity;
    if (!properties.length && !associations.length) {
      return html`<p class="no-properties">This entity has no properties or associations.</p>`;
    }
    return html`
    ${properties.map(p => this._propertyTemplate(p))}
    `;
  }

  protected _propertyTemplate(item: DataProperty): TemplateResult {
    const { info, type, key, required } = item;
    const label = info.name || 'Unnamed property';
    return html`
    <div class="property-container" data-key="${key}">
      <div class="property-border"></div>
      <div class="property-value">
        <div class="property-headline">
          <div class="property-decorator scalar" tabindex="-1"><hr></div>
          <div class="param-name required">
            <span class="param-label text-selectable">${label}</span>
          </div>
          <span class="headline-separator"></span>
          <div class="param-type text-selectable">${type || 'Any type'}</div>
          ${required ? html`<span class="param-pill pill" title="This property is required.">
            Required
          </span>` : ''}
        </div>
        <div class="description-column">  
          <div class="api-description">
            <arc-marked sanitize>
              <div slot="markdown-html" class="markdown-body text-selectable">${info.description || 'No description'}</div>
            </arc-marked>
          </div>
        </div>
        <div class="details-column"></div>
      </div>
      <div class="property-actions">
        <anypoint-icon-button aria-label="Remove this property" title="Remove this property" @click="${this._propertyRemoveHandler}">
          <api-icon icon="remove" aria-hidden="true"></api-icon>
        </anypoint-icon-button>
        <anypoint-icon-button aria-label="Edit this property" title="Edit this property" @click="${this._propertyEditHandler}">
          <api-icon icon="edit" aria-hidden="true"></api-icon>
        </anypoint-icon-button>
      </div>
    </div>
    `;
  }

  protected _entityParentsProperties(parents: DataEntity[]): TemplateResult[] | string {
    if (!parents.length) {
      return '';
    }
    return parents.map(p => html`
    <p class="inheritance-label text-selectable">Properties inherited from <b>${p.info.name}</b>.</p>
    ${this._entityPropertiesTemplate(p)}
    `);
  }

  protected _addPropertyButtonTemplate(): TemplateResult {
    return html`
    <div class="add-property-section">
      <anypoint-button emphasis="medium" @click="${this._addPropertyHandler}">Add property</anypoint-button>
    </div>
    `;
  }

  protected _editorTemplate(entity: DataEntity): TemplateResult {
    const { selectedProperty } = this;
    return html`
    <div class="editor">
      ${selectedProperty ?
        this._propertyEditorTemplate(entity, selectedProperty) :
        this._entityEditorTemplate(entity)}
    </div>
    `;
  }

  protected _propertyEditorTemplate(entity: DataEntity, id: string): TemplateResult | string {
    const item = entity.properties.find(i => i.key === id);
    if (!item) {
      return '';
    }
    const { info } = item;
    return html`
    <div class="editor-title">Data Property</div>

    <anypoint-input class="input" name="name" .value="${info.name}" label="Property name" @change="${this._propertyInfoChangeHandler}"></anypoint-input>
    <anypoint-input class="input" name="description" .value="${info.description}" label="Property description (optional)" @change="${this._propertyInfoChangeHandler}"></anypoint-input>

    `;
  }

  protected _entityEditorTemplate(entity: DataEntity): TemplateResult {
    const { info } = entity;

    return html`
    <div class="editor-title">Data Entity</div>

    <anypoint-input class="input" name="name" .value="${info.name}" label="Entity name" @change="${this._infoChangeHandler}"></anypoint-input>
    <anypoint-input class="input" name="description" .value="${info.description}" label="Entity description (optional)" @change="${this._infoChangeHandler}"></anypoint-input>

    <div class="editor-separator"></div>
    ${this._parentsEditorTemplate(entity)}
    `;
  }

  protected _parentsEditorTemplate(entity: DataEntity): TemplateResult {
    return html`
    <div class="section-title">Parents</div>
    ${this._highlightEntityDropZone ? this._parentDropZoneTemplate() : this._parentsTemplate(entity)}
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
    ${parents.length ? this._parentsListTemplate(parents) : html`<p class="no-info">No parent entities</p>`}
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
      <anypoint-icon-button aria-label="Remove this parent" title="Remove this parent" @click="${this._parentRemoveHandler}">
        <api-icon icon="remove" aria-hidden="true"></api-icon>
      </anypoint-icon-button>
    </li>
    `;
  }
}
