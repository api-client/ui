/* eslint-disable class-methods-use-this */
import { LitElement, html, TemplateResult, CSSResult, css } from 'lit';
import { IRequestLog, RequestLog, Headers, DeserializedPayload } from "@api-client/core/build/browser.js";
import { property, state } from "lit/decorators.js";
import { AnypointTabsElement } from "@anypoint-web-components/awc";
import "@anypoint-web-components/awc/dist/define/anypoint-tabs.js";
import "@anypoint-web-components/awc/dist/define/anypoint-tab.js";
import '../../define/log-headers.js';
import '../../define/log-body.js';

/**
 * An element that renders the view for a core's `IRequestLog`.
 */
export default class RequestLogElement extends LitElement {
  static get styles(): CSSResult {
    return css`
    :host {
      display: block;
    }
    `;
  }

  protected _httpLog?: IRequestLog | RequestLog;

  /**
   * @description This property is set when the `httpLog` is set. It always represent an instance of the `RequestLog` (or undefined) regardless of the input format.
   * @protected
   * @type {RequestLog}
   */
  protected _log?: RequestLog;

  /**
   * @description The request log to render. When not set it renders nothing.
   * @type {(IRequestLog | RequestLog)}
   */
  @property({ type: Object }) 
  get httpLog(): IRequestLog | RequestLog | undefined {
    return this._httpLog;
  }

  set httpLog(value: IRequestLog | RequestLog | undefined) {
    const old = this._httpLog;
    if (old === value) {
      return;
    }
    this._httpLog = value;
    if (value) {
      if (typeof (value as RequestLog).toJSON === 'function') {
        this._log = value as RequestLog;
      } else {
        this._log = new RequestLog(value as IRequestLog);
      }
    } else {
      this._log = undefined;
    }
    this._processPayload();
    this.requestUpdate();
  }

  @property({ type: String }) selected?: string;

  /**
   * @description Returns `true` when the request has a payload message.
   * @readonly
   * @type {boolean}
   */
  get hasRequestPayload(): boolean {
    const { _log } = this;
    if (!_log) {
      return false;
    }
    const { request } = _log;
    if (!request) {
      return false;
    }
    return !!request.payload;
  }

  /**
   * @description Returns `true` when the response has a payload message.
   * @readonly
   * @type {boolean}
   */
  get hasResponsePayload(): boolean {
    const { _log } = this;
    if (!_log) {
      return false;
    }
    const { response } = _log;
    if (!response) {
      return false;
    }
    return !!response.payload;
  }

  @state() protected _requestPayload?: DeserializedPayload;

  @state() protected _responsePayload?: DeserializedPayload;

  /**
   * Reads the payload to the original format for both the request and the response.
   */
  protected async _processPayload(): Promise<void> {
    const { _log } = this;
    if (!_log) {
      return;
    }
    const { request, response } = _log;
    if (request) {
      if (request.payload) {
        this._requestPayload = await request.readPayload();
      } else {
        this._requestPayload = undefined;
      }
    } else {
      this._requestPayload = undefined;
    }

    if (response) {
      if (response.payload) {
        this._responsePayload = await response.readPayload();
      } else {
        this._responsePayload = undefined;
      }
    } else {
      this._responsePayload = undefined;
    }
  }

  protected _tabChangeHandler(e: Event): void {
    const tabs = e.target as AnypointTabsElement;
    this.selected = String(tabs.selected);
  }

  protected render(): TemplateResult {
    return html`
    ${this._tabsTemplate()}
    ${this._contentTab()}
    `;
  }

  protected _tabsTemplate(): TemplateResult {
    const { selected='headers' } = this;
    return html`
    <anypoint-tabs
      .selected="${selected}"
      @selectedchange="${this._tabChangeHandler}"
      class="editor-tabs"
      attrForSelected="data-tab"
    >
      <anypoint-tab data-tab="headers">Headers</anypoint-tab>
      <anypoint-tab ?hidden="${!this.hasRequestPayload}" data-tab="payload">Payload</anypoint-tab>
      <anypoint-tab ?hidden="${!this.hasResponsePayload}" data-tab="preview">Preview</anypoint-tab>
      <anypoint-tab data-tab="response">Response</anypoint-tab>
      <anypoint-tab data-tab="timings">Timings</anypoint-tab>
      <anypoint-tab data-tab="redirects">Redirects</anypoint-tab>
    </anypoint-tabs>
    `;
  }

  protected _contentTab(): TemplateResult {
    const { selected='headers', _log } = this;
    if (!_log) {
      return html`<div class="empty-info">No data to render</div>`;
    }
    let tpl: TemplateResult;
    switch (selected) {
      case 'payload': tpl = this._payloadTemplate(_log); break;
      case 'preview': tpl = this._previewTemplate(_log); break;
      case 'response': tpl = this._responseTemplate(_log); break;
      case 'timings': tpl = this._timingsTemplate(_log); break;
      case 'redirects': tpl = this._redirectsTemplate(_log); break;
      default:
        tpl = this._headersTemplate(_log);
    }
    return tpl;
  }

  /**
   * Renders basic information about the request:
   * - request method & URL
   * - request headers
   * - response headers
   */
  protected _headersTemplate(info: RequestLog): TemplateResult {
    return html`
    <log-headers .httpLog="${info}"></log-headers>
    `;
  }

  /**
   * @returns The template for the "raw" response body view.
   */
  protected _payloadTemplate(info: RequestLog): TemplateResult {
    if (!info) {
      return html``;
    }
    const { request } = info;
    if (!request) {
      return html`<p>No request data</p>`;
    }
    const parser = new Headers(request.headers);
    const mime = parser.get('content-type');
    return html`
    <log-body .payload="${request.payload}" .contentType="${mime}"></log-body>
    `;
  }

  /**
   * @returns The template for the parsed response body view.
   */
  protected _previewTemplate(info: RequestLog): TemplateResult {
    if (!info) {
      return html``;
    }
    const { response } = info;
    if (!response) {
      return html`<p>No response data</p>`;
    }
    const parser = new Headers(response.headers);
    const mime = parser.get('content-type');
    // FIXME: This may be an error response.
    return html`
    <log-body .payload="${response.payload}" .contentType="${mime}"></log-body>
    `;
  }

  protected _responseTemplate(info: RequestLog): TemplateResult {
    if (!info) {
      return html``;
    }
    const { response } = info;
    if (!response) {
      return html`<p>No response data</p>`;
    }
    const parser = new Headers(response.headers);
    const mime = parser.get('content-type');
    // FIXME: This may be an error response.
    return html`
    <log-body .payload="${response.payload}" .contentType="${mime}" raw></log-body>
    `;
  }

  protected _timingsTemplate(info: RequestLog): TemplateResult {
    return html``;
  }

  protected _redirectsTemplate(info: RequestLog): TemplateResult {
    return html``;
  }
}
