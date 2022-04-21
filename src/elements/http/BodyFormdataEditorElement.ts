/* eslint-disable class-methods-use-this */
/**
@license
Copyright 2020 The Advanced REST client authors <arc@mulesoft.com>
Licensed under the Apache License, Version 2.0 (the "License"); you may not
use this file except in compliance with the License. You may obtain a copy of
the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
License for the specific language governing permissions and limitations under
the License.
*/
import { LitElement, html, CSSResult, TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import '@anypoint-web-components/awc/dist/define/anypoint-input.js';
import '@anypoint-web-components/awc/dist/define/anypoint-switch.js';
import { IProperty, Property } from '@api-client/core/build/browser.js';
import { AnypointInputElement, AnypointSwitchElement } from '@anypoint-web-components/awc';
import '../../define/api-icon.js';
import elementStyles from './Formdata.styles.js';
import {
  valueValue,
  modelValue,
  valueChanged,
  notifyChange,
  formTemplate,
  actionsTemplate,
  paramItemTemplate,
  paramToggleTemplate,
  paramNameInput,
  paramValueInput,
  paramRemoveTemplate,
  paramInputHandler,
  removeParamHandler,
  enabledHandler,
  modelChanged,
  modelToValue,
  encodeParameters,
  decodeParameters,
  addParamHandler,
  addParamTemplate,
} from './internals.js';
import { 
  decodeUrlEncoded,
  encodeUrlEncoded,
  createViewModel,
  formArrayToString,
} from './UrlEncodeUtils.js';


export default class BodyFormdataEditorElement extends LitElement {
  static get styles(): CSSResult {
    return elementStyles;
  }

  /**
   * When set the editor is in read only mode.
   */
  @property({ type: Boolean, reflect: true }) readOnly = false;

  /**
   * When set all controls are disabled in the form
   */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /** 
   * When set it automatically encodes and decodes values.
   */
  @property({ type: Boolean, reflect: true }) autoEncode = false;

  [valueValue] = '';

  /**
   * The HTTP body.
   */
  @property({ type: String })
  get value(): string {
    return this[valueValue];
  }

  set value(value: string) {
    const old = this[valueValue];
    if (old === value) {
      return;
    }
    this[valueValue] = value;
    this[valueChanged](value);
  }

  [modelValue]: IProperty[] = [];

  /**
   * Computed data model for the view.
   * Don't set both `value` and `model`. If the model exists then
   * set only it or otherwise the `value` setter override the model.
   */
  get model(): IProperty[] {
    return this[modelValue];
  }

  set model(value: IProperty[]) {
    const old = this[modelValue];
    if (old === value) {
      return;
    }
    if (Array.isArray(value)) {
      this[modelValue] = value;
    } else {
      this[modelValue] = [];
    }
    this[valueValue] = this[modelToValue]();
    this.requestUpdate();
  }

  [notifyChange](): void {
    this.dispatchEvent(new Event('change'));
  }

  [modelChanged](): void {
    if (this.readOnly) {
      return;
    }
    this[valueValue] = this[modelToValue]();
    this[notifyChange]();
  }

  [modelToValue](): string {
    const { model, autoEncode } = this;
    
    if (autoEncode) {
      const encoded = encodeUrlEncoded(model) as IProperty[];
      return formArrayToString(encoded);
    }
    return formArrayToString(this.model);
  }

  /**
   * Called when the `value` property change. It generates the view model
   * for the editor.
   */
  [valueChanged](value: string): void {
    if (!value) {
      this.model = [];
      return;
    }
    const model = createViewModel(value) as IProperty[];
    if (this.autoEncode) {
      this[modelValue] = decodeUrlEncoded(model) as IProperty[];
    } else {
      this[modelValue] = model;
    }
    this.requestUpdate();
  }

  /**
   * Handler to the remove a parameter
   */
  [removeParamHandler](e: Event): void {
    const node = e.currentTarget as HTMLElement;
    const index = Number(node.dataset.index);
    const items = this.model;
    items.splice(index, 1);
    this[modelChanged]();
    this.requestUpdate();
  }

  [enabledHandler](e: Event): void {
    const node = e.target as AnypointSwitchElement;
    const index = Number(node.dataset.index);
    const items = this.model;
    const item = items[index];
    item.enabled = node.checked;
    this[modelChanged]();
  }

  [paramInputHandler](e: Event): void {
    e.stopPropagation();
    const node = e.target as AnypointInputElement;
    const { value } = node;
    const prop = node.dataset.property as 'name' | 'value';
    const index = Number(node.dataset.index);
    const item = this.model[index];
    const old = item[prop];
    if (old === value) {
      return;
    }
    item[prop] = value;
    this[modelChanged]();
  }

  /**
   * Focuses on the last query parameter name filed
   */
  focusLastName(): void {
    if (!this.shadowRoot) {
      return;
    }
    const row = this.shadowRoot.querySelector('.params-list > :last-child');
    if (!row) {
      return;
    }
    try {
      const node = row.querySelector('.param-name');
      // @ts-ignore
      node.focus();
    } catch (e) {
      // ...
    }
  }

  /**
   * Adds a new parameter to the list.
   */
  async [addParamHandler](): Promise<void> {
    if (this.readOnly || this.disabled) {
      return;
    }
    const prop = Property.String('', '', true);
    const items = this.model;
    items[items.length] = prop.toJSON();
    this.model = items;
    this.requestUpdate();
    await this.updateComplete;
    setTimeout(() => {
      this.focusLastName();
    });
  }

  /**
   * Encodes current parameters in the model, updated the value, and notifies the change
   */
  [encodeParameters](): void {
    const encoded = encodeUrlEncoded(this.model) as IProperty[];
    this[modelValue] = encoded;
    this[valueValue] = formArrayToString(encoded);
    this[notifyChange]();
    this.requestUpdate();
  }

  /**
   * Encodes current parameters in the model, updated the value, and notifies the change
   */
  [decodeParameters](): void {
    const decoded = decodeUrlEncoded(this.model) as IProperty[];
    this[modelValue] = decoded;
    this[valueValue] = formArrayToString(decoded);
    this[notifyChange]();
    this.requestUpdate();
  }

  render(): TemplateResult {
    return html`
    ${this[formTemplate]()}
    ${this[addParamTemplate]()}
    ${this[actionsTemplate]()}`;
  }

  [formTemplate](): TemplateResult {
    const items = this.model;
    if (!Array.isArray(items) || !items.length) {
      return html`<p class="empty-list">Add a parameter to the list</p>`;
    }
    return html`
    <div class="table-labels">
      <span class="param-name-label">Name</span>
      <span class="param-value-label">Value</span>
    </div>
    <div class="params-list">
      ${items.map((item, index) => this[paramItemTemplate](item, index))}
    </div>
    `;
  }

  [addParamTemplate](): TemplateResult {
    const { readOnly, disabled } = this;
    return html`<div class="query-actions">
    <anypoint-button
      emphasis="low"
      @click="${this[addParamHandler]}"
      class="add-param"
      ?disabled="${readOnly || disabled}"
    >
      <api-icon icon="add"></api-icon> Add
    </anypoint-button>
  </div>`
  }

  [paramItemTemplate](item: IProperty, index: number): TemplateResult {
    return html`
    <div class="form-row">
      ${this[paramToggleTemplate](item, index)}
      ${this[paramNameInput](item, index)}
      ${this[paramValueInput](item, index)}
      ${this[paramRemoveTemplate](index)}
    </div>`;
  }

  /**
   * @returns Template for the parameter name input
   */
  [paramRemoveTemplate](index: number): TemplateResult {
    const { readOnly } = this;
    return html`
    <anypoint-icon-button
      data-index="${index}"
      data-action="remove"
      @click="${this[removeParamHandler]}"
      title="Remove this parameter"
      aria-label="Activate to remove this item"
      ?disabled="${readOnly}"
    >
      <api-icon icon="remove"></api-icon>
    </anypoint-icon-button>
    `;
  }

  /**
   * @returns Template for the parameter name input
   */
  [paramToggleTemplate](item: IProperty, index: number): TemplateResult {
    const { readOnly } = this;
    return html`
    <anypoint-switch
      data-index="${index}"
      .checked="${item.enabled}"
      @checkedchange="${this[enabledHandler]}"
      title="Enable / disable parameter"
      aria-label="Activate to toggle enabled state of this item"
      class="param-switch"
      ?disabled="${readOnly}"
    ></anypoint-switch>
    `;
  }

  /**
   * @returns Template for the parameter name input
   */
  [paramNameInput](item: IProperty, index: number): TemplateResult {
    const { readOnly, autoEncode } = this;
    const hasPattern = !autoEncode;
    const pattern = hasPattern ? '\\S*' : undefined;
    return html`
    <anypoint-input
      ?autoValidate="${hasPattern}"
      .value="${item.name}"
      data-property="name"
      data-index="${index}"
      class="param-name"
      ?readOnly="${readOnly}"
      .pattern="${pattern}"
      @change="${this[paramInputHandler]}"
      noLabelFloat
    >
      <label slot="label">Parameter name</label>
    </anypoint-input>
    `;
  }

  /**
   * @returns Template for the parameter value input
   */
  [paramValueInput](item: IProperty, index: number): TemplateResult {
    const { readOnly, autoEncode } = this;
    const hasPattern = !autoEncode;
    const pattern = hasPattern ? '\\S*' : undefined;
    return html`
    <anypoint-input
      ?autoValidate="${hasPattern}"
      .value="${item.value}"
      data-property="value"
      data-index="${index}"
      class="param-value"
      ?readOnly="${readOnly}"
      .pattern="${pattern}"
      @change="${this[paramInputHandler]}"
      noLabelFloat
    >
      <label slot="label">Parameter value</label>
    </anypoint-input>
    `;
  }

  [actionsTemplate](): TemplateResult | string {
    const { readOnly, autoEncode } = this;
    if (autoEncode) {
      return '';
    }
    return html`
    <div class="dialog-actions">
      <anypoint-button
        id="encode"
        @click="${this[encodeParameters]}"
        title="URL encodes parameters in the editor"
        ?disabled="${readOnly}"
      >Encode values</anypoint-button>
      <anypoint-button
        id="decode"
        @click="${this[decodeParameters]}"
        title="URL decodes parameters in the editor"
        ?disabled="${readOnly}"
      >Decode values</anypoint-button>
    </div>`;
  }
}
