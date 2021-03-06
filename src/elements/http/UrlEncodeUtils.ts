/* eslint-disable no-continue */
/* eslint-disable no-plusplus */
import { Property, IProperty } from "@api-client/core/build/browser.js";

/**
 * Returns a string where all characters that are not valid for a URL
 * component have been escaped. The escaping of a character is done by
 * converting it into its UTF-8 encoding and then encoding each of the
 * resulting bytes as a %xx hexadecimal escape sequence.
 *
 * Note: this method will convert any space character into its escape
 * short form, '+' rather than %20. It should therefore only be used for
 * query-string parts.
 *
 * The following character sets are **not** escaped by this method:
 * - ASCII digits or letters
 * - ASCII punctuation characters: ```- _ . ! ~ * ' ( )</pre>```
 *
 * Notice that this method <em>does</em> encode the URL component delimiter
 * characters:<blockquote>
 *
 * ```
 * ; / ? : & = + $ , #
 * ```
 *
 * @param str A string containing invalid URL characters
 * @returns a string with all invalid URL characters escaped
 */
export function encodeQueryString(str: string): string {
  if (!str) {
    return str;
  }
  const regexp = /%20/g;
  return encodeURIComponent(str).replace(regexp, '+');
}

/**
 * Returns a string where all URL component escape sequences have been
 * converted back to their original character representations.
 *
 * Note: this method will convert the space character escape short form, '+',
 * into a space. It should therefore only be used for query-string parts.
 *
 * @param {string} str string containing encoded URL component sequences
 * @return {string} string with no encoded URL component encoded sequences
 */
export function decodeQueryString(str: string): string {
  if (!str) {
    return str;
  }
  const regexp = /\+/g;
  return decodeURIComponent(str.replace(regexp, '%20'));
}

/**
 * Appends form data parameter to an array.
 * If the parameter already exists on the array it creates an array for
 * the value instead of appending the same parameter.
 *
 * @param array An array to append the parameter
 * @param name Name of the form data parameter
 * @param value Value of the form data parameter
 * @return Updated array
 */
export function appendArrayResult(array: IProperty[], name: string, value: string): IProperty[] {
  const item = array.find((i) => i.name === name);
  if (item) {
    if (Array.isArray(item.value)) {
      item.value.push(value);
    } else {
      item.value = [item.value, value];
    }
  } else {
    const p = Property.String(name, value, true);
    array.push(p.toJSON());
  }
  return array;
}

/**
 * Converts a string to an array with objects containing name and value keys
 * 
 * @param input An input string
 * @returns An array of params with `name` and `value` keys.
 */
export function createParamsArray(input: string): IProperty[] {
  let result: IProperty[] = [];
  if (!input) {
    return result;
  }
  let state = 0; // 0 - reading name, 1 - reading value
  let i = 0;
  let _tmpName = '';
  let _tmpValue = '';
  const cond = true;
  while (cond) {
    const ch = input[i++];
    if (ch === undefined) {
      if (_tmpValue || _tmpName) {
        result = appendArrayResult(result, _tmpName, _tmpValue);
      }
      break;
    }
    if (ch === '=') {
      if (state !== 1) {
        state = 1;
        continue;
      }
    }
    if (ch === '&') {
      state = 0;
      result = appendArrayResult(result, _tmpName, _tmpValue);
      _tmpName = '';
      _tmpValue = '';
      continue;
    }
    if (state === 0) {
      _tmpName += ch;
    } else if (state === 1) {
      _tmpValue += ch;
    }
  }
  return result;
}

/**
 * Parse input string to array of x-www-form-urlencoded form parameters.
 *
 * This function will not url-decode names and values. Please, use
 * `decodeUrlEncoded(createViewModel(str))` to create an array of decoded parameters.
 *
 * @param input A string of HTTP x-www-form-urlencoded parameters
 * @returns An array of params with `name` and `value` keys.
 */
