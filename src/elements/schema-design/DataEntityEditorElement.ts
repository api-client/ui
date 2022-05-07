import { css, CSSResult, html, TemplateResult } from "lit";
import { property, query, state } from "lit/decorators.js";
import { DataEntityKind, DataNamespace } from "@api-client/core/build/browser.js";
import '@anypoint-web-components/awc/dist/define/anypoint-button.js';
import '@anypoint-web-components/awc/dist/define/anypoint-icon-button.js';
import ApiElement from "../ApiElement.js";
import theme from '../theme.js';
import schemaCommon from './schemaCommon.js';
import EditorCommon from './CommonStyles.js';
import MarkdownStyles from '../highlight/MarkdownStyles.js';
import '../../define/api-icon.js';
import '../../define/marked-highlight.js';
import '../../define/data-property-form.js';
import '../../define/data-association-form.js';
import '../../define/data-entity-form.js';
import '../../define/data-schema-document.js';
import DataSchemaDocument from "./DataSchemaDocument.js";

/**
 * The DataEntity editor UI and logic.
 * 
 * @fires change - When the entity has changed and the parent element / app should update the value in the store.
 * @fires namechange - When a name of the data entity has changed. This triggers a render in the navigation. This is fired after the `change` event.
 */
export default class DataEntityEditorElement extends ApiElement {
  static get styles(): CSSResult[] {
    return [
      theme,
      schemaCommon,
      MarkdownStyles,
      EditorCommon,
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
   * The key of the selected property being edited.
   */
  @property({ type: String }) selectedProperty?: string;

  /**
   * The key of the selected association being edited.
   */
  @property({ type: String }) selectedAssociation?: string;

  @state() protected _highlightEntityDropZone?: boolean;

  @query('data-schema-document')
  protected _schemaDoc?: DataSchemaDocument;

  constructor() {
    super();
    this.addEventListener('dragenter', this._dragEnterHandler.bind(this));
    this.addEventListener('dragleave', this._dragLeaveHandler.bind(this));
  }

  protected _notifyChanged(): void {
    this.dispatchEvent(new Event('change'));
    if (this._highlightEntityDropZone) {
      this._highlightEntityDropZone = false;
    }
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
    this.selectedProperty = undefined;
    this.selectedAssociation = undefined;
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

  protected _propertyChangeHandler(): void {
    this._notifyChanged();
    const { _schemaDoc } = this;
    if (_schemaDoc) {
      _schemaDoc.requestUpdate();
    }
  }

  protected _entityChangeHandler(): void {
    this._notifyChanged();
    const { _schemaDoc } = this;
    if (_schemaDoc) {
      _schemaDoc.requestUpdate();
    }
  }

  protected _schemaEntityChangeHandler(): void {
    this._notifyChanged();
    this.requestUpdate();
  }

  protected _schemaEntityEditHandler(e: CustomEvent): void {
    const { type, key } = e.detail;
    if (type === 'property') {
      this.selectedProperty = key;
      this.selectedAssociation = undefined;
    } else if (type === 'association') {
      this.selectedProperty = undefined;
      this.selectedAssociation = key;
    }
  }

  protected _entityNameHandler(): void {
    // just retarget
    this.dispatchEvent(new Event('namechange'));
  }

  protected _cancelEditor(): void {
    this.selectedProperty = undefined;
    this.selectedAssociation = undefined;
  }

  protected render(): TemplateResult {
    return html`
    <div class="container">
      ${this._structureTemplate()}
      ${this._editorTemplate()}
    </div>
    `;
  }

  protected _structureTemplate(): TemplateResult {
    return html`
    <div class="structure">
      <data-schema-document
        .root="${this.root}"
        .key="${this.selected}"
        .selectedProperty="${this.selectedProperty || this.selectedAssociation}"
        ?associationDropZone="${this._highlightEntityDropZone}"
        editable
        @change="${this._schemaEntityChangeHandler}"
        @edit="${this._schemaEntityEditHandler}"
      ></data-schema-document>
    </div>
    `;
  }

  protected _editorTemplate(): TemplateResult {
    const { selectedProperty, selectedAssociation } = this;
    let content: TemplateResult;
    if (selectedProperty) {
      content = this._propertyEditorTemplate(selectedProperty);
    } else if (selectedAssociation) {
      content = this._associationEditorTemplate(selectedAssociation);
    } else {
      content = this._entityEditorTemplate();
    }
    return html`
    <div class="editor">${content}</div>
    `;
  }

  protected _propertyEditorTemplate(id: string): TemplateResult {
    return html`
    <div class="editor-title">
      Data Property
      <anypoint-icon-button class="title-icon" title="Close this editor" @click="${this._cancelEditor}">
        <api-icon icon="close"></api-icon>
      </anypoint-icon-button>
    </div>
    <data-property-form 
      .root="${this.root}" 
      .key="${id}" 
      @change="${this._propertyChangeHandler}"
    ></data-property-form>
    `;
  }

  protected _associationEditorTemplate(id: string): TemplateResult {
    return html`
    <div class="editor-title">
      Data Association
      <anypoint-icon-button class="title-icon" title="Close this editor" @click="${this._cancelEditor}">
        <api-icon icon="close"></api-icon>
      </anypoint-icon-button>
    </div>
    <data-association-form
      .root="${this.root}" 
      .key="${id}" 
      @change="${this._propertyChangeHandler}"
    ></data-association-form>
    `;
  }

  protected _entityEditorTemplate(): TemplateResult {
    return html`
    <div class="editor-title">Data Entity</div>
    <data-entity-form 
      .root="${this.root}" 
      .key="${this.selected}"
      ?parentDropZone="${this._highlightEntityDropZone}"
      @change="${this._entityChangeHandler}"
      @namechange="${this._entityNameHandler}"
    ></data-entity-form>
    `;
  }
}
