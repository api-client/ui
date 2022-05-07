import { AnypointCheckboxElement, AnypointInputElement, AnypointListboxElement } from "@anypoint-web-components/awc";
import { DataNamespace, DataProperty, DataPropertyType, DataPropertyTypes, EventUtils } from "@api-client/core/build/browser.js";
import { css, CSSResult, html, PropertyValueMap, TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import '@anypoint-web-components/awc/dist/define/anypoint-input.js';
import '@anypoint-web-components/awc/dist/define/anypoint-dropdown-menu.js';
import '@anypoint-web-components/awc/dist/define/anypoint-listbox.js';
import '@anypoint-web-components/awc/dist/define/anypoint-item.js';
import '@anypoint-web-components/awc/dist/define/anypoint-checkbox.js';
import '@anypoint-web-components/awc/dist/define/anypoint-chip-input.js';
import ApiElement from "../ApiElement.js";
import EditorCommon from './CommonStyles.js';
import theme from '../theme.js';

export default class PropertyFormElement extends ApiElement {
  static get styles(): CSSResult[] {
    return [
      theme,
      EditorCommon,
      css`
      :host {
        display: block;
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

  protected render(): TemplateResult {
    const { _property: item } = this;
    if (!item) {
      return html``;
    }
    const { info, multiple = false, required = false, primary = false, index = false, tags } = item;
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
    </form>
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
