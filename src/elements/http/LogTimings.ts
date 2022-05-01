/* eslint-disable class-methods-use-this */
import { LitElement, html, TemplateResult, CSSResult, css, PropertyValueMap } from 'lit';
import { RequestTime, IRequestTime } from "@api-client/core/build/browser.js";
import { property, state } from "lit/decorators.js";
import "@anypoint-web-components/awc/dist/define/anypoint-progress.js";
import "@anypoint-web-components/awc/dist/define/date-time.js";
import { ITimingViewData, ITimingProgressInfo, computeTimingsViewData } from '../../lib/http/Har.js';


export default class LogTimings extends LitElement {
  static get styles(): CSSResult {
    return css`
    :host {
      display: block;
      --anypoint-progress-height: var(--request-timings-progress-height, 12px);
      --anypoint-progress-container-color: var(--request-timings-progress-background, #f5f5f5);
      --anypoint-progress-active-color: var(--request-timings-progress-background, #f5f5f5);
      --anypoint-progress-secondary-color: var(--request-timings-progress-color, #4a4);
    }

    .row {
      display: flex;
      flex-direction: row;
      align-items: center;
    }

    anypoint-progress {
      flex: 1;
      flex-basis: 0.000000001px;
    }

    .label,
    .date-value {
      user-select: text;
      cursor: text;
    }

    .label {
      margin-right: 8px;
    }

    .timing-label {
      width: var(--request-timings-label-width, 160px);
      /* font-weight: 200; */
    }

    .timing-value {
      width: var(--request-timings-value-width, 120px);
      text-align: right;
      user-select: text;
      cursor: text;
    }

    .total {
      margin-top: 12px;
      padding-top: 12px;
      font-weight: 500;
      border-top: 2px var(--request-timings-total-border-color, rgba(255, 255, 255, 0.74)) solid;
    }

    .row.is-total {
      justify-content: flex-end;
    }

    :host([narrow]) .row {
      flex-direction: column;
      align-items: start;
      margin: 8px 0;
    }

    :host([narrow]) anypoint-progress {
      width: 100%;
      flex: auto;
      order: 3;
    }

    :host([narrow]) .timing-value {
      text-align: left;
      order: 2;
    }

    :host([narrow]) .timing-label {
      order: 1;
      width: auto;
    }

    .status-row,
    .timings-row {
      flex-direction: row;
      display: flex;
      align-items: center;
      min-height: 56px;
    }

    .status-row {
      flex-direction: row;
      display: flex;
      justify-content: flex-end;
    }

    .sub-title {
      font-size: 0.88rem;
      text-transform: uppercase;
    }

    .status-label {
      width: 60px;
      font-size: var(--request-timings-panel-timing-total-size, 1.1rem);
      font-weight: var(--request-timings-panel-timing-total-weight, 400);
    }

    .text {
      user-select: text;
      cursor: text;
    }

    .redirect-value {
      margin-top: 12px;
      flex: 1;
      flex-basis: 0.000000001px;
    }

    :host([narrow]) .timings-row {
      flex-direction: column;
      align-items: start;
      margin: 20px 0;
    }

    :host([narrow]) .redirect-value {
      width: 100%;
      flex: auto;
    }

    :host([narrow]) .status-row {
      justify-content: flex-start;
    }

    .no-data {
      text-align: left;
      margin: 20px;
    }
    `;
  }

  /**
   * The ordered list of timings for each redirect.
   * The last timing is the final request.
   * @type {((RequestTime | IRequestTime)[])}
   */
  @property({ type: Array }) timings?: (RequestTime | IRequestTime)[];

  /**
   * When set it renders mobile friendly view
   */
  @property({ type: Boolean, reflect: true }) narrow = false;

  @state() protected _withRedirects: boolean = false;

  @state() protected _data: ITimingViewData[] = [];

  @state() protected _totalTime: number = 0;

