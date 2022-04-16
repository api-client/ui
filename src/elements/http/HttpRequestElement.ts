/* eslint-disable class-methods-use-this */
import { LitElement, html, TemplateResult, CSSResult, PropertyValueMap } from 'lit';
import { property, state } from 'lit/decorators.js';
import { ProjectRequest, Environment, Events as CoreEvents, IProjectRequest, DeserializedPayload } from '@api-client/core/build/browser.js';
import { EventsTargetMixin, ResizableMixin, AnypointTabsElement } from '@anypoint-web-components/awc';
import "@anypoint-web-components/awc/dist/define/anypoint-dropdown.js";
import "@anypoint-web-components/awc/dist/define/anypoint-listbox.js";
import "@anypoint-web-components/awc/dist/define/anypoint-icon-item.js";
import "@anypoint-web-components/awc/dist/define/anypoint-tabs.js";
import "@anypoint-web-components/awc/dist/define/anypoint-tab.js";
import '../../define/api-icon.js';
import '../../define/url-input-editor.js';
import UrlInputEditorElement from './UrlInputEditorElement.js';
import elementStyles from './HttpRequestElementStyles.js';
import { SecurityProcessor } from '../../lib/security/SecurityProcessor.js';

export const urlMetaTemplate = Symbol('urlMetaTemplate');
export const httpMethodSelectorTemplate = Symbol('httpMethodSelectorTemplate');
export const urlEditorTemplate = Symbol('urlEditorTemplate');
export const methodSelectorOpened = Symbol('methodSelectorOpened');
export const methodClosedHandler = Symbol('methodClosedHandler');
export const methodOptionsTemplate = Symbol('methodOptionsTemplate');
export const methodSelectorClickHandler = Symbol('methodSelectorClickHandler');
export const methodSelectorKeydownHandler = Symbol('methodSelectorKeydownHandler');
export const requestMenuHandler = Symbol('requestMenuHandler');
export const tabsTemplate = Symbol('tabsTemplate');
export const tabChangeHandler = Symbol('tabChangeHandler');
export const currentEditorTemplate = Symbol('currentEditorTemplate');
export const headersTemplate = Symbol('headersTemplate');
export const bodyTemplate = Symbol('bodyTemplate');
export const authorizationTemplate = Symbol('authorizationTemplate');
export const actionsTemplate = Symbol('actionsTemplate');
export const actionsUiHandler = Symbol('actionsUiHandler');
export const actionsHandler = Symbol('actionsHandler');
export const snippetsTemplate = Symbol('snippetsTemplate');
export const headersHandler = Symbol('headersHandler');
export const bodyHandler = Symbol('bodyHandler');
export const authorizationHandler = Symbol('authorizationHandler');
export const configHandler = Symbol('configHandler');
export const headersValue = Symbol('headersValue');
export const uiConfigValue = Symbol('uiConfigValue');
export const readHeaders = Symbol('readHeaders');
export const awaitingOAuth2authorization = Symbol('awaitingOAuth2authorization');
export const headersDialogTemplate = Symbol('headersDialogTemplate');
export const contentWarningCloseHandler = Symbol('contentWarningCloseHandler');
export const sendIgnoreValidation = Symbol('sendIgnoreValidation');
export const internalSendHandler = Symbol('internalSendHandler');
export const metaRequestEditorHandler = Symbol('metaRequestEditorHandler');
export const requestMetaCloseHandler = Symbol('requestMetaCloseHandler');
export const curlDialogTemplate = Symbol('curlDialogTemplate');
export const importCURL = Symbol('importCURL');
export const curlCloseHandler = Symbol('curlCloseHandler');
export const sendButtonTemplate = Symbol('sendButtonTemplate');
export const snippetsRequestSymbol = Symbol('snippetsRequest');
export const computeSnippetsRequestSymbol = Symbol('computeSnippetsRequest');

export const HttpMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'CONNECT', 'OPTIONS', 'TRACE'];
export const NonPayloadMethods = ['GET', 'HEAD'];

