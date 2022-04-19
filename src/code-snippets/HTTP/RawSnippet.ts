/* eslint-disable class-methods-use-this */
import { Payload, Headers } from '@api-client/core/build/browser';
import CodeSnippet from '../CodeSnippet.js';
// import 'prismjs/prism.js';
import 'prismjs/components/prism-http.min.js';

export default class RawSnippet extends CodeSnippet {
  get lang(): string {
    return 'http';
  }

  computeCommand(url: string, method: string, headers?: Headers, payload?: Payload): string {
    if (!url || !method) {
      return '';
    }
    const urlData = this.urlDetails(url);
    let result = `${method} ${urlData.path} HTTP/1.1\n`;
    if (urlData.hostValue) {
      result += `Host: ${urlData.hostValue}:${urlData.port}\n`;
    }
    result += this._genHeadersPart(headers);
    result += this._genPayloadPart(payload);
    return result;
  }

  _genHeadersPart(headers?: Headers): string {
    let result = '';
    if (headers) {
      for (const [name, value] of headers) {
        result += `${name}: ${value}\n`;
      }
    }
    return result;
  }

  _genPayloadPart(payload?: Payload): string {
    let result = '';
    if (typeof payload === 'string') {
      result += '\n';
      result += payload;
      result += '\n\n';
    }
    return result;
  }
}
