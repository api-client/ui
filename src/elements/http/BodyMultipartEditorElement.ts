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
import { IMultipartBody, PayloadSerializer } from '@api-client/core/build/browser.js';
import '@anypoint-web-components/awc/dist/define/anypoint-input.js';
import '@anypoint-web-components/awc/dist/define/anypoint-switch.js';
import '@anypoint-web-components/awc/dist/define/anypoint-button.js';
import { AnypointInputElement, AnypointSwitchElement } from '@anypoint-web-components/awc';
import '../../define/api-icon.js';
import elementStyles from './Multipart.styles.js';
import {
  valueValue,
  modelValue,
  valueChanged,
  notifyChange,
  modelToValue,
  modelChanged,
  addFile,
  addText,
  formTemplate,
  addParamTemplate,
  filePartTemplate,
  textPartTemplate,
  paramItemTemplate,
  paramToggleTemplate,
  paramRemoveTemplate,
  removeParamHandler,
  enabledHandler,
  filePartNameHandler,
  filePartValueHandler,
  pickFileHandler,
  textPartNameHandler,
  textPartValueHandler,
  internalModel,
  internalFromModel,
  setFormValue,
} from './internals.js';


let hasSupport: boolean;
try {
  const fd = new FormData();
  fd.append('test', new Blob(['.'], { type: 'image/jpg' }), 'test.jpg');
  hasSupport = ('entries' in fd);
} catch (e) {
  /* istanbul ignore next  */
  hasSupport = false;
}
export const hasFormDataSupport = hasSupport;

/**
 * The internal representation of the model that has the original File object.
 */
interface IMultipartInternalBody extends IMultipartBody {
  file?: File | Blob;
}

/**
 * Converts blob data to base64 string.
 *
 * @param blob File or blob object to be translated to string
 * @returns Promise resolved to a base64 string data from the file.
 */
function blobToString(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = (): void => {
      resolve(String(reader.result));
    };
    reader.onerror = (): void => {
      reject(new Error('Unable to convert blob to string.'));
    };
    reader.readAsDataURL(blob);
  });
}

/**
 * Multipart payload editor for ARC/API Console body editor.
 *
 * On supported browsers (full support for FormData, Iterator and ArrayBuffer) it will render a
 * UI controls to generate payload message preview.
 *
 * It produces a FormData object that can be used in XHR / Fetch or transformed to ArrayBuffer to be
 * used in socket connection.
 */
export default class BodyMultipartEditorElement extends LitElement {
  static get styles(): CSSResult {
    return elementStyles;
  }

  /**
   * When set the editor is in read only mode.
   */
  @property({ type: Boolean }) readOnly = false;

  /**
   * When set all controls are disabled in the form
   */
  @property({ type: Boolean }) disabled = false;

  /** 
   * When set it ignores the content type processing.
   * This disables option "current header value", in raw editor, and disabled information about 
   * content-type header update.
   */
  @property({ type: Boolean }) ignoreContentType = false;

  protected [valueValue] = new FormData();

  /**
   * The value of this form. It is a FormData object with the user entered values.
   * Do not set the `value` when setting the `model`. When setting both 
   * the element would compute the value from model or the other way around, depending
   * which operation is the last.
   * When a model is already generated, use only model.
   */
  @property({ type: Object })
  get value(): FormData {
    return this[valueValue];
  }

  set value(value: FormData) {
    const old = this[valueValue];
    if (old === value || !(value instanceof FormData)) {
      return;
    }
    this[valueValue] = value;
    this.requestUpdate('value', old);
    this[valueChanged](value);
    // Note, never set `value` property internally in the element
    // as this will regenerate the entire view model which is 
    // not very efficient. Instead set the private value and 
    // request for the update.
  }

  /** 
   * The model used by the external application
   */
  [modelValue]: IMultipartBody[] = [];

  /** 
   * Internal model that is in sync with the external model but keeps used input
   * rather than transformed data..
   */
  [internalModel]: IMultipartInternalBody[] = [];

  /**
   * Computed data model for the view.
   * Don't set both `value` and `model`. If the model exists then
   * set only it or otherwise the `value` setter override the model.
   */
  @property({ type: Array })
  get model(): IMultipartBody[] {
    return this[modelValue];
  }

