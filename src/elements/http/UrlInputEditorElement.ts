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
import { html, CSSResult, TemplateResult, PropertyValueMap } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';
import { property, state, query } from 'lit/decorators.js';
import { ValidatableElement, EventsTargetMixin, AnypointListboxElement } from '@anypoint-web-components/awc';
import '@anypoint-web-components/awc/dist/define/anypoint-icon-button.js';
import '@anypoint-web-components/awc/dist/define/anypoint-button.js';
import '@anypoint-web-components/awc/dist/define/anypoint-input.js';
import '@anypoint-web-components/awc/dist/define/anypoint-dropdown.js';
import '@anypoint-web-components/awc/dist/define/anypoint-item.js';
import '@anypoint-web-components/awc/dist/define/anypoint-item-body.js';
import '@anypoint-web-components/awc/dist/define/anypoint-listbox.js';
import '@anypoint-web-components/awc/dist/define/anypoint-collapse.js';
import { Events as CoreEvents, IUrl, EventUtils, Environment, Property, Server } from '@api-client/core/build/browser.js';
import classStyles from './UrlInputEditor.styles.js';
import UrlParamsEditorElement from './UrlParamsEditorElement.js';
import { IconType } from '../icons/Icons.js';
import { sortUrls } from '../../lib/http/Url.js';
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
  notifyChange,
  extValueChangeHandler,
  keyDownHandler,
  dispatchAnalyticsEvent,
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
import { Events } from '../../events/Events.js';
import { EventTypes } from '../../events/EventTypes.js';

/* eslint-disable no-param-reassign */
/* eslint-disable no-plusplus */
/* eslint-disable no-continue */
/* eslint-disable class-methods-use-this */

/**
 * The request URL editor
 *
 * The element renders an editor for a HTTP request editor.
 */
export default class UrlInputEditorElement extends EventsTargetMixin(ValidatableElement) {
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
  @property({ type: Boolean, reflect: true }) detailsOpened = false;

  /**
   * Default protocol for the URL if it's missing.
   */
  @property({ type: String, reflect: true }) defaultProtocol = 'http';

  /**
   * When set the editor is in read only mode.
   */
  @property({ type: Boolean, reflect: true }) readOnly = false;

  /**
   * The list of environments that apply to the current request.
   */
  @property({ type: Array }) environments?: Environment[];

  /**
   * The key of the selected environment.
   */
  @property({ type: String, reflect: true }) environment?: string;

  @state() [autocompleteOpened] = false;

  @state() [suggestionsValue]?: IUrl[];

  @state() [renderedSuggestions]?: IUrl[];

  [previousValue]?: string;

  [focusedValue] = false;

  [overlayOpenedValue]?: boolean;

  [shadowContainerOpened] = false;

  [shadowContainerHeight]?: number;

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

  /**
   * Computed value when an environment change.
   * 
   * Reads the environment to render in the view if any is defined.
   * When the `environment` is not set it returns the first environment.
   */
  @state() protected effectiveEnvironment: Environment | undefined;

  /**
   * A flag that determines whether environment selector is rendered.
   */
  @state() protected withEnvironment = false;

  /**
   * The list of variables to apply to the current request.
   * This is computed when the `environments` or `environment` change.
   */
  @state() protected variables?: Property[];

  /**
   * The label to render in the environment selector.
   * This is computed when the `environments` or `environment` change.
   */
  @state() protected environmentLabel?: string;

  /**
   * Whether the environment selector is opened.
   */
  @state() protected environmentSelectorOpened = false;

  @query('.environment-selector')
  envSelectorWrapper?: HTMLElement;

  constructor() {
    super();
    this[extValueChangeHandler] = this[extValueChangeHandler].bind(this);
    this[keyDownHandler] = this[keyDownHandler].bind(this);
    this[urlHistoryDeletedHandler] = this[urlHistoryDeletedHandler].bind(this);
    this[urlHistoryDestroyedHandler] = this[urlHistoryDestroyedHandler].bind(this);
  }

  _attachListeners(node: EventTarget): void {
    super._attachListeners(node);
    node.addEventListener(EventTypes.HttpProject.Request.State.urlChange, this[extValueChangeHandler]);
    node.addEventListener(EventTypes.AppData.Http.UrlHistory.State.delete, this[urlHistoryDeletedHandler]);
    node.addEventListener(EventTypes.AppData.Http.UrlHistory.State.clear, this[urlHistoryDestroyedHandler]);
    this.addEventListener('keydown', this[keyDownHandler]);
  }

  _detachListeners(node: EventTarget): void {
    super._detachListeners(node);
    node.removeEventListener(EventTypes.HttpProject.Request.State.urlChange, this[extValueChangeHandler]);
    node.removeEventListener(EventTypes.AppData.Http.UrlHistory.State.delete, this[urlHistoryDeletedHandler]);
    node.removeEventListener(EventTypes.AppData.Http.UrlHistory.State.clear, this[urlHistoryDestroyedHandler]);
    this.removeEventListener('keydown', this[keyDownHandler]);
  }

