/* eslint-disable class-methods-use-this */
import { Payload, Headers } from '@api-client/core/build/browser';
import CodeSnippet from '../CodeSnippet.js';

export default class AsyncFetchSnippet extends CodeSnippet {
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

    result += `const response = await fetch('${url}'`;
    if (hasInit) {
      result += ', init';
    }
    result += ');\n';
    // eslint-disable-next-line no-template-curly-in-string
    result += 'console.log(`response status is ${response.status}`);\n';
    result += 'const mediaType = response.headers.get(\'content-type\');\n';
    result += 'let data;\n';
    result += 'if (mediaType.includes(\'json\')) {\n';
    result += '  data = await response.json();\n';
    result += '} else {\n';
    result += '  data = await response.text();\n';
    result += '}\n';
    result += 'console.log(data);\n';
    result += '';
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