/**
 * An element that renders an HTTP editor.
 */
export default class HttpRequestElement extends ResizableMixin(EventsTargetMixin(LitElement)) {
  static get styles(): CSSResult[] {
    return [elementStyles];
  }

  /**
   * The request payload.
   * It can be just a string or an object with the payload data depending on the content type.
   */
  @property() payload?: DeserializedPayload;

  /**
   * The HTTP method (or operation).
   */
  @property({ type: String }) method?: string;

  /**
   * The request URL
   */
  @property({ type: String }) url?: string;

  /**
   * The HTTP headers string.
   */
  @property({ type: String }) headers?: string;

  /**
   * The list of environments that apply to the current request.
   */
  @property({ type: Array }) environments?: Environment[];

  /**
   * The key of the selected environment.
   */
  @property({ type: String }) environment?: string;

  /**
   * The project request object.
   */
  @property({ type: Object }) request?: ProjectRequest;

  /** 
   * The Current content type value.
   */
  @property({ type: String }) contentType?: string;

  /**
   * Redirect URL for the OAuth2 authorization.
   * If can be also set by dispatching `oauth2-redirect-url-changed`
   * with `value` property on the `detail` object.
   */
  @property({ type: String }) oauth2RedirectUri?: string;

  /**
   * When set the editor is in read only mode.
   */
  @property({ type: Boolean }) readOnly = false;

  /**
   * A value to be passed to the OAuth 2 `authorizationUri` property in case
   * if current configuration has no value.
   * This is to be used as a default value.
   */
  @property({ type: String }) oauth2AuthorizationUri?: string;

  /**
   * A value to be passed to the OAuth 2 `accessTokenUri` property in case
   * if current configuration has no value.
   * This is to be used as a default value.
   */
  @property({ type: String }) oauth2AccessTokenUri?: string;

  /**
   * When set it ignores all `content-*` headers when the request method is `GET`.
   * When not set or `false` it renders a warning message.
   */
  @property({ type: Boolean }) ignoreContentOnGet = false;

  /** 
   * When set the `content-` headers warning dialog is rendered.
   */
  @property({ type: Boolean }) contentHeadersDialogOpened = false;

  /** 
   * When set it renders the send request button.
   */
  @property({ type: Boolean }) renderSend = false;

  /**
   * To be set when the request is being transported.
   */
  @property({ type: Boolean }) loading = false;

  /** 
   * When set the editor does not allow to send the request if one is already loading.
   */
  @property({ type: Boolean }) noSendOnLoading = false;

  @state() [snippetsRequestSymbol]?: IProjectRequest;

  /**
   * An index of currently opened tab.
   * @default 0
   */
  @property({ type: Number }) selectedTab = 0;

  /**
   * A request object that is used to render the code snippets.
   */
  get snippetsRequest(): IProjectRequest | undefined {
    return this[snippetsRequestSymbol];
  }

  @state() [methodSelectorOpened] = false;

  /**
   * @returns True when the request cannot have the payload on the message.
   */
  get isPayload(): boolean {
    const expects = this.request?.getExpects();
    if (!expects) {
      return false
    }
    return !NonPayloadMethods.includes(expects.method);
  }

  constructor() {
    super();
    this[internalSendHandler] = this[internalSendHandler].bind(this);
  }

  _attachListeners(node: EventTarget): void {
    super._attachListeners(node);
    // FIXME:  Implement this event
    // node.addEventListener(RequestEventTypes.send, this[internalSendHandler]);
  }

  _detachListeners(node: EventTarget): void {
    super._attachListeners(node);
    // node.addEventListener(RequestEventTypes.send, this[internalSendHandler]);
  }

  firstUpdated(changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
    super.firstUpdated(changedProperties);
    this[computeSnippetsRequestSymbol]();
  }

  /**
   * Reads the headers value and applies the `ignoreContentOnGet` application setting.
   */
  [readHeaders](): string {
    let { headers } = this;
    if (!headers) {
      return '';
    }
    const { method='GET' } = this;
    if (this.ignoreContentOnGet && method.toLowerCase() === 'get') {
      const reg = /^content-\S+(\s+)?:.*\n?/gim;
      headers = headers.replace(reg, '');
    }
    return headers.trim();
  }

