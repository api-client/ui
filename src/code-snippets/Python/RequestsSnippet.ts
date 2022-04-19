/* eslint-disable class-methods-use-this */
import { Payload, Headers } from '@api-client/core/build/browser';
import CodeSnippet from '../CodeSnippet.js';
import 'prismjs/components/prism-python.min.js';

export default class RequestsSnippet extends CodeSnippet {
  get lang(): string {
    return 'python';
  }

  computeCommand(url: string, method: string, headers?: Headers, payload?: Payload): string {
    if (!url || !method) {
      return '';
    }
    let result = 'import requests\n\n';
    const hasHeaders = !!headers;
    const hasPayload = !!payload;
    result += `url = '${url}'\n`;
    if (hasHeaders) {
      result += this._getHeaders(headers);
      if (!hasPayload) {
        result += '\n';
      }
    }
    if (hasPayload) {
      result += this._getPayload(payload);
    }
    result += this._getConnection(method, hasPayload, hasHeaders);
    result += this._getFooter();
    return result;
  }

  _getHeaders(headers: Headers): string {
    let result = 'headers = {';
    const parts: string[] = [];
    for (const [name, value] of headers) {
      parts.push(`'${name}': '${value}'`);
    }
    result += parts.join(',');
    result += '}\n';
    return result;
  }

  _getPayload(payload: Payload): string {
    let result = 'body = """';
    result += payload;
    result += '"""\n\n';
    return result;
  }

  /**
   * Computes value of connection definition
   * @param url HTTP request url
   * @param method HTTP request method
   * @param hasPayload True if the request contains payload message
   * @param hasHeaders True if the request contains headers
   */
  _getConnection(method: string, hasPayload: boolean, hasHeaders: boolean): string {
    const lowerMethod = String(method).toLowerCase();
    let result = `req = requests.${lowerMethod}(url`;
    if (hasHeaders) {
      result += ', headers=headers';
    }
    if (hasPayload) {
      result += ', data=body';
    }
    result += ')\n\n';
    return result;
  }

  /**
   * @return Returns ending of the code definition
   */
  _getFooter(): string {
    let result = 'print(req.status_code)\n';
    result += 'print(req.headers)\n';
    result += 'print(req.text)';
    return result;
  }
}