  protected updated(cp: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
    super.updated(cp);
    if (cp.has('environments') || cp.has('environment')) {
      this._computeEnvironment();
    }
  }

  protected _computeEnvironment(): void {
    const { environment, environments } = this;
    if (!Array.isArray(environments) || !environments.length) {
      this.withEnvironment = false;
      return;
    }
    this.withEnvironment = true;
    // selected env
    let effective = environments.find(i => i.key === environment);
    if (!effective) {
      [effective] = environments;
    }
    this.effectiveEnvironment = effective;

    // variables
    const flatProperties: Property[] = [];
    let effectiveServer: Server | undefined;

    for (const env of environments) {
      if (env.server && env.server.uri) {
        effectiveServer = env.server;
      }
      if (env.variables) {
        for (const prop of env.variables) {
          // environments are listed from the project's root down to the folder where the requests
          // exists. When a folder has a variable that was already defined it is replaced.
          const index = flatProperties.findIndex(i => i.name === prop.name);
          if (index >= 0) {
            flatProperties.splice(index, 1);
          }
          flatProperties.push(prop);
        }
      }
      if (env === effective) {
        break;
      }
    }

    this.variables = flatProperties;

    // label in the env selector
    let renderPrefix: string | undefined;
    if (effectiveServer) {
      renderPrefix = effectiveServer.readUri(flatProperties);
    }
    if (!renderPrefix) {
      renderPrefix = effective.info.name || 'Unnamed environment';
    }
    this.environmentLabel = renderPrefix;
  }

  /**
   * A handler that is called on input
   */
  [notifyChange](): void {
    Events.HttpProject.Request.State.urlChange(this.value, this);
    this.dispatchEvent(new Event('change'));
  }

  /**
   * A handler for the `url-value-changed` event.
   * If this element is not the source of the event then it will update the `value` property.
   * It's to be used besides the Polymer's data binding system.
   */
  [extValueChangeHandler](e: Event): void {
    if (e.composedPath()[0] === this || this.readOnly) {
      return;
    }
    const { value } = (e as CustomEvent).detail;
    if (value !== this.value) {
      this.value = value;
    }
  }

