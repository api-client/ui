/* eslint-disable class-methods-use-this */
import { Payload, Headers } from '@api-client/core/build/browser';
import CodeSnippet from '../CodeSnippet.js';

export default class CcurlSnippet extends CodeSnippet {
  get lang(): string {
    return 'clike';
  }

  get _codeHeaders(): string {
    return '#include <stdio.h>\n#include <curl/curl.h>\n\n';
  }

  computeCommand(url: string, method: string, headers?: Headers, payload?: Payload): string {
    if (!url || !method) {
      return '';
    }
    let result = this._codeHeaders;
    result += 'int main(void)\n{\n';
    result += '\tCURL *curl;\n\tCURLcode res;\n\n';
    result += '\tcurl = curl_easy_init();\n';
    result += `\tcurl_easy_setopt(curl, CURLOPT_URL, "${url}");\n`;
    result += `\tcurl_easy_setopt(curl, CURLOPT_CUSTOMREQUEST, "${method}");\n`;
    result += '\t/* if redirected, tell libcurl to follow redirection */\n';
    result += '\tcurl_easy_setopt(curl, CURLOPT_FOLLOWLOCATION, 1L);\n\n';
    if (Array.isArray(headers)) {
      result += '\tstruct curl_slist *headers = NULL;\n';
      headers.forEach((value, name) => {
        result += `\theaders = curl_slist_append(headers, "${name}: ${value}");\n`;
      });
      result += '\tcurl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);\n';
    }
    if (payload) {
      result += '\n';
      result += '\tchar *body ="';
      if (typeof payload === 'string') {
        const re = /"/g;
        payload.split('\n').forEach((line) => {
          result += line.replace(re, '\\"');
        });
      }
      result += '";\n';
      result += '\tcurl_easy_setopt(curl, CURLOPT_POSTFIELDS, body);\n';
    }
    result += '\n\t/* Perform the request, res will get the return code */\n';
    result += '\tres = curl_easy_perform(curl);\n';
    result += '\tif (res != CURLE_OK) {\n';
    result += '\t\tfprintf(stderr, "curl_easy_perform() failed: %s\\n"';
    result += ', curl_easy_strerror(res));\n';
    result += '\t}\n';
    result += '\t/* Clean up after yourself */\n';
    result += '\tcurl_easy_cleanup(curl);\n';
    result += '\treturn 0;\n';
    result += '}\n';
    result += '/* See: http://stackoverflow.com/a/2329792/1127848 of how ';
    result += 'to read data from the response. */';
    return result;
  }
}
