/* eslint-disable class-methods-use-this */
import { Payload, Headers } from '@api-client/core/build/browser';
import CodeSnippet from '../CodeSnippet.js';
import 'prismjs/components/prism-python.min.js';

export default class Python31Snippet extends CodeSnippet {
  get lang(): string {
    return 'python';
  }

  computeCommand(url: string, method: string, headers?: Headers, payload?: Payload): string {
    if (!url || !method) {
      return '';
    }
    let result = 'import http.client\n\n';
    const hasHeaders = !!headers;
    const hasPayload = !!payload;

    if (hasHeaders) {
      result += this._getHeaders(headers);
      if (!hasPayload) {
        result += '\n';
      }
    }
    if (hasPayload) {
      result += this._getPayload(payload);
    }
    result += this._getConnection(url, method, hasPayload, hasHeaders);
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
  _getConnection(url: string, method: string, hasPayload: boolean, hasHeaders: boolean): string {
    const data = this.urlDetails(url);
    let cls = 'HTTP';
    if (data.port === '443') {
      cls += 'S';
    }
    let result = `conn = http.client.${cls}Connection('${data.hostValue}')\n`;
    result += `conn.request('${method}','${data.path}'`;
    if (hasPayload) {
      result += ', body';
    }
    if (hasHeaders) {
      result += ', headers';
    }
    result += ')\n';
    return result;
  }

  /**
   * @return Returns ending of the code definition
   */
  _getFooter(): string {
    let result = 'res = conn.getresponse()\n';
    result += '\n';
    result += 'data = res.read()\n';
    result += 'print(res.status, res.reason)\n';
    result += 'print(data.decode(\'utf-8\'))\n';
    result += 'print(res.getheaders())';
    return result;
  }
}
