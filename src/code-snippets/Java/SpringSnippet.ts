/* eslint-disable class-methods-use-this */
import { Payload, Headers } from '@api-client/core/build/browser';
import CodeSnippet from '../CodeSnippet.js';
import 'prismjs/components/prism-java.min.js';

export default class SpringSnippet extends CodeSnippet {
  get lang(): string {
    return 'java';
  }

  computeCommand(url: string, method: string, headers?: Headers, payload?: Payload): string {
    if (!url || !method) {
      return '';
    }
    let result = `RestTemplate rest = new RestTemplate();\n`;
    result += 'HttpHeaders headers = new HttpHeaders();\n';
    result += this._genHeadersPart(headers);
    result += this._genPayloadPart(payload);
    result += '\n';
    result += 'HttpEntity<String> requestEntity = new HttpEntity<String>(body, headers);\n';
    result += 'ResponseEntity<String> responseEntity = rest.exchange(';
    result += `"${url}", HttpMethod.${method}, requestEntity, String.class);\n`;
    result += 'HttpStatus httpStatus = responseEntity.getStatusCode();\n';
    result += 'int status = httpStatus.value();\n';
    result += 'String response = responseEntity.getBody();\n';
    result += 'System.out.println("Response status: " + status);\n';
    result += 'System.out.println(response);';
    return result;
  }

  _genHeadersPart(headers?: Headers): string {
    let result = '';
    if (headers) {
      for (const [name, value] of headers) {
        result += `headers.add("${name}", "${value}");\n`;
      };
    }
    return result;
  }

  _genPayloadPart(payload?: Payload): string {
    let result = '';
    if (typeof payload === 'string') {
      result += '\nStringBuilder sb = new StringBuilder();\n';
      const list = this._payloadToList(payload);
      const len = list.length;
      list.forEach((line, i) => {
        if (i + 1 !== len) {
          // eslint-disable-next-line no-param-reassign
          line += '\\n';
        }
        result += `sb.append("${line}");\n`;
      });
      result += 'String body = sb.toString();\n';
    } else {
      result += 'String body = "";\n';
    }
    return result;
  }

  _payloadToList(payload: string): string[] {
    return payload.split('\n').map((item) => item.replace(/"/g, '\\"'));
  }
}