  set model(value: IMultipartBody[]) {
    const old = this[modelValue];
    if (old === value) {
      return;
    }
    if (Array.isArray(value)) {
      this[modelValue] = value;
    } else {
      this[modelValue] = [];
    }
    this[modelChanged](value);
    // Note, never set `model` property internally in the element
    // as this will regenerate the entire `value` which is 
    // not very efficient. Instead set the private value and 
    // request for the update.
  }

  /**
   * Adds an instance of a file to the form data
   */
  async addFile(file: File): Promise<void> {
    if (this.readOnly || this.disabled) {
      return;
    }
    if (!this.model) {
      this[modelValue] = [];
    }
    if (!this[internalModel]) {
      this[internalModel] = [];
    }
    const { model } = this;
    const entry = await PayloadSerializer.serializeFormDataEntry(file.name, file);
    model.push(entry);
    this[internalModel].push({ ...entry, file });
    const { value: form } = this;
    if (form.has(entry.name)) {
      form.delete(entry.name);
    }
    this[setFormValue](entry, file);
    this[notifyChange]();
    this.requestUpdate();
  }

  [notifyChange](): void {
    this.dispatchEvent(new Event('change'));
  }

  /**
   * Updates properties when the model change externally
   */
  async [modelChanged](model: IMultipartBody[]): Promise<void> {
    this[valueValue] = this[modelToValue](model);
    if (Array.isArray(model)) {
      this[internalModel] = await this[internalFromModel](model);
    }
    this.requestUpdate();
  }

  /**
   * Transforms view model into the FormData object.
   *
   * @param model The view model
   */
  [modelToValue](model: IMultipartBody[]): FormData {
    if (!Array.isArray(model) || !model.length) {
      return new FormData();
    }
    return PayloadSerializer.deserializeFormData(model);
  }

  /**
   * Called when the `value` property change. It generates the view model
   * for the editor.
   */
  async [valueChanged](value?: FormData): Promise<void> {
    if (!value) {
      this[modelValue] = [];
      this[internalModel] = [];
      return;
    }
    const data = await PayloadSerializer.stringifyFormData((value as unknown) as Iterable<(string | File)[]>);
    this[modelValue] = data.data as IMultipartBody[];
    this[internalModel] = await this[internalFromModel](data.data as IMultipartBody[]);
    this.requestUpdate();
  }

  /**
   * Creates the core's multipart body model to our internal model.
   */
  async [internalFromModel](model: IMultipartBody[]): Promise<IMultipartInternalBody[]> {
    const result: IMultipartInternalBody[] = [];
    for (const item of model) {
      const { isFile, value, type } = item;
      const copy = { ...item } as IMultipartInternalBody;

      if (isFile) {
        try {
          const blob = PayloadSerializer.deserializeBlob(value);
          // @ts-ignore
          blob.name = item.fileName;
          copy.file = blob;
          result.push(copy)
        } catch (e) {
          // ...
        }
      } else if (type) {
        try {
          const blob = PayloadSerializer.deserializeBlob(value);
          // eslint-disable-next-line no-await-in-loop
          copy.value = await blob!.text();
          result.push(copy);
        } catch (e) {
          // ...
        }
      } else {
        result.push(copy);
      }
    }
    return result;
  }

  /**
   * Adds a new text part to the list.
   * It does not update the FormData as there's no value just yet.
   */
  [addText](): void {
    if (this.readOnly || this.disabled) {
      return;
    }
    const { model } = this;
    const obj: IMultipartBody = {
      name: '',
      value: '',
      enabled: true,
      isFile: false,
    };
    model.push(obj);
    this[internalModel].push({ ...obj });
    this.requestUpdate();
  }

  /**
   * Adds a new text part to the list.
   * It does not update the FormData as there's no value just yet.
   */
  [addFile](): void {
    if (this.readOnly || this.disabled) {
      return;
    }
    const { model } = this;
    const obj: IMultipartBody = {
      name: '',
      value: '',
      enabled: true,
      isFile: true,
    };
    model.push(obj);
    this[internalModel].push({ ...obj });
    this.requestUpdate();
  }

