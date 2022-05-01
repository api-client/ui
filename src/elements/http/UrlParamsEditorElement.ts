/* eslint-disable no-param-reassign */
import { html, CSSResult, TemplateResult, PropertyValueMap } from 'lit';
import { OverlayElement, AnypointInputElement, AnypointCheckboxElement } from '@anypoint-web-components/awc';
import { property } from 'lit/decorators.js';
import { UrlProcessor, IUrlParamPart, UrlEncoder } from '@api-client/core/build/browser.js';
import '@anypoint-web-components/awc/dist/define/anypoint-icon-button.js';
import '@anypoint-web-components/awc/dist/define/anypoint-button.js';
import '@anypoint-web-components/awc/dist/define/anypoint-input.js';
import '@anypoint-web-components/awc/dist/define/anypoint-switch.js';
import styles from './UrlDetailedEditor.styles.js';
import '../../define/api-icon.js';
import '../../define/url-input-editor.js';
import {
  valueValue,
  valueChanged,
  notifyChange,
  addParamHandler,
  removeParamHandler,
  encodeQueryParameters,
  decodeQueryParameters,
  enabledHandler,
  paramInputHandler,
  formTemplate,
  actionsTemplate,
  listTemplate,
  paramItemTemplate,
  paramRemoveTemplate,
  paramToggleTemplate,
  paramNameInput,
  paramValueInput,
} from './internals.js';

/**
 * An element that works with the `url-input-editor` that renders an overlay
 * with query parameter values.
 */
export default class UrlParamsEditorElement extends OverlayElement {
  static get styles(): CSSResult {
    return styles;
  }

  /**
   * True if the last call to `validate` is invalid.
   */
  @property({ reflect: true, type: Boolean }) invalid?: boolean;

  protected _parser = new UrlProcessor('/');

  /**
   * When set the editor is in read only mode.
   */
  @property({ type: Boolean, reflect: true }) readOnly = false;

  [valueValue] = '';

  /**
   * Current value of the editor.
   */
  @property()
  get value(): string {
    return this[valueValue];
  }

  set value(value: string) {
    const old = this[valueValue];
    if (old === value) {
      return;
    }
    this[valueValue] = value;
    this.requestUpdate('value', old);
    this[valueChanged](value);
  }

  /**
   * The model used to build the view.
   */
  get model(): UrlProcessor {
    return this._parser;
  }

  protected updated(cp: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
    if (cp.has('invalid')) {
      if (this.invalid) {
        this.setAttribute('aria-invalid', 'true');
        
      } else {
        this.removeAttribute('aria-invalid');
      }
    }
    super.updated(cp);
  }

  /**
   * @return Returns `true` if the value of the element has no validity problems; otherwise returns false.
   */
  checkValidity(): boolean {
    const state = this._getValidity();
    const { invalid } = this;
    if (state === invalid || invalid === undefined) {
      this.invalid = !state;
      this.dispatchEvent(new Event('invalid'));
    }
    return state;
  }

  /**
   * Validates the element.
   * @returns True if the form is valid.
   */
  _getValidity(): boolean {
    const inputs = Array.from(this.shadowRoot!.querySelectorAll('.params-list anypoint-input')) as AnypointInputElement[];
    let result = true;
    inputs.forEach((input) => {
      const vResult = input.checkValidity();
      if (result && !vResult) {
        result = vResult;
      }
    });
    return result;
  }

  [notifyChange](): void {
    this.dispatchEvent(new Event('change'));
  }

  /**
   * A handler that is called on input
   */
  [valueChanged](value?: string): void {
    if (value) {
      this._parser = new UrlProcessor(value);
    } else {
      this._parser = new UrlProcessor('/');
    }
  }

