/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable lit-a11y/click-events-have-key-events */
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
import { LitElement, html, CSSResult, TemplateResult } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';
import { property, state } from 'lit/decorators.js';
import { ValidatableMixin, EventsTargetMixin, AnypointListboxElement } from '@anypoint-web-components/awc';
import '@anypoint-web-components/awc/dist/define/anypoint-icon-button.js';
import '@anypoint-web-components/awc/dist/define/anypoint-button.js';
import '@anypoint-web-components/awc/dist/define/anypoint-input.js';
import '@anypoint-web-components/awc/dist/define/anypoint-dropdown.js';
import '@anypoint-web-components/awc/dist/define/anypoint-item.js';
import '@anypoint-web-components/awc/dist/define/anypoint-item-body.js';
import '@anypoint-web-components/awc/dist/define/anypoint-listbox.js';
import '@anypoint-web-components/awc/dist/define/anypoint-collapse.js';
import { Events as CoreEvents, UrlParser, EventUtils, UrlEncoder } from '@api-client/core/build/browser.js';
import classStyles from './UrlInputEditor.styles.js';
import UrlParamsEditorElement from './UrlParamsEditorElement.js';
import { IconType } from '../icons/Icons.js';
import '../../define/api-icon.js';
import '../../define/url-params-editor.js';

import {
  readAutocomplete,
  focusedValue,
  overlayOpenedValue,
  toggleSuggestions,
  shadowContainerOpened,
  shadowContainerHeight,
  paramsEditorTemplate,
  mainInputTemplate,
  shadowTemplate,
  urlAutocompleteTemplate,
  paramsResizeHandler,
  paramsClosedHandler,
  paramsOpenedHandler,
  inputHandler,
  toggleHandler,
  valueValue,
  notifyChange,
  extValueChangeHandler,
  keyDownHandler,
  decodeEncode,
  dispatchAnalyticsEvent,
  processUrlParams,
  autocompleteResizeHandler,
  setShadowHeight,
  mainFocusBlurHandler,
  autocompleteOpened,
  suggestionsValue,
  renderedSuggestions,
  suggestionsListTemplate,
  suggestionItemTemplate,
  previousValue,
  filterSuggestions,
  suggestionHandler,
  setSuggestionsWidth,
  autocompleteClosedHandler,
  suggestionsList,
  removeSuggestionHandler,
  clearSuggestionsHandler,
  urlHistoryDeletedHandler,
  urlHistoryDestroyedHandler,
} from './internals.js';

/* eslint-disable no-param-reassign */
/* eslint-disable no-plusplus */
/* eslint-disable no-continue */
/* eslint-disable class-methods-use-this */

/**
 * The request URL editor
 *
 * The element renders an editor for a HTTP request editor.
 */
export default class UrlInputEditorElement extends EventsTargetMixin(ValidatableMixin(LitElement)) {
  static get styles(): CSSResult {
    return classStyles;
  }

  /**  
   * The current URL value.
   */
  @property({ type: String }) value = 'http://';

  /**
   * True if detailed editor is opened.
   */
  @property({ type: Boolean }) detailsOpened = false;

  /**
   * Default protocol for the URL if it's missing.
   */
  @property({ type: String }) defaultProtocol = 'http';

  /**
   * When set the editor is in read only mode.
   */
  @property({ type: Boolean }) readOnly = false;

  [valueValue]: string;

  @state() [autocompleteOpened] = false;

  @state() [suggestionsValue]: any; // ARCUrlHistory[]

  @state() [renderedSuggestions]: any; // ARCUrlHistory[]

  [previousValue]?: string;

  [focusedValue] = false;

  [overlayOpenedValue] = false;

  [shadowContainerOpened] = false;

  [shadowContainerHeight]?: number;

  // get value(): string {
  //   return this[valueValue];
  // }

  // set value(value: string) {
  //   const old = this[valueValue];
  //   if (old === value) {
  //     return;
  //   }
  //   this[valueValue] = value;
  //   this.requestUpdate('value', old);
  //   this.dispatchEvent(new CustomEvent('change'));
  // }

