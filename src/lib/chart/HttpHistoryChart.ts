/* eslint-disable class-methods-use-this */
import { ErrorResponse, IHttpHistory, IResponse } from '@api-client/core/build/browser.js';
import { css, html, TemplateResult } from 'lit';
import { range } from 'lit/directives/range.js';
import { map } from 'lit/directives/map.js';
import { classMap } from 'lit/directives/class-map.js';
import { getTime, relativeDay } from '../time/Conversion.js';

const chartStyles = css`
.grid-container {
  display: grid;
  grid-template:
    "header header" 40px
    "rows data" auto
    ". columns" 80px / 80px auto;
}

.chart-title {
  font-weight: 500;
  font-size: 1.1rem;
  grid-area: header;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-rows {
  grid-area: rows;
  position: relative;
  background-image: repeating-linear-gradient(to top, #CCC, #CCC 1px, white 1px, white 10%, #CCC 10% );
  border-right: 1px #e5e5e5 solid;
  text-align: right;
  padding-right: 20px;
}

.chart-rows .label {
  left: 0;
  top: calc(100% / 2 - calc(1rem / 2));
  position: absolute;
  transform: rotate(-90deg);
  left: -68px;
}

.chart-data {
  grid-area: data; 
}

.chart-rows,
.chart-data {
  background-image: repeating-linear-gradient(to top, #CCC, #CCC 1px, white 1px, white 10%, #CCC 10% );
}

.chart-columns {
  grid-area: columns;
  /* overflow: hidden; */
}

.chart-data,
.chart-columns {
  display: flex;
  gap: 12px;
}

.data-rows {
  display: flex;
  flex-direction: column-reverse;
  height: 100%;
}

.data-rows > * {
  flex: 1 1 0%;
  display: flex;
  align-items: start;
  justify-content: end;
  margin-top: 8px;
}

.data-column,
.data-bar {
  display: block;
  min-width: 8px;
  background-color: transparent;
  min-width: 20px;
  flex: 1 1 0%;
}

.data-bar.day-separator {
  background-color: #03a9f45e;
}

.data-bar.day-separator,
.data-column.day-separator {
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: 60px;
}

.data-bar.day-separator .label {
  transform: rotate(-90deg);
  white-space: nowrap;
  background-color: #a2dffb;
  padding: 8px;
}

.data-column {
  display: flex;
  align-items: center;
  padding-top: 8px;
}

.data-column .label {
  display: block;
  transform: rotate(-90deg);
  white-space: nowrap;
  /* overflow: hidden;
  text-overflow: ellipsis; */
}

.bar-day-entry {
  display: flex;
  flex-direction: column;
}

.bar-day-entry .label {
  flex: 1;
  min-height: 0px;
  position: relative;
  z-index: 1;
  place-self: center end;
  display: flex;
  align-items: end;
}

.label.inside {
  transform: translate(0px, 1.5rem);
}

.bar-value {
  transition: all 0.4s ease-in-out 0s;
  background: rgb(76 175 80 / 78%);
}
`;

export { chartStyles };

const DaySeparatorKind = 'Chart#DaySeparator';
const EntryKind = 'Chart#Entry';

interface IDaySeparator {
  kind: typeof DaySeparatorKind;
  label: string;
}

interface IEntry {
  kind: typeof EntryKind;
  /**
   * Request duration.
   */
  d: number;
  /**
   * Request size
   */
  res: number;
  /**
   * Response size
   */
  rps: number;
  /**
   * The log created time
   */
  t: number;
}

type DataEntry = IEntry | IDaySeparator;

export class HttpHistoryChart {
  protected _topDuration: number = 0;

  protected _topRequestSize: number = 0;
  
  protected _topResponseSize: number = 0;

  /**
   * The ordered from the oldest to the newest history data.
   */
  protected _values: DataEntry[] = [];

  /**
   * @param data Sorted history data. Each array item is a group if requests made that day.
   */
  constructor(protected data: IHttpHistory[][]) {
    this._analyze();
  }

  /**
   * Normalizes the data, formats the labels and sets the `_values` array.
   */
  protected _analyze(): void {
    const { data } = this;
    const result: DataEntry[] = [];
    const copy = [...data].reverse();
    for (const group of copy) {
      if (!group.length) {
        continue;
      }
      const groupEntry: IDaySeparator = {
        kind: DaySeparatorKind,
        label: relativeDay(group[0].midnight!),
      };
      result.push(groupEntry);
      for (const item of [...group].reverse()) {
        const { log, created } = item;
        if (!log) {
          continue;
        }
        const entry: IEntry = {
          kind: EntryKind,
          d: 0,
          res: 0,
          rps: 0,
          t: created,
        };
        result.push(entry);
        const { size, response } = log;
        if (size) {
          entry.res = size.request;
          entry.rps = size.response;
          if (this._topRequestSize < size.request) {
            this._topRequestSize = size.request;
          }
          if (this._topResponseSize < size.response) {
            this._topResponseSize = size.response;
          }
        }
        if (!ErrorResponse.isErrorResponse(response)) {
          const typed = response as IResponse;
          entry.d = typed.loadingTime;
          if (this._topDuration < typed.loadingTime) {
            this._topDuration = typed.loadingTime;
          }
        }
      }
    }
    this._values = result;
  }

  /**
   * Creates a plot for the request duration.
   */
  durationPlot(): TemplateResult {
    return html`
    <figure aria-hidden="true" class="grid-container chart">
      <figcaption class="chart-title">Request duration</figcaption>
      ${this._durationRows()}
      ${this._durationChart()}
      ${this._durationColumns()}
    </figure>
    `;
  }

  private _durationRows(): TemplateResult {
    const step = this._topDuration / 10;
    return html`
    <div class="chart-rows">
      <div class="label">Milliseconds</div>
      <div class="data-rows">
        ${map(range(10), (i) => html`<span>${Math.round((i+1) * step)}</span>`)}
      </div>
    </div>
    `;
  }

  private _durationChart(): TemplateResult {
    const data = this._values;
    return html`<div class="chart-data">
      ${data.map(i => this._durationItem(i))}
    </div>`;
  }

  private _durationColumns(): TemplateResult {
    const data = this._values;
    return html`
    <div class="chart-columns">
      ${data.map(i => this._durationColumn(i))}
    </div>`;
  }

  private _durationItem(item: DataEntry): TemplateResult {
    if (item.kind === DaySeparatorKind) {
      return this._durationDaySeparatorItem(item);
    }
    return this._durationEntryItem(item);
  }

  private _durationDaySeparatorItem(item: IDaySeparator): TemplateResult {
    return html`
    <div class="data-bar day-separator">
      <span class="label">${item.label}</span>
    </div>
    `;
  }

  private _durationEntryItem(item: IEntry): TemplateResult {
    const { d } = item;
    let scale = 0;
    if (this._topDuration) {
      scale = d / this._topDuration;
    }
    const classes = {
      'label': true,
      'inside': scale >= 0.75,
    };
    return html`
    <div class="data-bar bar-day-entry">
      <span class="${classMap(classes)}">${d}</span>
      <div class="bar-value" style="flex-basis: ${scale * 100}%">
      </div>
    </div>
    `;
  }

  private _durationColumn(item: DataEntry): TemplateResult {
    const classes = {
      'data-column': true,
      'day-separator': item.kind === DaySeparatorKind,
    };
    let label: string | undefined;
    if (item.kind === EntryKind) {
      label = getTime(item.t);
    }
    return html`
    <div class="${classMap(classes)}">
      ${label ? html`<span class="label">${label}</span>` : ''}
    </div>
    `;
  }
}
