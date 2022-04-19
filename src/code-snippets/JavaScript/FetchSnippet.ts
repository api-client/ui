/* eslint-disable class-methods-use-this */
import { Payload, Headers } from '@api-client/core/build/browser';
import CodeSnippet from '../CodeSnippet.js';

export default class FetchSnippet extends CodeSnippet {
  get lang(): string {
    return 'javascript';
  }

  computeCommand(url: string, method: string, headers?: Headers, payload?: Payload): string {
    if (!url || !method) {
      return '';
    }
    const hasHeaders = !!headers;
    const hasPayload = !!payload;
    const hasInit = hasHeaders || hasPayload || !!(method && method !== 'GET');
    let result = '';

    if (hasInit) {
      result += this._createHeaders(headers);
      result += this._createPayload(payload);
      result += 'const init = {\n';
      result += `  method: '${method}'`;
      if (hasHeaders) {
        result += `,\n  headers`;
      }
      if (hasPayload) {
        result += `,\n  body`;
      }
      result += '\n';
      result += '};\n\n';
    }

    result += `fetch('${url}'`;
    if (hasInit) {
      result += ', init';
    }
    result += ')\n';
    result += '.then((response) => {\n';
    result += '  return response.json(); // or .text() or .blob() ...\n';
    result += '})\n';
    result += '.then((text) => {\n';
    result += '  // text is the response body\n';
    result += '})\n';
    result += '.catch((e) => {\n';
    result += '  // error in e.message\n';
    result += '});';
    return result;
  }

  _createHeaders(headers?: Headers): string {
    if (!headers) {
      return '';
    }
    let result = 'const headers = new Headers();\n';
    for (const [name, value] of headers) {
      result += `headers.append('${name}', '${value}');\n`;
    }
    result += '\n';
    return result;
  }

  _createPayload(payload?: Payload): string {
    if (typeof payload !== 'string') {
      return '';
    }
    return `const body = \`${payload}\`;\n\n`;
  }
}