  /**
   * @returns An icon name for the main input suffix icon
   */
  get inputIcon(): IconType {
    const { detailsOpened } = this;
    return detailsOpened ? 'close' : 'edit';
  }

  /**
   * @returns A title for the main input suffix icon
   */
  get inputIconTitle(): string {
    const { detailsOpened } = this;
    return detailsOpened ? 'Close parameters editor' : 'Open parameters editor';
  }

  get [suggestionsList](): AnypointListboxElement {
    const node = this.shadowRoot!.querySelector('.url-autocomplete anypoint-listbox') as AnypointListboxElement;
    return node;
  }

  constructor() {
    super();
    this[extValueChangeHandler] = this[extValueChangeHandler].bind(this);
    this[keyDownHandler] = this[keyDownHandler].bind(this);
    this[urlHistoryDeletedHandler] = this[urlHistoryDeletedHandler].bind(this);
    this[urlHistoryDestroyedHandler] = this[urlHistoryDestroyedHandler].bind(this);
  }

  _attachListeners(node: EventTarget): void {
    super._attachListeners(node);
    // node.addEventListener(RequestEventTypes.State.urlChange, this[extValueChangeHandler]);
    // node.addEventListener(ArcModelEventTypes.UrlHistory.State.delete, this[urlHistoryDeletedHandler]);
    // node.addEventListener(ArcModelEventTypes.destroyed, this[urlHistoryDestroyedHandler]);
    this.addEventListener('keydown', this[keyDownHandler]);
  }

  /**
   * @param {EventTarget} node
   */
  _detachListeners(node: EventTarget): void {
    super._detachListeners(node);
    // node.removeEventListener(RequestEventTypes.State.urlChange, this[extValueChangeHandler]);
    // node.removeEventListener(ArcModelEventTypes.UrlHistory.State.delete, this[urlHistoryDeletedHandler]);
    // node.removeEventListener(ArcModelEventTypes.destroyed, this[urlHistoryDestroyedHandler]);
    this.removeEventListener('keydown', this[keyDownHandler]);
  }

  /**
   * A handler that is called on input
   */
  [notifyChange](): void {
    // RequestEvents.State.urlChange(this, this.value);
    this.dispatchEvent(new CustomEvent('change'));
  }

  /**
   * A handler for the `url-value-changed` event.
   * If this element is not the source of the event then it will update the `value` property.
   * It's to be used besides the Polymer's data binding system.
   *
   * @param {RequestChangeEvent} e
   */
  [extValueChangeHandler](e: any): void {
    if (e.composedPath()[0] === this || this.readOnly) {
      return;
    }
    const { changedProperty, changedValue } = e;
    if (changedProperty === 'url' && changedValue !== this.value) {
      this.value = changedValue;
    }
  }

  /**
   * Opens detailed view.
   */
  toggle(): void {
    this.detailsOpened = !this.detailsOpened;
    this.dispatchEvent(new CustomEvent('detailsopened'));
  }

  /**
   * HTTP encode query parameters
   */
  encodeParameters(): void {
    if (this.readOnly) {
      return;
    }
    this[decodeEncode]('encode');
    this[dispatchAnalyticsEvent]('Encode parameters');
  }

  /**
   * HTTP decode query parameters
   */
  decodeParameters(): void {
    if (this.readOnly) {
      return;
    }
    this[decodeEncode]('decode');
    this[dispatchAnalyticsEvent]('Decode parameters');
  }

  /**
   * Dispatches analytics event with "event" type.
   * @param label A label to use with GA event
   */
  [dispatchAnalyticsEvent](label: string): void {
    const init = {
      category: 'Request view',
      action: 'URL editor',
      label,
    }
    CoreEvents.Telemetry.event(this, init);
  }

  /**
   * HTTP encode or decode query parameters depending on [type].
   */
  [decodeEncode](type: string): void {
    const url = this.value;
    if (!url) {
      return;
    }
    const parser = new UrlParser(url);
    this[processUrlParams](parser, type);
    this.value = parser.value;
    this[notifyChange]();
  }


