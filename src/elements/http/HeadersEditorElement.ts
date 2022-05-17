/* eslint-disable arrow-body-style */
/* eslint-disable no-param-reassign */
/* eslint-disable class-methods-use-this */
/**
@license
Copyright 2018 The Advanced REST client authors <arc@mulesoft.com>
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
import { html, LitElement, TemplateResult, CSSResult, css } from 'lit';
import { property, query } from 'lit/decorators.js';
import '@anypoint-web-components/awc/dist/define/anypoint-icon-button.js';
import '@anypoint-web-components/awc/dist/define/anypoint-button.js';
import '@anypoint-web-components/awc/dist/define/anypoint-input.js';
import '@anypoint-web-components/awc/dist/define/anypoint-switch.js';
import '@anypoint-web-components/awc/dist/define/anypoint-autocomplete.js';
import { EventsTargetMixin, AnypointAutocompleteElement, AnypointInputElement, AnypointSwitchElement } from '@anypoint-web-components/awc';
import { Events as CoreEvents, HttpDefinitions } from '@api-client/core/build/browser.js';
import '../../define/api-icon.js';
import { HeadersArray, IHeader } from '../../lib/http/HeadersArray.js'
import { EventTypes } from '../../events/EventTypes.js';

/**
 * An element that renders an editor that specializes in editing HTP headers.
 */
export default class HeadersEditorElement extends EventsTargetMixin(LitElement) {
  static get styles(): CSSResult[] {
    return [
      css`
      :host {
        display: block;
      }

      .form-row {
        display: flex;
        align-items: center;
        flex: 1;
      }

      .params-list {
        margin: 12px 0;
      }

      .query-title {
        font-size: .869rem;
        font-weight: 500;
        text-transform: uppercase;
        display: block;
        margin-top: 12px;
      }

      .table-labels {
        display: flex;
        align-items: center;
        font-size: .94rem;
        font-weight: 500;
        height: 48px;
      }

      .param-name-label {
        margin-left: 52px;
        /* inputs default size is 200 */
        width: 200px;
        display: block;
      }

      .param-switch {
        margin: 0px 8px 0px 0px;
      }

      anypoint-input {
        margin: 0;
      }

      .param-name {
        margin-right: 4px;
      }

      .param-value {
        flex: 1;
      }

      .dialog-actions {
        display: flex;
        align-items: center;
        margin-top: 24px;
      }

      .close-button {
        margin-left: auto;
      }

      .raw-editor {
        white-space: pre-wrap;
        padding: 4px;
        outline: none;
        color: var(--headers-editor-color, #3b548c);
        background-color: var(--headers-editor-background-color, var(--primary-background-color, initial));
      }

      /* For autocomplete */
      .highlight {
        background-color: rgba(0, 0, 0, 0.12);
      }
      `,
    ];
  }

  protected _value = '';

  protected _headers = new HeadersArray();
  
  /**
   * The HTTP headers value.
   */
  @property({ type: String }) 
  get value(): string {
    return this._value;
  }

  set value(value: string) {
    const old = this._value;
    if (old === value) {
      return;
    }
    this._value = value;
    if (value) {
      this._headers = HeadersArray.fromHeaders(value);
    } else {
      this._headers = new HeadersArray();
    }
    this.requestUpdate('value', old);
  }

  /**  
   * When enabled it renders source mode (code mirror editor with headers support)
   */    
  @property({ type: Boolean, reflect: true }) source = false;

  /**
   * When set the editor is in read only mode.
   */
  @property({ type: Boolean, reflect: true }) readOnly = false;
  
  
  @query('anypoint-autocomplete')
  protected _autocompleteRef?: AnypointAutocompleteElement;

  get hasHeaders(): boolean {
    return !!this._headers.length;
  }

  constructor() {
    super();
    this._contentTypeHandler = this._contentTypeHandler.bind(this);
  }

