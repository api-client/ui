import { fixture, assert, oneEvent } from '@open-wc/testing';
import { IAuthorizationData } from '@api-client/core/build/browser.js';
import { normalizeUrl, computeKey, AuthDataModel } from  '../../../src/http-client/idb/AuthDataModel.js';
import { EventTypes } from '../../../src/events/EventTypes.js';
import { Events } from '../../../src/events/Events.js';

describe('AuthDataModel', () => {
  async function etFixture(): Promise<HTMLElement> {
    return fixture(`<div></div>`);
  }

  describe('normalizeUrl()', () => {
    it('returns the same URL when no QP and Hash', () => {
      const url = 'https://domain.com/path/to/resource';
      const result = normalizeUrl(url);
      assert.equal(result, url);
    });

    it('Removes query parameters', () => {
      const url = 'https://domain.com/path?a=b&c=d';
      const result = normalizeUrl(url);
      assert.equal(result, 'https://domain.com/path');
    });

    it('Removes hash', () => {
      const url = 'https://domain.com/path#test-abc';
      const result = normalizeUrl(url);
      assert.equal(result, 'https://domain.com/path');
    });

    it('Removes QP and hash', () => {
      const url = 'https://domain.com/path?a=b#test-abc';
      const result = normalizeUrl(url);
      assert.equal(result, 'https://domain.com/path');
    });

    it('Returns empty string when no argument', () => {
      const result = normalizeUrl(undefined);
      assert.equal(result, '');
    });
  });

  describe('computeKey()', () => {
    const url = 'https://domain.com/path';
    const method = 'basic';

    it('Returns key for url and method', () => {
      const result = computeKey(method, url);
      assert.equal(result, 'basic/https%3A%2F%2Fdomain.com%2Fpath');
    });

    it('Returns key for url without method', () => {
      const result = computeKey(method);
      assert.equal(result, 'basic/');
    });
  });

  describe('update()', () => {
    
    let element: AuthDataModel;
    let et: HTMLElement;
    let data: IAuthorizationData;
    
    beforeEach(async () => {
      et = await etFixture();
      element = new AuthDataModel();
      element.listen(et);
      data = {
        username: 'uname-test',
        password: 'pwd-test',
        domain: 'some',
        key: '',
      }
    });

    after(() => element.deleteModel());

    it('returns the change record', async () => {
      const url = 'https://domain.com/path';
      const method = 'ntlm';
      const record = await element.update(url, method, data);
      assert.typeOf(record, 'object', 'returns an object');
      assert.equal(record.key, computeKey(method, url), 'sets the key');
      assert.typeOf(record.item, 'object', 'sets the item');
    });

    it('creates a new object in the datastore', async () => {
      const url = 'https://api.com/';
      const method = 'basic';

      const result = await element.update(url, method, data);
      const { item } = result;
      assert.equal(item.key, computeKey(method, url), 'sets the key');
      assert.equal(item.username, data.username, 'username is set');
      assert.equal(item.password, data.password, 'password is set');
      assert.equal(item.domain, data.domain, 'username is set');
    });

    it('updates created object', async () => {
      const url = 'https://api.com/';
      const method = 'ntlm';

      const result = await element.update(url, method, data);
      
      result.item.username = 'test-2';
      const updated = await element.update(url, method, result.item);

      assert.equal(updated.item.key, computeKey(method, url), 'sets the key');
      assert.equal(updated.item.username, 'test-2', 'Name is set');
    });

    it('dispatches the change event', async () => {
      const url = 'https://api.com';
      const method = 'ntlm';

      element.update(url, method, data);
      await oneEvent(et, EventTypes.HttpClient.Model.AuthData.State.update);
    });

    it('sets the data through the event', async () => {
      const url = 'https://dot.com/';
      const method = 'ntlm';

      const result = await Events.HttpClient.Model.AuthData.update(url, method, data, et);
      assert.typeOf(result, 'object', 'has the change record');
      const { item } = result;
      assert.equal(item.key, computeKey(method, url), 'sets the key');
    });
  });

  describe('query()', () => {
    const url = 'http://domain.com/auth';
    const method = 'x-ntlm';
    let model: AuthDataModel;
    let et: HTMLElement;

    before(async () => {
      model = new AuthDataModel();
      return model.update(url, method, {
        username: 'uname-test',
        password: 'pwd-test',
        domain: 'some',
        key: '',
      });
    });

    beforeEach(async () => {
      et = await etFixture();
      model = new AuthDataModel();
      model.listen(et);
    });

    after(() => model.deleteModel());
    
    it('returns the existing data from the data store', async () => {
      const result = await model.query(url, method);
      assert.equal(result.username, 'uname-test');
      assert.equal(result.password, 'pwd-test');
      assert.equal(result.domain, 'some');
    });

    it('returns undefined if no data', async () => {
      const result = await model.query('other', method);
      assert.isUndefined(result);
    });

    it('queries for the data through the event', async () => {
      const result = await Events.HttpClient.Model.AuthData.query(url, method, et);
      assert.equal(result.username, 'uname-test');
      assert.equal(result.password, 'pwd-test');
      assert.equal(result.domain, 'some');
    });
  });
});