  /**
   * Processes query parameters and path value by `processFn`.
   * The function has to be available on this instance.
   * @param parser Instance of UrlParser
   * @param processFn Function name to call on each parameter
   */
  [processUrlParams](parser: UrlParser, processFn: string): void {
    const decoded = parser.searchParams.map((item) => {
      let key;
      let value;
      if (processFn === 'encode') {
        key = UrlEncoder.encodeQueryString(item[0], true);
        value = UrlEncoder.encodeQueryString(item[1], true);
      } else {
        key = UrlEncoder.decodeQueryString(item[0], true);
        value = UrlEncoder.decodeQueryString(item[1], true);
      }
      return [key, value];
    });
    parser.searchParams = decoded;
    const { path } = parser;
    if (path && path.length) {
      const parts = path.split('/');
      let tmp = '/';
      for (let i = 0, len = parts.length; i < len; i++) {
        let part = parts[i];
        if (!part) {
          continue;
        }
        if (processFn === 'encode') {
          part = UrlEncoder.encodeQueryString(part, false);
        } else {
          part = UrlEncoder.decodeQueryString(part, false);
        }
        tmp += part;
        if (i + 1 !== len) {
          tmp += '/';
        }
      }
      parser.path = tmp;
    }
  }

  /**
   * Queries the data model for history data and sets the suggestions
   * @param q User query from the input field
   */
  async [readAutocomplete](q: string): Promise<void> {
    try {
      // FIXME: IMplement this.
      throw new Error(q)
      // this[suggestionsValue] = /** @type ARCUrlHistory[] */ (await ArcModelEvents.UrlHistory.query(this, q));
    } catch (e) {
      this[suggestionsValue] = /** @type ARCUrlHistory[] */ (undefined);
    }
  }

  [keyDownHandler](e: KeyboardEvent): void {
    const target = e.composedPath()[0] as HTMLElement;
    if (!target || target.nodeName !== 'INPUT') {
      return;
    }
    if (!this[autocompleteOpened] && ['Enter', 'NumpadEnter'].includes(e.code)) {
      // FIXME: Add this event
      // RequestEvents.send(this);
    } else if (this[autocompleteOpened] && target.classList.contains('main-input')) {
      const { code } = e;
      if (code === 'ArrowUp') {
        e.preventDefault();
        this[suggestionsList].highlightPrevious();
      } else if (code === 'ArrowDown') {
        e.preventDefault();
        this[suggestionsList].highlightNext();
      } else if (['Enter', 'NumpadEnter'].includes(code)) {
        e.preventDefault();
        const node = this[suggestionsList];
        const { highlightedItem } = node;
        if (!highlightedItem) {
          // FIXME: Add this event
          // RequestEvents.send(this);
          this[toggleSuggestions](false);
        } else {
          const index = node.indexOf(highlightedItem);
          node.select(index);
        }
      }
    }
  }

  /**
   * Validates the element.
   */
  _getValidity(): boolean {
    if (this.detailsOpened) {
      const element = this.shadowRoot!.querySelector('url-params-editor') as UrlParamsEditorElement;
      return element.validate(this.value);
    }
    const element = this.shadowRoot!.querySelector('.main-input') as HTMLInputElement;
    if (!element) {
      return true;
    }
    return element.validity.valid;
  }

  /**
   * @param e A handler for either main input or the details editor value change
   */
  [inputHandler](e: Event): void {
    if (this.readOnly) {
      return;
    }
    const node = e.target as HTMLInputElement;
    this[previousValue] = this.value;
    this.value = node.value;
    this[notifyChange]();
    if (node.classList.contains('main-input')) {
      this.renderSuggestions();
    }
  }


  [toggleHandler](e: PointerEvent): void {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    this.toggle();
  }

  [mainFocusBlurHandler](e: Event): void {
    this[focusedValue] = e.type === 'focus';
    this.requestUpdate();
    if (this[focusedValue] && !this[autocompleteOpened] && !this.detailsOpened) {
      this.renderSuggestions();
    }
  }

