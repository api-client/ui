/* eslint-disable class-methods-use-this */
import { Payload, Headers } from '@api-client/core/build/browser';
import CodeSnippet from '../CodeSnippet.js';
import 'prismjs/components/prism-java.min.js';

export default class PlatformSnippet extends CodeSnippet {
  get lang(): string {
    return 'java';
  }

  computeCommand(url: string, method: string, headers?: Headers, payload?: Payload): string {
    let result = `URL url = new URL("${url}");\n`;
    let cls = 'Http';
    if (url.indexOf('https') === 0) {
      cls += 's';
    }
    cls += 'URLConnection';
    result += `${cls} con = (${cls}) url.openConnection();\n`;
    result += `con.setRequestMethod("${method}");\n`;
    result += this._genHeadersPart(headers);
    result += this._genPayloadPart(payload);
    result += '\n';
    result += 'int status = con.getResponseCode();\n';
    result += 'BufferedReader in = new BufferedReader(';
    result += 'new InputStreamReader(con.getInputStream()));\n';
    result += 'String inputLine;\n';
    result += 'StringBuffer content = new StringBuffer();\n';
    result += 'while((inputLine = in.readLine()) != null) {\n';
    result += '\tcontent.append(inputLine);\n';
    result += '}\n';
    result += 'in.close();\n';
    result += 'con.disconnect();\n';
    result += 'System.out.println("Response status: " + status);\n';
    result += 'System.out.println(content.toString());';
    return result;
  }

  _genHeadersPart(headers?: Headers): string {
    let result = '';
    if (headers) {
      for (const [name, value] of headers) {
        result += `con.setRequestProperty("${name}", "${value}");\n`;
      };
    }
    return result;
  }

  _genPayloadPart(payload?: Payload): string {
    let result = '';
    if (typeof payload === 'string') {
      result += '\n/* Payload support */\n';
      result += 'con.setDoOutput(true);\n';
      result += 'DataOutputStream out = new DataOutputStream(con.getOutputStream());\n';
      const list = this._payloadToList(payload);
      const size = list.length;
      list.forEach((line, i) => {
        const nl = i + 1 === size ? '' : '\\n'
        result += `out.writeBytes("${line}${nl}");\n`;
      });
      result += 'out.flush();\n';
      result += 'out.close();\n';
    }
    return result;
  }

  _payloadToList(payload: string): string[] {
    return payload.split('\n').map((item) => item.replace(/"/g, '\\"'));
  }
}
