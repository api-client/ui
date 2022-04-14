/* eslint-disable class-methods-use-this */
import { LitElement, html, CSSResult, TemplateResult } from 'lit';
import { ValidatableMixin, OverlayMixin, ResizableMixin, AnypointInputElement, AnypointCheckboxElement } from '@anypoint-web-components/awc';
import { UrlParser } from '@api-client/core/build/browser.js';
import { property } from 'lit/decorators.js';
import '@anypoint-web-components/awc/dist/define/anypoint-icon-button.js';
import '@anypoint-web-components/awc/dist/define/anypoint-button.js';
import '@anypoint-web-components/awc/dist/define/anypoint-input.js';
import '@anypoint-web-components/awc/dist/define/anypoint-switch.js';
import styles from './UrlDetailedEditor.styles.js';
import '../../define/api-icon.js';
import '../../define/url-input-editor.js';
import {
  getHostValue,
  findSearchParam,
  findModelParam,
  valueValue,
  valueChanged,
  notifyChange,
  computeModel,
  computeSearchParams,
  queryModelChanged,
  updateParserSearch,
  parserValue,
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

/* eslint-disable no-plusplus */
/* eslint-disable no-continue */
/* eslint-disable prefer-destructuring */

export declare interface QueryParameter {
  /**
   * The name of the parameter
   */
  name: string;
  /**
   * The value of the parameter
   */
  value: string;
  /**
   * Whether the parameter is currently enabled.
   */
  enabled: boolean;
}

export declare interface ViewModel {
  host?: string;
  path?: string;
  anchor?: string;
}

/** @typedef {import('./UrlParamsEditorElement').QueryParameter} QueryParameter */
/** @typedef {import('./UrlParamsEditorElement').ViewModel} ViewModel */
/** @typedef {import('lit-element').TemplateResult} TemplateResult */
/** @typedef {import('@anypoint-web-components/awc').AnypointInputElement} AnypointInputElement */
/** @typedef {import('@anypoint-web-components/awc').AnypointCheckboxElement} AnypointCheckboxElement */

/**
 * An element that works with the `url-input-editor` that renders an overlay
 * with query parameter values.
 */
export default class UrlParamsEditorElement extends ResizableMixin(OverlayMixin(ValidatableMixin(LitElement))) {
  static get styles(): CSSResult {
    return styles;
  }

  /**
   * Computed data model for the view.
   */
  @property() model: ViewModel = {};

  /**
   * List of query parameters model.
   * If not set then it is computed from current URL.
   *
   * Model for query parameters is:
   * - name {String} param name
   * - value {String} param value
   * - enabled {Boolean} is param included into the `value`
   */
  @property() queryParameters?: QueryParameter[];

  /**
   * When set the editor is in read only mode.
   */
  readOnly = false;

  [valueValue] = '';

  [parserValue]?: UrlParser;

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

  [notifyChange](): void {
    this.dispatchEvent(new Event('change'));
  }

  /**
   * A handler that is called on input
   */
  [valueChanged](value: string): void {
    const { queryParameters = [] } = this;
    const hasParams = !!queryParameters.length;
    if (!value && !hasParams) {
      return;
    }
    this[computeModel](value, queryParameters);
  }

  [computeModel](value: string, queryModel: QueryParameter[] = []): void {
    if (!value) {
      this.model = {};
      this.queryParameters = [];
      return;
    }
    const parser = new UrlParser(value);
    this[parserValue] = parser;
    const model: ViewModel = {};
    model.host = this[getHostValue](parser) || '';
    model.path = parser.path || '';
    model.anchor = parser.anchor || '';
    this.model = model;
    this[computeSearchParams](parser, queryModel);
  }

  [computeSearchParams](parser: UrlParser, queryModel: QueryParameter[] = []): void {
    if (!this.queryParameters) {
      this.queryParameters = queryModel;
    }
    const items = this.queryParameters;
    // 1 keep disabled items in the model
    // 2 remove items that are in query model but not in search params
    // 3 update value of model
    // 4 add existing search params to the model
    const { searchParams } = parser;
    for (let i = queryModel.length - 1; i >= 0; i--) {
      if (queryModel[i].enabled === false) {
        continue;
      }
      const param = this[findSearchParam](searchParams, queryModel[i].name);
      if (!param) {
        items.splice(i, 1);
      } else if (queryModel[i].value !== param[1]) {
        items[i].value = param[1];
      }
    }
    // Add to `queryModel` params that are in `parser.searchParams`
    searchParams.forEach((pairs) => {
      const param = this[findModelParam](queryModel, pairs[0]);
      if (!param) {
        items[items.length] = {
          name: pairs[0],
          value: pairs[1],
          enabled: true
        };
      }
    });
    this.queryParameters = [...items];
  }

  [queryModelChanged](): void {
    if (this.readOnly) {
      return;
    }
    if (!this[parserValue]) {
      this[parserValue] = new UrlParser('');
    }
    this[updateParserSearch](this.queryParameters);
    this[valueValue] = this[parserValue]?.value || '';
    this[notifyChange]();
  }

  /**
   * Updates `queryParameters` model from change record.
   *
   * @param model Current model for the query parameters
   */
  [updateParserSearch](model: QueryParameter[] = []): void {
    const params: string[][] = [];
    model.forEach((item) => {
      if (!item.enabled) {
        return;
      }
      params.push([item.name, item.value]);
    });
    this[parserValue]!.searchParams = params;
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

  /**
   * Adds a new Query Parameter to the list.
   */
  async [addParamHandler](): Promise<void> {
    if (this.readOnly) {
      return;
    }
    const obj = {
      name: '',
      value: '',
      enabled: true
    };
    const items = this.queryParameters || [];
    items[items.length] = obj;
    this.queryParameters = [...items];
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
    const items = this.queryParameters!;
    items.splice(index, 1);
    this.queryParameters = [...items];
    this[queryModelChanged]();
    this.requestUpdate();
    await this.updateComplete;
    this.refit();
    this.notifyResize();
  }

  /**
   * Validates the element.
   * @returns True if the form is valid.
   */
  _getValidity(): boolean {
    const inputs = Array.from(this.shadowRoot!.querySelectorAll('.params-list anypoint-input')) as AnypointInputElement[];
    let result = true;
    inputs.forEach((input) => {
      const vResult = input.validate();
      if (result && !vResult) {
        result = vResult;
      }
    });
    return result;
  }

  /**
   * Dispatches the `urlencode` event. The editor handles the action.
   */
  [encodeQueryParameters](): void {
    this.dispatchEvent(new CustomEvent('urlencode', {
      composed: true
    }));
    setTimeout(() => this.validate(this.value));
  }

  /**
   * Dispatches the `urldecode` event. The editor handles the action.
   */
  [decodeQueryParameters](): void {
    this.dispatchEvent(new CustomEvent('urldecode', {
      composed: true
    }));
    setTimeout(() => this.validate(this.value));
  }

  [enabledHandler](e: CustomEvent): void {
    const node = e.target as AnypointCheckboxElement;
    const index = Number(node.dataset.index);
    const item = this.queryParameters![index];
    item.enabled = node.checked;
    this[queryModelChanged]();
  }

  /**
   * @param {CustomEvent} e
   */
  [paramInputHandler](e: CustomEvent): void {
    const node = e.target as AnypointInputElement;
    const { value } = node;
    const prop = node.dataset.property as string;
    const index = Number(node.dataset.index);
    const item = this.queryParameters![index];
    // @ts-ignore
    const old = item[prop] as any;
    if (old === value) {
      return;
    }
    // @ts-ignore
    item[prop] = value;
    this[queryModelChanged]();
  }

  [getHostValue](parser: UrlParser): string | undefined {
    const { protocol } = parser;
    let { host } = parser;
    if (host) {
      if (protocol) {
        host = `${protocol}//${host}`;
      }
    } else if (protocol) {
      host = `${protocol}//`;
    }
    return host;
  }

  /**
   * Finds a search parameter in the parser's model by given name.
   * @param searchParams Model for search params
   * @param name Name of the parameter
   * @returns Search parameter model item
   */
  [findSearchParam](searchParams: string[][], name: string): string[] | undefined {
    for (let i = searchParams.length - 1; i >= 0; i--) {
      if (searchParams[i][0] === name) {
        return searchParams[i];
      }
    }
    return undefined;
  }

  /**
   * Searches for a query parameters model by given name.
   * @param model Query parameters model
   * @param name Name of the parameter
   * @returns Model item.
   */
  [findModelParam](model: QueryParameter[], name: string): QueryParameter | undefined {
    for (let i = 0, len = model.length; i < len; i++) {
      const item = model[i];
      if (!item.enabled || item.name !== name) {
        continue;
      }
      return item;
    }
    return undefined;
  }

  render(): TemplateResult {
    return html`
    ${this[formTemplate]()}
    ${this[actionsTemplate]()}`;
  }

  [formTemplate](): TemplateResult {
    const items = this.queryParameters || [];
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
        <arc-icon icon="addCircleOutline"></arc-icon> Add
      </anypoint-button>
    </div>
    `;
  }

  /**
   * @param items THe list to render
   */
  [listTemplate](items: QueryParameter[]): TemplateResult {
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

  [paramItemTemplate](item: QueryParameter, index: number): TemplateResult {
    return html`
    <div class="form-row">
      ${this[paramToggleTemplate](item, index)}
      ${this[paramNameInput](item, index)}
      ${this[paramValueInput](item, index)}
      ${this[paramRemoveTemplate](index)}
    </div>`;
  }

  /**
   * @param {number} index
   * @return {TemplateResult} Template for the parameter name input
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
      <arc-icon icon="removeCircleOutline"></arc-icon>
    </anypoint-icon-button>
    `;
  }

  /**
   * @returns Template for the parameter name input
   */
  [paramToggleTemplate](item: QueryParameter, index: number): TemplateResult {
    return html`
    <anypoint-switch
      data-index="${index}"
      .checked="${item.enabled}"
      @checkedchange="${this[enabledHandler]}"
      title="Enable / disable parameter"
      aria-label="Activate to toggle enabled state of this item"
      class="param-switch"
    ></anypoint-switch>
    `;
  }

  /**
   * @returns Template for the parameter name input
   */
  [paramNameInput](item: QueryParameter, index: number): TemplateResult {
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
    >
      <label slot="label">Parameter name</label>
    </anypoint-input>
    `;
  }

  /**
   * @returns Template for the parameter value input
   */
  [paramValueInput](item: QueryParameter, index: number): TemplateResult {
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
    >
      <label slot="label">Parameter value</label>
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