  /**
   * Triggers URL suggestions rendering.
   * If there are suggestions to render this will enable the dropdown.
   */
  async renderSuggestions(): Promise<void> {
    const { value = '' } = this;
    if (this[previousValue] && value.startsWith(this[previousValue] || '')) {
      this[filterSuggestions]();
      return;
    }
    await this[readAutocomplete](value);
    this[filterSuggestions]();
  }

  /**
   * Performs the query on the current suggestions and, if any, renders them.
   */
  async [filterSuggestions](): Promise<void> {
    const items = this[suggestionsValue];
    if (!Array.isArray(items) || !items.length) {
      this[toggleSuggestions](false);
      return;
    }
    const { value = '' } = this;
    const query = String(value).toLowerCase();
    const rendered = items.filter(i => i.url.toLowerCase().includes(query));
    if (!rendered.length) {
      this[toggleSuggestions](false);
      return;
    }
    if (rendered.length === 1 && rendered[0].url.toLowerCase() === query) {
      this[toggleSuggestions](false);
      return;
    }
    // @FIXME: Implement this.
    // sortUrls(rendered, query);
    this[renderedSuggestions] = rendered;
    this[toggleSuggestions](true);
    this.requestUpdate();
    await this.updateComplete;
    const node = this.shadowRoot!.querySelector('anypoint-dropdown')!;
    node.refit();
    node.notifyResize();
    this[setSuggestionsWidth]();
  }

  /**
   * @param {boolean} opened
   */
  [toggleSuggestions](opened: boolean): void {
    if (!opened) {
      const element = this.shadowRoot!.querySelector('.main-input') as HTMLInputElement;
      element.focus();
    }
    if (this[overlayOpenedValue] !== opened) {
      this[overlayOpenedValue] = opened;
      this[autocompleteOpened] = opened;
      this.requestUpdate();
    }
    if (!opened && this[shadowContainerOpened]) {
      this[shadowContainerOpened] = false;
      this[shadowContainerHeight] = 0;
      this.requestUpdate();
    }
  }

  [autocompleteResizeHandler](): void {
    if (!this[overlayOpenedValue]) {
      return;
    }
    const node = this.shadowRoot!.querySelector('.url-autocomplete')!;
    const input = this.shadowRoot!.querySelector('.input-wrapper')!;
    const rect1 = node.getBoundingClientRect();
    const rect2 = input.getBoundingClientRect();
    const total = rect1.height + rect2.height;
    if (!total) {
      return;
    }
    this[setShadowHeight](total);
  }

  [suggestionHandler](e: Event): void {
    const list = e.target as AnypointListboxElement;
    const { selected } = list;
    list.selected = undefined;
    if (selected === -1 || selected === null || selected === undefined) {
      return;
    }
    const item = this[renderedSuggestions][selected];
    if (!item) {
      return;
    }
    this.value = item.url;
    this[toggleSuggestions](false);
    this[notifyChange]();
  }

  /**
   * Sets the width of the suggestions container so it renders
   * the URL suggestions in the full width of the input container.
   */
  [setSuggestionsWidth](): void {
    const rect = this.getBoundingClientRect();
    const { width } = rect;
    if (!width) {
      return;
    }
    this[suggestionsList].style.width = `${width}px`;
  }

  /**
   * A handler for the close event dispatched by the suggestions drop down.
   * Closes the suggestions (sets the state) and cancels the event.
   */
  [autocompleteClosedHandler](e: Event): void {
    EventUtils.cancelEvent(e);
    this[toggleSuggestions](false);
  }

  /**
   * Sets a height on the shadow background element.
   */
  [setShadowHeight](height: number): void {
    this[shadowContainerHeight] = height;
    this[shadowContainerOpened] = true;
    this.requestUpdate();
  }

