/* eslint-disable class-methods-use-this */
import { Payload, Headers } from '@api-client/core/build/browser';
import CodeSnippet from '../CodeSnippet.js';
import 'prismjs/components/prism-bash.min.js';

export default class CurlSnippet extends CodeSnippet {
  get lang(): string {
    return 'bash';
  }

  computeCommand(url: string, method: string, headers?: Headers, payload?: Payload): string {
    let result = `curl "${url}" \\\n`;
    if (method !== 'GET') {
      result += `  -X ${method} \\\n`;
    }
    if (typeof payload === 'string') {
      let quot = '';
      try {
        // eslint-disable-next-line no-param-reassign
        payload = JSON.stringify(payload);
      } catch (_) {
        quot = '"';
      }
      result += `  -d ${quot}${payload}${quot} \\\n`;
    }
    if (headers) {
      const parts: string[] = [];
      for (const [name, value] of headers) {
        parts.push(`  -H "${name}: ${value}" `);
      }
      result += parts.join('\\\n');
    }
    if (result.substring(-2) === '\\\n') {
      result = result.substring(0, result.length - 3);
    }
    return result;
  }
}
