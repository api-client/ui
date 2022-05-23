/* eslint-disable @typescript-eslint/ban-ts-comment */
import { assert, aTimeout } from '@open-wc/testing';
import { ContextStateUpdateEvent, IArcHttpRequest, ArcHttpRequest, ArcHttpRequestKind, ProjectMock, ContextStateDeleteEvent, ContextDeleteRecord } from '@api-client/core/build/browser.js';
import sinon from 'sinon';
import { HistoryModel } from  '../../../src/arc/idb/HistoryModel.js';
import { EventTypes } from '../../../src/events/EventTypes.js';
import { Events } from '../../../src/events/Events.js';

describe('HistoryModel', () => {
  const mock = new ProjectMock();

  describe('put()', () => {
    let instance: HistoryModel;

    before(async () => {
      instance = new HistoryModel();
    });

    after(async () => {
      await instance.deleteModel();
    });

    it('returns the change record', async () => {
      const data = mock.arc.arcRequest();
      const result = await instance.put(data);
      assert.typeOf(result, 'object');
      assert.typeOf(result.key, 'string', 'has an key');
      assert.deepEqual(result.item, data, 'has the created object');
    });

    it('stores the record in the datastore', async () => {
      const data = mock.arc.arcRequest();
      await instance.put(data);
      const result = await instance.get(data.key);
      assert.deepEqual(result, data);
    });

    it('dispatches the change event', async () => {
      const data = mock.arc.arcRequest();
      const spy = sinon.spy();
      window.addEventListener(EventTypes.HttpClient.Model.History.State.update, spy);
      await instance.put(data);
      window.removeEventListener(EventTypes.HttpClient.Model.History.State.update, spy);

      assert.isTrue(spy.called, 'Event was dispatched');
      const e = spy.args[0][0] as ContextStateUpdateEvent<IArcHttpRequest>;
      const changeRecord = e.detail;
      assert.typeOf(changeRecord, 'object', 'returns an object');
      assert.equal(changeRecord.key, data.key, 'has an key');
      assert.equal(changeRecord.kind, data.kind, 'has an kind');
      assert.deepEqual(changeRecord.item, data, 'has created object');
    });

    it('creates the object via the event', async () => {
      const data = mock.arc.arcRequest();
      instance.listen();
      const result = await Events.HttpClient.Model.History.update(data);
      instance.unlisten();
      assert.typeOf(result, 'object');
      assert.typeOf(result.key, 'string', 'has an key');
      assert.deepEqual(result.item, data, 'has the created object');
    });
  });

  describe('putBulk()', () => {
    let instance: HistoryModel;

    before(async () => {
      instance = new HistoryModel();
    });

    after(async () => {
      await instance.deleteModel();
    });

    it('returns the change record', async () => {
      const data = mock.arc.arcRequests(2);
      const result = await instance.putBulk(data);
      assert.typeOf(result, 'array');
      assert.lengthOf(result, 2);
      const [r1, r2] = result;
      assert.typeOf(r1.key, 'string', 'has the #1 key');
      assert.deepEqual(r1.item, data[0], 'has the #1 item');
      assert.typeOf(r2.key, 'string', 'has the #2 key');
      assert.deepEqual(r2.item, data[1], 'has the #2 item');
    });

    it('stores the record in the datastore', async () => {
      const data = mock.arc.arcRequests(2);
      await instance.putBulk(data);
      const result = await instance.get(data[0].key);
      assert.deepEqual(result, data[0]);
    });

    it('dispatches the change event for each inserted object', async () => {
      const data = mock.arc.arcRequests(2);
      const spy = sinon.spy();
      window.addEventListener(EventTypes.HttpClient.Model.History.State.update, spy);
      await instance.putBulk(data);
      window.removeEventListener(EventTypes.HttpClient.Model.History.State.update, spy);

      assert.equal(spy.callCount, 2, 'The event was dispatched twice');
      const e1 = spy.args[0][0] as ContextStateUpdateEvent<IArcHttpRequest>;
      const e2 = spy.args[1][0] as ContextStateUpdateEvent<IArcHttpRequest>;
      
      const changeRecord1 = e1.detail;
      assert.typeOf(changeRecord1, 'object', 'returns an object');
      assert.equal(changeRecord1.key, data[0].key, 'has an key');
      assert.equal(changeRecord1.kind, data[0].kind, 'has an kind');
      assert.deepEqual(changeRecord1.item, data[0], 'has created object');

      const changeRecord2 = e2.detail;
      assert.typeOf(changeRecord2, 'object', 'returns an object');
      assert.equal(changeRecord2.key, data[1].key, 'has an key');
      assert.equal(changeRecord2.kind, data[1].kind, 'has an kind');
      assert.deepEqual(changeRecord2.item, data[1], 'has created object');
    });

    it('creates the object via the event', async () => {
      const data = mock.arc.arcRequests(2);
      instance.listen();
      const result = await Events.HttpClient.Model.History.updateBulk(data);
      instance.unlisten();
      assert.typeOf(result, 'array');
      assert.lengthOf(result, 2);
      const [r1, r2] = result;
      assert.typeOf(r1.key, 'string', 'has the #1 key');
      assert.deepEqual(r1.item, data[0], 'has the #1 item');
      assert.typeOf(r2.key, 'string', 'has the #2 key');
      assert.deepEqual(r2.item, data[1], 'has the #2 item');
    });
  });

  describe('get()', () => {
    let id: string;
    let instance: HistoryModel;
    before(async () => {
      instance = new HistoryModel();
      const data = mock.arc.arcRequest();
      const record = await instance.put(data);
      id = record.key;
    });

    after(async () => {
      await instance.deleteModel();
    });

    it('returns the document meta', async () => {
      const result = await instance.get(id);
      assert.equal(result.kind, ArcHttpRequestKind, 'has the kind');
      assert.typeOf(result.created, 'number', 'has the created');
      assert.typeOf(result.info, 'object', 'has the info');
    });

    it('throws when no ID', async () => {
      let err: Error | undefined;
      try {
        await instance.get('');
      } catch (e) {
        err = e;
      }
      assert.equal(err.message, 'The "key" argument is missing.');
    });

    it('returns undefined when no record', async () => {
      const result = await instance.get('other');
      assert.isUndefined(result);
    });
  });

  describe('getBulk()', () => {
    let id: string;
    let instance: HistoryModel;
    before(async () => {
      instance = new HistoryModel();
      const data = mock.arc.arcRequest();
      await instance.put(data);
      id = data.key;
    });

    after(async () => {
      await instance.deleteModel();
    });

    it('returns the document meta', async () => {
      const result = await instance.getBulk([id]);
      assert.typeOf(result, 'array');
      assert.lengthOf(result, 1);
      const [r1] = result;
      assert.equal(r1.kind, ArcHttpRequestKind, 'has the kind');
      assert.typeOf(r1.created, 'number', 'has the created');
      assert.typeOf(r1.info, 'object', 'has the info');
    });

    it('throws when no keys', async () => {
      let err: Error | undefined;
      try {
        // @ts-ignore
        await instance.getBulk();
      } catch (e) {
        err = e;
      }
      assert.equal(err.message, 'The "keys" argument is missing.');
    });

    it('throws when invalid keys', async () => {
      let err: Error | undefined;
      try {
        // @ts-ignore
        await instance.getBulk('test');
      } catch (e) {
        err = e;
      }
      assert.equal(err.message, 'The "keys" argument expected to be an array.');
    });

    it('returns undefined when no record', async () => {
      const result = await instance.getBulk(['other']);
      assert.deepEqual(result, [undefined]);
    });
  });

  describe('delete()', () => {
    let instance: HistoryModel;
    let id: string;
    beforeEach(async () => {
      instance = new HistoryModel();
      const data = mock.arc.arcRequest();
      await instance.put(data);
      id = data.key;
    });

    after(async () => {
      await instance.deleteModel();
    });

    it('marks the document deleted', async () => {
      await instance.delete(id);
      const item = await instance.get(id, { deleted: true });
      assert.typeOf(item, 'object');
    });

    it('is unable to read through get()', async () => {
      await instance.delete(id);
      const item = await instance.get(id);
      assert.isUndefined(item);
    });

    it('is unable to read through list()', async () => {
      await instance.delete(id);
      const all = await instance.list();
      assert.lengthOf(all.items, 0);
    });

    it('throws when no key', async () => {
      let err: Error | undefined;
      try {
        await instance.delete(undefined);
      } catch (e) {
        err = e;
      }
      assert.equal(err.message, 'The "key" argument is missing.');
    });

    it('deletes the entity through the event', async () => {
      instance.listen();
      await Events.HttpClient.Model.History.delete(id);
      const item = await instance.get(id);
      assert.isUndefined(item);
    });

    it('dispatches the change event', async () => {
      const spy = sinon.spy();
      window.addEventListener(EventTypes.HttpClient.Model.History.State.delete, spy);
      await instance.delete(id);
      window.removeEventListener(EventTypes.HttpClient.Model.History.State.delete, spy);

      assert.isTrue(spy.called, 'Event was dispatched');
      const e = spy.args[0][0] as ContextStateDeleteEvent;
      const changeRecord = e.detail;
      assert.typeOf(changeRecord, 'object', 'returns an object');
      assert.equal(changeRecord.key, id, 'has an key');
      assert.typeOf(changeRecord.kind, 'string', 'has an kind');
    });
  });

  describe('deleteBulk()', () => {
    let instance: HistoryModel;
    let id: string;
    beforeEach(async () => {
      instance = new HistoryModel();
      const data = mock.arc.arcRequest();
      await instance.put(data);
      id = data.key;
    });

    after(async () => {
      await instance.deleteModel();
    });

    it('marks documents deleted', async () => {
      await instance.deleteBulk([id]);
      const item = await instance.get(id, { deleted: true });
      assert.typeOf(item, 'object');
    });

    it('returns the change record', async () => {
      const result = await instance.deleteBulk([id]);
      assert.typeOf(result, 'array');
      assert.lengthOf(result, 1);
      assert.equal(result[0].key, id);
      assert.typeOf(result[0].kind, 'string');
    });

    it('puts "undefined" when item not found', async () => {
      const result = await instance.deleteBulk([id, 'other']);
      assert.typeOf(result, 'array');
      assert.lengthOf(result, 2);
      assert.isUndefined(result[1]);
    });

    it('throws when no key', async () => {
      let err: Error | undefined;
      try {
        await instance.deleteBulk(undefined);
      } catch (e) {
        err = e;
      }
      assert.equal(err.message, 'The "keys" argument is missing.');
    });

    it('throws when invalid keys', async () => {
      let err: Error | undefined;
      try {
        // @ts-ignore
        await instance.deleteBulk('test');
      } catch (e) {
        err = e;
      }
      assert.equal(err.message, 'The "keys" argument expected to be an array.');
    });

    it('deletes the entity through the event', async () => {
      instance.listen();
      await Events.HttpClient.Model.History.deleteBulk([id]);
      const item = await instance.get(id);
      assert.isUndefined(item);
    });

    it('dispatches the change event for each deleted', async () => {
      const spy = sinon.spy();
      window.addEventListener(EventTypes.HttpClient.Model.History.State.delete, spy);
      await Events.HttpClient.Model.History.deleteBulk([id]);
      window.removeEventListener(EventTypes.HttpClient.Model.History.State.delete, spy);

      assert.equal(spy.callCount, 1, 'the event was dispatched');
      const e = spy.args[0][0] as ContextStateDeleteEvent;
      const changeRecord = e.detail;
      assert.typeOf(changeRecord, 'object', 'returns an object');
      assert.equal(changeRecord.key, id, 'has an key');
      assert.typeOf(changeRecord.kind, 'string', 'has an kind');
    });

    it('does not dispatch event for invalid items', async () => {
      const spy = sinon.spy();
      window.addEventListener(EventTypes.HttpClient.Model.History.State.delete, spy);
      await Events.HttpClient.Model.History.deleteBulk([id, 'other']);
      window.removeEventListener(EventTypes.HttpClient.Model.History.State.delete, spy);

      assert.equal(spy.callCount, 1, 'the event was dispatched');
      const e = spy.args[0][0] as ContextStateDeleteEvent;
      const changeRecord = e.detail;
      assert.typeOf(changeRecord, 'object', 'returns an object');
      assert.equal(changeRecord.key, id, 'has an key');
      assert.typeOf(changeRecord.kind, 'string', 'has an kind');
    });
  });

  describe('undeleteBulk()', () => {
    let instance: HistoryModel;
    let id: string;
    let records: ContextDeleteRecord[];
    beforeEach(async () => {
      instance = new HistoryModel();
      const data = mock.arc.arcRequest();
      await instance.put(data);
      id = data.key;
      records = await instance.deleteBulk([id]);
    });

    after(async () => {
      await instance.deleteModel();
    });

    it('marks documents not deleted', async () => {
      await instance.undeleteBulk(records);
      const item = await instance.get(id);
      assert.typeOf(item, 'object');
    });

    it('returns the change record', async () => {
      const result = await instance.undeleteBulk(records);
      assert.typeOf(result, 'array');
      assert.lengthOf(result, 1);
      assert.equal(result[0].key, id);
      assert.typeOf(result[0].kind, 'string');
    });

    it('puts "undefined" when item not found', async () => {
      const result = await instance.undeleteBulk([ ...records, { key: 'other' } ]);
      assert.typeOf(result, 'array');
      assert.lengthOf(result, 2);
      assert.isUndefined(result[1]);
    });

    it('throws when no key', async () => {
      let err: Error | undefined;
      try {
        await instance.undeleteBulk(undefined);
      } catch (e) {
        err = e;
      }
      assert.equal(err.message, 'The "records" argument is missing.');
    });

    it('throws when invalid keys', async () => {
      let err: Error | undefined;
      try {
        // @ts-ignore
        await instance.undeleteBulk('test');
      } catch (e) {
        err = e;
      }
      assert.equal(err.message, 'The "records" argument expected to be an array.');
    });

    it('restores the entity through the event', async () => {
      instance.listen();
      await Events.HttpClient.Model.History.undeleteBulk(records);
      instance.unlisten();
      const item = await instance.get(id);
      assert.typeOf(item, 'object');
    });

    it('dispatches the change event for each deleted', async () => {
      const spy = sinon.spy();
      window.addEventListener(EventTypes.HttpClient.Model.History.State.update, spy);
      await Events.HttpClient.Model.History.undeleteBulk(records);
      window.removeEventListener(EventTypes.HttpClient.Model.History.State.update, spy);

      assert.equal(spy.callCount, 1, 'the event was dispatched');
      const e = spy.args[0][0] as ContextStateUpdateEvent<IArcHttpRequest>;
      const changeRecord = e.detail;
      assert.typeOf(changeRecord, 'object', 'returns an object');
      assert.equal(changeRecord.key, id, 'has an key');
      assert.typeOf(changeRecord.kind, 'string', 'has an kind');
      assert.typeOf(changeRecord.item, 'object', 'has the restored object');
    });

    it('does not dispatch event for invalid items', async () => {
      const spy = sinon.spy();
      window.addEventListener(EventTypes.HttpClient.Model.History.State.update, spy);
      await instance.undeleteBulk([ ...records, { key: 'other' } ]);
      window.removeEventListener(EventTypes.HttpClient.Model.History.State.update, spy);

      assert.equal(spy.callCount, 1, 'the event was dispatched');
    });
  });

  describe('list()', () => {
    describe('Without data', () => {
      let instance: HistoryModel;
      beforeEach(async () => {
        instance = new HistoryModel();
      });

      it('returns empty array', async () => {
        const result = await instance.list();
        assert.typeOf(result, 'object', 'result is an object');
        assert.lengthOf(result.items, 0, 'result has no items');
        assert.isUndefined(result.nextPageToken, 'nextPageToken is undefined');
      });
    });

    describe('with data', () => {
      let instance: HistoryModel;

      before(async () => {
        instance = new HistoryModel();
        const data = mock.arc.arcRequests(30);
        await instance.putBulk(data);
      });

      after(async () => {
        await instance.deleteModel();
      });

      it('returns a query result for default parameters', async () => {
        const result = await instance.list();
        assert.typeOf(result, 'object', 'result is an object');
        assert.typeOf(result.nextPageToken, 'string', 'has page token');
        assert.typeOf(result.items, 'array', 'has response items');
        assert.lengthOf(result.items, instance.defaultQueryOptions.limit, 'has default limit of items');
      });

      it('respects the "limit" parameter', async () => {
        const result = await instance.list({
          limit: 5,
        });
        assert.lengthOf(result.items, 5);
      });

      it('respects the "nextPageToken" parameter', async () => {
        const result1 = await instance.list({
          limit: 10,
        });
        const result2 = await instance.list({
          nextPageToken: result1.nextPageToken,
        });
        assert.lengthOf(result2.items, 10);
        const all = await instance.list({
          limit: 20,
        });
        assert.deepEqual(all.items, result1.items.concat(result2.items), 'has both pages');
      });

      it('does not set "nextPageToken" when no more results', async () => {
        const result1 = await instance.list({
          limit: 40,
        });
        const result2 = await instance.list({
          nextPageToken: result1.nextPageToken,
        });
        assert.isUndefined(result2.nextPageToken);
      });
    });

    describe('Events', () => {
      let instance: HistoryModel;
      before(async () => {
        instance = new HistoryModel();
        const data = mock.arc.arcRequests(30);
        await instance.putBulk(data);
        instance.listen();
      });

      after(async () => {
        instance.unlisten();
        await instance.deleteModel();
      });


      it('returns a query result for default parameters', async () => {
        const result = await Events.HttpClient.Model.History.list(undefined);
        assert.typeOf(result, 'object', 'result is an object');
        assert.typeOf(result.nextPageToken, 'string', 'has page token');
        assert.typeOf(result.items, 'array', 'has response items');
        assert.lengthOf(result.items, instance.defaultQueryOptions.limit, 'has default limit of items');
      });

      it('respects the "limit" parameter', async () => {
        const result = await Events.HttpClient.Model.History.list({
          limit: 5,
        });
        assert.lengthOf(result.items, 5);
      });

      it('respects the "nextPageToken" parameter', async () => {
        const result1 = await Events.HttpClient.Model.History.list({
          limit: 10,
        });
        const result2 = await Events.HttpClient.Model.History.list({
          nextPageToken: result1.nextPageToken,
        });
        assert.lengthOf(result2.items, 10);
        const all = await Events.HttpClient.Model.History.list({
          limit: 20,
        });
        assert.deepEqual(all.items, result1.items.concat(result2.items), 'has both pages');
      });
    });
  });

  describe('query()', () => {
    let instance: HistoryModel;
    let r1: IArcHttpRequest;
    let r2: IArcHttpRequest;
    let r3: IArcHttpRequest;
    let r4: IArcHttpRequest;
    let r5: IArcHttpRequest;

    before(async () => {
      instance = new HistoryModel();
      r1 = ArcHttpRequest.fromUrl('http://api.com/p1').toJSON();
      r1.info.name = 'Authorize user';
      await aTimeout(0); // making sure the "created" time is different.
      r2 = ArcHttpRequest.fromUrl('http://dot.com/d1').toJSON();
      r2.info.name = undefined;
      r2.info.description = 'This is a very important request';
      await aTimeout(0);
      r3 = ArcHttpRequest.fromUrl('http://sub.api.com').toJSON();
      r3.info.name = mock.lorem.words(2);
      await aTimeout(0);
      r4 = ArcHttpRequest.fromUrl('http://api.com/index?a=b&token=123456qwerty').toJSON();
      r4.info.name = mock.lorem.words(2);
      await aTimeout(0);
      r5 = ArcHttpRequest.fromUrl('http://random.eu/').toJSON();
      r5.info.name = mock.lorem.words(2);
      r5.expects.headers = `content-type: application/json\nauthorization: bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2V4YW1wbGUuYXV0aDAuY29tLyIsImF1ZCI6Imh0dHBzOi8vYXBpLmV4YW1wbGUuY29tL2NhbGFuZGFyL3YxLyIsInN1YiI6InVzcl8xMjMiLCJpYXQiOjE0NTg3ODU3OTYsImV4cCI6MTQ1ODg3MjE5Nn0.CA7eaHjIHz5NxeIJoFK9krqaeZrPLwmMmgI_XiQiIkQ`;
      await instance.putBulk([r1, r2, r3, r4, r5]);
    });

    after(async () => {
      await instance.deleteModel();
    });

    it('queries for the full URL', async () => {
      const result = await instance.query({ term: r4.expects.url });
      assert.deepEqual(result, [r4]);
    });

    it('queries for a partial URL', async () => {
      const result = await instance.query({ term: 'api.com' });
      assert.lengthOf(result, 3, 'has all matches');
      assert.isTrue(result.some(i => i.key === r1.key), 'has r1');
      assert.isTrue(result.some(i => i.key === r3.key), 'has r3');
      assert.isTrue(result.some(i => i.key === r4.key), 'has r4');
    });

    it('queries for a query param', async () => {
      const result = await instance.query({ term: '123456qwe' });
      assert.lengthOf(result, 1, 'has all matches');
      assert.deepEqual(result, [r4]);
    });

    it('queries for a name', async () => {
      const result = await instance.query({ term: 'authorize user' });
      assert.lengthOf(result, 1, 'has all matches');
      assert.deepEqual(result, [r1]);
    });

    it('queries for a description', async () => {
      const result = await instance.query({ term: 'very important' });
      assert.lengthOf(result, 1, 'has all matches');
      assert.deepEqual(result, [r2]);
    });

    it('queries for a header value', async () => {
      const result = await instance.query({ term: 'bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' });
      assert.lengthOf(result, 1, 'has all matches');
      assert.deepEqual(result, [r5]);
    });

    it('queries via the event', async () => {
      instance.listen();
      const result = await Events.HttpClient.Model.History.query({ term: '123456qwe' });
      instance.unlisten();
      assert.lengthOf(result, 1, 'has all matches');
      assert.deepEqual(result, [r4]);
    });
  });
});