  /**
   * Handler to the remove a parameter
   */
  [removeParamHandler](e: Event): void {
    const node = e.currentTarget as HTMLElement;
    const index = Number(node.dataset.index);
    const items = this.model;
    const item = items[index];
    items.splice(index, 1);
    this[internalModel].splice(index, 1);
    this.value.delete(item.name);
    this.requestUpdate();
    this[notifyChange]();
  }

  [enabledHandler](e: Event): void {
    const node = e.target as AnypointSwitchElement;
    const index = Number(node.dataset.index);
    const items = this.model;
    const item = items[index];
    const { checked } = node;
    item.enabled = checked;
    this[internalModel][index].enabled = checked;
    if (!item.enabled) {
      this.value.delete(item.name);
    } else if (item.enabled && item.name) {
      const setValue = item.isFile ? this[internalModel][index].file! : item.value;
      this[setFormValue](item, setValue);
    }
    this[notifyChange]();
  }

  /**
   * @param item Item definition
   * @param value The value to set. Value in the item is ignored
   */
  [setFormValue](item: IMultipartBody, value: File | Blob | string): void {
    if (!value || !item.name) {
      return;
    }
    if (item.isFile) {
      this.value.set(item.name, value);
    } else if (item.type) {
      const blob = new Blob([value || ''], { type: item.type });
      this.value.set(item.name, blob, 'blob');
    } else {
      this.value.set(item.name, value);
    }
  }

  [filePartNameHandler](e: Event): void {
    const input = e.target as AnypointInputElement;
    const { value } = input;
    const index = Number(input.dataset.index);
    const item = this.model[index];
    const old = item.name;
    if (old === value) {
      return;
    }
    const { value: form } = this;
    item.name = value;
    this[internalModel][index].name = value;
    if (form.has(old)) {
      const current = form.get(old)!;
      form.delete(old);
      form.set(value, current);
    }
    this[notifyChange]();
  }

  [pickFileHandler](e: Event): void {
    const node = e.target as HTMLElement;
    const input = node.nextElementSibling as HTMLInputElement;
    input.click();
  }

  async [filePartValueHandler](e: Event): Promise<void> {
    e.stopPropagation();
    const input = e.target as HTMLInputElement;
    const files = input.files as FileList;
    const file = files[0];
    const index = Number(input.dataset.index);
    const item = this.model[index];
    const { value: form } = this;
    const value = await blobToString(file);
    item.value = value;
    this[internalModel][index].file = file;
    item.fileName = file.name;
    if (form.has(item.name)) {
      form.delete(item.name);
    }
    this[setFormValue](item, file);
    this[notifyChange]();
    this.requestUpdate();
  }

  [textPartNameHandler](e: Event): void {
    const input = e.target as AnypointInputElement;
    const { value } = input;
    const index = Number(input.dataset.index);
    const item = this.model[index];
    const old = item.name;
    if (old === value) {
      return;
    }
    const { value: form } = this;
    item.name = value;
    this[internalModel][index].name = value;
    if (form.has(old)) {
      const current = form.get(old)!;
      form.delete(old);
      form.set(value, current);
    }
    this[notifyChange]();
  }

  async [textPartValueHandler](e: Event): Promise<void> {
    e.stopPropagation();
    const input = e.target as AnypointInputElement;
    const { value } = input;
    const index = Number(input.dataset.index);
    const prop = input.dataset.property as 'value' | 'type';
    const item = this.model[index];
    const old = item[prop];
    if (old === value) {
      return;
    }
    if (prop === 'type') {
      // when changing data type it needs to read the original value
      // from the user input, not the already transformed one.
      const textValue = this[internalModel][index].value;
      item.value = textValue;
    }
    item[prop] = value;
    this[internalModel][index][prop] = value;
    if (!item.name) {
      return;
    }
    const { value: form } = this;
    if (form.has(item.name)) {
      form.delete(item.name);
    }
    this[setFormValue](item, item.value);
    if (item.type) {
      // transform only blob values
      item.value = await blobToString(form.get(item.name) as Blob);
    }
    this[notifyChange]();
    this.requestUpdate();
  }

  render(): TemplateResult {
    if (!hasSupport) {
      return html`<p>The current browser does not support this editor</p>`;
    }
    const { ignoreContentType } = this;
    return html`
    ${this[formTemplate]()}
    ${this[addParamTemplate]()}
    ${ignoreContentType ? '' : html`<p class="mime-info">
      <api-icon icon="info" class="info"></api-icon>
      The content-type header will be updated for this request when the HTTP message is generated.
    </p>`}
    `;
  }