  [paramsOpenedHandler](e: Event): void {
    EventUtils.cancelEvent(e);
    const node = e.target as UrlParamsEditorElement;
    requestAnimationFrame(() => {
      if (!this.detailsOpened) {
        return;
      }
      const input = this.shadowRoot!.querySelector('.input-wrapper')!;
      const rect1 = node.getBoundingClientRect();
      const rect2 = input.getBoundingClientRect();
      const total = rect1.height + rect2.height;
      if (!total) {
        return;
      }
      this[overlayOpenedValue] = true;
      this[setShadowHeight](total);
    });
  }

  [paramsClosedHandler](e: Event): void {
    EventUtils.cancelEvent(e);
    this[overlayOpenedValue] = false;
    this[shadowContainerOpened] = false;
    this[shadowContainerHeight] = 0;
    this.detailsOpened = false;
    this.requestUpdate();
  }

  [paramsResizeHandler](e: Event): void {
    if (this.detailsOpened) {
      this[paramsOpenedHandler](e);
    }
  }

  /**
   * Removes the rendered suggestion from the store and from the currently rendered list.
   */
  async [removeSuggestionHandler](e: Event): Promise<void> {
    e.preventDefault();
    e.stopPropagation();
    // const node = /** @type HTMLElement */ (e.target);
    // const { id } = node.dataset;
    // if (!id) {
    //   return;
    // }
    // await ArcModelEvents.UrlHistory.delete(this, id);
  }

  /**
   * Removes all stored history URLs.
   */
  async [clearSuggestionsHandler](e: Event): Promise<void> {
    e.preventDefault();
    e.stopPropagation();
    // await ArcModelEvents.destroy(this, ['url-history']);
  }

  /**
   * @param {ARCHistoryUrlDeletedEvent} e 
   */
  [urlHistoryDeletedHandler](e: any): void {
    // const { id } = e;
    // const items = /** @type ARCUrlHistory[] */ (this[suggestionsValue]);
    // if (!Array.isArray(items)) {
    //   return;
    // }
    // const index = items.findIndex(i => i._id === id);
    // items.splice(index, 1);
    // if (this[autocompleteOpened]) {
    //   this[filterSuggestions]();
    // }
  }

  /**
   * @param {ARCModelStateDeleteEvent} e 
   */
  [urlHistoryDestroyedHandler](e: any): void {
    // const { store } = e;
    // if (!['all', 'url-history'].includes(store)) {
    //   return;
    // }
    // this[suggestionsValue] = /** @type ARCUrlHistory[] */ (undefined);
    // this[renderedSuggestions] = /** @type ARCUrlHistory[] */ (undefined);
    // this[toggleSuggestions](false);
  }

  render(): TemplateResult {
    const focused = this[focusedValue];
    const overlay = this[overlayOpenedValue];
    const acOpened = this[autocompleteOpened];
    const classes = {
      container: true,
      focused,
      overlay,
      autocomplete: acOpened,
    };
    return html`
    ${this[shadowTemplate]()}
    <div class="${classMap(classes)}">
      ${this[mainInputTemplate]()}  
      ${this[paramsEditorTemplate]()}
    </div>`;
  }

  /**
   * @returns A template for the main input element
   */
  [mainInputTemplate](): TemplateResult {
    const { inputIcon, inputIconTitle, value } = this;
    const acOpened = this[autocompleteOpened];
    const iconClasses = {
      'toggle-icon': true,
      disabled: acOpened,
    };
    return html`
    <div class="input-wrapper">
      <input 
        .value="${value}" 
        class="main-input"
        required
        placeholder="Request URL"
        id="mainInput"
        autocomplete="off"
        spellcheck="false"
        @focus="${this[mainFocusBlurHandler]}"
        @blur="${this[mainFocusBlurHandler]}"
        @input="${this[inputHandler]}"
        aria-label="The URL value"
      />
      <api-icon 
        icon="${inputIcon}"
        title="${inputIconTitle}"
        class="${classMap(iconClasses)}"
        @click="${this[toggleHandler]}"
      ></api-icon>
    </div>
    ${this[urlAutocompleteTemplate]()}
    `;
  }