  /**
   * Validates state of the URL.
   * @return True if the URL has a structure that looks like
   * an URL which means scheme + something
   */
  validateUrl(): boolean {
    const panel = this.shadowRoot!.querySelector('url-input-editor');
    if (!panel) {
      return true;
    }
    return panel.validate(panel.value);
  }

  /**
   * Checks if current request requires calling `authorize()` on the OAuth2 method.
   *
   * @return This returns `true` only for valid OAuth 2 method that has no access token.
   */
  requiresAuthorization(): boolean {
    if (!this.request) {
      return false;
    }
    const { authorization=[] } = this.request;
    const oauth = authorization.find((method) => method.enabled && method.type === 'oauth 2');
    if (!oauth) {
      return false;
    }
    // FIXME: When having auth methods
    // const authMethod = /** @type AuthorizationMethodElement */ (this.shadowRoot!.querySelector('authorization-method[type="oauth 2"]'));
    // const cnf = /** @type OAuth2Authorization */ (oauth.config);
    // if (authMethod.validate() && !cnf.accessToken) {
    //   return true;
    // }
    return false;
  }

  /**
   * Validates headers for `Content-*` entries against current method.
   * @param request The request object
   * @return True if headers are invalid.
   */
  validateContentHeaders(request: any): boolean {
    const method = request.method || 'get';
    if (method.toLowerCase() !== 'get') {
      return false;
    }
    if ((request.headers || '').toLowerCase().indexOf('content-') === -1) {
      return false;
    }
    return true;
  }

  /**
   * Dispatches the send request event to the ARC request engine.
   */
  send(): void {
    if (this.loading && this.noSendOnLoading) {
      return;
    }
    if (!this.validateUrl()) {
      return;
    }
    if (this.requiresAuthorization()) {
      // const authMethod = /** @type AuthorizationMethodElement */ (this.shadowRoot.querySelector('authorization-method[type="oauth 2"]'));
      // authMethod.authorize();
      // this[awaitingOAuth2authorization] = true;
      return;
    }
    // this.requestId = v4();
    this.notifyRequestChanged();
    // const request = this.serialize();
    // if (!this.ignoreValidationOnGet && this.validateContentHeaders(request.request)) {
    //   this.contentHeadersDialogOpened = true;
    //   return;
    // }
    // TransportEvents.request(this, request);
    // TelemetryEvents.event(this, {
    //   category: 'Request editor',
    //   action: 'Send request',
    // });
  }

  /**
   * Aborts the request
   */
  abort(): void {
    // TransportEvents.abort(this, this.requestId);
  }

  [internalSendHandler](e: Event): void {
    e.stopPropagation();
    this.send();
  }

  [methodSelectorKeydownHandler](e: KeyboardEvent): void {
    if (['Space', 'Enter', 'NumpadEnter', 'ArrowDown'].includes(e.code)) {
      this[methodSelectorClickHandler]();
    }
  }

  async [methodSelectorClickHandler](): Promise<void> {
    this[methodSelectorOpened] = false;
    this.requestUpdate();
    await this.updateComplete;
    this[methodSelectorOpened] = true;
    this.requestUpdate();
    await this.updateComplete;
  }

  /**
   * The handler for the method drop down list close event.
   */
  [methodClosedHandler](): void {
    this[methodSelectorOpened] = false;
  }

  /**
   * The handler for the HTTP method drop down.
   */
  protected _methodActivateHandler(e: CustomEvent): void {
    this[methodSelectorOpened] = false;
    const { selected } = e.detail;
    this.method = selected;
    this.notifyRequestChanged();
    this.notifyChanged('method', selected);
    if (!this.isPayload && this.selectedTab === 1) {
      this.selectedTab = 0;
    }
    CoreEvents.Telemetry.event(this, {
      category: 'Request editor',
      action: 'Method selected',
      label: selected,
    });
    this[computeSnippetsRequestSymbol]();
  }