export function createViewModel(input: string): IProperty[] {
  if (typeof input !== 'string' || !input.trim()) {
    return [];
  }
  let result = input;
  // Chrome inspector has FormData output in format: `param-name`:`param-value`
  // When copying from inspector the ':' must be replaced with '='
  const htmlInputCheck = /^([^\\=]{1,})=(.*)$/m;
  if (!htmlInputCheck.test(result)) {
    // replace chrome inspector data.
    result = result.replace(/^([^\\:]{1,}):(.*)$/gm, '$1=$2&').replace(/\n/gm, '');
    result = result.substring(0, result.length - 1);
  }
  return createParamsArray(result);
}

/**
 * URL encodes a value.
 *
 * @param value Value to encode. Either string or array of strings.
 * @returns Encoded value. The same type as the input.
 */
export function encodeValue(value: string|string[]): string|string[] {
  if (Array.isArray(value)) {
    let cp = [...value];
    cp = cp.map((item) => encodeQueryString(item));
    return cp;
  }
  return encodeQueryString(value);
}

/**
 * Parse input string as a payload param key or value.
 *
 * @param input An input to parse.
 */
export function paramValue(input: string): string {
  if (!input) {
    return String('');
  }
  let typed = String(input);
  typed = typed.trim();
  return typed;
}

/**
 * Creates a form data string for a single item.
 * @param model The model with `name` and `value` properties.
 * @returns Generated value string for x-www-form-urlencoded form.
 */
export function modelItemToFormDataString(model: IProperty): string | undefined {
  if (model.enabled === false) {
    return undefined;
  }
  const name = paramValue(model.name);
  let value = model.value as string;
  if (value && Array.isArray(value)) {
    return value.map((item) => `${name}=${paramValue(item)}`).join('&');
  }
  value = paramValue(value);
  if (!name && !value) {
    return undefined;
  }
  if (!value && model.required === false) {
    return undefined;
  }
  return `${name}=${value}`;
}

/**
 * Parse input array to string x-www-form-urlencoded.
 *
 * Note that this function doesn't encodes the name and value. Use
 * `formArrayToString(encodeUrlEncoded(arr))`
 * to create a encoded string from the array.
 *
 * @param arr Input array. Each element must contain an
 * object with `name` and `value` keys.
 * @returns A parsed string of `name`=`value` pairs of the input objects.
 */
export function formArrayToString(arr: IProperty[]): string {
  if (!arr || !Array.isArray(arr)) {
    return '';
  }
  const result: string[] = [];
  arr.forEach((item) => {
    const data = modelItemToFormDataString(item);
    if (data) {
      result[result.length] = data;
    }
  });
  return result.join('&');
}

/**
 * Encode payload to x-www-form-urlencoded string.
 *
 * @param input An input data.
 */
export function encodeUrlEncoded(input: IProperty[] | string): IProperty[] | string {
  if (!input || !input.length) {
    return input;
  }
  const isArray = Array.isArray(input);
  let typed: IProperty[];
  if (!isArray) {
    typed = createViewModel(String(input));
  } else {
    typed = input;
  }
  const result = typed.map((obj) => {
    const item = { ...obj };
    item.name = encodeQueryString(item.name);
    item.value = encodeValue(item.value as string || '');
    return item;
  });
  if (isArray) {
    return result;
  }
  return formArrayToString(result);
}

/**
 * URL decodes a value.
 *
 * @param value Value to decode. Either string or array of strings.
 * @returns Decoded value. The same type as the input.
 */
export function decodeValue(value: string[]|string): string[]|string {
  if (Array.isArray(value)) {
    let cp = [...value];
    cp = cp.map((item) => decodeQueryString(item));
    return cp;
  }
  return decodeQueryString(value);
}

/**
 * Decode x-www-form-urlencoded data.
 *
 * @param input An input data.
 */
export function decodeUrlEncoded(input: IProperty[] | string): IProperty[] | string {
  if (!input || !input.length) {
    return input;
  }
  const isArray = Array.isArray(input);
  let typed: IProperty[];
  if (!isArray) {
    typed = createViewModel(String(input));
  } else {
    typed = input;
  }
  typed.forEach((obj) => {
    // eslint-disable-next-line no-param-reassign
    obj.name = decodeQueryString(obj.name);
    // eslint-disable-next-line no-param-reassign
    obj.value = decodeValue(obj.value as string || '');
  });
  if (isArray) {
    return typed;
  }
  return formArrayToString(typed);
}