  /**
   * @returns A template for the autocomplete element
   */
  [urlAutocompleteTemplate](): TemplateResult {
    const { detailsOpened } = this;
    let opened = this[autocompleteOpened];
    if (opened && detailsOpened) {
      opened = false;
    }
    if (opened && (!this[renderedSuggestions] || !this[renderedSuggestions].length)) {
      opened = false;
    }
    return html`
    <anypoint-dropdown
      class="url-autocomplete"
      fitPositionTarget
      .positionTarget="${this as HTMLElement}"
      verticalAlign="top"
      horizontalAlign="left"
      verticalOffset="45"
      .opened="${opened}"
      noAutofocus
      noCancelOnOutsideClick
      @resize="${this[autocompleteResizeHandler]}"
      @overlay-opened="${EventUtils.cancelEvent}"
      @overlay-closed="${EventUtils.cancelEvent}"
      @iron-overlay-opened="${EventUtils.cancelEvent}"
      @iron-overlay-closed="${EventUtils.cancelEvent}"
      @opened="${EventUtils.cancelEvent}"
      @closed="${this[autocompleteClosedHandler]}"
    >
      <div class="suggestions-container" slot="dropdown-content">
        <anypoint-listbox
          aria-label="Use arrows and enter to select list item. Escape to close the list."
          selectable="anypoint-item"
          useAriaSelected
          @select="${this[suggestionHandler]}"
        >
          ${this[suggestionsListTemplate]()}
        </anypoint-listbox>
        <p class="clear-all-history">
          <span class="clear-all-history-label" @click="${this[clearSuggestionsHandler]}">Clear all history</span>
        </p>
      </div>
    </anypoint-dropdown>
    `;
  }

  /**
   * @returns {TemplateResult[]|string} The template for the suggestions list.
   */
  [suggestionsListTemplate](): TemplateResult[] | string {
    const items = this[renderedSuggestions];
    if (!Array.isArray(items) || !items.length) {
      return '';
    }
    return items.map(i => this[suggestionItemTemplate](i));
  }

  /**
   * @param {ARCUrlHistory} item 
   * @returns The template for an URL suggestion item.
   */
  [suggestionItemTemplate](item: any): TemplateResult {
    const { url, _id } = item;
    // this has a11y rule disabled because we are not planning to make this so complex to use
    // where you can switch between the list context to a button context.
    return html`
    <anypoint-item>
      <div>${url}</div>
      <span 
        class="remove-suggestion" 
        data-id="${_id}" 
        @click="${this[removeSuggestionHandler]}"
      >Remove</span>
    </anypoint-item>`;
  }

  /**
   * @returns A template for the background shadow below
   * the main input and the overlays
   */
  [shadowTemplate](): TemplateResult {
    const opened = this[shadowContainerOpened];
    const styles = { height: `0px` };
    if (this[shadowContainerHeight] !== undefined) {
      styles.height = `${this[shadowContainerHeight]}px`
    }
    const classes = {
      'content-shadow': true,
      opened,
    };
    return html`
    <div class="${classMap(classes)}" style=${styleMap(styles)}></div>
    `;
  }

  /**
   * @returns A template for query parameters overlay
   */
  [paramsEditorTemplate](): TemplateResult {
    const { readOnly, detailsOpened, value } = this;
    return html`
    <url-params-editor
      class="params-editor"
      fitPositionTarget
      horizontalAlign="left"
      verticalAlign="top"
      .positionTarget="${this as HTMLElement}"
      noOverlap
      .value="${value}"
      noCancelOnOutsideClick
      @urlencode="${this.encodeParameters}"
      @urldecode="${this.decodeParameters}"
      @change="${this[inputHandler]}"
      ?readOnly="${readOnly}"
      ?opened="${detailsOpened}"
      @opened="${this[paramsOpenedHandler]}"
      @closed="${this[paramsClosedHandler]}"
      @overlay-closed="${EventUtils.cancelEvent}"
      @overlay-opened="${EventUtils.cancelEvent}"
      @iron-overlay-closed="${EventUtils.cancelEvent}"
      @iron-overlay-opened="${EventUtils.cancelEvent}"
      @resize="${this[paramsResizeHandler]}"
    ></url-params-editor>
    `;
  }
}
