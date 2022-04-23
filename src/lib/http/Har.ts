import { RequestTime, IRequestTime } from "@api-client/core/build/browser.js";

export interface ITimingProgressInfo {
  /**
   * The end time of the previous item. This causes the progress to move to the right by this value.
   */
  previous: number;
  /**
   * The item's end value in the progress timeline
   */
  value: number;
  /**
   * The computed value of the progress label.
   */
  label: string;
  /**
   * The name of the value.
   */
  type: string;
  /**
   * The row title
   */
  title: string;
  /**
   * The aria label for the progress element
   */
  ariaLabel: string;
}

export interface ITimingViewData {
  duration: number;

  data: {
    connect: ITimingProgressInfo;
    receive: ITimingProgressInfo;
    send: ITimingProgressInfo;
    wait: ITimingProgressInfo;
    blocked: ITimingProgressInfo;
    dns: ITimingProgressInfo;
    ssl?: ITimingProgressInfo;
  }
}

/**
 * Reads a numeric value
 * @param value The input value
 * @param defValue The default value to return when the input is an invalid number.
 * @returns A positive integer value
 */
function readTimingValue(value: unknown, defValue = 0): number {
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed < 0) {
    return defValue;
  }
  return parsed;
}

/**
 * @param timing The timings object
 * @returns The total request time
 */
export function computeTimingDuration(timing: RequestTime | IRequestTime): number {
  if (!timing) {
    return 0;
  }
  const connect = readTimingValue(timing.connect);
  const receive = readTimingValue(timing.receive);
  const send = readTimingValue(timing.send);
  const wait = readTimingValue(timing.wait);
  const blocked = readTimingValue(timing.blocked);
  const dns = readTimingValue(timing.dns);
  const ssl = readTimingValue(timing.ssl);
  let time = connect + receive + send + wait;
  if (dns > 0) {
    time += dns;
  }
  if (blocked > 0) {
    time += blocked;
  }
  if (ssl > 0) {
    time += ssl;
  }
  return time;
}

/**
 * Computes the duration of the entire HTTP request based on logs.
 * 
 * @param timings The list of timings for all redirects and the final response.
 * @returns The number of milliseconds from the beginning of the request till the end.
 */
export function computeRequestDuration(timings: (RequestTime | IRequestTime)[]): number {
  let time = 0;
  if (!Array.isArray(timings)) {
    return time;
  }
  timings.forEach((timing) => {
    time += computeTimingDuration(timing);
  });
  time = Math.round(time * 10000) / 10000;
  return time;
}

/**
 * Sums two HAR times.
 * If any argument is `undefined` or `-1` then `0` is assumed.
 * @param a Time #1
 * @param b Time #2
 * @returns The sum of both
 */
function computeSum(a = 0, b = 0): number {
  let a1 = Number(a);
  let b1 = Number(b);
  if (a1 < 0) {
    a1 = 0;
  }
  if (b1 < 0) {
    b1 = 0;
  }
  return a1 + b1;
}

/**
 * Round numeric value to precision defined in the `power` argument.
 *
 * @param value The value to round
 * @returns The rounded value as string.
 */
function roundTime(value: number): string {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return 'unknown';
  }
  const factor = 10 ** 4;
  return String(Math.round(value * factor) / factor);
}

function computeTimingViewData(timing: RequestTime | IRequestTime): ITimingViewData {
  const connect = readTimingValue(timing.connect);
  const receive = readTimingValue(timing.receive);
  const send = readTimingValue(timing.send);
  const wait = readTimingValue(timing.wait);
  const blocked = readTimingValue(timing.blocked);
  const dns = readTimingValue(timing.dns);
  const ssl = readTimingValue(timing.ssl, -1);

  const blockedProgressValue = computeSum(blocked);
  const ttcProgressValue = computeSum(blocked, dns);
  const sslProgressValue = computeSum(ttcProgressValue, connect);
  const sendProgressValue = computeSum(sslProgressValue, ssl);
  const ttfbProgressValue = computeSum(sendProgressValue, send);
  const receiveProgressValue = computeSum(ttfbProgressValue, wait);
  const receive2ProgressValue = computeSum(receiveProgressValue, receive);

  const result: ITimingViewData = {
    duration: computeTimingDuration(timing),
    data: {
      blocked: {
        previous: 0,
        value: blocked,
        label: roundTime(blocked),
        type: 'blocked',
        title: 'Queueing:',
        ariaLabel: 'Queueing time',
      },
      dns: {
        previous: blockedProgressValue,
        value: ttcProgressValue,
        label: roundTime(dns),
        type: 'dns',
        title: 'DNS Lookup:',
        ariaLabel: 'DNS lookup time',
      },
      connect: {
        previous: ttcProgressValue,
        value: sslProgressValue,
        label: roundTime(connect),
        type: 'ttc',
        title: 'Time to connect:',
        ariaLabel: 'Time to connect',
      },
      send: {
        previous: sendProgressValue,
        value: ttfbProgressValue,
        label: roundTime(send),
        type: 'send',
        title: 'Send time:',
        ariaLabel: 'Send time',
      },
      wait: {
        previous: ttfbProgressValue,
        value: receiveProgressValue,
        label: roundTime(wait),
        type: 'ttfb',
        title: 'Wait time:',
        ariaLabel: 'Time to first byte',
      },
      receive: {
        previous: receiveProgressValue,
        value: receive2ProgressValue,
        label: roundTime(receive),
        type: 'receive',
        title: 'Content download:',
        ariaLabel: 'Receiving time',
      }
    }
  };
  if (ssl >= 0) {
    result.data.ssl = {
      previous: sslProgressValue,
      value: sendProgressValue,
      label: roundTime(ssl),
      type: 'ssl',
      title: 'SSL negotiation:',
      ariaLabel: 'SSL negotiation time',
    };
  }
  return result;
}

/**
 * Computes view data for the request log timings UI.
 * @param timings The ordered list of timings for each redirect and the final request.
 */
export function computeTimingsViewData(timings: (RequestTime | IRequestTime)[]): ITimingViewData[] {
  return timings.map(i => computeTimingViewData(i));
}
