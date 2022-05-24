/* eslint-disable no-plusplus */
/* eslint-disable class-methods-use-this */
import { html, CSSResult, css, TemplateResult } from 'lit';
import { ClassInfo, classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { property } from 'lit/decorators.js';
import { AnypointListboxElement, AnypointTabsElement } from '@anypoint-web-components/awc';
import { Har, Page, Entry, Request, Response, Header, QueryString, Timings } from 'har-format';
import { DataCalculator } from '@api-client/core/build/browser.js';
import '@anypoint-web-components/awc/dist/define/anypoint-collapse.js';
import '@anypoint-web-components/awc/dist/define/anypoint-listbox.js';
import '@anypoint-web-components/awc/dist/define/anypoint-icon-item.js';
import '@anypoint-web-components/awc/dist/define/anypoint-item-body.js';
import '@anypoint-web-components/awc/dist/define/anypoint-tabs.js';
import '@anypoint-web-components/awc/dist/define/anypoint-tab.js';
import ApiElement from '../ApiElement.js';

export const harValue = Symbol('harValue');
export const ignorePagesValue = Symbol('ignorePagesValue');
export const processHar = Symbol('processHar');
export const computeEntriesOnly = Symbol('computeEntriesOnly');
export const computePages = Symbol('computePages');
export const pagesValue = Symbol('pagesValue');
export const entriesValue = Symbol('entriesValue');
export const renderPages = Symbol('renderPages');
export const renderEntries = Symbol('renderEntries');
export const pageTemplate = Symbol('pageTemplate');
export const pageHeaderTemplate = Symbol('pageHeaderTemplate');
export const entriesTemplate = Symbol('entriesTemplate');
export const entryTemplate = Symbol('entryTemplate');
export const openedPagesValue = Symbol('openedPagesValue');
export const openedEntriesValue = Symbol('openedEntriesValue');
export const computeRenderedEntries = Symbol('computeRenderedEntries');
export const computeStatusClasses = Symbol('computeStatusClasses');
export const statusLabel = Symbol('statusLabel');
export const loadingTimeTemplate = Symbol('loadingTimeTemplate');
export const responseSizeTemplate = Symbol('responseSizeTemplate');
export const togglePage = Symbol('togglePage');
export const pageClickHandler = Symbol('pageClickHandler');
export const pageKeydownHandler = Symbol('pageKeydownHandler');
export const computeTotalTime = Symbol('computeTotalTime');
export const computeVisualTimes = Symbol('computeVisualTimes');
export const sumTimings = Symbol('sumTimings');
export const timingsTemplate = Symbol('timingsTemplate');
export const timingTemplate = Symbol('timingTemplate');
export const sortEntires = Symbol('sortEntires');
export const entrySelectionHandler = Symbol('entrySelectionHandler');
export const entryDetails = Symbol('entryDetails');
export const entryDetailsTabsTemplate = Symbol('entryDetailsTabsTemplate');
export const selectedTabsValue = Symbol('selectedTabsValue');
export const detailsTabSelectionHandler = Symbol('detailsTabSelectionHandler');
export const entryDetailsContentTemplate = Symbol('entryDetailsContentTemplate');
export const entryDetailsRequestTemplate = Symbol('entryDetailsRequestTemplate');
export const entryDetailsResponseTemplate = Symbol('entryDetailsResponseTemplate');
export const definitionTemplate = Symbol('definitionTemplate');
export const headersTemplate = Symbol('headersTemplate');
export const queryParamsTemplate = Symbol('queryParamsTemplate');
export const computeEntrySizeInfo = Symbol('computeEntrySizeInfo');
export const sizesTemplate = Symbol('sizesTemplate');
export const entryDetailsRequestBodyTemplate = Symbol('entryDetailsRequestBodyTemplate');
export const entryDetailsResponseBodyTemplate = Symbol('entryDetailsResponseBodyTemplate');
export const entryDetailsCookiesTemplate = Symbol('entryDetailsCookiesTemplate');

export interface RenderedPage {
  page: Page;
  entries: RenderedEntry[];
  totalTime: number;
}

export interface SortableEntry extends Entry {
  timestamp: number;
}

export interface RenderedEntry extends SortableEntry {
  id: number;
  requestTime: string;
  visualTimings?: RenderedEntryTimings;
  requestFormattedDate: string;

  requestSizes: EntrySizing;
  responseSizes: EntrySizing;
}

export interface RenderedEntryTimings {
  total: number;
  totalValue: number;
  delay?: number;
  blocked?: number;
  connect?: number;
  dns?: number;
  ssl?: number;
  send?: number;
  receive?: number;
  wait?: number;
}

export interface EntrySizing {
  headers: string;
  headersComputed: boolean;
  body: string;
  bodyComputed: boolean;
  sum: string;
  sumComputed: boolean;
}

/** used when generating keys for entires */
let nextId = 0;

/**
 * An element that renders the UI for HAR data.
 */
export default class HarViewerElement extends ApiElement {
  static get styles(): CSSResult[] {
    return [
      css`
      :host {
        display: block;
        --anypoint-item-icon-width: auto;
      }

      .status-code {
        color: var(--response-status-code-color, #fff);
        background-color: var(--status-code-color-200, rgb(36, 107, 39));
        padding: 2px 12px;
        border-radius: 12px;
        margin-right: 4px;
      }

      .status-code.error {
        background-color: var(--status-code-color-500, rgb(211, 47, 47));
      }

      .status-code.warning {
        background-color: var(--status-code-color-400, rgb(171, 86, 0));
      }

      .status-code.info {
        background-color: var(--status-code-color-300, rgb(48, 63, 159));
      }

      .loading-time-label {
        display: block;
        margin-left: auto;
        color: var(--har-viewer-page-time-color, inherit);
      }

      .response-size-label {
        display: block;
      }

      .entry-detail-line {
        display: flex;
        align-items: center;
      }

      .entry-location {
        margin-top: 6px;
        font-size: 1.1rem;
      }

      .entry-timings {
        margin-left: 32px;
        width: calc(40% - 32px);
        display: flex;
      }

      .time {
        margin-right: 32px;
      }

      .entry-timings-value {
        display: flex;
        height: 20px;
      }

      .timing-entry {
        height: 100%;
        background-color: transparent;
      }

      .timing-entry.blocked {
        background-color: var(--har-timings-blocked-color, #b4b4b4);
      }

      .timing-entry.dns {
        background-color: var(--har-timings-dns-color, #f6f696);
      }

      .timing-entry.connect {
        background-color: var(--har-timings-connect-color, #ffc04c);
      }

      .timing-entry.ssl {
        background-color: var(--har-timings-ssl-color, #8787ff);
      }

      .timing-entry.send {
        background-color: var(--har-timings-send-color, #ff7f7f);
      }

      .timing-entry.wait {
        background-color: var(--har-timings-wait-color, #2eac6c);
      }

      .timing-entry.receive {
        background-color: var(--har-timings-receive-color, #00c0ff);
      }

      .entry-item {
        border-top: 1px var(--divider-color, rgba(0, 0, 0, 0.12)) solid;
        padding: 0 8px;
      }

      .entry-item:last-of-type {
        border-bottom: 1px var(--divider-color, rgba(0, 0, 0, 0.12)) solid;
      }

      .entry-body {
        min-height: 72px;
      }

      .page-header {
        display: flex;
        height: 56px;
        font-weight: 500;
        align-items: center;
        font-size: 1.2rem;
        padding: 0 8px;
        cursor: default;
      }

      .page-header .label {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: var(--har-viewer-page-color, inherit);
      }

      .entry-details {
        margin-bottom: 40px;
      }

      .entry-details-title {
        font-size: 1.2rem;
        margin: 0.67em 0;
      }

      .body-preview {
        white-space: break-spaces;
        word-break: break-word;
      }

      .details-list dt {
        font-size: 1.1rem;
        font-weight: 500;
      }

      .details-list dfn {
        font-weight: 700;
      }

      .details-content {
        padding: 0 8px;
      }

      anypoint-listbox {
        background-color: transparent;
      }
      `,
    ];
  }

  [harValue]?: Har;

  [ignorePagesValue]?: boolean;

  /** 
   * The HAR object to render.
   */
  @property()
  get har(): Har | undefined {
    return this[harValue];
  }

  set har(value: Har | undefined) {
    const old = this[harValue];
    if (old === value) {
      return;
    }
    this[harValue] = value;
    this[processHar]();
  }

  /** 
   * When set it ignores pages matching and renders all requests in a single table.
   */
  @property()
  get ignorePages(): boolean | undefined {
    return this[ignorePagesValue];
  }

  set ignorePages(value: boolean | undefined) {
    const old = this[ignorePagesValue];
    if (old === value) {
      return;
    }
    this[ignorePagesValue] = value;
    this[processHar]();
  }

  [entriesValue]?: RenderedEntry[];

  [pagesValue]?: RenderedPage[];

  [openedPagesValue]: string[] = [];
  
  [openedEntriesValue]: string[] = [];

  [selectedTabsValue]: any = {};

  /**
   * Called when the `har` or `ignorePages` changed.
   */
  [processHar](): void {
    this[entriesValue] = undefined;
    this[pagesValue] = undefined;
    const { har, ignorePages } = this;
    if (!har || !har.log) {
      this.requestUpdate();
      return;
    }
    const { log } = har;
    const { pages, entries, } = log;
    if (!entries || !entries.length) {
      this.requestUpdate();
      return;
    }
    const items = this[sortEntires](entries);
    if (ignorePages || !pages || !pages.length) {
      this[computeEntriesOnly](items);
    } else {
      this[computePages](pages, items);
    }
  }

  /**
   * @returns The copy of the entires array with a shallow copy of each entry.
   */
  [sortEntires](entries: Entry[]): SortableEntry[] {
    const cp = entries.map((entry) => {
      const d = new Date(entry.startedDateTime);
      return ({
        ...entry,
        timestamp: d.getTime(),
      }) as SortableEntry;
    });
    cp.sort((a, b) => a.timestamp - b.timestamp);
    return cp;
  }

  /**
   * Performs computations to render entries only.
   * @param entries The list of entries to process.
   */
  [computeEntriesOnly](entries: SortableEntry[]): void {
    const totalTime = this[computeTotalTime](entries[0], entries[entries.length - 1]);
    this[entriesValue] = this[computeRenderedEntries](entries, totalTime);
    this[openedEntriesValue] = [];
    this.requestUpdate();
  }

  /**
   * Performs computations to render entries by page.
   * @param pages The list of pages to process.
   * @param entries The list of entries to process.
   */
  [computePages](pages: Page[], entries: SortableEntry[]): void {
    const result: RenderedPage[] = [];
    const opened: string[] = [];
    pages.forEach((page) => {
      opened.push(page.id);
      const items = entries.filter((entry) => entry.pageref === page.id);
      const totalTime = this[computeTotalTime](items[0], items[items.length - 1])
      const item: RenderedPage = ({
        page,
        entries: this[computeRenderedEntries](items, totalTime),
        totalTime,
      });
      result.push(item);
    });
    this[pagesValue] = result;
    this[openedPagesValue] = opened;
    this[openedEntriesValue] = [];
    this.requestUpdate();
  }

  /**
   * @param {SortableEntry[]} entries The entries to perform computations on.
   * @param {number} totalTime The total time of all entries rendered in the group
   * @returns {RenderedEntry[]}
   */
  [computeRenderedEntries](entries: SortableEntry[], totalTime: number): RenderedEntry[] {
    const result: RenderedEntry[] = [];
    if (!Array.isArray(entries) || !entries.length) {
      return result;
    }
    // This expects entires to be sorted by time (as required by the spec).
    const [startEntry] = entries;
    const startTime = startEntry.timestamp;
    entries.forEach((entry) => {
      const d = new Date(entry.timestamp);
      const visualTimings = this[computeVisualTimes](entry.timings, entry.timestamp - startTime, totalTime);
      const numType: "numeric" | "2-digit" = 'numeric';
      const options: Intl.DateTimeFormatOptions = ({
        hour: numType,
        minute: numType,
        second: numType,
        fractionalSecondDigits: 3,
      });
      const format = new Intl.DateTimeFormat(undefined, options);
      const requestTime = format.format(d);
      const format2 = new Intl.DateTimeFormat(undefined , {
        timeStyle: 'medium',
        dateStyle: 'medium',
      });
      const requestFormattedDate = format2.format(d);
      const requestSizes = this[computeEntrySizeInfo](entry.request);
      const responseSizes = this[computeEntrySizeInfo](entry.response);
      const item: RenderedEntry = ({
        id: nextId++,
        requestTime,
        requestFormattedDate,
        requestSizes,
        responseSizes,
        ...entry,
      });
      if (visualTimings) {
        item.visualTimings = visualTimings;
      }
      result.push(item);
    });
    return result;
  }

  [computeEntrySizeInfo](info: Request|Response): EntrySizing {
    const result: EntrySizing = ({
      headersComputed: false,
      bodyComputed: false,
      body: '',
      headers: '',
      sum: '',
      sumComputed: false,
    });

    let { headersSize=0, bodySize=0 } = info;
    const { headers } = info;
    if (headersSize < 1) {
      const parts: string[] = [];
      (headers || []).forEach((header) => {
        const key = header.name;
        if (key && key.trim() !== '') {
          let value;
          if (Array.isArray(header.value)) {
            value = header.value.join(',');
          } else {
            value = header.value;
          }
          let line = '';
          line += `${key}: `;
          if (typeof value !== 'undefined') {
            value = value.split('\n').join(' ');
            line += value;
          }
          parts.push(line);
        }
      });
      const hdrStr = parts.join('\n');
      headersSize = DataCalculator.stringSize(hdrStr);
      result.headersComputed = true;
    }
    if (bodySize < 1) {
      const typedRequest = (info as Request);
      const typedResponse = (info as Response);
      if (typedResponse.content) {
        if (typedResponse.content.size) {
          bodySize = typedResponse.content.size;
        } else if (typedResponse.content.text) {
          bodySize = DataCalculator.stringSize(typedResponse.content.text);
          result.bodyComputed = true;
        }
      } else if (typedRequest.postData && typedRequest.postData.text) {
        bodySize = DataCalculator.stringSize(typedRequest.postData.text);
        result.bodyComputed = true;
      }
    }
    if (bodySize < 0) {
      bodySize = 0;
    }
    result.body = DataCalculator.bytesToSize(bodySize);
    result.headers = DataCalculator.bytesToSize(headersSize);
    result.sum = DataCalculator.bytesToSize(headersSize + bodySize);
    result.sumComputed = result.bodyComputed || result.headersComputed;
    return result;
  }

  /**
   * @param code The status code to test for classes.
   * @returns List of classes to be set on the status code
   */
  [computeStatusClasses](code: number): ClassInfo {
    const classes = {
      'status-code': true,
      error: code >= 500 || code === 0,
      warning: code >= 400 && code < 500,
      info: code >= 300 && code < 400,
    };
    return classes;
  }

  /**
   * Computes the total time of page requests.
   * @param first The earliest entry in the range
   * @param last The latest entry in the range
   * @returns The total time of the page. Used to build the timeline.
   */
  [computeTotalTime](first: Entry, last: Entry): number {
    if (first === last) {
      return this[sumTimings](last.timings);
    }
    const startTime = new Date(first.startedDateTime).getTime();
    const endTime = new Date(last.startedDateTime).getTime();
    const lastDuration = this[sumTimings](last.timings);
    return endTime - startTime + lastDuration;
  }

  /**
   * @param timings The entry's timings object.
   * @param delay The timestamp when the first request started.
   * @param total The number of milliseconds all entries took.
   */
  [computeVisualTimes](timings: Timings, delay: number, total: number): RenderedEntryTimings|undefined {
    if (!timings) {
      return undefined;
    }
    const timingsSum = this[sumTimings](timings);
    const totalPercent = timingsSum / total * 100;
    const result: RenderedEntryTimings = ({
      total: totalPercent,
      totalValue: timingsSum,
    });
    if (delay) {
      result.delay = delay / total * 100;
    }
    if (typeof timings.blocked === 'number' && timings.blocked > 0) {
      result.blocked = timings.blocked / timingsSum * 100;
    }
    if (typeof timings.connect === 'number' && timings.connect > 0) {
      result.connect = timings.connect / timingsSum * 100;
    }
    if (typeof timings.dns === 'number' && timings.dns > 0) {
      result.dns = timings.dns / timingsSum * 100;
    }
    if (typeof timings.receive === 'number' && timings.receive > 0) {
      result.receive = timings.receive / timingsSum * 100;
    }
    if (typeof timings.send === 'number' && timings.send > 0) {
      result.send = timings.send / timingsSum * 100;
    }
    if (typeof timings.ssl === 'number' && timings.ssl > 0) {
      result.ssl = timings.ssl / timingsSum * 100;
    }
    if (typeof timings.wait === 'number' && timings.wait > 0) {
      result.wait = timings.wait / timingsSum * 100;
    }
    return result;
  }

  /**
   * Sums all timing values.
   * @param timings The timings object to compute
   * @returns The total time, excluding -1s
   */
  [sumTimings](timings: Timings): number {
    let result = 0;
    if (!timings) {
      return result;
    }
    if (typeof timings.blocked === 'number' && timings.blocked > 0) {
      result += timings.blocked;
    }
    if (typeof timings.connect === 'number' && timings.connect > 0) {
      result += timings.connect;
    }
    if (typeof timings.dns === 'number' && timings.dns > 0) {
      result += timings.dns;
    }
    if (typeof timings.receive === 'number' && timings.receive > 0) {
      result += timings.receive;
    }
    if (typeof timings.send === 'number' && timings.send > 0) {
      result += timings.send;
    }
    if (typeof timings.ssl === 'number' && timings.ssl > 0) {
      result += timings.ssl;
    }
    if (typeof timings.wait === 'number' && timings.wait > 0) {
      result += timings.wait;
    }
    return result;
  }

  /**
   * A handler for the page label click to toggle the page entries.
   */
  [pageClickHandler](e: Event): void {
    const node = (e.currentTarget as HTMLElement);
    const id = node.dataset.page;
    if (id) {
      this[togglePage](id);
    }
  }

  /**
   * A handler for the page label keydown to toggle the page entries on space key.
   */
  [pageKeydownHandler](e: KeyboardEvent): void {
    if (e.code !== 'Space') {
      return;
    }
    const node = (e.target as HTMLElement);
    const id = node.dataset.page;
    if (id) {
      this[togglePage](id);
    }
  }

  /**
   * Toggles the visibility of the page entries.
   * @param id The id of the page.
   */
  [togglePage](id: string): void {
    const allOpened = this[openedPagesValue];
    const index = allOpened.indexOf(id);
    if (index === -1) {
      allOpened.push(id);
    } else {
      allOpened.splice(index, 1);
    }
    this.requestUpdate();
  }

  /**
   * Handler for the list item selection event.
   */
  [entrySelectionHandler](e: Event): void {
    const list = e.target as AnypointListboxElement;
    if (list.localName !== 'anypoint-listbox') {
      // this event bubbles and the page has tabs which dispatch the same event.
      return;
    }
    const items = list.selectedItems as HTMLElement[];
    const ids = items.map((item) => item.dataset.entry!);
    this[openedEntriesValue] = ids;
    this.requestUpdate();
  }

  /**
   * Handler for the list item selection event.
   */
  [detailsTabSelectionHandler](e: Event): void {
    e.stopPropagation();
    const tabs = e.target as AnypointTabsElement;
    const { selected } = tabs;
    const id = Number(tabs.dataset.entry);
    this[selectedTabsValue][id] = selected;
    this.requestUpdate();
  }

  render(): TemplateResult {
    const pages = this[pagesValue];
    if (Array.isArray(pages) && pages.length) {
      return this[renderPages](pages);
    }
    const entries = this[entriesValue];
    if (Array.isArray(entries) && entries.length) {
      return this[renderEntries](entries);
    }
    return html``;
  }

  /**
   * @returns Template for the pages table
   */
  [renderPages](pages: RenderedPage[]): TemplateResult {
    return html`
    <div class="pages">
    ${pages.map((info) => this[pageTemplate](info))}
    </div>
    `;
  }

  /**
   * @returns Template for the entries table
   */
  [renderEntries](entries: RenderedEntry[]): TemplateResult {
    return html`
    <section class="entries-list">
    ${this[entriesTemplate](entries)}
    </section>
    `;
  }

  /**
   * @returns Template for a single page
   */
  [pageTemplate](info: RenderedPage): TemplateResult {
    const allOpened = this[openedPagesValue];
    const opened = allOpened.includes(info.page.id);
    return html`
    <section class="page">
      ${this[pageHeaderTemplate](info.page, info.totalTime)}
      <anypoint-collapse .opened="${opened}">
        <div class="page-entries">
          ${this[entriesTemplate](info.entries)}
        </div>
      </anypoint-collapse>
    </section>
    `;
  }

  /**
   * @returns Template for the pages table
   */
  [pageHeaderTemplate](page: Page, totalTime: number): TemplateResult {
    return html`
    <div class="page-header" @click="${this[pageClickHandler]}" @keydown="${this[pageKeydownHandler]}" tabindex="0" data-page="${page.id}">
      <span class="label">${page.title || 'Unknown page'}</span>
      ${this[loadingTimeTemplate](totalTime)}
    </div>
    `;
  }

  /**
   * @returns The template for the entries list
   */
  [entriesTemplate](entries: RenderedEntry[]): TemplateResult {
    return html`
    <anypoint-listbox 
      @selectedvalueschange="${this[entrySelectionHandler]}" 
      multi 
      selectable="anypoint-icon-item"
      aria-label="Select a list item to see details"
    >
      ${entries.map((item) => this[entryTemplate](item))}
    </anypoint-listbox>
    `;
  }

  /**
   * @returns The template for a single entry
   */
  [entryTemplate](entry: RenderedEntry): TemplateResult {
    const { request, response, timings, visualTimings, id, responseSizes } = entry;
    const allSelected = this[openedEntriesValue];
    const selected = allSelected.includes(`${id}`);
    return html`
    <anypoint-icon-item class="entry-item" data-entry="${id}">
      <div class="time" slot="item-icon">
        ${entry.requestTime}
      </div>
      <anypoint-item-body twoline class="entry-body">
        <div class="entry-detail-line">
          ${this[statusLabel](response.status, response.statusText)}
          ${this[loadingTimeTemplate](entry.time)}
          ${this[responseSizeTemplate](responseSizes)}
        </div>
        <div class="entry-location" title="${request.url}">${request.method} ${request.url}</div>
      </anypoint-item-body>
      <div class="entry-timings">
        ${this[timingsTemplate](timings, visualTimings, selected)}</div>
      </div>
    </anypoint-icon-item>
    ${selected ? this[entryDetails](entry) : ''}
    `;
  }

  /**
   * @param status The response status code
   * @param statusText The response reason part of the status.
   * @returns The template for the status message
   */
  [statusLabel](status: number, statusText = ''): TemplateResult {
    const codeClasses = this[computeStatusClasses](status);
    return html`
    <span class="${classMap(codeClasses)}">${status}</span>
    <span class="message">${statusText}</span>
    `;
  }

  /**
   * @param value The response loading time
   * @returns Template for the loading time message
   */
  [loadingTimeTemplate](value: number): TemplateResult | string {
    if (Number.isNaN(value)) {
      return '';
    }
    const roundedValue = Math.round(value || 0);
    return html`<span class="loading-time-label">Time: ${roundedValue} ms</span>`;
  }

  /**
   * @returns Template for the response size
   */
  [responseSizeTemplate](sizing: EntrySizing): TemplateResult | string {
    return html`<span class="response-size-label">Size: ${sizing.sum}</span>`;
  }

  /**
   * @param timings The entry's timings
   * @param visualTimings The computed visual timings for the template
   * @param fullWidth When set then it renders the timeline in the whole available space.
   * @returns The template for the timings timeline
   */
  [timingsTemplate](timings: Timings, visualTimings?: RenderedEntryTimings, fullWidth = false): TemplateResult | string {
    if (!visualTimings) {
      return '';
    }
    const { total, delay, blocked, connect, dns, receive, send, ssl, wait, } = visualTimings;
    const styles = {
      width: fullWidth ? '100%' : `${total}%`,
    };
    return html`
    ${fullWidth ? '' : this[timingTemplate](delay, 'delay')}
    <div class="entry-timings-value" style="${styleMap(styles)}">
      ${this[timingTemplate](blocked, 'blocked', 'Blocked', timings)}
      ${this[timingTemplate](dns, 'dns', 'DNS', timings)}
      ${this[timingTemplate](connect, 'connect', 'Connecting', timings)}
      ${this[timingTemplate](ssl, 'ssl', 'SSL negotiation', timings)}
      ${this[timingTemplate](send, 'send', 'Sending', timings)}
      ${this[timingTemplate](wait, 'wait', 'Waiting', timings)}
      ${this[timingTemplate](receive, 'receive', 'Receiving', timings)}
    </div>
    `;
  }

  /**
   * @param width
   * @param type Added to the class name.
   * @param label The label to use in the title attribute
   * @param timings The entry's timings object
   * @returns The template for a timing timeline item
   */
  [timingTemplate](width: number | undefined, type: keyof RenderedEntryTimings | keyof Timings, label?: string, timings?: Timings): TemplateResult | string {
    if (!width) {
      return '';
    }
    const styles = {
      width: `${width}%`,
    };
    const classes = {
      'timing-entry': true,
      [type]: true,
    };
    const time = timings && timings[type as keyof Timings];
    const title = typeof time === 'number' ? `${label}: ${Math.round(time)}ms` : undefined;
    return html`
    <div class="${classMap(classes)}" style="${styleMap(styles)}" title="${ifDefined(title)}"></div>
    `;
  }

  /**
   * @param entry The entry to render
   * @returns The template for an entry details.
   */
  [entryDetails](entry: RenderedEntry): TemplateResult {
    const { id } = entry;
    const selectedTab = this[selectedTabsValue][id] || 0;
    return html`
    <section class="entry-details">
      ${this[entryDetailsTabsTemplate](entry, selectedTab)}
      <div class="details-content" tabindex="0">
      ${this[entryDetailsContentTemplate](entry, selectedTab)}
      </div>
    </section>
    `;
  }

  /**
   * @param entry The entry to render
   * @param {number} selected The index of the selected tab
   * @returns The template for entry details content tabs.
   */
  [entryDetailsTabsTemplate](entry: RenderedEntry, selected: number): TemplateResult {
    const { id, request, response } = entry;
    const { postData, cookies: requestCookies } = request;
    const { content, cookies: responseCookies } = response;
    const hashRequestContent = !!postData && !!postData.text;
    const hashResponseContent = !!content && !!content.text;
    const hasRequestCookies = Array.isArray(requestCookies) && !!requestCookies.length;
    const hasResponseCookies = Array.isArray(responseCookies) && !!responseCookies.length;
    const hasCookies = hasRequestCookies || hasResponseCookies;
    return html`
    <anypoint-tabs .selected="${selected}" @selected="${this[detailsTabSelectionHandler]}" data-entry="${id}">
      <anypoint-tab>Request</anypoint-tab>
      <anypoint-tab>Response</anypoint-tab>
      <anypoint-tab ?hidden="${!hashRequestContent}">Request content</anypoint-tab>
      <anypoint-tab ?hidden="${!hashResponseContent}">Response content</anypoint-tab>
      <anypoint-tab ?hidden="${!hasCookies}">Cookies</anypoint-tab>
    </anypoint-tabs>
    `;
  }

  /**
   * @param entry The entry to render
   * @param selected The index of the selected tab
   * @returns The template for entry details content.
   */
  [entryDetailsContentTemplate](entry: RenderedEntry, selected?: number): TemplateResult | string {
    switch (selected) {
      case 0: return this[entryDetailsRequestTemplate](entry);
      case 1: return this[entryDetailsResponseTemplate](entry);
      case 2: return this[entryDetailsRequestBodyTemplate](entry);
      case 3: return this[entryDetailsResponseBodyTemplate](entry);
      case 4: return this[entryDetailsCookiesTemplate](entry);
      default: return '';
    }
  }

  /**
   * @param entry The entry to render
   * @returns The template for entry's request content.
   */
  [entryDetailsRequestTemplate](entry: RenderedEntry): TemplateResult {
    const { request, requestFormattedDate, serverIPAddress, requestSizes } = entry;
    const { headers, url, method, httpVersion, queryString } = request;
    return html`
    <div class="entry-details-title">Request on ${requestFormattedDate}</div>
    <dl class="details-list">
      <dt>General</dt>
      <dd>
        ${this[definitionTemplate]('URL', url)}
        ${this[definitionTemplate]('HTTP version', httpVersion)}
        ${this[definitionTemplate]('Operation', method)}
        ${this[definitionTemplate]('Remote Address', serverIPAddress)}
      </dd>
      ${this[headersTemplate](headers)}
      ${this[queryParamsTemplate](queryString)}
      ${this[sizesTemplate](requestSizes)}
    </dl>
    `;
  }

  /**
   * @param entry The entry to render
   * @returns The template for entry's response content.
   */
  [entryDetailsResponseTemplate](entry: RenderedEntry): TemplateResult {
    const { response, responseSizes } = entry;
    const { headers } = response;
    return html`
    <dl class="details-list">
      ${this[headersTemplate](headers)}
      ${this[sizesTemplate](responseSizes)}
    </dl>
    `;
  }

  /**
   * @param entry The entry to render
   * @returns The template for entry's request body preview.
   */
  [entryDetailsRequestBodyTemplate](entry: RenderedEntry): TemplateResult {
    const { request } = entry;
    const { postData } = request;
    if (!postData || !postData.text) {
      return html`<p>No request body data.</p>`;
    }
    return html`
    <pre><code class="body-preview">${postData.text}</code></pre>
    `;
  }

  /**
   * @param entry The entry to render
   * @returns The template for entry's response body preview.
   */
  [entryDetailsResponseBodyTemplate](entry: RenderedEntry): TemplateResult {
    const { response } = entry;
    const { content } = response;
    if (!content || !content.text) {
      return html`<p>No request body data.</p>`;
    }
    return html`
    <pre><code class="body-preview">${content.text}</code></pre>
    `;
  }

  /**
   * @param entry The entry to render
   * @returns The template for entry's cookies.
   */
  [entryDetailsCookiesTemplate](entry: RenderedEntry): TemplateResult {
    const { request, response } = entry;
    const { cookies: requestCookies } = request;
    const { cookies: responseCookies } = response;
    const hasRequestCookies = Array.isArray(requestCookies) && !!requestCookies.length;
    const hasResponseCookies = Array.isArray(responseCookies) && !!responseCookies.length;

    return html`
    <dl class="details-list">
      <dt>Request cookies</dt>
      <dd>
        ${hasRequestCookies ? requestCookies.map((item) => this[definitionTemplate](item.name, item.value)) : 
          html`No cookies recorded.`}
      </dd>

      <dt>Response cookies</dt>
      <dd>
        ${hasResponseCookies ? responseCookies.map((item) => this[definitionTemplate](item.name, item.value)) : 
          html`No cookies recorded.`}
      </dd>
    </dl>
    `;
  }

  /**
   * @param term Definition label
   * @param value Definition value
   * @returns The template for the definition.
   */
  [definitionTemplate](term: string, value?: string): TemplateResult | string {
    if (!value) {
      return '';
    }
    return html`
    <p class="definition">
      <dfn>${term}:</dfn> ${value}
    </p>
    `;
  }

  /**
   * @returns The template for the list of headers.
   */
  [headersTemplate](headers: Header[]): TemplateResult | string {
    return html`
    <dt>Headers</dt>
    <dd>
      ${Array.isArray(headers) && headers.length ? 
        headers.map((item) => this[definitionTemplate](item.name, item.value)) : 
        html`No headers recorded.`}
    </dd>
    `;
  }

  /**
   * @returns The template for the query parameters.
   */
  [queryParamsTemplate](params: QueryString[]): TemplateResult | string {
    if (!Array.isArray(params) || !params.length) {
      return '';
    }
    return html`
    <dt>Query parameters</dt>
    <dd>
      ${params.map((item) => this[definitionTemplate](item.name, item.value))}
    </dd>
    `;
  }

  /**
   * @returns The template for sizes information
   */
  [sizesTemplate](sizes: EntrySizing): TemplateResult {
    return html`
    <dt>Size</dt>
    <dd>
      ${this[definitionTemplate]('Headers', sizes.headers)}
      ${this[definitionTemplate]('Body', sizes.body)}
      ${this[definitionTemplate]('Total', sizes.sum)}
    </dd>`;
  }
}