  [addParamTemplate](): TemplateResult {
    const { readOnly, disabled } = this;
    return html`
    <div class="form-actions">
      <anypoint-button
        emphasis="medium"
        @click="${this[addFile]}"
        class="add-param file-part"
        ?disabled="${readOnly || disabled}"
      >
        Add file part
      </anypoint-button>
      <anypoint-button
        emphasis="medium"
        @click="${this[addText]}"
        class="add-param text-part"
        ?disabled="${readOnly || disabled}"
      >
        Add text part
      </anypoint-button>
    </div>`
  }

  [formTemplate](): TemplateResult {
    const items = this[internalModel];
    if (!items.length) {
      return html`<p class="empty-list">Add a part to the list</p>`;
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

  /**
   * @param part The form part
   * @param index The index on the list
   */
  [paramItemTemplate](part: IMultipartInternalBody, index: number): TemplateResult {
    let tpl;
    if (part.isFile) {
      tpl = this[filePartTemplate](part, index);
    } else {
      tpl = this[textPartTemplate](part, index);
    }
    return html`
    <div class="form-row">
      ${this[paramToggleTemplate](part, index)}
      ${tpl}
      ${this[paramRemoveTemplate](index)}
    </div>
    `;
  }

  /**
   * @param part The form part
   * @param index The index on the list
   * @returns A template for the file part
   */
  [filePartTemplate](part: IMultipartInternalBody, index: number): TemplateResult {
    const { readOnly } = this;
    const typedValue = part.file as File;
    return html`
    <anypoint-input
      autoValidate
      required
      .value="${part.name}"
      data-property="name"
      data-index="${index}"
      class="param-name"
      ?readOnly="${readOnly}"
      noLabelFloat
      @change="${this[filePartNameHandler]}"
    >
      <label slot="label">Part name</label>
    </anypoint-input>
    <div class="param-value">
      <anypoint-button @click="${this[pickFileHandler]}">Choose file</anypoint-button>
      <input type="file" hidden data-index="${index}" @change="${this[filePartValueHandler]}"/>
      ${typedValue ? html`<span class="file-info">${typedValue.name} (${typedValue.type}), ${typedValue.size} bytes</span>` : ''}
    </div>
    `;
  }

  /**
   * @param part The form part
   * @param index The index on the list
   * @returns A template for the text part
   */
  [textPartTemplate](part: IMultipartInternalBody, index: number): TemplateResult {
    const { readOnly } = this;
    return html`
    <anypoint-input
      autoValidate
      required
      .value="${part.name}"
      data-property="name"
      data-index="${index}"
      class="param-name"
      ?readOnly="${readOnly}"
      noLabelFloat
      @change="${this[textPartNameHandler]}"
    >
      <label slot="label">Part name</label>
    </anypoint-input>

    <anypoint-input
      autoValidate
      required
      .value="${part.value}"
      data-property="value"
      data-index="${index}"
      class="param-value"
      ?readOnly="${readOnly}"
      noLabelFloat
      @change="${this[textPartValueHandler]}"
    >
      <label slot="label">Part value</label>
    </anypoint-input>
    <anypoint-input
      .value="${part.type}"
      data-property="type"
      data-index="${index}"
      class="param-type"
      ?readOnly="${readOnly}"
      noLabelFloat
      @change="${this[textPartValueHandler]}"
    >
      <label slot="label">Part mime (optional)</label>
    </anypoint-input>
    `;
  }

  /**
   * @returns Template for the parameter name input
   */
  [paramRemoveTemplate](index: number): TemplateResult {
    const { readOnly } = this;
    return html`
    <anypoint-icon-button
      data-index="${index}"
      @click="${this[removeParamHandler]}"
      title="Remove this parameter"
      aria-label="Activate to remove this item"
      ?disabled="${readOnly}"
      data-action="remove"
    >
      <api-icon icon="remove"></api-icon>
    </anypoint-icon-button>
    `;
  }

  /**
   * @returns Template for the parameter name input
   */
  [paramToggleTemplate](item: IMultipartBody, index: number): TemplateResult {
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
}
