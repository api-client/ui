import { AnypointCheckboxElement, AnypointDropdownMenuElement, AnypointInputElement, AnypointListboxElement, SupportedInputTypes } from "@anypoint-web-components/awc";
import { DataNamespace, DataProperty, DataPropertyType, DataPropertyTypes, EventUtils } from "@api-client/core/build/browser.js";
import { css, CSSResult, html, PropertyValueMap, TemplateResult, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import '@anypoint-web-components/awc/dist/define/anypoint-input.js';
import '@anypoint-web-components/awc/dist/define/anypoint-dropdown-menu.js';
import '@anypoint-web-components/awc/dist/define/anypoint-listbox.js';
import '@anypoint-web-components/awc/dist/define/anypoint-item.js';
import '@anypoint-web-components/awc/dist/define/anypoint-checkbox.js';
import '@anypoint-web-components/awc/dist/define/anypoint-chip-input.js';
import ApiElement from "../ApiElement.js";
import EditorCommon from './CommonStyles.js';
import theme from '../theme.js';

interface IInputTemplateOptions {
  css?: string;
  index?: number;
  noLabel?: boolean;
}

export default class PropertyFormElement extends ApiElement {
  static get styles(): CSSResult[] {
    return [
      theme,
      EditorCommon,
      css`
      :host {
        display: block;
      }

      .no-description {
        margin: 1.2rem 20px;
      }

      .enum-values {
        margin: 0px 0px 20px;
        padding: 0px 0px 20px;
      }

      .input-item {
        display: flex;
        list-style: none;
        margin: 4px 20px;
      }

      .input.list-input {
        margin: 0;
        flex: 1;

        --anypoint-input-background-color: transparent;
      }

      .editor-title {
        text-transform: uppercase;
        font-size: 0.83rem;
      }
      `
    ]
  }
  
  /**
   * The key of the property to edit.
   */
  @property({ type: String, reflect: true }) key?: string;

  /**
   * The read data namespace.
   */
  @property({ type: Object }) root?: DataNamespace;

  /**
   * The computed entity when the key or root change.
   */
  @state() protected _property?: DataProperty;

  willUpdate(cp: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
    if (cp.has('key')) {
      this._computeProperty();
    }
  }

  protected _notifyChanged(): void {
    this.dispatchEvent(new Event('change'));
  }

  /**
   * Computes the view value for the property.
   * This should be called before the update is complete so this won't trigger another update.
   */
  protected _computeProperty(): void {
    const { root, key } = this;
    if (!root || !key) {
      this._property = undefined;
      return;
    }
    this._property = root.definitions.properties.find(i => i.key === key);
  }

  protected _infoChangeHandler(e: Event): void {
    const { _property } = this;
    if (!_property) {
      return;
    }
    const node = e.target as AnypointInputElement;
    const { name, value } = node;
    if (!['name', 'description', 'displayName'].includes(name as string)) {
      return;
    }
    if (name === 'name' && !value) {
      return;
    }
    _property.info[name as 'name' | 'description' | 'displayName'] = value;
    this._notifyChanged();
    this.requestUpdate();
  }

  protected _typeHandler(e: Event): void {
    const { _property } = this;
    if (!_property) {
      return;
    }
    const list = e.target as AnypointListboxElement;
    const value = list.selected as DataPropertyType;
    if (_property.type === value) {
      return;
    }
    _property.type = value;
    this._notifyChanged();
    this.requestUpdate();
  }

  protected _checkedHandler(e: Event): void {
    const { _property } = this;
    if (!_property) {
      return;
    }
    const input = e.target as AnypointCheckboxElement;
    const name = input.name as 'multiple' | 'required' | 'primary' | 'index';
    const { checked } = input;
    if (_property[name] === checked) {
      return;
    }
    _property[name] = checked;
    this._notifyChanged();
    this.requestUpdate();
  }

  protected _tagAddedHandler(e: CustomEvent): void {
    const { _property } = this;
    if (!_property) {
      return;
    }
    const { label } = e.detail;
    _property.addTag(label);
    this._notifyChanged();
    this.requestUpdate();
  }

  protected _tagRemovedHandler(e: CustomEvent): void {
    const { _property } = this;
    if (!_property) {
      return;
    }
    const index = e.detail.index as number;
    _property.tags.splice(index, 1);
    this._notifyChanged();
    this.requestUpdate();
  }

  protected _schemaChangeHandler(e: Event): void {
    const { _property } = this;
    if (!_property) {
      return;
    }
    const node = e.target as AnypointInputElement;
    const name = node.name as 'defaultValue';
    const { value } = node;
    const adapted = this._getAdapted(_property);
    adapted.schema![name] = value;
    this._notifyChanged();
  }

  protected _dropdownHandler(e: Event): void {
    const { _property } = this;
    if (!_property) {
      return;
    }
    const list = e.target as AnypointListboxElement;
    const menu = list.parentElement as AnypointDropdownMenuElement;
    const value = list.selected as string | undefined;
    const name = menu.name as 'defaultValue';
    const adapted = this._getAdapted(_property);
    adapted.schema![name] = value;
    this._notifyChanged();
  }

  protected _typedSchemaValueChange(e: Event): void {
    const { _property } = this;
    if (!_property) {
      return;
    }

    let value: string | undefined;
    let name: string | undefined;
    const node = e.target as HTMLElement;
    if (node.localName === 'anypoint-listbox') {
      const list = e.target as AnypointListboxElement;
      const menu = list.parentElement as AnypointDropdownMenuElement;
      value = list.selected as string | undefined;
      name = menu.name;
    } else if (node.localName === 'anypoint-input') {
      const input = e.target as AnypointInputElement;
      name = input.name;
      value = input.value;
    }
    if (!name) {
      return;
    }

    const adapted = this._getAdapted(_property);

    if (name === 'defaultValue') {
      adapted.schema!.defaultValue = value;
    }
    this._notifyChanged();
  }

  protected _exampleChangeHandler(e: Event): void {
    const { _property } = this;
    if (!_property) {
      return;
    }
    const node = e.target as AnypointInputElement;
    const { dataset, value } = node;
    const adapted = this._getAdapted(_property);
    if (!adapted.schema!.examples) {
      adapted.schema!.examples = [];
    }
    const list = adapted.schema!.examples as string[];
    if (dataset.index) {
      const index = Number(dataset.index);
      list[index] = value as string;
    } else {
      list.push(value as string);
      node.value = '';
    }
    this._notifyChanged();
    this.requestUpdate();
  }

  protected _removeExampleHandler(e: Event): void {
    const { _property } = this;
    if (!_property) {
      return;
    }
    const node = e.currentTarget as HTMLInputElement;
    const { dataset } = node;
    if (!dataset.index) {
      return;
    }
    const index = Number(dataset.index);
    const adapted = this._getAdapted(_property);
    if (!adapted.schema!.examples) {
      return;
    }
    adapted.schema!.examples.splice(index, 1);
    this._notifyChanged();
    this.requestUpdate();
  }

  protected _enumChangeHandler(e: Event): void {
    const { _property } = this;
    if (!_property) {
      return;
    }
    const node = e.target as AnypointInputElement;
    const { dataset, value } = node;
    const adapted = this._getAdapted(_property);
    if (!adapted.schema!.enum) {
      adapted.schema!.enum = [];
    }
    const list = adapted.schema!.enum as string[];
    if (dataset.index) {
      const index = Number(dataset.index);
      list[index] = value as string;
    } else {
      list.push(value as string);
      node.value = '';
    }
    this._notifyChanged();
    this.requestUpdate();
  }

  protected _removeEnumHandler(e: Event): void {
    const { _property } = this;
    if (!_property) {
      return;
    }
    const node = e.currentTarget as HTMLInputElement;
    const { dataset } = node;
    if (!dataset.index) {
      return;
    }
    const index = Number(dataset.index);
    const adapted = this._getAdapted(_property);
    if (!adapted.schema!.enum) {
      return;
    }
    adapted.schema!.enum.splice(index, 1);
    this._notifyChanged();
    this.requestUpdate();
  }

  protected _getAdapted(dataProperty: DataProperty): DataProperty {
    let adapted: DataProperty;
    if (!dataProperty.adapts) {
      adapted = dataProperty.createAdapted();
    } else {
      adapted = dataProperty.readAdapted()!;
    }
    if (!adapted.schema) {
      adapted.schema = {};
    }
    return adapted;
  }

  protected render(): TemplateResult {
    const { _property: item } = this;
    if (!item) {
      return html``;
    }
    const { info, multiple = false, required = false, primary = false, index = false, tags, readOnly = false, writeOnly = false, deprecated = false } = item;
    const allTags = this.root?.definitions.tags;
    return html`
    <form name="data-property" @submit="${EventUtils.cancelEvent}" data-key="${item.key}">
      <anypoint-input class="input" name="name" .value="${info.name}" label="Property name" required autoValidate @change="${this._infoChangeHandler}"></anypoint-input>
      <anypoint-input class="input" name="displayName" .value="${info.displayName}" label="Display name (optional)" @change="${this._infoChangeHandler}"></anypoint-input>
      <anypoint-input class="input" name="description" .value="${info.description}" label="Property description (optional)" @change="${this._infoChangeHandler}"></anypoint-input>
      ${this._typeSelector(item)}

      <div class="checkbox-group">
        <anypoint-checkbox name="required" .checked="${required}" title="Whether the property is required in the schema" @change="${this._checkedHandler}">Required</anypoint-checkbox>
        <anypoint-checkbox name="multiple" .checked="${multiple}" title="When set it declares this property as an array. Multiple instances of the value are permitted." @change="${this._checkedHandler}">Multiple</anypoint-checkbox>
        <anypoint-checkbox name="primary" .checked="${primary}" title="Makes this property a primary key for the schema. This is optional for a schema." @change="${this._checkedHandler}">Primary key</anypoint-checkbox>
        <anypoint-checkbox name="index" .checked="${index}" title="Indicates the property is a key and should be indexed." @change="${this._checkedHandler}">Indexed key</anypoint-checkbox>
        <anypoint-checkbox name="readOnly" .checked="${readOnly}" title="The value cannot be changed." @change="${this._checkedHandler}">Read only</anypoint-checkbox>
        <anypoint-checkbox name="writeOnly" .checked="${writeOnly}" title="The value cannot be read." @change="${this._checkedHandler}">Write only</anypoint-checkbox>
        <anypoint-checkbox name="deprecated" .checked="${deprecated}" title="Makes this property deprecated." @change="${this._checkedHandler}">Deprecated</anypoint-checkbox>
      </div>

      <div class="tags-input">
        <anypoint-chip-input 
          class="input" 
          name="tag" 
          label="Tags" 
          .chipsValue="${tags}" 
          .source="${allTags}" 
          @added="${this._tagAddedHandler}"
          @removed="${this._tagRemovedHandler}"
        ></anypoint-chip-input>
      </div>

      <div class="editor-separator"></div>
      <div class="editor-title">Schema</div>
      ${this._schemaEditorTemplate(item)}
      
    </form>
    `;
  }

  protected _schemaEditorTemplate(item: DataProperty): TemplateResult {
    const adapted = item.readAdapted();
    const schema = adapted && adapted.schema;

    let defaultValue: string | undefined;
    let examples: string[] | undefined;
    let values: string[] | undefined;
    if (schema) {
      defaultValue = schema.defaultValue;
      examples = schema.examples;
      values = schema.enum;
    }
    return html`
    ${this._typedInputElement(item.type, 'defaultValue' ,'Default value (optional)', this._typedSchemaValueChange, defaultValue)}
    ${this._examplesEditorTemplate(item, examples)}
    ${this._enumEditorTemplate(item, values)}
    `;
  }

  protected _examplesEditorTemplate(item: DataProperty, examples?: string[]): TemplateResult | typeof nothing {
    if (['nil', 'boolean'].includes(item.type)) {
      return nothing;
    }
    return html`
    <div class="editor-title">Examples</div>
    ${this._textInputTemplate(item.type, 'example', 'Add example', this._exampleChangeHandler)}
    ${this._examplesListTemplate(item, examples)}
    `;
  }

  protected _examplesListTemplate(item: DataProperty, examples?: string[]): TemplateResult {
    if (!examples || !examples.length) {
      return html`
      <div class="no-description">No examples.</div>
      `;
    }
    return html`
    <ul class="enum-values">
      ${examples.map((i, index) => html`
      <li class="input-item">
        ${this._textInputTemplate(item.type, 'example', 'Example', this._exampleChangeHandler, i, { index, css: 'list-input', noLabel: true })}
        <anypoint-icon-button data-index="${index}" title="Remove this example" @click="${this._removeExampleHandler}">
          <api-icon icon="remove" role="presentation"></api-icon>
        </anypoint-icon-button>
      </li>`)}
    </ul>
    `;
  }

  protected _enumEditorTemplate(item: DataProperty, values?: string[]): TemplateResult | typeof nothing {
    if (['nil', 'boolean'].includes(item.type)) {
      return nothing;
    }
    return html`
    <div class="editor-title">Enum</div>
    ${this._textInputTemplate(item.type, 'enum', 'Add value', this._enumChangeHandler)}
    ${this._enumListTemplate(item, values)}
    `;
  }

  protected _enumListTemplate(item: DataProperty, values?: string[]): TemplateResult {
    if (!values || !values.length) {
      return html`
      <div class="no-description">No values.</div>
      `;
    }
    return html`
    <ul class="enum-values">
      ${values.map((i, index) => html`<li class="input-item">
        ${this._textInputTemplate(item.type, 'enum', 'Value', this._enumChangeHandler, i, { index, css: 'list-input', noLabel: true })}
        <anypoint-icon-button data-index="${index}" title="Remove this example" @click="${this._removeEnumHandler}">
          <api-icon icon="remove" role="presentation"></api-icon>
        </anypoint-icon-button>
      </li>`)}
    </ul>
    `;
  }

  protected _typeToInputType(type: DataPropertyType): SupportedInputTypes {
    switch (type) {
      case 'integer':
      case 'number': return 'number';
      case 'date': return 'date';
      case 'time': return 'time';
      case 'datetime': return 'datetime-local';
      default: return 'text';
    }
  }

  protected _typedInputElement(type: DataPropertyType, name: string, label: string, changeHandler: Function, value?: string): TemplateResult {
    if (type === 'boolean') {
      return this._booleanInputTemplate(type, name, label, changeHandler, value);
    }
    if (type === 'nil') {
      return this._nilInputTemplate(type, name, label, changeHandler, value);
    }
    return this._textInputTemplate(type, name, label, changeHandler, value);
  }

  protected _textInputTemplate(type: DataPropertyType, name: string, label: string, changeHandler: Function, value?: string, opts: IInputTemplateOptions = {}): TemplateResult {
    const inputType = this._typeToInputType(type);
    let step: string | undefined;
    if (['time', 'datetime-local'].includes(type) || type === 'integer') {
      step = '1';
    }
    return html`
    <anypoint-input 
      class="input ${opts.css ? opts.css : ''}" 
      data-index="${ifDefined(opts.index)}"
      name="${name}" 
      .value="${value}" 
      label="${label}" 
      type="${inputType}"
      .step="${step}"
      .noLabelFloat="${!!opts.noLabel}"
      @change="${changeHandler}"></anypoint-input>
    `;
  }

  protected _nilInputTemplate(type: DataPropertyType, name: string, label: string, changeHandler: Function, value?: string): TemplateResult {
    return html`
    <anypoint-dropdown-menu
      name="${name}"
      fitPositionTarget
      class="input"
    >
      <label slot="label">${label}</label>
      <anypoint-listbox 
        slot="dropdown-content" 
        tabindex="-1" 
        @selected="${changeHandler}" 
        attrForSelected="data-value" 
        .selected="${value}"
        fallbackSelection=""
      >
      <anypoint-item data-value="">None</anypoint-item>
      <anypoint-item data-value="null">Nil</anypoint-item>
      </anypoint-listbox>
    </anypoint-dropdown-menu>
    `;
  }

  protected _booleanInputTemplate(type: DataPropertyType, name: string, label: string, changeHandler: Function, value?: string): TemplateResult {
    return html`
    <anypoint-dropdown-menu
      name="${name}"
      fitPositionTarget
      class="input"
    >
      <label slot="label">${label}</label>
      <anypoint-listbox 
        slot="dropdown-content" 
        tabindex="-1" 
        @selected="${changeHandler}" 
        attrForSelected="data-value" 
        .selected="${value}"
        fallbackSelection=""
      >
      <anypoint-item data-value="">None</anypoint-item>
      <anypoint-item data-value="true">True</anypoint-item>
      <anypoint-item data-value="false">False</anypoint-item>
      </anypoint-listbox>
    </anypoint-dropdown-menu>
    `;
  }

  protected _typeSelector(item: DataProperty): TemplateResult {
    const { type = 'any' } = item;
    return html`
    <anypoint-dropdown-menu
      name="type"
      title="Property data type"
      fitPositionTarget
      class="input"
    >
      <label slot="label">Data type</label>
      <anypoint-listbox 
        slot="dropdown-content" 
        tabindex="-1" 
        @selected="${this._typeHandler}" 
        attrForSelected="data-value" 
        .selected="${type}"
      >
      ${DataPropertyTypes.map(value => html`<anypoint-item data-value="${value}">${value}</anypoint-item>`)}
      </anypoint-listbox>
    </anypoint-dropdown-menu>
    `;
  }
}