  /**
   * The handler for the URL editor change event
   */
  protected _urlHandler(e: Event): void {
    const panel = e.target as UrlInputEditorElement;
    const { value } = panel;
    this._updateUrl(value);
  }

  /**
   * Commits the change in the URL.
   * @param value The new URL value
   */
  protected _updateUrl(value: string): void {
    this.url = value;
    this.notifyRequestChanged();
    this.notifyChanged('url', value);
    this[computeSnippetsRequestSymbol]();
  }

  async [tabChangeHandler](e: Event): Promise<void> {
    const tabs = e.target as AnypointTabsElement;
    this.selectedTab = Number(tabs.selected);
    this.refreshEditors();
    // if (!this.uiConfig) {
    //   this.uiConfig = {};
    // }
    // this.uiConfig.selectedEditor = this.selectedTab;
    this.notifyRequestChanged();
    // this.notifyChanged('uiConfig', this.uiConfig);
    const labels = ['Headers', 'Body', 'Authorization', 'Actions', 'Config', 'Code snippets'];
    CoreEvents.Telemetry.event(this, {
      category: 'Request editor',
      action: 'Editor switched',
      label: labels[this.selectedTab],
    });
    await this.updateComplete;
    this.notifyResize();
  }

  /**
   * Refreshes payload and headers editors
   * state (code mirror) if currently selected.
   */
  async refreshEditors(): Promise<void> {
    await this.updateComplete;
    this.notifyResize();
    // this ensures that the workspace element receives the event
    this.dispatchEvent(new Event('resize', { bubbles: true, composed: true }));
  }

  /**
   * The handler for the headers change event from the headers editor.
   */
  [headersHandler](e: Event): void {
    e.preventDefault();
    // const node = /** @type HeadersEditorElement */ (e.target);
    // const { value, model, source } = node;
    // this[headersValue] = value;
    // if (!this.uiConfig) {
    //   this.uiConfig = {};
    // }
    // if (!this.uiConfig.headers) {
    //   this.uiConfig.headers = {};
    // }
    // this.uiConfig.headers.model = model;
    // this.uiConfig.headers.source = source;
    // this.contentType = HeadersParser.contentType(value);
    this.notifyRequestChanged();
    // this.notifyChanged('headers', value);
    this[computeSnippetsRequestSymbol]();
  }

  /**
   * The handler for the body editor change event
   */
  [bodyHandler](e: Event): void {
    e.preventDefault();
    // const node = /** @type BodyEditorElement */ (e.target);
    // const { value, model, selected } = node;
    // this.payload = value;
    // if (!this.uiConfig) {
    //   this.uiConfig = {};
    // }
    // if (!this.uiConfig.body) {
    //   this.uiConfig.body = {};
    // }
    // this.uiConfig.body.model = model;
    // this.uiConfig.body.selected = selected;
    this.notifyRequestChanged();
    // this.notifyChanged('payload', value);
    this[computeSnippetsRequestSymbol]();
  }

  /**
   * The handler for the authorization editor change event
   * @param {Event} e
   */
  [authorizationHandler](e: Event): void {
    e.preventDefault();
    // const selector = /** @type AuthorizationSelectorElement */ (e.target);
    // const { selected, type } = selector;
    // const methods = /** @type AuthorizationMethodElement[] */ (selector.items);
    // const result = /** @type RequestAuthorization[] */ ([]);
    // methods.forEach((authMethod) => {
    //   const { type: mType } = authMethod;
    //   const config = (authMethod && authMethod.serialize) ? authMethod.serialize() : undefined;
    //   const valid = (authMethod && authMethod.validate) ? authMethod.validate() : true;
    //   const enabled = type.includes(mType);
    //   result.push({
    //     config,
    //     type: mType,
    //     enabled,
    //     valid,
    //   });
    // });
    // this.authorization = result;
    // if (!this.uiConfig) {
    //   this.uiConfig = {};
    // }
    // if (!this.uiConfig.authorization) {
    //   this.uiConfig.authorization = {};
    // }
    // this.uiConfig.authorization.selected = /** @type number */ (selected);
    this.notifyRequestChanged();
    // this.notifyChanged('authorization', result);
    this.requestUpdate();
    this[computeSnippetsRequestSymbol]();
  }

