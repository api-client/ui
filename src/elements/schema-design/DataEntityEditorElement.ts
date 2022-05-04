import { css, CSSResult, html, LitElement, PropertyValueMap, TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { DataEntity, DataEntityKind, DataNamespace } from "@api-client/core/build/browser.js";
import '@anypoint-web-components/awc/dist/define/anypoint-input.js';
import { AnypointInputElement } from "@anypoint-web-components/awc";

/**
 * The DataEntity editor UI and logic.
 * 
 * @fires change When the entity has changed and the parent element / app should update the value in the store.
 */
export default class DataEntityEditorElement extends LitElement {
  static get styles(): CSSResult[] {
    return [
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
        background: var(--data-editor-background, #e5e5e5);
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

      .drop-zone {
        height: 120px;
        border: 4px var(--accent-color) dotted;
        margin: 28px 20px;
      }

      code {
        white-space: pre-wrap;
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

  protected _notifyChanged(): void {
    this.dispatchEvent(new Event('change'));
  }

  /**
   * Computes the view value for the entity.
   * This should be called before the update is complete so this won't trigger another update.
   */
  protected _computeSelectedEntity(): void {
    const { root, selected } = this;
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
    this.requestUpdate();
  }

  protected _propertyEditorTemplate(entity: DataEntity, id: string): TemplateResult {
    return html`
    <div class="editor-title">Data Property</div>
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
    <div class="editor-section-title">Parents</div>
    ${this._highlightEntityDropZone ? html`<div class="drop-zone" data-type="entity-parent" @dragover="${this._dragoverHandler}" @drop="${this._dropHandler}"></div>` : this._parentsTemplate(entity)}
    `;
  }

  protected _parentsTemplate(entity: DataEntity): TemplateResult {
    const parents = entity.getComputedParents();
    return html`
    ${parents.length ? this._parentsListTemplate(parents) : html`<p class="no-info">No parent entities</p>`}
    <anypoint-button emphasis="medium">Add parent entity</anypoint-button>
    `;
  }

  protected _parentsListTemplate(parents: DataEntity[]): TemplateResult {
    return html`
    <ul>
      ${parents.map(p => html`<li>${p.info.name || p.key}</li>`)}
    </ul>
    `;
  }
}
