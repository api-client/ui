import { DeserializedPayload } from "@api-client/core/build/browser.js";

/**
 * @param body The body 
 * @param charset The optional charset to use with the text decoder.
 */
 export function ensureBodyString(body: DeserializedPayload, charset?: string): string | undefined {
  if (body === undefined || body === null) {
    return undefined;
  }
  if (typeof body === 'string' || typeof body === 'boolean' || typeof body === 'number') {
    return String(body);
  }
  if (body instanceof Uint8Array) {
    // This is node's Buffer via Electron bindings.
    return body.toString();
  }
  if (body instanceof ArrayBuffer) {
    const decoder = new TextDecoder(charset);
    try {
      return decoder.decode(body);
    } catch (e) {
      return '';
    }
  }
  return undefined;
}

/**
 * Computes charset value from the `content-type` header.
 * @param contentType Content type header string
 */
export function computeCharset(contentType?: string): string | undefined {
  if (!contentType || typeof contentType !== 'string') {
    return undefined;
  }
  if (contentType.indexOf('charset') === -1) {
    return undefined;
  }
  const parts = contentType.split(';');
  for (let i = 0, len = parts.length; i < len; i++) {
    const part = parts[i].trim();
    const _tmp = part.split('=');
    if (_tmp[0] === 'charset') {
      return _tmp[1].trim();
    }
  }
  return undefined;
}

/**
 * Reads content-type header from the response headers.
 *
 * @param contentType The value of the content type header
 * @returns When present an array where first item is the content type and second is charset value. Otherwise empty array.
 */
export function readContentType(contentType?: string): string[] {
  if (!contentType) {
    return [];
  }
  const charset = computeCharset(contentType);
  let value = contentType;
  if (charset) {
    value = value.substring(0, value.indexOf(';'));
  }
  const result = [value];
  if (charset) {
    result.push(charset);
  }
  return result;
}

export const defaultBinaryTypes = [
  'application/zip', 'application/gzip', 'application/octet-stream', 'application/pkcs8',
  'application/x-bzip', 'application/x-bzip2', 'application/msword', 'application/x-7z-compressed',
  'application/epub+zip', 'application/java-archive', 'application/ogg', 'audio/opus', 'application/x-tar',
  'application/macbinary', 'application/x-executable',
];

/**
 * @description Tests whether the content type represents a JSON body.
 * @export
 * @param {string} mime The body mime type.
 * @returns True when the body is a JSON body.
 */
export function isJsonBody(mime: string): boolean {
  return mime.includes('/json') || 
    // all kinds of +json like ld+json, graph+json, whatever+json
    mime.includes('+json') || 
    // The legacy JSON mime before official registration.
    mime.includes('text/x-json')
}

/**
 * Checks whether the content type corresponds to an XML body.
 */
export function isXmlBody(mime: string): boolean {
  return mime.includes('/xml') || mime.includes('+xml');
}

/**
 * Checks whether the content type corresponds to an XML body.
 */
export function isPdfBody(mime: string): boolean {
  return mime === 'application/pdf';
}

/**
 * Checks whether the content type corresponds to an XML body.
 */
export function isBinaryBody(mime: string): boolean {
  if (defaultBinaryTypes.includes(mime)) {
    return true;
  }
  return mime.startsWith('audio/') ||
    mime.startsWith('video/') ||
    mime.startsWith('font/') ||
    mime.startsWith('application/vnd.ms') ||
    mime.startsWith('application/vnd.oasis') ||
    mime.startsWith('application/vnd.openxmlformats') ||
    mime.startsWith('model/') ||
    mime.endsWith('+zip')
}

/**
 * Checks whether the content type represents an image and if so it 
 * returns its general type.
 */
export function imageBody(mime: string): 'binary' | 'svg' | undefined {
  if (!mime.startsWith('image/')) {
    return undefined;
  }
  if (mime.endsWith('/svg+xml')) {
    return 'svg';
  }
  return 'binary';
}

export function isTextBody(mime: string): boolean {
  return isJsonBody(mime) || isXmlBody(mime) || imageBody(mime) === 'svg';
}