  _attachListeners(node: EventTarget): void {
    super._attachListeners(node);
    node.addEventListener(EventTypes.HttpProject.Request.State.contentTypeChange, this._contentTypeHandler as any);
  }

  _detachListeners(node: EventTarget): void {
    super._detachListeners(node);
    node.removeEventListener(EventTypes.HttpProject.Request.State.contentTypeChange, this._contentTypeHandler as any);
  }

  /**
   * Updates header value. If the header does not exist in the editor it will be created.
   * @param name Header name
   * @param value Header value
   */
  updateHeader(name: string, value: string): void {
    const { _headers } = this;
    const lowerName = name.toLowerCase();
    const index = _headers.findIndex((item) => (item.name || '').toLocaleLowerCase() === lowerName);
    if (index === -1) {
      _headers.push({
        name,
        value,
        enabled: true,
      });
    } else {
      _headers[index].value = value;
    }
    this._propagateModelChange();
    this.requestUpdate();
  }

  /**
   * Removes header from the editor by its name.
   * @param name Header name
   */
  removeHeader(name: string): void {
    const { _headers } = this;
    const lowerName = name.toLowerCase();
    const index = _headers.findIndex((item) => (item.name || '').toLocaleLowerCase() === lowerName);
    if (index < 0) {
      return;
    }
    _headers.splice(index, 1);
    this._propagateModelChange();
    this.requestUpdate();
  }

  /**
   * Adds a header to the list of headers
   */
  add(): void {
    this._headers.push({
      name: '',
      value: '',
      enabled: true,
    });
    // the value hasn't actually changed here so no events
    this.requestUpdate();
  }

  _contentTypeHandler(e: CustomEvent): void {
    const { value } = e.detail;
    this.updateHeader('content-type', value);
  }

  /**
   * Dispatches `change` event to notify about the value change
   */
  protected _notifyValueChange(): void {
    this.dispatchEvent(new Event('change'))
  }

  /**
   * Updates the `value` from the current model and dispatches the value change event
   */
  protected _propagateModelChange(): void {
    this._value = this._headers.toString();
    this._notifyValueChange();
  }

  protected _enabledHandler(e: Event): void {
    const node = e.target as AnypointSwitchElement;
    const index = Number(node.dataset.index);
    const item = this._headers[index];
    item.enabled = node.checked;
    this._propagateModelChange();
  }

  protected _headerInputHandler(e: Event): void {
    const node = e.target as AnypointInputElement;
    const { value } = node;
    const prop = node.dataset.property as 'name' | 'value';
    const index = Number(node.dataset.index);
    if (!Number.isInteger(index)) {
      return;
    }
    const { _headers } = this;
    const item = _headers[index];
    const old = item[prop];
    if (old === value) {
      return;
    }
    item[prop] = value as string;
    this._propagateModelChange();
  }

  /**
   * Handler to the remove a header
   */
  protected _removeHeaderHandler(e: Event): void {
    const node = e.currentTarget as HTMLElement;
    const index = Number(node.dataset.index);
    if (!Number.isInteger(index)) {
      return;
    }
    this._headers.splice(index, 1);
    this._propagateModelChange();
    this.requestUpdate();
  }

  /**
   * A handler for the add header click.
   */
  protected async _addHeaderHandler(): Promise<void> {
    this.add();
    await this.updateComplete;
    setTimeout(() => this._focusLastName());
  }

  /**
   * Adds autocomplete support for the currently focused header.
   */
  protected _inputFocusHandler(e: Event): void {
    const sc = this._autocompleteRef;
    if (!sc) {
      return;
    }
    const node = e.target as HTMLInputElement;
    if (sc.target === node) {
      return;
    }
    sc.target = node;
    const prop = node.dataset.property as string;
    let suggestions;
    if (prop === 'name') {
      suggestions = HttpDefinitions.queryRequestHeaders().map((item) => item.key);
    } else {
      const i = Number(node.dataset.index);
      const item = this._headers[i];
      if (item.name) {
        const items = HttpDefinitions.queryRequestHeaders(item.name);
        if (items && items.length && items[0].autocomplete) {
          suggestions = items[0].autocomplete;
        }
      }
    }
    sc.source = suggestions;
    if (suggestions) {
      
      sc.renderSuggestions();
    }
  }