  /**
   * Opens detailed view.
   */
  toggle(): void {
    this.detailsOpened = !this.detailsOpened;
    this.dispatchEvent(new Event('detailsopened'));
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
   * Queries the data model for history data and sets the suggestions
   * @param q User query from the input field
   */
  async [readAutocomplete](q: string): Promise<void> {
    try {
      const value = await Events.AppData.Http.UrlHistory.query(q, this);
      this[suggestionsValue] = value && value.filter(i => !!i);
    } catch (e) {
      this[suggestionsValue] = undefined;
    }
  }

  [keyDownHandler](e: KeyboardEvent): void {
    const target = e.composedPath()[0] as HTMLElement;
    if (!target || target.nodeName !== 'INPUT') {
      return;
    }
    if (!this[autocompleteOpened] && ['Enter', 'NumpadEnter'].includes(e.code)) {
      Events.HttpProject.Request.send(this);
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
          Events.HttpProject.Request.send(this);
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
      return element.checkValidity();
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
    if (!this.detailsOpened && node.classList.contains('main-input')) {
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
    const q = String(value).toLowerCase();
    const rendered = items.filter(i => i.url.toLowerCase().includes(q));
    if (!rendered.length) {
      this[toggleSuggestions](false);
      return;
    }
    if (rendered.length === 1 && rendered[0].url.toLowerCase() === q) {
      this[toggleSuggestions](false);
      return;
    }
    sortUrls(rendered, q);
    this[renderedSuggestions] = rendered;
    this[toggleSuggestions](true);
    this.requestUpdate();
    await this.updateComplete;
    const node = this.shadowRoot!.querySelector('anypoint-dropdown')!;
    node.refit();
    node.notifyResize();
    this[setSuggestionsWidth]();
  }

  [toggleSuggestions](opened: boolean): void {
    if (!opened && this[overlayOpenedValue]) {
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
    const items = this[renderedSuggestions];
    if (!items || selected === -1 || selected === null || selected === undefined) {
      return;
    }
    const item = items[selected as number];
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
  [removeSuggestionHandler](e: Event): void {
    e.preventDefault();
    e.stopPropagation();
    const node = e.target as HTMLElement;
    const { id } = node.dataset;
    if (!id) {
      return;
    }
    Events.AppData.Http.UrlHistory.delete(id, this);
  }

  /**
   * Removes all stored history URLs.
   */
  [clearSuggestionsHandler](e: Event): void {
    e.preventDefault();
    e.stopPropagation();
    Events.AppData.Http.UrlHistory.clear(this);
  }

  
  [urlHistoryDeletedHandler](e: Event): void {
    const items = this[suggestionsValue];
    if (!Array.isArray(items)) {
      return;
    }
    const url = (e as CustomEvent).detail;
    const index = items.findIndex(i => i.url === url);
    items.splice(index, 1);
    if (this[autocompleteOpened]) {
      this[filterSuggestions]();
    }
  }

  [urlHistoryDestroyedHandler](): void {
    this[suggestionsValue] = undefined;
    this[renderedSuggestions] = undefined;
    this[toggleSuggestions](false);
  }

  protected _selectorClickHandler(): void {
    this.environmentSelectorOpened = true;
  }

  protected _selectorKeydownHandler(e: KeyboardEvent): void {
    if (e.key === 'Enter') {
      e.preventDefault();
      this.environmentSelectorOpened = true;
    }
  }

  protected _selectorClosed(e: Event): void {
    EventUtils.cancelEvent(e);
    this.environmentSelectorOpened = false;
  }

  protected _environmentSelectHandler(e: Event): void {
    const list = e.target as AnypointListboxElement;
    const { selected } = list;
    // list.selected = undefined;
    EventUtils.cancelEvent(e);
    this.environmentSelectorOpened = false;
    this.environment = selected as string; 
  }

  render(): TemplateResult {
    const focused = this[focusedValue];
    const overlay = !!this[overlayOpenedValue];
    const acOpened = this[autocompleteOpened];
    const classes = {
      container: true,
      focused,
      overlay,
      autocomplete: acOpened,
      'environment': this.withEnvironment,
    };
    return html`
    ${this[shadowTemplate]()}
    <div class="${classMap(classes)}">
      <div class="container-prefix"></div>
      ${this[mainInputTemplate]()}  
      ${this[paramsEditorTemplate]()}
      <div class="container-suffix"></div>
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
      ${this._environmentSelectorTemplate()}
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

  protected _environmentSelectorTemplate(): TemplateResult | string {
    if (!this.withEnvironment) {
      return '';
    }
    const { environments } = this;
    const label = this.environmentLabel!;
    const renderDropdown = environments!.length > 1;
    return html`
    <div 
      class="environment-selector" 
      tabindex="0" 
      @click="${this._selectorClickHandler}" 
      @keydown="${this._selectorKeydownHandler}"
      aria-label="Selected environment"
      title="Selected environment"
    >
      <span class="environment-label">${label}</span>
      ${renderDropdown ? html`<api-icon icon="arrowDropDown" class="env-trigger"></api-icon>` : ''}
    </div>
    ${renderDropdown ? this._environmentDropdownTemplate(environments!) : ''}
    `;
  }

  protected _environmentDropdownTemplate(environments: Environment[]): TemplateResult {
    const effective = this.effectiveEnvironment;
    return html`
    <anypoint-dropdown 
      .opened="${this.environmentSelectorOpened}"
      .positionTarget="${this.envSelectorWrapper}"
      fitPositionTarget
      noOverlap
      @opened="${EventUtils.cancelEvent}"
      @closed="${this._selectorClosed}"
    >
      <anypoint-listbox
        class="env-options"
        useAriaSelected
        slot="dropdown-content"
        @selected="${this._environmentSelectHandler}"
        attrForSelected="data-key"
        .selected="${effective && effective.key}"
      >
        ${environments.map(e => this._environmentListItem(e))}
      </anypoint-listbox>
    </anypoint-dropdown>
    `;
  }

  protected _environmentListItem(environment: Environment): TemplateResult {
    const name = environment.info.name || 'Unnamed environment';
    const srv = environment.getServer();
    const url = srv?.readUri();
    return html`
    <anypoint-item data-key="${environment.key}">
      <anypoint-item-body ?twoLine="${!!url}">
        <div>${name}</div>
        ${url ? html`<div data-secondary>${url}</div>` : ''}
      </anypoint-item-body>
    </anypoint-item>
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
    const items = this[renderedSuggestions];
    if (opened && (!items || !items.length)) {
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
   * @returns The template for the suggestions list.
   */
  [suggestionsListTemplate](): TemplateResult[] | string {
    const items = this[renderedSuggestions];
    if (!Array.isArray(items) || !items.length) {
      return '';
    }
    return items.map(i => this[suggestionItemTemplate](i));
  }

  /**
   * @returns The template for an URL suggestion item.
   */
  [suggestionItemTemplate](item: IUrl): TemplateResult {
    const { url } = item;
    // this has a11y rule disabled because we are not planning to make this so complex to use
    // where you can switch between the list context to a button context.
    return html`
    <anypoint-item>
      <div>${url}</div>
      <span 
        class="remove-suggestion" 
        data-id="${url}" 
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
      @change="${this[inputHandler]}"
      ?readOnly="${readOnly}"
      ?opened="${detailsOpened}"
      @opened="${this[paramsOpenedHandler]}"
      @closed="${this[paramsClosedHandler]}"
      @resize="${this[paramsResizeHandler]}"
    ></url-params-editor>
    `;
  }
}
