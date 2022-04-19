/* eslint-disable class-methods-use-this */
import { IHttpRequest, Payload, Headers } from '@api-client/core/build/browser.js';
import { PrismHighlighter } from '../elements/highlight/PrismHighlighter.js';

export declare interface CodeHeader {
  name: string;
  value: string;
}

export declare interface UrlDetails {
  path: string;
  port: string;
  hostValue: string;
  autoPort?: boolean;
}

const URI_CACHE = new Map<string, UrlDetails>()

/**
 * The base class for all HTTP code snippets.
 */
export default abstract class CodeSnippet {
  /**
   * The syntax highlighting language to use after computing the command.
   */
  abstract get lang(): string;

  /**
   * The function that computes command from the given request values.
   */
  abstract computeCommand(url: string, method: string, headers?: Headers, payload?: Payload): string;

  /**
   * Processes the current snippet command.
   */
  tokenize(request: IHttpRequest): string {
    const { url='', method = 'GET', headers, payload } = request;
    let parsed: Headers | undefined;
    if (headers) {
      parsed = new Headers(headers);
    }
    const code = this.computeCommand(url, method, parsed, payload);
    if (!code) {
      return '';
    }
    const highlight = new PrismHighlighter();
    return highlight.tokenize(code, this.lang);
  }

  /**
   * Reads the host, port and path from the url.
   * This function uses URI library to parse the URL so you have to
   * include this library from bower_components if the element want to use it.
   */
  urlDetails(value: string): UrlDetails {
    let result = URI_CACHE.get(value);
    if (!result) {
      const url = value;
      result = {
        path: '',
        port: '',
        hostValue: '',
        autoPort: false,
      };
      if (!url) {
        return result;
      }
      let uri;
      try {
        uri = new URL(url);
      } catch (e) {
        if (url[0] === '/') {
          result.path = url;
          result.port = '80';
        }
        return result;
      }
      let host = uri.hostname;
      if (host) {
        host = decodeURIComponent(host);
      }
      let { port } = uri;
      if (!port) {
        result.autoPort = true;
        if (uri.protocol === 'https:') {
          port = '443';
        } else {
          port = '80';
        }
      }
      result.port = String(port);
      result.hostValue = host;
      const query = uri.search;
      let path = uri.pathname;
      if (!path) {
        path = '/';
      } else {
        path = decodeURIComponent(path);
      }
      if (query) {
        path += query;
      }
      result.path = path;
      URI_CACHE.set(value, result);
    }
    return result;
  }
}