  /**
   * Copies current response text value to clipboard.
   */
  protected async _copyHandler(e: Event): Promise<void> {
    const button = e.target as HTMLButtonElement;
    try {
      await navigator.clipboard.writeText(this.value);
      button.innerText = 'Done';
    } catch (cause) {
      button.innerText = 'Error';
    }
    button.disabled = true;
    if ('part' in button) {
      // @ts-ignore
      button.part.add('content-action-button-disabled');
      // @ts-ignore
      button.part.add('code-content-action-button-disabled');
    }
    setTimeout(() => this._resetCopyState(button), 1000);
    CoreEvents.Telemetry.event(this, {
      category: 'Usage',
      action: 'Click',
      label: 'Headers editor clipboard copy',
    });
  }

  protected _resetCopyState(button: HTMLButtonElement): void {
    button.innerText = 'Copy';
    button.disabled = false;
    if ('part' in button) {
      // @ts-ignore
      button.part.remove('content-action-button-disabled');
      // @ts-ignore
      button.part.remove('code-content-action-button-disabled');
    }
  }

  /**
   * Toggles the source view
   */
  async _sourceModeHandler(e: Event): Promise<void> {
    const sw = e.target as AnypointSwitchElement;
    this.source = sw.checked;
    this.requestUpdate();
    await this.updateComplete;
  }

  /**
   * Handler for the raw input event.
   */
  protected _rawValueHandler(e: Event): void {
    const editor = e.target as HTMLDivElement;
    const { innerHTML } = editor;
    const p1 = new RegExp("<!.*>", "g");
    const p2 = new RegExp("<div>", "g");
    const p3 = new RegExp("</div>", "g");
    const p4 = new RegExp("<br>", "g");
    const value = innerHTML.replace(p2, "\n").replace(p3, "").replace(p4, "").replace(p1, "").trim();
    this._value = value;
    this._notifyValueChange();
  }