  /**
   * The handler for the actions editor change event
   */
  [actionsHandler](e: CustomEvent): void {
    e.preventDefault();
    // const panel = /** @type ARCActionsElement */ (e.target);
    // const { type } = e.detail;
    // const list = type === 'request' ? panel.request : panel.response;
    // const prop = type === 'request' ? 'requestActions' : 'responseActions';
    // this[prop] = /** @type RunnableAction[] */ (list);
    // const { selected } = panel;
    // if (!this.uiConfig) {
    //   this.uiConfig = {};
    // }
    // if (!this.uiConfig.actions) {
    //   this.uiConfig.actions = {};
    // }
    // this.uiConfig.actions.selected = selected;
    this.notifyRequestChanged();
    // this.notifyChanged(prop, list);
    this.requestUpdate();
  }

  /**
   * The handler for the actions editor UI state change event
   */
  [actionsUiHandler](e: Event): void {
    e.preventDefault();
    // const panel = /** @type ARCActionsElement */ (e.target);
    // const { selected } = panel;
    // if (!this.uiConfig) {
    //   this.uiConfig = {};
    // }
    // if (!this.uiConfig.actions) {
    //   this.uiConfig.actions = {};
    // }
    // this.uiConfig.actions.selected = selected;
    this.notifyRequestChanged();
    // this.notifyChanged('uiConfig', this.uiConfig);
  }

  /**
   * The handler for the config editor change event
   */
  [configHandler](e: Event): void {
    e.preventDefault();
    // const node = /** @type ArcRequestConfigElement */ (e.target);
    // this.config = node.config;
    this.notifyRequestChanged();
    // this.notifyChanged('config', this.config);
  }

  /**
   * Called when a value on one of the editors change.
   * Dispatches non-bubbling `change` event.
   */
  notifyRequestChanged(): void {
    this.dispatchEvent(new Event('change'));
  }

  /**
   * Called to notify listeners about a particular property change
   * 
   * @param type The property that changed. The resulting event type is the combination of this value and the `change` suffix.
   * @param value The value of the changed property
   */
  notifyChanged(type: string, value: any): void {
    this.dispatchEvent(new CustomEvent(`${type}change`, {
      detail: {
        value
      }
    }));
  }

  [contentWarningCloseHandler](): void {
    this.contentHeadersDialogOpened = false;
  }

  [sendIgnoreValidation](): void {
    // this.ignoreValidationOnGet = true;
    this.send();
  }

  /**
   * When a request change this recomputes the values for code snippets.
   * These are different from the actual values in the request as
   * they contain authorization values applied to it.
   */
  [computeSnippetsRequestSymbol](): void {
    const { request } = this;
    if (!request) {
      return;
    }
    const serialized = request.toJSON();
    const { authorization=[] } = serialized;
    SecurityProcessor.applyAuthorization(serialized, authorization, { immutable: true });
    this[snippetsRequestSymbol] = serialized;
  }

  render(): TemplateResult {
    return html`
    ${this[urlMetaTemplate]()}
    ${this[tabsTemplate]()}
    ${this[currentEditorTemplate]()}
    ${this[headersDialogTemplate]()}
    `;
  }

  /**
   * @returns The template for the top line with method selector, URL, and options.
   */
  protected [urlMetaTemplate](): TemplateResult {
    return html`
    <div class="url-meta">
      ${this[httpMethodSelectorTemplate]()}
      ${this[urlEditorTemplate]()}
      ${this[sendButtonTemplate]()}
    </div>
    `;
  }

