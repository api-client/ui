import { assert } from '@open-wc/testing';
import { IProperty, Property } from '@api-client/core/build/browser.js';
import { loadMonaco } from '../MonacoSetup.js';
import { 
  encodeUrlEncoded, 
  encodeQueryString, 
  modelItemToFormDataString, 
  decodeUrlEncoded, 
  formArrayToString,
  decodeQueryString,
} from '../../../src/elements/http/UrlEncodeUtils.js';

describe('UrlEncodeUtils', () => {
  before(async () => loadMonaco());
  
  describe('URL encoder', () => {
    it('encodes a string', () => {
      const src = 'test=encoded value&encoded name=encoded value';
      const compare = 'test=encoded+value&encoded+name=encoded+value';
      const result = encodeUrlEncoded(src);
      assert.equal(result, compare);
    });
  
    it('encodes a string with repeatable parameters', () => {
      const src = 'test=encoded value&test=other value&encoded name=encoded value';
      const compare = 'test=encoded+value&test=other+value&encoded+name=encoded+value';
      const result = encodeUrlEncoded(src);
      assert.equal(result, compare);
    });
  
    it('encodes an array', () => {
      const src: IProperty[] = [
        Property.String('test', 'encoded value').toJSON(),
        Property.String('encoded name', 'encoded value').toJSON(),
      ];
      const compare: IProperty[] = [
        Property.String('test', 'encoded+value').toJSON(),
        Property.String('encoded+name', 'encoded+value').toJSON(),
      ];
      const str = encodeUrlEncoded(src);
      assert.deepEqual(str, compare);
    });
  
    it('encodes an array with array value', () => {
      const base = Property.String().toJSON();

      const src: IProperty[] = [
        { ...base, 'name': 'test', 'value': ['encoded value', 'other value'] },
        Property.String('encoded name', 'encoded value').toJSON(),
       ];
      const compare: IProperty[] = [
        { ...base, 'name': 'test', 'value': ['encoded+value', 'other+value'] },
        Property.String('encoded+name', 'encoded+value').toJSON(),
      ];
      const result = encodeUrlEncoded(src);
      assert.deepEqual(result, compare);
    });
  
    it('encodes a query string', () => {
      const query = '/test path/?param name=param value';
      const encoded = encodeQueryString(query);
      // path will be encoded, this function encodes query params only.
      const compare = '%2Ftest+path%2F%3Fparam+name%3Dparam+value';
      assert.equal(encoded, compare);
    });
  });

  describe('URL decoder', () => {
    it('Decode encoded string', () => {
      const compare = 'test=encoded value&encoded name=encoded value';
      const src = 'test=encoded+value&encoded+name=encoded+value';
      const result = decodeUrlEncoded(src);
      assert.equal(result, compare);
    });
  
    it('Decode encoded string with repeatable parameters', () => {
      const src = 'test=encoded+value&encoded+name=encoded+value&test=other+value';
      const compare = 'test=encoded value&test=other value&encoded name=encoded value';
      const result = decodeUrlEncoded(src);
      assert.equal(result, compare);
    });
  
    it('Decodes encoded array', () => {
      const compare: IProperty[] = [
        Property.String('test', 'encoded value').toJSON(),
        Property.String('encoded name', 'encoded value').toJSON(),
      ];
      const input: IProperty[] = [
        Property.String('test', 'encoded+value').toJSON(),
        Property.String('encoded+name', 'encoded+value').toJSON(),
      ];
      const result = decodeUrlEncoded(input);
      assert.deepEqual(result, compare);
    });
  
    it('Decodes encoded array with array value', () => {
      const base = Property.String().toJSON();

      const compare: IProperty[] = [
        Property.String('test', 'encoded value').toJSON(),
        { ...base, 'name': 'encoded name', 'value': ['encoded value', 'other value'] },
      ];

      const src: IProperty[] = [
        Property.String('test', 'encoded+value').toJSON(),
        { ...base, 'name': 'encoded+name', 'value': ['encoded+value', 'other+value'] },
      ];
      const str = decodeUrlEncoded(src);
      assert.deepEqual(str, compare);
    });
  });

  describe('modelItemToFormDataString()', () => {
    it('returns undefined when item is not enabled', () => {
      const property = Property.String('', '', false).toJSON();
      const result = modelItemToFormDataString(property);
      assert.isUndefined(result);
    });

    it('returns undefined when no name and value', () => {
      const property = Property.String('', '').toJSON();
      const result = modelItemToFormDataString(property);
      assert.isUndefined(result);
    });

    it('returns undefined when no value value and no required', () => {
      const property = Property.String('test', '', false).toJSON();
      const result = modelItemToFormDataString(property);
      assert.isUndefined(result);
    });

    it('returns a string', () => {
      const property = Property.String('test', 'value', true).toJSON();
      const result = modelItemToFormDataString(property);
      assert.typeOf(result, 'string');
    });

    it('always returns a string', () => {
      const property = Property.Boolean('test', true, true).toJSON();
      const result = modelItemToFormDataString(property);
      assert.equal(result, 'test=true');
    });

    it('processes array values', () => {
      const property = Property.fromType('test', '', true).toJSON();
      property.value = ['a', 'b'];
      const result = modelItemToFormDataString(property);
      assert.equal(result, 'test=a&test=b');
    });
  });

  describe('Array to string', () => {
    it('Create payload string from an array', () => {
      const list: IProperty[] = [
        Property.String('test', 'encoded value').toJSON(),
        Property.String('encoded name', 'encoded value').toJSON(),
      ];
      const compare = 'test=encoded value&encoded name=encoded value';
      const str = formArrayToString(list);
      assert.equal(str, compare);
    });
  
    it('Empty model returns empty string', () => {
      const list: IProperty[] = [
        Property.String('', '').toJSON(),
      ];
      const str = formArrayToString(list);
      assert.equal(str, '');
    });
  
    it('Should create www-urlencoded string from array', () => {
      const list: IProperty[] = [
        Property.String('test', 'encoded value').toJSON(),
        Property.String('encoded name', 'encoded value').toJSON(),
      ];
      const compare = 'test=encoded+value&encoded+name=encoded+value';
      const str = formArrayToString(encodeUrlEncoded(list) as IProperty[]);
      assert.equal(str, compare);
    });
  
    it('Should create payload string from array with array value', () => {
      const arrayProperty = Property.String('test', '').toJSON();
      arrayProperty.value = ['encoded value', 'other value'];
      const list: IProperty[] = [
        arrayProperty, 
        Property.String('encoded name', 'encoded value').toJSON(),
      ];
      const compare = 'test=encoded value&test=other value&encoded name=encoded value';
      const str = formArrayToString(list);
      assert.equal(str, compare);
    });
  });

  describe('encodeQueryString()', () => {
    it('returns undefined when no input', () => {
      const result = encodeQueryString(undefined);
      assert.isUndefined(result);
    });
  });

  describe('decodeQueryString()', () => {
    it('returns undefined when no input', () => {
      const result = decodeQueryString(undefined);
      assert.isUndefined(result);
    });
  });
});
