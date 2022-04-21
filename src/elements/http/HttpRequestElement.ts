/* eslint-disable class-methods-use-this */
import { LitElement, html, TemplateResult, CSSResult, PropertyValueMap } from 'lit';
import { property, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { 
  Environment, Events as CoreEvents, DeserializedPayload, Headers,
  RequestAuthorization,
  IOAuth2Authorization,
  IHttpRequest,
  HttpRequest,
  RequestUiMeta,
} from '@api-client/core/build/browser.js';
import { EventsTargetMixin, ResizableMixin, AnypointTabsElement } from '@anypoint-web-components/awc';
import "@anypoint-web-components/awc/dist/define/anypoint-dropdown.js";
import "@anypoint-web-components/awc/dist/define/anypoint-listbox.js";
import "@anypoint-web-components/awc/dist/define/anypoint-icon-item.js";
import "@anypoint-web-components/awc/dist/define/anypoint-tabs.js";
import "@anypoint-web-components/awc/dist/define/anypoint-tab.js";
import '../../define/api-icon.js';
import '../../define/url-input-editor.js';
import '../../define/http-headers-editor.js';
import '../../define/http-snippets.js';
import '../../define/body-editor.js';
import UrlInputEditorElement from './UrlInputEditorElement.js';
import HeadersEditorElement from './HeadersEditorElement.js';
import elementStyles from './HttpRequestElementStyles.js';
import { SecurityProcessor } from '../../lib/security/SecurityProcessor.js';
import { EventTypes } from '../../events/EventTypes.js';
import { Events } from '../../events/Events.js';
import authorizationTemplates from './RequestAuth.template.js';
import AuthorizationSelectorElement from '../authorization/AuthorizationSelectorElement.js';
import AuthorizationMethodElement from '../authorization/AuthorizationMethodElement.js';
import BodyEditorElement from './BodyEditorElement.js';

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
export const snippetsTemplate = Symbol('snippetsTemplate');
export const bodyHandler = Symbol('bodyHandler');
export const authorizationHandler = Symbol('authorizationHandler');
export const headersValue = Symbol('headersValue');
export const uiConfigValue = Symbol('uiConfigValue');
export const readHeaders = Symbol('readHeaders');
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

  protected _headers?: string;

  /**
   * The HTTP headers string.
   */
  @property({ type: String }) 
  get headers(): string | undefined {
    return this._headers;
  }

  set headers(value: string | undefined) {
    const old = this._headers;
    if (old === value) {
      return;
    }
    this._headers = value;
    if (value) {
      const parsed = new Headers(value);
      this.contentType = parsed.get('content-type');
    } else {
      this.contentType = undefined;
    }
    this.requestUpdate();
  }

  /**
   * The list of environments that apply to the current request.
   */
  @property({ type: Array }) environments?: Environment[];

  /**
   * The key of the selected environment.
   */
  @property({ type: String, reflect: true }) environment?: string;

  /** 
   * The Current content type value.
   */
  @property({ type: String, reflect: true }) contentType?: string;

  @property({ type: Array }) authorization?: RequestAuthorization[];

  /**
   * Redirect URL for the OAuth2 authorization.
   * If can be also set by dispatching `oauth2-redirect-url-changed`
   * with `value` property on the `detail` object.
   */
  @property({ type: String }) oauth2RedirectUri?: string;

  /**
   * When set the editor is in read only mode.
   */
  @property({ type: Boolean, reflect: true }) readOnly = false;

  /**
   * A value to be passed to the OAuth 2 `authorizationUri` property in case
   * if current configuration has no value.
   * This is to be used as a default value.
   */
  @property({ type: String, reflect: true }) oauth2AuthorizationUri?: string;

  /**
   * A value to be passed to the OAuth 2 `accessTokenUri` property in case
   * if current configuration has no value.
   * This is to be used as a default value.
   */
  @property({ type: String, reflect: true }) oauth2AccessTokenUri?: string;

  /**
   * When set it ignores all `content-*` headers when the request method is `GET`.
   * When not set or `false` it renders a warning message.
   */
  @property({ type: Boolean, reflect: true }) ignoreContentOnGet = false;

  /** 
   * When set the `content-` headers warning dialog is rendered.
   */
  @property({ type: Boolean, reflect: true }) contentHeadersDialogOpened = false;

  /** 
   * When set it renders the send request button.
   */
  @property({ type: Boolean, reflect: true }) renderSend = false;

  /**
   * To be set when the request is being transported.
   */
  @property({ type: Boolean, reflect: true }) loading = false;

  /** 
   * When set the editor does not allow to send the request if one is already loading.
   */
  @property({ type: Boolean, reflect: true }) noSendOnLoading = false;

  @state() [snippetsRequestSymbol]?: IHttpRequest;

  /**
   * An index of currently opened tab.
   * @default 0
   */
  @property({ type: Number, reflect: true }) selectedTab = 0;

  /**
   * A request object that is used to render the code snippets.
   */
  get snippetsRequest(): IHttpRequest | undefined {
    return this[snippetsRequestSymbol];
  }

  @state() [methodSelectorOpened] = false;

  /**
   * Optional instance of the `RequestUiMeta` to store the UI state.
   */
  @property({ type: Object }) ui?: RequestUiMeta;

  /**
   * @returns True when the request cannot have the payload on the message.
   */
  get isPayload(): boolean {
    const { method } = this;
    if (!method) {
      return false;
    }
    return !NonPayloadMethods.includes(method);
  }

  protected _awaitingOAuth2authorization = false;

  /**
   * This is set by the internal logic. When `ignoreContentOnGet` is set and the headers have `content-` headers
   * a dialog is rendered when trying to send the request. When the user chooses to ignore the warning this
   * flag makes sure that `send()` does not check headers.
   * 
   * @todo(pawel): This should be done in the request logic module plugin.
   * Plugins can stop request indefinitely or cancel it.
   */
  ignoreValidationOnGet = false;

  constructor() {
    super();
    this[internalSendHandler] = this[internalSendHandler].bind(this);
  }

  _attachListeners(node: EventTarget): void {
    super._attachListeners(node);
    node.addEventListener(EventTypes.HttpProject.Request.send, this[internalSendHandler]);
  }

  _detachListeners(node: EventTarget): void {
    super._attachListeners(node);
    node.addEventListener(EventTypes.HttpProject.Request.send, this[internalSendHandler]);
  }

  firstUpdated(changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
    super.firstUpdated(changedProperties);
    this._computeSnippetsRequest();
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
    const { authorization=[] } = this;
    const oauth = authorization.find((method) => method.enabled && method.type === 'oauth 2');
    if (!oauth) {
      return false;
    }
    const authMethod = this.shadowRoot!.querySelector('authorization-method[type="oauth 2"]') as AuthorizationMethodElement | null;
    if (!authMethod) {
      return false;
    }
    const cnf = oauth.config as IOAuth2Authorization;
    if (authMethod.validate() && !cnf.accessToken) {
      return true;
    }
    return false;
  }

  /**
   * Validates headers for `Content-*` entries against current method.
   * @param request The request object
   * @return True if headers are invalid.
   */
  validateContentHeaders(request: IHttpRequest): boolean {
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
   * Serializes the current values to the `IHttpRequest`
   */
  async serialize(): Promise<IHttpRequest> {
    const instance = new HttpRequest();
    if (this.url) {
      instance.url = this.url;
    }
    if (this.method) {
      instance.method = this.method;
    }
    if (this.headers) {
      instance.headers = this.headers;
    }
    if (this.payload) {
      instance.writePayload(this.payload);
    }
    return instance.toJSON();
  }

  /**
   * Dispatches the send request event to the ARC request engine.
   */
  async send(): Promise<void> {
    if (this.loading && this.noSendOnLoading) {
      return;
    }
    if (!this.validateUrl()) {
      return;
    }
    if (this.requiresAuthorization()) {
      const authMethod = this.shadowRoot!.querySelector('authorization-method[type="oauth 2"]') as AuthorizationMethodElement;
      authMethod.authorize();
      this._awaitingOAuth2authorization = true;
      return;
    }
    // store the URL in the history
    Events.AppData.Http.UrlHistory.add(this.url as string, this);
    // this.requestId = v4();
    const request = await this.serialize();
    if (!this.ignoreValidationOnGet && this.validateContentHeaders(request)) {
      this.contentHeadersDialogOpened = true;
      return;
    }

    // FIXME: Add core transport events
    // TransportEvents.request(this, request);
    
    CoreEvents.Telemetry.event(this, {
      category: 'Request editor',
      action: 'Send request',
    });
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
    this._computeSnippetsRequest();
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
    this._computeSnippetsRequest();
  }

  async [tabChangeHandler](e: Event): Promise<void> {
    const tabs = e.target as AnypointTabsElement;
    this.selectedTab = Number(tabs.selected);
    this.refreshEditors();
    if (!this.ui) {
      this.ui = new RequestUiMeta();
    }
    this.ui.selectedEditor = this.selectedTab;
    this.notifyRequestChanged();
    this.notifyChanged('ui', this.ui);
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
  _headersHandler(e: Event): void {
    e.preventDefault();
    const node = e.target as HeadersEditorElement;
    const { value, source } = node;
    if (!this.ui) {
      this.ui = new RequestUiMeta();
    }
    if (!this.ui.headers) {
      this.ui.headers = {};
    }
    // this.ui.headers.model = model;
    this.ui.headers.source = source;
    this._updateHeaders(value);
    this.notifyChanged('ui', this.ui);
  }

  protected _updateHeaders(value: string): void {
    this.headers = value;
    const headers = new Headers(value);
    this.contentType = headers.get('content-type');
    this.notifyRequestChanged();
    this.notifyChanged('headers', value);
    this._computeSnippetsRequest();
  }

  /**
   * The handler for the body editor change event
   */
  [bodyHandler](e: Event): void {
    e.preventDefault();
    const node = e.target as BodyEditorElement;
    const { value, model, selected } = node;
    if (!this.ui) {
      this.ui = new RequestUiMeta();
    }
    if (!this.ui.body) {
      this.ui.body = {};
    }
    this.ui.body.model = model;
    this.ui.body.selected = selected;
    
    this._updatePayload(value);
    this._computeSnippetsRequest();
    this.notifyChanged('ui', this.ui);
  }

  protected _updatePayload(value: any): void {
    this.payload = value;
    this.notifyRequestChanged();
    this.notifyChanged('payload', value);
  }

  /**
   * The handler for the authorization editor change event
   * @param {Event} e
   */
  [authorizationHandler](e: Event): void {
    e.preventDefault();
    const selector = e.target as AuthorizationSelectorElement;
    const { type, selected } = selector;
    const methods = selector.items as AuthorizationMethodElement[];
    const result: RequestAuthorization[] = [];
    methods.forEach((authMethod) => {
      const { type: mType } = authMethod;
      const config = (authMethod && authMethod.serialize) ? authMethod.serialize() : undefined;
      const valid = (authMethod && authMethod.validate) ? authMethod.validate() : true;
      const enabled = type!.includes(mType!);
      const auth = RequestAuthorization.fromTypedConfig(mType as any, config as any, valid);
      auth.enabled = enabled;
      result.push(auth);
    });
    if (!this.ui) {
      this.ui = new RequestUiMeta();
    }
    if (!this.ui.authorization) {
      this.ui.authorization = {};
    }
    this.ui.authorization.selected = selected as number;
    this._updateAuthorization(result);
    this.notifyChanged('ui', this.ui);
  }

  protected _updateAuthorization(auth: RequestAuthorization[]): void {
    this.authorization = auth;
    this.notifyRequestChanged();
    this.notifyChanged('authorization', auth);
    this.requestUpdate();
    this._computeSnippetsRequest();
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
    this.ignoreValidationOnGet = true;
    this.send();
  }

  /**
   * When a request change this recomputes the values for code snippets.
   * These are different from the actual values in the request as
   * they contain authorization values applied to it.
   */
  async _computeSnippetsRequest(): Promise<void> {
    const serialized = await this.serialize();
    const { authorization=[] } = this;
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
   * @returns The template for the request editor tabs
   */
  [tabsTemplate](): TemplateResult {
    const { isPayload, selectedTab, ui } = this;
    const selected = ui && ui.selectedEditor || selectedTab;
    return html`
    <anypoint-tabs
      .selected="${selected}"
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
   * @returns The template for the current editor
   */
  [currentEditorTemplate](): TemplateResult {
    const { selectedTab, isPayload } = this;
    const headersVisible = selectedTab === 0;
    const bodyVisible = isPayload && selectedTab === 1;
    const authVisible = selectedTab === 2;
    const codeVisible = selectedTab === 3;
    return html`
    <div class="panel">
    ${this[headersTemplate](headersVisible)}
    ${this[bodyTemplate](bodyVisible)}
    ${this[authorizationTemplate](authVisible)}
    ${this[snippetsTemplate](codeVisible)}
    </div>
    `;
  }

  /**
   * @param visible Whether the panel should not be hidden
   * @returns The template for the headers editor
   */
  [headersTemplate](visible: boolean): TemplateResult {
    const {
      eventsTarget,
      headers,
      readOnly,
    } = this;
    return html`
    <http-headers-editor
      ?hidden="${!visible}"
      .eventsTarget="${eventsTarget}"
      .value="${headers || ''}"
      @change="${this._headersHandler}"
      ?readonly="${readOnly}"
    ></http-headers-editor>`;
  }

  /**
   * @param visible Whether the panel should not be hidden
   * @returns The template for the body editor
   */
  [bodyTemplate](visible: boolean): TemplateResult {
    const {
      payload,
      readOnly,
      contentType,
      ui,
    } = this;
    const body = ui && ui.body;
    const selected = body && body.selected as any;
    const model = body && body.model;
    
    return html`
    <body-editor
      ?hidden="${!visible}"
      ?readOnly="${readOnly}"
      .contentType="${contentType}"
      .model="${model}"
      .value="${!model && payload || undefined}"
      selected="${ifDefined(selected)}"
      @change="${this[bodyHandler]}"
      @select="${this[bodyHandler]}"
    ></body-editor>
    `;
  }

  /**
   * @param visible Whether the panel should not be hidden
   * @returns The template for the authorization editor
   */
  [authorizationTemplate](visible: boolean): TemplateResult|string {
    const { oauth2RedirectUri, authorization, ui } = this;
    const config = {
      oauth2RedirectUri,
      hidden: !visible,
      ui,
    };
    return authorizationTemplates(this[authorizationHandler], config, authorization);
  }

  /**
   * @param visible Whether the panel should be rendered
   * @returns The template for the Code snippets
   */
  [snippetsTemplate](visible: boolean): TemplateResult|string {
    if (!visible) {
      return '';
    }
    const request = this[snippetsRequestSymbol];
    return html`<http-snippets .request="${request}" ></http-snippets>`;
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
        <p>
          The <b>GET</b> request should not contain <b>content-*</b> headers. It may
          cause the server to behave unexpectedly.
        </p>
        <p><b>Do you want to continue?</b></p>
      </div>
      <div class="buttons">
        <anypoint-button data-dialog-dismiss >Cancel request</anypoint-button>
        <anypoint-button data-dialog-confirm @click="${this[sendIgnoreValidation]}">Continue</anypoint-button>
      </div>
    </anypoint-dialog>`
  }
}
