/* eslint-disable class-methods-use-this */
import { LitElement, html, TemplateResult, CSSResult, css } from 'lit';
import { IRequestLog, RequestLog, Headers, ErrorResponse, Response, RequestTime, ResponseRedirect } from "@api-client/core/build/browser.js";
import { property, state } from "lit/decorators.js";
import { AnypointTabsElement } from "@anypoint-web-components/awc";
import "@anypoint-web-components/awc/dist/define/anypoint-tabs.js";
import "@anypoint-web-components/awc/dist/define/anypoint-tab.js";
import { statusTemplate, StatusStyles } from "./HttpStatus.js";
import '../../define/log-headers.js';
import '../../define/log-body.js';
import '../../define/log-timings.js';

/**
 * An element that renders the view for a core's `IRequestLog`.
 */
export default class RequestLogElement extends LitElement {
  static get styles(): CSSResult[] {
    return [
      StatusStyles,
      css`
      :host {
        display: block;
      }

      .status-row {
        display: flex;
        flex-direction: row;
        align-items: center;
        min-height: 56px;
        padding: 20px 0;
        overflow: auto;
      }

      .status-label {
        width: 40px;
        margin-right: 24px;
      }

      .redirect-value {
        flex: 1;
        overflow: hidden;
      }

      .redirect-value log-body {
        overflow: auto;
      }

      .header-name {
        font-weight: 600;
      }

      .padded-panel {
        padding: 0 20px;
      }
      `,
    ];
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
    if (['get', 'head'].includes(request.method.toLowerCase())) {
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

  get hasResponse(): boolean {
    const { _log } = this;
    if (!_log) {
      return false;
    }
    const { response } = _log;
    return !!response;
  }

  @state() protected _isErrorResponse = false;

  @state() protected _timingsData?: RequestTime[];

  @state() protected _redirectsData?: ResponseRedirect[];

  /**
   * Reads the payload to the original format for both the request and the response.
   */
  protected async _processPayload(): Promise<void> {
    const { _log } = this;
    if (!_log) {
      this._isErrorResponse = false;
      this._timingsData = undefined;
      this._redirectsData = undefined;
      return;
    }
    const { response } = _log;
    if (!response) {
      this._isErrorResponse = false;
      this._timingsData = undefined;
      this._redirectsData = undefined;
    } else {
      this._isErrorResponse = ErrorResponse.isErrorResponse(response);
      // computes list of redirects.
      if (!this._isErrorResponse) {
        const r = response as Response;
        const timings: RequestTime[] = [];
        const redirects: ResponseRedirect[] = [];
        if (Array.isArray(_log.redirects)) {
          _log.redirects.forEach((rdr) => {
            redirects.push(rdr);
            if (rdr.timings) {
              timings.push(rdr.timings);
            }
          });
        }
        if (r.timings) {
          timings.push(r.timings);
        }
        this._timingsData = timings;
        this._redirectsData = redirects;
      }
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
      @selected="${this._tabChangeHandler}"
      class="editor-tabs"
      attrForSelected="data-tab"
    >
      <anypoint-tab data-tab="headers" id="headers-tab">Headers</anypoint-tab>
      <anypoint-tab ?hidden="${!this.hasRequestPayload}" data-tab="payload" id="payload-tab">Payload</anypoint-tab>
      <anypoint-tab ?hidden="${!this.hasResponsePayload}" data-tab="preview" id="preview-tab">Preview</anypoint-tab>
      <anypoint-tab data-tab="response" id="response-tab">Response</anypoint-tab>
      <anypoint-tab data-tab="timings" id="timings-tab">Timings</anypoint-tab>
      <anypoint-tab data-tab="redirects" id="redirects-tab">Redirects</anypoint-tab>
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
      case 'timings': tpl = this._timingsTemplate(); break;
      case 'redirects': tpl = this._redirectsTemplate(); break;
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
    <log-headers .httpLog="${info}" role="tabpanel" aria-labelledby="headers-tab" class="padded-panel"></log-headers>
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
      return this._noDataTemplate('payload-tab');
      // return html`<p aria-labelledby="payload-tab" class="padded-panel">No request data</p>`;
    }
    const parser = new Headers(request.headers);
    const mime = parser.get('content-type');
    return html`
    <log-body .payload="${request.payload}" .contentType="${mime}" role="tabpanel" aria-labelledby="payload-tab"></log-body>
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
      return html`<p aria-labelledby="preview-tab" class="padded-panel">No response data</p>`;
    }
    const parser = new Headers(response.headers);
    const mime = parser.get('content-type');
    return html`
    <log-body aria-labelledby="preview-tab" .payload="${response.payload}" .contentType="${mime}" role="tabpanel"></log-body>
    `;
  }

  protected _responseTemplate(info: RequestLog): TemplateResult {
    if (!info) {
      return html``;
    }
    const { response } = info;
    if (!response) {
      return this._noDataTemplate('response-tab');
      // return html`<p aria-labelledby="response-tab" class="padded-panel">No response data</p>`;
    }
    const parser = new Headers(response.headers);
    const mime = parser.get('content-type');
    return html`
    <log-body aria-labelledby="response-tab" .payload="${response.payload}" .contentType="${mime}" raw role="tabpanel"></log-body>
    `;
  }

  protected _timingsTemplate(): TemplateResult {
    const { _timingsData } = this;
    if (!_timingsData || !_timingsData.length) {
      return this._noDataTemplate('timings-tab');
    }
    return html`<log-timings class="padded-panel" aria-labelledby="timings-tab" .timings="${_timingsData}" role="tabpanel"></log-timings>`;
  }

  protected _redirectsTemplate(): TemplateResult {
    const { _redirectsData } = this;
    if (!_redirectsData || !_redirectsData.length) {
      return this._noDataTemplate('redirects-tab');
    }
    return html`
    <div role="tabpanel"  class="padded-panel" aria-labelledby="redirects-tab">
      ${_redirectsData.map((item, index) => this._redirectTemplate(item, index))}
    </div>
    `;
  }

  protected _redirectTemplate(item: ResponseRedirect, index: number): TemplateResult {
    const { url, response } = item;
    if (!response) {
      return html`
      <div class="status-row">
        <div class="status-label text">#<span>${index + 1}</span></div>
        <div class="redirect-value">This redirect has no response data</div>
      </div>
      `;
    }
    const headers = new Headers(response.headers);
    const mime = headers.get('content-type');
    return html`
    <div class="status-row">
      <div class="status-label text">#<span>${index + 1}</span></div>
      <div class="redirect-value">
        <div class="redirect-code">
          ${statusTemplate(response.status, response.statusText)}
        </div>
        <div class="redirect-location">
          <a href="${url}" class="auto-link">${url}</a>
        </div>
        ${this._headersRawTemplate(headers)}
        ${response.payload ? html`<log-body .payload="${response.payload}" .contentType="${mime}" role="tabpanel"></log-body>` : ''}
      </div>
    </div>
    `;
  }

  protected _headersRawTemplate(header: Headers): TemplateResult | string {
    const templates: TemplateResult[] = [];
    header.forEach((value, name) => {
      templates.push(html`
      <li>
        <span class="header-name">${name}</span>
        <span class="header-value">${value}</span>
      </li>
      `);
    });
    if (!templates.length) {
      return '';
    }
    return html`
    <ul>
      ${templates}
    </ul>
    `;
  }

  protected _noDataTemplate(arialLabelledBy: string): TemplateResult {
    return html`
    <div class="no-data padded-panel" aria-labelledby="${arialLabelledBy}">No data to render in this view.</div>
    `;
  }
}
