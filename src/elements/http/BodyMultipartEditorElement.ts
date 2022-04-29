/* eslint-disable no-param-reassign */
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
import { IMultipartBody, ISafePayload, PayloadSerializer, IFileMeta, IBlobMeta } from '@api-client/core/build/browser.js';
import '@anypoint-web-components/awc/dist/define/anypoint-input.js';
import '@anypoint-web-components/awc/dist/define/anypoint-switch.js';
import '@anypoint-web-components/awc/dist/define/anypoint-button.js';
import { AnypointInputElement, AnypointSwitchElement } from '@anypoint-web-components/awc';
import '../../define/api-icon.js';
import elementStyles from './Multipart.styles.js';

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

function normalizePartValue(item: IMultipartBody): void {
  if (typeof item.value === 'string') {
    const oldValue = item.value;
    // eslint-disable-next-line no-param-reassign
    item.value = {
      type: 'string',
      data: oldValue,
    };
  }
}

/**
 * Multipart payload editor.
 *
 * The element internally uses a generated from a FormData model. It is API Client's `IMultipartBody` array.
 * The FormData is generated on-fly when accessing the `value` getter. It also regenerates the model when 
 * the `value` property change. Because of that you should never set the value on the editor but only manipulate the 
 * `model` property.
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

  /**
   * The value of this form. 
   * When reading the `value` it generated the FormData from the model values.
   * When setting this property is regenerates the `model` to the value in the FormData.
   * When setting to anything other than the `FormData` it sets the `model` to an empty array.
   */
  @property({ type: Object })
  get value(): FormData {
    return this.toFormData();
  }

  set value(value: FormData) {
    this._updateModel(value);
  }

  /** 
   * The model used by the external application
   */
  protected _modelValue: IMultipartBody[] = [];

  /**
   * Computed data model for the view.
   * Don't set both `value` and `model`. If the model exists then
   * set only it or otherwise the `value` setter override the model.
   */
  @property({ type: Array })
  get model(): IMultipartBody[] {
    return this._modelValue;
  }

  set model(value: IMultipartBody[]) {
    const old = this._modelValue;
    if (old === value) {
      return;
    }
    if (Array.isArray(value)) {
      this._modelValue = value;
    } else {
      this._modelValue = [];
    }
    this.requestUpdate('model', old);
    if (value) {
      this._upgradeLegacy(value);
    }
  }

  /**
   * @returns The FormData from the current model.
   */
  toFormData(): FormData {
    const validItems = this._modelValue.filter((item) => {
      const { name, value } = item;
      if (!name) {
        return false;
      }
      if (typeof value === 'string') {
        return true;
      }
      if (value.type === 'string') {
        return true;
      }
      if (value.type === 'blob' || value.type === 'file') {
        return !!value.data && !!value.data.length;
      }
      return true;
    });
    return PayloadSerializer.deserializeFormData(validItems);
  }

  /**
   * Makes an attempt to upgrade old definitions of the `IMultipartBody`.
   * If this fails, the form will show error instead of part field.
   * @param value The current model.
   */
  protected async _upgradeLegacy(value: IMultipartBody[]): Promise<void> {
    const ps: Promise<void>[] = [];
    for (const part of value) {
      if (part.isFile === undefined) {
        continue;
      }
      if (part.isFile === false && !part.type) {
        delete part.isFile;
        const oldValue = (part.value || '') as string;
        part.value = {
          type: 'string',
          data: oldValue,
        };
      } else if (part.isFile === false && part.type) {
        ps.push(this._upgradeLegacyBlob(part));
      } else {
        ps.push(this._upgradeLegacyFile(part));
      }
    }
    if (ps.length) {
      await Promise.allSettled(ps);
      this.requestUpdate();
      this._notifyChange();
    }
  }

  protected async _upgradeLegacyBlob(part: IMultipartBody): Promise<void> {
    if (typeof part.value !== 'string') {
      return;
    }
    const readBlob = PayloadSerializer.deserializeBlobLegacy(part.value as string);
    if (!readBlob) {
      return;
    }
    const contents = await readBlob.text();
    part.blobText = contents || '';
    const blob = new Blob([part.blobText!], { type: part.type });
    part.value = await PayloadSerializer.stringifyBlob(blob);
    delete part.type;
    delete part.isFile;
  }

  protected async _upgradeLegacyFile(part: IMultipartBody): Promise<void> {
    if (typeof part.value !== 'string') {
      return;
    }
    const readBlob = PayloadSerializer.deserializeBlobLegacy(part.value as string);
    if (!readBlob) {
      return;
    }
    const fname = part.fileName || 'unknown-file.txt';
    const file = new File([readBlob], fname, { type: readBlob.type });
    part.value = await PayloadSerializer.stringifyFile(file);
    delete part.fileName;
    delete part.isFile;
  }

  protected async _updateModel(value?: unknown): Promise<void> {
    if (!value || !(value instanceof FormData)) {
      this.model = [];
      return;
    }
    const payload = await PayloadSerializer.stringifyFormData(value as FormData);
    this.model = payload.data as IMultipartBody[];
  }

  /**
   * Adds an instance of a file to the form data
   */
  async addFile(file: File): Promise<void> {
    if (this.readOnly || this.disabled) {
      return;
    }
    const { model } = this;
    const entry = await PayloadSerializer.serializeFormDataEntry(file.name, file);
    model.push(entry);
    this._notifyChange();
    this.requestUpdate();
  }

  protected _notifyChange(): void {
    this.dispatchEvent(new Event('change'));
  }

  /**
   * Adds an empty text part item to the form.
   */
  addEmptyText(): void {
    if (this.readOnly || this.disabled) {
      return;
    }
    const { model } = this;
    const obj: IMultipartBody = {
      name: '',
      value: {
        data: '',
        type: 'string',
      },
      enabled: true,
    };
    model.push(obj);
    this.requestUpdate();
  }

  /**
   * Adds an empty file part item to the form.
   */
  addEmptyFile(): void {
    if (this.readOnly || this.disabled) {
      return;
    }
    const { model } = this;
    const obj: IMultipartBody = {
      name: '',
      value: {
        data: [],
        type: 'file',
      },
      enabled: true,
    };
    model.push(obj);
    this.requestUpdate();
  }

  /**
   * Adds a new text part to the list.
   * It does not update the FormData as there's no value just yet.
   */
  protected _addTextHandler(): void {
    this.addEmptyText();
  }

  /**
   * Adds a new text part to the list.
   * It does not update the FormData as there's no value just yet.
   */
  protected _addFileHandler(): void {
    this.addEmptyFile();
  }

  /**
   * Handler to the remove a parameter
   */
  protected _removeParamHandler(e: Event): void {
    const node = e.currentTarget as HTMLElement;
    const index = Number(node.dataset.index);
    const items = this.model;
    items.splice(index, 1);
    this.requestUpdate();
    this._notifyChange();
  }

  protected _enabledHandler(e: Event): void {
    const node = e.target as AnypointSwitchElement;
    const index = Number(node.dataset.index);
    const items = this.model;
    const item = items[index];
    const { checked } = node;
    item.enabled = checked;
    this._notifyChange();
  }

  protected _filePartNameHandler(e: Event): void {
    const input = e.target as AnypointInputElement;
    const { value } = input;
    const index = Number(input.dataset.index);
    const item = this.model[index];
    const old = item.name;
    if (old === value) {
      return;
    }
    item.name = value as string;
    this._notifyChange();
  }

  protected _pickFileHandler(e: Event): void {
    const node = e.target as HTMLElement;
    const input = node.nextElementSibling as HTMLInputElement;
    input.click();
  }

  protected async _filePartValueHandler(e: Event): Promise<void> {
    e.stopPropagation();
    const input = e.target as HTMLInputElement;
    const index = Number(input.dataset.index);
    this._updateFilePartValue(index, input.files![0]);
  }

  async _updateFilePartValue(index: number, file: File): Promise<void> {
    const item = this.model[index];
    if (!item || !file) {
      return;
    }
    item.value = await PayloadSerializer.stringifyFile(file);
    this._notifyChange();
    this.requestUpdate();
  }

  protected _textPartNameHandler(e: Event): void {
    const input = e.target as AnypointInputElement;
    const { value } = input;
    const index = Number(input.dataset.index);
    const item = this.model[index];
    const old = item.name;
    if (old === value) {
      return;
    }
    item.name = value as string;
    this._notifyChange();
  }

  /**
   * Updates the value of the text part.
   * When the part is the text part it simply updates the value.
   * For a blob part it regenerates the blob.
   */
  async _textPartValueHandler(e: Event): Promise<void> {
    e.stopPropagation();
    const input = e.target as AnypointInputElement;
    const index = Number(input.dataset.index);
    const item = this._modelValue[index];
    if (!item) {
      return;
    }
    const { value } = input;
    normalizePartValue(item);
    const typedValue = item.value as ISafePayload;
    if (typedValue.type === 'string') {
      typedValue.data = value as string;
    } else {
      item.blobText = value;
      const blob = new Blob([value as string], { type: typedValue.meta?.mime || 'text/plain' });
      item.value = await PayloadSerializer.stringifyBlob(blob);
    }
    this._notifyChange();
  }

  /**
   * A handler for the part's mime type. This does not only change the value's 
   * mime type but also resets the blob value.
   */
  protected async _handlePartMimeChange(e: Event): Promise<void> {
    e.stopPropagation();
    const input = e.target as AnypointInputElement;
    const index = Number(input.dataset.index);
    const item = this._modelValue[index];
    if (!item) {
      return;
    }
    const { value } = input;
    normalizePartValue(item);
    // change the type from text to blob, if needed
    const typedValue = item.value as ISafePayload;
    
    if (typedValue.type === 'string') {
      item.blobText = typedValue.data as string;
    } else if (!item.blobText && typedValue.data) {
      const restored = PayloadSerializer.deserializeBlob(typedValue);
      item.blobText = await restored!.text();
    }
    const blob = new Blob([item.blobText || ''], { type: value });
    item.value = await PayloadSerializer.stringifyBlob(blob);
    this._notifyChange();
  }

  render(): TemplateResult {
    if (!hasSupport) {
      return html`<p>The current browser does not support this editor</p>`;
    }
    const { ignoreContentType } = this;
    return html`
    ${this._formTemplate()}
    ${this._addParamTemplate()}
    ${ignoreContentType ? '' : html`<p class="mime-info">
      <api-icon icon="info" class="info"></api-icon>
      The content-type header will be updated for this request when the HTTP message is generated.
    </p>`}
    `;
  }

  _addParamTemplate(): TemplateResult {
    const { readOnly, disabled } = this;
    return html`
    <div class="form-actions">
      <anypoint-button
        emphasis="medium"
        @click="${this._addFileHandler}"
        class="add-param file-part"
        ?disabled="${readOnly || disabled}"
      >
        Add file part
      </anypoint-button>
      <anypoint-button
        emphasis="medium"
        @click="${this._addTextHandler}"
        class="add-param text-part"
        ?disabled="${readOnly || disabled}"
      >
        Add text part
      </anypoint-button>
    </div>`
  }

  _formTemplate(): TemplateResult {
    const items = this.model;
    if (!items.length) {
      return html`<p class="empty-list">Add a part to the list</p>`;
    }
    return html`
    <div class="table-labels">
      <span class="param-name-label">Name</span>
      <span class="param-value-label">Value</span>
    </div>
    <div class="params-list">
      ${items.map((item, index) => this._paramItemTemplate(item, index))}
    </div>
    `;
  }

  /**
   * @param part The form part
   * @param index The index on the list
   */
  protected _paramItemTemplate(part: IMultipartBody, index: number): TemplateResult | string {
    if (typeof part.isFile === 'boolean') {
      // When this is still set it means that when setting the model something went wrong. 
      // This also mean we can't recover from here so the only option is to remove the part.
      return this._incompatibleTemplate(index);
    }
    normalizePartValue(part);
    const value = part.value as ISafePayload;
    let tpl;
    if (value.type === 'string') {
      tpl = this._textPartTemplate(part, index);
    } else if (value.type === 'blob') {
      tpl = this._blobPartTemplate(part, index);
    } else {
      tpl = this._filePartTemplate(part, index);
    }
    return html`
    <div class="form-row">
      ${this._paramToggleTemplate(part, index)}
      ${tpl}
      ${this._paramRemoveTemplate(index)}
    </div>
    `;
  }

  protected _incompatibleTemplate(index: number): TemplateResult {
    return html`
    <div class="form-row">
      <p class="incompatible-part">This part cannot be rendered. Please, remove this part.</p>
      ${this._paramRemoveTemplate(index)}
    </div>
    `;
  }

  /**
   * @param part The form part
   * @param index The index on the list
   * @returns A template for the file part
   */
  protected _filePartTemplate(part: IMultipartBody, index: number): TemplateResult {
    const { readOnly } = this;
    const item = part.value as ISafePayload;
    const meta = item && item.meta as IFileMeta | undefined;
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
      @change="${this._filePartNameHandler}"
      label="Part name"
    ></anypoint-input>
    <div class="param-value">
      <anypoint-button @click="${this._pickFileHandler}">Choose file</anypoint-button>
      <input type="file" hidden data-index="${index}" @change="${this._filePartValueHandler}"/>
      ${meta ? html`<span class="file-info">${meta.name} (${meta.mime}), ${item.data.length} bytes</span>` : ''}
    </div>
    `;
  }

  protected _blobPartTemplate(part: IMultipartBody, index: number): TemplateResult {
    const { name, blobText } = part;
    const item = part.value as ISafePayload;
    const meta = item.meta as IBlobMeta | undefined;
    return html`
    ${this._partNameTemplate(index, name)}
    ${this._partValueTemplate(index, blobText)}
    ${this._partMimeTemplate(index, meta && meta.mime || '')}
    `;
  }

  protected _textPartTemplate(part: IMultipartBody, index: number): TemplateResult {
    const { name } = part;
    const value = (part.value as ISafePayload).data as string | undefined;
    return html`
    ${this._partNameTemplate(index, name)}
    ${this._partValueTemplate(index, value)}
    ${this._partMimeTemplate(index)}
    `;
  }

  protected _partNameTemplate(index: number, name?: string): TemplateResult {
    const { readOnly } = this;
    return html`
    <anypoint-input
      autoValidate
      required
      .value="${name}"
      data-property="name"
      data-index="${index}"
      class="param-name"
      ?readOnly="${readOnly}"
      noLabelFloat
      @change="${this._textPartNameHandler}"
      label="Part name"
    ></anypoint-input>
    `;
  }

  protected _partValueTemplate(index: number, value?: string): TemplateResult {
    const { readOnly } = this;
    return html`
    <anypoint-input
      autoValidate
      required
      .value="${value}"
      data-index="${index}"
      class="param-value"
      ?readOnly="${readOnly}"
      noLabelFloat
      @change="${this._textPartValueHandler}"
      label="Part value"
    ></anypoint-input>
    `;
  }

  protected _partMimeTemplate(index: number, value?: string): TemplateResult {
    const { readOnly } = this;
    return html`
    <anypoint-input
      .value="${value}"
      data-index="${index}"
      class="param-type"
      ?readOnly="${readOnly}"
      noLabelFloat
      @change="${this._handlePartMimeChange}"
      label="Part mime (optional)"
    ></anypoint-input>
    `;
  }

  /**
   * @returns Template for the parameter name input
   */
  protected _paramRemoveTemplate(index: number): TemplateResult {
    const { readOnly } = this;
    return html`
    <anypoint-icon-button
      data-index="${index}"
      @click="${this._removeParamHandler}"
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
  protected _paramToggleTemplate(item: IMultipartBody, index: number): TemplateResult {
    const { readOnly } = this;
    return html`
    <anypoint-switch
      data-index="${index}"
      .checked="${item.enabled || false}"
      @change="${this._enabledHandler}"
      title="Enable / disable parameter"
      aria-label="Activate to toggle enabled state of this item"
      class="param-switch"
      ?disabled="${readOnly}"
    ></anypoint-switch>
    `;
  }
}
