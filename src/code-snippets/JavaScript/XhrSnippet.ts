/* eslint-disable class-methods-use-this */
import { Payload, Headers } from '@api-client/core/build/browser';
import CodeSnippet from '../CodeSnippet.js';

export default class XhrSnippet extends CodeSnippet {
  get lang(): string {
    return 'javascript';
  }

  computeCommand(url: string, method: string, headers?: Headers, payload?: Payload): string {
    if (!url || !method) {
      return '';
    }
    let result = 'var xhr = new XMLHttpRequest();\n';
    result += 'xhr.addEventListener(\'load\', function(e) {\n';
    result += '  var response = e.target.responseText;\n';
    result += '  console.log(response);\n';
    result += '});\n';
    result += 'xhr.addEventListener(\'error\', function(e) {\n';
    result += '  console.error(\'Request error with status\', e.target.status);\n';
    result += '});\n';
    result += `xhr.open('${method}', '${url}');\n`;
    if (headers) {
      for (const [name, value] of headers) {
        result += `xhr.setRequestHeader('${name}','${value}');\n`;
      }
    }
    if (typeof payload === 'string') {
      result += 'var body = \'\';\n';
      const re = /'/g;
      const list = payload.split('\n');
      const size = list.length;
      list.forEach((line, i) => {
        const nl = i + 1 === size ? '' : '\\n'
        // eslint-disable-next-line no-param-reassign
        line = line.replace(re, '\\\'');
        result += `body += '${line}${nl}';\n`;
      });
      result += 'xhr.send(body);\n';
    } else {
      result += 'xhr.send();\n';
    }
    return result;
  }
}
