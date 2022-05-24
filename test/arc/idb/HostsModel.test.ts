/* eslint-disable @typescript-eslint/ban-ts-comment */
import { assert } from '@open-wc/testing';
import { ContextStateUpdateEvent, IHostRule, HostRuleKind, ProjectMock, ContextStateDeleteEvent } from '@api-client/core/build/browser.js';
import sinon from 'sinon';
import { HostsModel } from  '../../../src/http-client/idb/HostsModel.js';
import { EventTypes } from '../../../src/events/EventTypes.js';
import { Events } from '../../../src/events/Events.js';

describe('HostsModel', () => {
  const mock = new ProjectMock();

  describe('put()', () => {
    let instance: HostsModel;

    before(async () => {
      instance = new HostsModel();
    });

    after(async () => {
      await instance.deleteModel();
    });

    it('returns the change record', async () => {
      const data = mock.hostRules.rule();
      const result = await instance.put(data);
      assert.typeOf(result, 'object');
      assert.typeOf(result.key, 'string', 'has an key');
      assert.deepEqual(result.item, data, 'has the created object');
    });

    it('stores the record in the datastore', async () => {
      const data = mock.hostRules.rule();
      await instance.put(data);
      const result = await instance.get(data.key);
      assert.deepEqual(result, data);
    });

    it('dispatches the change event', async () => {
      const data = mock.hostRules.rule();
      data.kind = HostRuleKind;
      const spy = sinon.spy();
      window.addEventListener(EventTypes.HttpClient.Model.Host.State.update, spy);
      await instance.put(data);
      window.removeEventListener(EventTypes.HttpClient.Model.Host.State.update, spy);

      assert.isTrue(spy.called, 'Event was dispatched');
      const e = spy.args[0][0] as ContextStateUpdateEvent<IHostRule>;
      const changeRecord = e.detail;
      assert.typeOf(changeRecord, 'object', 'returns an object');
      assert.equal(changeRecord.key, data.key, 'has an key');
      assert.equal(changeRecord.kind, HostRuleKind, 'has an kind');
      assert.deepEqual(changeRecord.item, data, 'has created object');
    });

    it('creates the object via the event', async () => {
      const data = mock.hostRules.rule();
      instance.listen();
      const result = await Events.HttpClient.Model.Host.update(data);
      instance.unlisten();
      assert.typeOf(result, 'object');
      assert.typeOf(result.key, 'string', 'has an key');
      assert.deepEqual(result.item, data, 'has the created object');
    });
  });

  describe('putBulk()', () => {
    let instance: HostsModel;

    before(async () => {
      instance = new HostsModel();
    });

    after(async () => {
      await instance.deleteModel();
    });

    it('returns the change record', async () => {
      const data = mock.hostRules.rules(2);
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
      const data = mock.hostRules.rules(2);
      await instance.putBulk(data);
      const result = await instance.get(data[0].key);
      assert.deepEqual(result, data[0]);
    });

    it('dispatches the change event for each inserted object', async () => {
      const data = mock.hostRules.rules(2);
      data[0].kind = HostRuleKind;
      data[1].kind = HostRuleKind;
      const spy = sinon.spy();
      window.addEventListener(EventTypes.HttpClient.Model.Host.State.update, spy);
      await instance.putBulk(data);
      window.removeEventListener(EventTypes.HttpClient.Model.Host.State.update, spy);

      assert.equal(spy.callCount, 2, 'The event was dispatched twice');
      const e1 = spy.args[0][0] as ContextStateUpdateEvent<IHostRule>;
      const e2 = spy.args[1][0] as ContextStateUpdateEvent<IHostRule>;
      
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
      const data = mock.hostRules.rules(2);
      instance.listen();
      const result = await Events.HttpClient.Model.Host.updateBulk(data);
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
    let instance: HostsModel;
    before(async () => {
      instance = new HostsModel();
      const data = mock.hostRules.rule();
      data.kind = HostRuleKind;
      await instance.put(data);
      id = data.key;
    });

    after(async () => {
      await instance.deleteModel();
    });

    it('returns the document meta', async () => {
      const result = await instance.get(id);
      assert.equal(result.kind, HostRuleKind, 'has the kind');
      assert.typeOf(result.enabled, 'boolean', 'has the enabled');
      assert.typeOf(result.from, 'string', 'has the from');
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
    let instance: HostsModel;
    before(async () => {
      instance = new HostsModel();
      const data = mock.hostRules.rule();
      data.kind = HostRuleKind;
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
      assert.equal(r1.kind, HostRuleKind, 'has the kind');
      assert.typeOf(r1.enabled, 'boolean', 'has the enabled');
      assert.typeOf(r1.from, 'string', 'has the from');
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
    let instance: HostsModel;
    let id: string;
    beforeEach(async () => {
      instance = new HostsModel();
      const data = mock.hostRules.rule();
      data.kind = HostRuleKind;
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
      await Events.HttpClient.Model.Host.delete(id);
      const item = await instance.get(id);
      assert.isUndefined(item);
    });

    it('dispatches the change event', async () => {
      const spy = sinon.spy();
      window.addEventListener(EventTypes.HttpClient.Model.Host.State.delete, spy);
      await instance.delete(id);
      window.removeEventListener(EventTypes.HttpClient.Model.Host.State.delete, spy);

      assert.isTrue(spy.called, 'Event was dispatched');
      const e = spy.args[0][0] as ContextStateDeleteEvent;
      const changeRecord = e.detail;
      assert.typeOf(changeRecord, 'object', 'returns an object');
      assert.equal(changeRecord.key, id, 'has an key');
      assert.typeOf(changeRecord.kind, 'string', 'has an kind');
    });
  });

  describe('deleteBulk()', () => {
    let instance: HostsModel;
    let id: string;
    beforeEach(async () => {
      instance = new HostsModel();
      const data = mock.hostRules.rule();
      data.kind = HostRuleKind;
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
      await Events.HttpClient.Model.Host.deleteBulk([id]);
      const item = await instance.get(id);
      assert.isUndefined(item);
    });

    it('dispatches the change event for each deleted', async () => {
      const spy = sinon.spy();
      window.addEventListener(EventTypes.HttpClient.Model.Host.State.delete, spy);
      await Events.HttpClient.Model.Host.deleteBulk([id]);
      window.removeEventListener(EventTypes.HttpClient.Model.Host.State.delete, spy);

      assert.equal(spy.callCount, 1, 'the event was dispatched');
      const e = spy.args[0][0] as ContextStateDeleteEvent;
      const changeRecord = e.detail;
      assert.typeOf(changeRecord, 'object', 'returns an object');
      assert.equal(changeRecord.key, id, 'has an key');
      assert.typeOf(changeRecord.kind, 'string', 'has an kind');
    });

    it('does not dispatch event for invalid items', async () => {
      const spy = sinon.spy();
      window.addEventListener(EventTypes.HttpClient.Model.Host.State.delete, spy);
      await Events.HttpClient.Model.Host.deleteBulk([id, 'other']);
      window.removeEventListener(EventTypes.HttpClient.Model.Host.State.delete, spy);

      assert.equal(spy.callCount, 1, 'the event was dispatched');
      const e = spy.args[0][0] as ContextStateDeleteEvent;
      const changeRecord = e.detail;
      assert.typeOf(changeRecord, 'object', 'returns an object');
      assert.equal(changeRecord.key, id, 'has an key');
      assert.typeOf(changeRecord.kind, 'string', 'has an kind');
    });
  });

  describe('list()', () => {
    describe('Without data', () => {
      let instance: HostsModel;
      beforeEach(async () => {
        instance = new HostsModel();
      });

      it('returns empty array', async () => {
        const result = await instance.list();
        assert.typeOf(result, 'object', 'result is an object');
        assert.lengthOf(result.items, 0, 'result has no items');
        assert.isUndefined(result.nextPageToken, 'nextPageToken is undefined');
      });
    });

    describe('with data', () => {
      let instance: HostsModel;

      before(async () => {
        instance = new HostsModel();
        const data = mock.hostRules.rules(30);
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
      let instance: HostsModel;
      before(async () => {
        instance = new HostsModel();
        const data = mock.hostRules.rules(30);
        await instance.putBulk(data);
        instance.listen();
      });

      after(async () => {
        instance.unlisten();
        await instance.deleteModel();
      });


      it('returns a query result for default parameters', async () => {
        const result = await Events.HttpClient.Model.Host.list(undefined);
        assert.typeOf(result, 'object', 'result is an object');
        assert.typeOf(result.nextPageToken, 'string', 'has page token');
        assert.typeOf(result.items, 'array', 'has response items');
        assert.lengthOf(result.items, instance.defaultQueryOptions.limit, 'has default limit of items');
      });

      it('respects the "limit" parameter', async () => {
        const result = await Events.HttpClient.Model.Host.list({
          limit: 5,
        });
        assert.lengthOf(result.items, 5);
      });

      it('respects the "nextPageToken" parameter', async () => {
        const result1 = await Events.HttpClient.Model.Host.list({
          limit: 10,
        });
        const result2 = await Events.HttpClient.Model.Host.list({
          nextPageToken: result1.nextPageToken,
        });
        assert.lengthOf(result2.items, 10);
        const all = await Events.HttpClient.Model.Host.list({
          limit: 20,
        });
        assert.deepEqual(all.items, result1.items.concat(result2.items), 'has both pages');
      });
    });
  });
});
