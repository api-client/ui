import { Headers } from '@api-client/core/build/browser.js';

export interface IHeader {
  name: string;
  value: string;
  enabled: boolean;
}

/**
 * An array that specializes in keeping HTTP headers data.
 */
export class HeadersArray extends Array<IHeader> {
  static fromHeaders(headersStr?: string): HeadersArray {
    const headers = new Headers(headersStr);
    const array = new HeadersArray();
    for (const [name, value] of headers) {
      array.push({
        enabled: true,
        name,
        value,
      });
    }
    return array;
  }

  /**
   * Overrides native toString to generate the headers string.
   * @returns HTTP headers string.
   */
  toString(): string {
    const headers = new Headers();
    this.forEach((header) => {
      if (header.enabled) {
        headers.append(header.name, header.value);
      }
    });
    return headers.toString();
  }
}