  /**
   * @returns The template for the HTTP method selector
   */
  protected [httpMethodSelectorTemplate](): TemplateResult {
    const { method='GET' } = this;
    const target = this as HTMLElement;
    return html`
    <div 
      class="method-selector"
      tabindex="0"
      @click="${this[methodSelectorClickHandler]}"
      @keydown="${this[methodSelectorKeydownHandler]}"
    >
      <span class="label">${method}</span>
      <api-icon icon="expandMore"></api-icon>
    </div>
    <anypoint-dropdown 
      .opened="${this[methodSelectorOpened]}" 
      .positionTarget="${target}" 
      verticalAlign="top"
      @closed="${this[methodClosedHandler]}"
      @activate="${this._methodActivateHandler}"
    >
      <anypoint-listbox 
        fallbackSelection="GET" 
        attrForSelected="data-method" 
        slot="dropdown-content" 
        selectable="anypoint-icon-item"
        class="method-list"
      >
        ${this[methodOptionsTemplate]()}
      </anypoint-listbox>
    </anypoint-dropdown>
    `;
  }

  /**
   * @returns The templates for each supported HTTP methods
   */
  protected [methodOptionsTemplate](): TemplateResult[] {
    return HttpMethods.map((method) => html`
    <anypoint-icon-item
      data-method="${method}"
    >
      <div slot="item-icon" data-method="${method.toLocaleLowerCase()}" class="http-label"></div>
      ${method}
    </anypoint-icon-item>`);
  }

  /**
   * @returns The template for the HTTP URL editor
   */
  protected [urlEditorTemplate](): TemplateResult {
    const { url=''  } = this;
    const { eventsTarget } = this;
    return html`
    <url-input-editor
      .value="${url}"
      .eventsTarget="${eventsTarget}"
      .environments="${this.environments}"
      .environment="${this.environment}"
      @change="${this._urlHandler}"
    ></url-input-editor>
    `;
  }

  /**
   * @returns The template for the "send" or "abort" buttons.
   */
  protected [sendButtonTemplate](): TemplateResult | string {
    if (!this.renderSend) {
      return '';
    }
    if (this.loading) {
      return html`
      <anypoint-icon-button title="Cancel sending the request" @click="${this.abort}">
        <api-icon icon="cancel"></api-icon>
      </anypoint-icon-button>
      `;
    }
    return html`
    <anypoint-icon-button title="Send the request" class="send-button" @click="${this.send}">
      <api-icon icon="send"></api-icon>
    </anypoint-icon-button>
    `;
  }

  /**
   * @returns {TemplateResult} The template for the request editor tabs
   */
  [tabsTemplate](): TemplateResult {
    const { isPayload, selectedTab, } = this;
    return html`
    <anypoint-tabs
      .selected="${selectedTab}"
      @selectedchange="${this[tabChangeHandler]}"
      class="editor-tabs"
    >
      <anypoint-tab data-tab="headers">Headers</anypoint-tab>
      <anypoint-tab ?hidden="${!isPayload}" data-tab="payload">Body</anypoint-tab>
      <anypoint-tab data-tab="authorization">Authorization</anypoint-tab>
      <anypoint-tab data-tab="code-snippets">Code snippets</anypoint-tab>
    </anypoint-tabs>`;
  }

  /**
   * @returns {TemplateResult} The template for the current editor
   */
  [currentEditorTemplate](): TemplateResult {
    const { selectedTab, isPayload } = this;
    const headersVisible = selectedTab === 0;
    const bodyVisible = isPayload && selectedTab === 1;
    const authVisible = selectedTab === 2;
    const actionsVisible = selectedTab === 3;
    const codeVisible = selectedTab === 4;

    return html`
    <div class="panel">
    ${this[headersTemplate](headersVisible)}
    ${this[bodyTemplate](bodyVisible)}
    ${this[authorizationTemplate](authVisible)}
    ${this[actionsTemplate](actionsVisible)}
    ${this[snippetsTemplate](codeVisible)}
    </div>
    `;
  }