  protected updated(cp: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
    super.updated(cp);
    if (cp.has('timings')) {
      this._processTimings();
    }
  }

  protected _processTimings(): void {
    const { timings } = this;
    if (!timings) {
      this._data = [];
      this._withRedirects = false;
      this._totalTime = 0;
      return;
    }
    this._withRedirects = timings.length > 1;
    this._data = computeTimingsViewData(timings);
    this._totalTime = this._data.reduce((prev, current) => prev + current.duration, 0);
  }

  protected render(): TemplateResult {
    const { _data, _withRedirects } = this;
    if (!Array.isArray(_data) || !_data.length) {
      return this._noDataTemplate();
    }
    if (_withRedirects) {
      return this._redirectsTableTemplate();
    }
    return this._timingTemplate(_data[0]);
  }

  protected _noDataTemplate(): TemplateResult {
    return html`
    <div class="no-data">No data to render in this view.</div>
    `;
  }

  protected _redirectsTableTemplate(): TemplateResult {
    const { _totalTime, _data } = this;
    const items = [..._data];
    const last = items.pop()!;
    return html`
    <section class="redirects">
      <h3 class="sub-title">Redirects</h3>
      ${items.map((item, index) => this._redirectItemTemplate(item, index))}
      <h3 class="sub-title">Final request</h3>
      <div class="timings-row">
        <div class="redirect-value">
          ${this._timingTemplate(last)}
        </div>
      </div>
      <div class="status-row">
        <div class="flex"></div>
        <span class="timing-value total text">Total: ${_totalTime} ms</span>
      </div>
    </section>
    `;
  }

  protected _redirectItemTemplate(item: ITimingViewData, index: number): TemplateResult {
    return html`
    <div class="timings-row">
      <div class="status-label text">#<span>${index + 1}</span></div>
      <div class="redirect-value">
        ${this._timingTemplate(item)}
      </div>
    </div>
    `;
  }

  /**
   * @returns The template for a single timing item.
   */
  protected _timingTemplate(info: ITimingViewData): TemplateResult {
    const { data, duration } = info;
    const { blocked, connect, dns, receive, send, wait, ssl } = data;
    return html`
    ${this._timingRowTemplate(duration, blocked)}
    ${this._timingRowTemplate(duration, dns)}
    ${this._timingRowTemplate(duration, connect)}
    ${this._timingRowTemplate(duration, ssl)}
    ${this._timingRowTemplate(duration, send)}
    ${this._timingRowTemplate(duration, wait)}
    ${this._timingRowTemplate(duration, receive)}
    <div class="row is-total">
      <span class="timing-value total">${info.duration} ms</span>
    </div>
    `;
  }

  /**
   * Renders a single timing row.
   * @param duration Max value of the progress
   * @param info The computed timing values.
   */
  protected _timingRowTemplate(duration: number, info?: ITimingProgressInfo): TemplateResult | string {
    if (!info || typeof info.label === 'undefined') {
      return '';
    }
    return html`
    <div class="row" data-type="${info.type}-time">
      <div class="timing-label label">${info.title}</div>
      <anypoint-progress
        aria-label="${info.ariaLabel}"
        .value="${info.previous}"
        .secondaryProgress="${info.value}"
        .max="${duration}"
        step="0.0001"
      ></anypoint-progress>
      <span class="timing-value">${info.label} ms</span>
    </div>
    `;
  }

  /**
   * Renders the start time row
   * @param time The timestamp of the request
   */
  protected _startTimeTemplate(time: number): TemplateResult | string {
    if (typeof time !== 'number') {
      return '';
    }
    return html`
    <div class="row" data-type="start-time">
      <span class="label">Start date:</span>
      <date-time
        year="numeric"
        month="numeric"
        day="numeric"
        hour="numeric"
        minute="numeric"
        second="numeric"
        class="date-value"
        .date="${time}"
      ></date-time>
    </div>`;
  }
}