  /**
   * Focuses on the last header name filed
   */
  _focusLastName(): void {
    const row = this.shadowRoot!.querySelector('.params-list > :last-child');
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

  render(): TemplateResult {
    const { source } = this;
    return html`
    <div class="editor">
      ${this._contentActionsTemplate()}
      ${source ? this._sourceTemplate() : this._formTemplate()}
    </div>
    ${this._autocompleteTemplate()}
    `;
  }

  /**
   * @returns a template for the content actions
   */
  _contentActionsTemplate(): TemplateResult {
    return html`
    <div class="content-actions">
      ${this._copyActionButtonTemplate()}
      ${this._editorSwitchTemplate()}
    </div>
    `;
  }

  /**
   * @returns The template for the copy action button
   */
  _copyActionButtonTemplate(): TemplateResult {
    return html`
    <anypoint-button 
      class="copy-button"
      @click="${this._copyHandler}"
      ?disabled="${!this.hasHeaders}"

    >Copy</anypoint-button>
    `;
  }

  /**
   * @returns The template for the editor type switch
   */
  _editorSwitchTemplate(): TemplateResult {
    return html`
    <anypoint-switch 
      .checked="${this.source}" 
      @change="${this._sourceModeHandler}"
      class="editor-switch"
    >Text editor</anypoint-switch>
    `;
  }

  /**
   * @returns a template for the content actions
   */
  _sourceTemplate(): TemplateResult {
    const { readOnly } = this;
    return html`
    <div
      ?contentEditable="${!readOnly}"
      data-headers-panel
      class="raw-editor"
      @input="${this._rawValueHandler}"
    >${this.value}</div>`;
  }

  /**
   * @returns a template for the content actions
   */
  _formTemplate(): TemplateResult {
    if (!this.hasHeaders) {
      return this._emptyTemplate();
    }
    return html`
    ${this._formHeaderTemplate()}
    <div class="params-list">
      ${this._headers.map((item, index) => this._headerItemTemplate(item, index))}
    </div>
    ${this._addTemplate()}
    `;
  }

  /**
   * @returns The template for the editor title
   */
  _formHeaderTemplate(): TemplateResult {
    return html`
    <div class="table-labels">
      <span class="param-name-label">Name</span>
      <span class="param-value-label">Value</span>
    </div>`;
  }

  /**
   * @returns a template for the empty list view
   */
  _emptyTemplate(): TemplateResult {
    return html`
      <p class="empty-list">Add a header to the HTTP request.</p>
      ${this._addTemplate()}
    `;
  }

  /**
   * @param {FormItem} item
   * @param {number} index
   * @return {TemplateResult}
   */
  _headerItemTemplate(item: IHeader, index: number): TemplateResult {
    return html`
    <div class="form-row">
      ${this._headerToggleTemplate(item, index)}
      ${this._headerNameInput(item, index)}
      ${this._headerValueInput(item, index)}
      ${this._headerRemoveTemplate(index)}
    </div>`;
  }

  /**
   * @returns a template for the content actions
   */
  _addTemplate(): TemplateResult {
    const { readOnly } = this;
    return html`
    <div class="form-actions">
      <anypoint-button
        emphasis="low"
        @click="${this._addHeaderHandler}"
        class="add-param"
        ?disabled="${readOnly}"
      >
        <api-icon icon="add"></api-icon> Add
      </anypoint-button>
    </div>
    `;
  }

  /**
   * @param {number} index
   * @return Template for the parameter name input
   */
  _headerRemoveTemplate(index: number): TemplateResult {
    const { readOnly } = this;
    return html`
    <anypoint-icon-button
      data-index="${index}"
      @click="${this._removeHeaderHandler}"
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
  _headerToggleTemplate(item: IHeader, index: number): TemplateResult {
    const { readOnly } = this;
    return html`
    <anypoint-switch
      data-index="${index}"
      .checked="${item.enabled}"
      @change="${this._enabledHandler}"
      title="Enable / disable header"
      aria-label="Activate to toggle enabled state of this item"
      class="param-switch"
      ?disabled="${readOnly}"
    ></anypoint-switch>
    `;
  }

  /**
   * @param {FormItem} item
   * @param {number} index
   * @return Template for the parameter name input
   */
  _headerNameInput(item: IHeader, index: number): TemplateResult {
    const { readOnly } = this;
    return html`
    <anypoint-input
      autoValidate
      .value="${item.name}"
      data-property="name"
      data-index="${index}"
      class="param-name"
      ?readOnly="${readOnly}"
      pattern="\\S*"
      @change="${this._headerInputHandler}"
      noLabelFloat
      @focus="${this._inputFocusHandler}"
      label="Header name"
    >
    </anypoint-input>
    `;
  }

  /**
   * @param {FormItem} item
   * @param {number} index
   * @return Template for the parameter value input
   */
  _headerValueInput(item: IHeader, index: number): TemplateResult {
    const { readOnly } = this;
    return html`
    <anypoint-input
      .value="${item.value}"
      data-property="value"
      data-index="${index}"
      class="param-value"
      ?readOnly="${readOnly}"
      @change="${this._headerInputHandler}"
      noLabelFloat
      @focus="${this._inputFocusHandler}"
      label="Header value"
    >
    </anypoint-input>
    `;
  }

  /**
   * @returns A template for the autocomplete element
   */
  _autocompleteTemplate(): TemplateResult {
    const { readOnly } = this;
    return html`
    <anypoint-autocomplete
      fitPositionTarget
      horizontalAlign="left"
      verticalAlign="top"
      verticalOffset="40"
      ?disabled="${readOnly}"
    ></anypoint-autocomplete>
    `;
  }
}