  /**
   * @param {boolean} visible Whether the panel should not be hidden
   * @returns {TemplateResult} The template for the headers editor
   */
  [headersTemplate](visible: boolean): TemplateResult {
    const {
      eventsTarget,
      // headers,
      // .value="${headers}"
      readOnly,
    } = this;
    return html`
    <headers-editor
      ?hidden="${!visible}"
      .eventsTarget="${eventsTarget}"
      @change="${this[headersHandler]}"
      ?readonly="${readOnly}"
    ></headers-editor>`;
  }

  /**
   * @param {boolean} visible Whether the panel should not be hidden
   * @returns {TemplateResult} The template for the body editor
   */
  [bodyTemplate](visible: boolean): TemplateResult {
    const {
      // payload,
      readOnly,
      contentType,
      // uiConfig={},
    } = this;
    // const { body={} } = uiConfig;
    // const { model, selected } = body;
    // const typedSelected = /** @type {"raw" | "urlEncode" | "multipart" | "file"} */ (selected);
    // .value="${!model && payload || undefined}"
    // selected="${ifDefined(typedSelected)}" 
    //   .model="${model}"
    return html`
    <body-editor
      ?hidden="${!visible}"
      ?readOnly="${readOnly}"
      .contentType="${contentType}"
      @change="${this[bodyHandler]}"
      @select="${this[bodyHandler]}"
    ></body-editor>
    `;
  }

  /**
   * @param {boolean} visible Whether the panel should not be hidden
   * @returns {TemplateResult} The template for the authorization editor
   */
  [authorizationTemplate](visible: boolean): TemplateResult|string {
    return html`TO DO: ${visible}`;
    // const { oauth2RedirectUri, authorization, uiConfig={} } = this;
    // const { authorization: authUi={} } = uiConfig;
    // const config = {
    //   oauth2RedirectUri,
    //   outlined, 
    //   anypoint,
    //   ui: authUi,
    //   hidden: !visible,
    // };
    // return authorizationTemplates(this[authorizationHandler], config, authorization);
  }

  /**
   * @param visible Whether the panel should be rendered
   * @returns The template for the ARC request actions editor
   */
  [actionsTemplate](visible: boolean): TemplateResult|string {
    if (!visible) {
      return '';
    }
    return 'TODO';
    // const { requestActions, responseActions, outlined, anypoint } = this;
    // return html`
    // <arc-actions
    //   .request="${requestActions}"
    //   .response="${responseActions}"
    //   ?anypoint="${anypoint}"
    //   ?outlined="${outlined}"
    //   slot="content"
    //   @change="${this[actionsHandler]}"
    //   @selectedchange="${this[actionsUiHandler]}"
    // ></arc-actions>
    // `;
  }

  /**
   * @param visible Whether the panel should be rendered
   * @returns The template for the Code snippets
   */
  [snippetsTemplate](visible: boolean): TemplateResult|string {
    if (!visible) {
      return '';
    }
    const { expects } = this[snippetsRequestSymbol] || {};
    const { url = '', method = '', headers = '', payload = '' } = expects || {};
    let data;
    if (typeof payload === 'string') {
      data = payload;
    }
    return html`
    <http-code-snippets
      scrollable
      .url="${url}"
      .method="${method}"
      .headers="${headers}"
      .payload="${data}"
    ></http-code-snippets>
    `;
  }

  /**
   * @returns The template for the invalid content headers dialog
   */
  [headersDialogTemplate](): TemplateResult|string {
    const { contentHeadersDialogOpened } = this;
    return html`
    <anypoint-dialog .opened="${contentHeadersDialogOpened}" @closed="${this[contentWarningCloseHandler]}">
      <h2>Headers are not valid</h2>
      <div>
        <p>The <b>GET</b> request should not contain <b>content-*</b> headers. It may
        cause the server to behave unexpectedly.</p>
        <p><b>Do you want to continue?</b></p>
      </div>
      <div class="buttons">
        <anypoint-button
          data-dialog-dismiss
        >Cancel request</anypoint-button>
        <anypoint-button
          data-dialog-confirm
          @click="${this[sendIgnoreValidation]}"
        >Continue</anypoint-button>
      </div>
    </anypoint-dialog>`
  }
}
