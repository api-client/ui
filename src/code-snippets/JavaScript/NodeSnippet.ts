/* eslint-disable class-methods-use-this */
import { Payload, Headers } from '@api-client/core/build/browser';
import CodeSnippet from '../CodeSnippet.js';

export default class NodeSnippet extends CodeSnippet {
  get lang(): string {
    return 'javascript';
  }

  computeCommand(url: string, method: string, headers?: Headers, payload?: Payload): string {
    if (!url || !method) {
      return '';
    }
    const isHttps = String(url).indexOf('https:') === 0;
    let libName = 'http';
    if (isHttps) {
      libName += 's';
    }
    let result = `const http = require('${libName}');\n`;
    const data = this.urlDetails(url);
    result += 'const init = {\n';
    result += `  host: '${data.hostValue}',\n`;
    result += `  path: '${data.path}',\n`;
    if (!data.autoPort) {
      result += `  port: ${data.port},\n`;
    }
    result += `  method: '${method}',\n`;
    result += this._genHeadersPart(headers);
    result += '};\n';
    result += 'const callback = function(response) {\n';
    result += '  let result = Buffer.alloc(0);\n';
    result += '  response.on(\'data\', function(chunk) {\n';
    result += '    result = Buffer.concat([result, chunk]);\n';
    result += '  });\n';
    result += '  \n';
    result += '  response.on(\'end\', function() {\n';
    result += '    // result has response body buffer\n';
    result += '    console.log(result.toString(\'utf8\'));\n';
    result += '  });\n';
    result += '};\n';
    result += '\n';
    result += 'const req = http.request(init, callback);\n';
    result += this._genPayloadPart(payload);
    result += 'req.end();\n';
    return result;
  }

  _genHeadersPart(headers?: Headers): string {
    let result = '';
    if (headers) {
      result += '  headers: {\n';
      const parts: string[] = [];
      for (const [name, value] of headers) {
        parts[parts.length] = `    '${name}': '${value}'`;
      }
      result += parts.join(',\n');
      result += '\n  }\n';
    }
    return result;
  }

  _genPayloadPart(payload?: Payload): string {
    let result = '';
    if (typeof payload === 'string') {
      result += `const body = \`${payload}\`;\n`;
      result += 'req.write(body);\n';
    }
    return result;
  }
}