  /**
   * Focuses on the last query parameter name filed
   */
  focusLastName(): void {
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

  protected _updateValue(): void {
    this[valueValue] = this._parser.toString();
    this[notifyChange]();
  }

  /**
   * Adds a new Query Parameter to the list.
   */
  async [addParamHandler](): Promise<void> {
    if (this.readOnly) {
      return;
    }
    this._parser.search.append('', '');
    this.requestUpdate();
    await this.updateComplete;
    this.refit();
    this.notifyResize();
    this.focusLastName();
  }

  /**
   * Handler to the remove a parameter
   */
  async [removeParamHandler](e: PointerEvent): Promise<void> {
    const node = (e.currentTarget as HTMLElement);
    const index = Number(node.dataset.index);
    this._parser.search.delete(index);
    this._updateValue();
    this.requestUpdate();
    await this.updateComplete;
    this.refit();
    this.notifyResize();
  }

  [encodeQueryParameters](): void {
    const { search } = this._parser;
    const list = search.list();
    list.forEach((part, index) => {
      part.name = UrlEncoder.encodeQueryString(part.name, true);
      part.value = UrlEncoder.encodeQueryString(part.value, true);
      search.update(index, part);
    });
    // TODO: UrlEncoder.decodeQueryString(part, false) on each path segment
    this.requestUpdate();
    this._updateValue();
    setTimeout(() => this.checkValidity());
  }

  [decodeQueryParameters](): void {
    const { search } = this._parser;
    const list = search.list();
    list.forEach((part, index) => {
      part.name = UrlEncoder.decodeQueryString(part.name, true);
      part.value = UrlEncoder.decodeQueryString(part.value, true);
      search.update(index, part);
    });
    // TODO: UrlEncoder.encodeQueryString(part, false) on each path segment
    this.requestUpdate();
    this._updateValue();
    setTimeout(() => this.checkValidity());
  }

  [enabledHandler](e: CustomEvent): void {
    const node = e.target as AnypointCheckboxElement;
    const index = Number(node.dataset.index);
    this._parser.search.toggle(index, node.checked);
    this._updateValue();
  }

  /**
   * @param {CustomEvent} e
   */
  [paramInputHandler](e: CustomEvent): void {
    const node = e.target as AnypointInputElement;
    const { value } = node;
    const prop = node.dataset.property as string;
    const index = Number(node.dataset.index);
    const list = this._parser.search.list();
    if (prop === 'name') {
      list[index].name = value as string;
    } else {
      list[index].value = value as string;
    }
    this._parser.search.update(index, list[index]);
    this._updateValue();
  }

  render(): TemplateResult {
    return html`
    ${this[formTemplate]()}
    ${this[actionsTemplate]()}`;
  }

  [formTemplate](): TemplateResult {
    const items = this._parser.search.list();
    const { readOnly } = this;
    return html`
    <label class="query-title">Query parameters</label>
    ${this[listTemplate](items)}
    <div class="query-actions">
      <anypoint-button
        emphasis="low"
        @click="${this[addParamHandler]}"
        class="add-param"
        ?disabled="${readOnly}"
      >
        <api-icon icon="add"></api-icon> Add
      </anypoint-button>
    </div>
    `;
  }

  /**
   * @param items THe list to render
   */
  [listTemplate](items: IUrlParamPart[]): TemplateResult {
    if (!Array.isArray(items) || !items.length) {
      return html`<p class="empty-list">Add a query parameter to the URL</p>`;
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

  [paramItemTemplate](item: IUrlParamPart, index: number): TemplateResult {
    return html`
    <div class="form-row">
      ${this[paramToggleTemplate](item, index)}
      ${this[paramNameInput](item, index)}
      ${this[paramValueInput](item, index)}
      ${this[paramRemoveTemplate](index)}
    </div>`;
  }

  /**
   * @return Template for the parameter name input
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
    >
      <api-icon icon="remove"></api-icon>
    </anypoint-icon-button>
    `;
  }

  /**
   * @returns Template for the parameter name input
   */
  [paramToggleTemplate](item: IUrlParamPart, index: number): TemplateResult {
    return html`
    <anypoint-switch
      data-index="${index}"
      .checked="${item.enabled}"
      @change="${this[enabledHandler]}"
      title="Enable / disable parameter"
      aria-label="Activate to toggle enabled state of this item"
      class="param-switch"
    ></anypoint-switch>
    `;
  }

  /**
   * @returns Template for the parameter name input
   */
  [paramNameInput](item: IUrlParamPart, index: number): TemplateResult {
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
      @change="${this[paramInputHandler]}"
      noLabelFloat
      label="Parameter name"
    >
    </anypoint-input>
    `;
  }

  /**
   * @returns Template for the parameter value input
   */
  [paramValueInput](item: IUrlParamPart, index: number): TemplateResult {
    const { readOnly } = this;
    return html`
    <anypoint-input
      autoValidate
      .value="${item.value}"
      data-property="value"
      data-index="${index}"
      class="param-value"
      ?readOnly="${readOnly}"
      pattern="\\S*"
      @change="${this[paramInputHandler]}"
      noLabelFloat
      label="Parameter value"
    >
    </anypoint-input>
    `;
  }

  [actionsTemplate](): TemplateResult {
    const { readOnly } = this;
    return html`
    <div class="dialog-actions">
      <anypoint-button
        id="encode"
        @click="${this[encodeQueryParameters]}"
        title="URL encodes parameters in the editor"
        ?disabled="${readOnly}"
      >Encode URL</anypoint-button>
      <anypoint-button
        id="decode"
        @click="${this[decodeQueryParameters]}"
        title="URL decodes parameters in the editor"
        ?disabled="${readOnly}"
      >Decode URL</anypoint-button>
      <anypoint-button
        class="close-button"
        @click="${this.close}"
        title="Closes the editor"
      >Close</anypoint-button>
    </div>`;
  }
}
