/* eslint-disable @typescript-eslint/ban-ts-comment */
import { assert } from '@open-wc/testing';
import sinon from 'sinon';
import { 
  ContextChangeRecord, ContextDeleteEvent, ContextDeleteRecord, ContextListEvent, ContextListOptions, ContextReadEvent, 
  ContextStateDeleteEvent, ContextStateUpdateEvent, ContextUpdateEvent, IArcHttpRequest, ArcHttpRequest, ContextReadBulkEvent, ContextUpdateBulkEvent, ContextDeleteBulkEvent, ContextRestoreEvent, IQueryDetail, ContextQueryEvent
} from '@api-client/core/build/browser.js';
import {
  HistoryEvents,
} from '../../../../src/arc/events/models/HistoryEvents.js';
import { ArcModelEventTypes } from '../../../../src/arc/events/models/ArcModelEventTypes.js';

describe('HistoryEvents', () => {
  describe('read()', () => {
    const key = 'test-id';

    it('dispatches the event on the default target', async () => {
      const spy = sinon.spy();
      window.addEventListener(ArcModelEventTypes.History.read, spy);
      await HistoryEvents.read(key);
      window.removeEventListener(ArcModelEventTypes.History.read, spy);
      assert.isTrue(spy.called);
    });

    it('dispatches the event on the passed target', async () => {
      const spy = sinon.spy();
      document.body.addEventListener(ArcModelEventTypes.History.read, spy);
      await HistoryEvents.read(key, document.body);
      document.body.removeEventListener(ArcModelEventTypes.History.read, spy);
      assert.isTrue(spy.called);
    });

    it('has the passed data', async () => {
      const spy = sinon.spy();
      window.addEventListener(ArcModelEventTypes.History.read, spy);
      await HistoryEvents.read(key);
      window.removeEventListener(ArcModelEventTypes.History.read, spy);
      const e = spy.args[0][0] as ContextReadEvent<IArcHttpRequest>;
      assert.equal(e.detail.key, key);
    });
  });

  describe('readBulk()', () => {
    const keys = ['test-id'];

    it('dispatches the event on the default target', async () => {
      const spy = sinon.spy();
      window.addEventListener(ArcModelEventTypes.History.readBulk, spy);
      await HistoryEvents.readBulk(keys);
      window.removeEventListener(ArcModelEventTypes.History.readBulk, spy);
      assert.isTrue(spy.called);
    });

    it('dispatches the event on the passed target', async () => {
      const spy = sinon.spy();
      document.body.addEventListener(ArcModelEventTypes.History.readBulk, spy);
      await HistoryEvents.readBulk(keys, document.body);
      document.body.removeEventListener(ArcModelEventTypes.History.readBulk, spy);
      assert.isTrue(spy.called);
    });

    it('has the passed data', async () => {
      const spy = sinon.spy();
      window.addEventListener(ArcModelEventTypes.History.readBulk, spy);
      await HistoryEvents.readBulk(keys);
      window.removeEventListener(ArcModelEventTypes.History.readBulk, spy);
      const e = spy.args[0][0] as ContextReadBulkEvent<IArcHttpRequest>;
      assert.equal(e.detail.keys, keys);
    });
  });

  describe('update()', () => {
    const item = ArcHttpRequest.fromName('r1').toJSON();

    it('dispatches the event on the default target', async () => {
      const spy = sinon.spy();
      window.addEventListener(ArcModelEventTypes.History.update, spy);
      await HistoryEvents.update(item);
      window.removeEventListener(ArcModelEventTypes.History.update, spy);
      assert.isTrue(spy.called);
    });

    it('dispatches the event on the passed target', async () => {
      const spy = sinon.spy();
      document.body.addEventListener(ArcModelEventTypes.History.update, spy);
      await HistoryEvents.update(item, document.body);
      document.body.removeEventListener(ArcModelEventTypes.History.update, spy);
      assert.isTrue(spy.called);
    });

    it('has the passed data', async () => {
      const spy = sinon.spy();
      window.addEventListener(ArcModelEventTypes.History.update, spy);
      await HistoryEvents.update(item);
      window.removeEventListener(ArcModelEventTypes.History.update, spy);
      const e = spy.args[0][0] as ContextUpdateEvent<IArcHttpRequest>;
      assert.deepEqual(e.detail.item, item);
    });
  });

  describe('updateBulk()', () => {
    const items = [ArcHttpRequest.fromName('r1').toJSON()];

    it('dispatches the event on the default target', async () => {
      const spy = sinon.spy();
      window.addEventListener(ArcModelEventTypes.History.updateBulk, spy);
      await HistoryEvents.updateBulk(items);
      window.removeEventListener(ArcModelEventTypes.History.updateBulk, spy);
      assert.isTrue(spy.called);
    });

    it('dispatches the event on the passed target', async () => {
      const spy = sinon.spy();
      document.body.addEventListener(ArcModelEventTypes.History.updateBulk, spy);
      await HistoryEvents.updateBulk(items, document.body);
      document.body.removeEventListener(ArcModelEventTypes.History.updateBulk, spy);
      assert.isTrue(spy.called);
    });

    it('has the passed data', async () => {
      const spy = sinon.spy();
      window.addEventListener(ArcModelEventTypes.History.updateBulk, spy);
      await HistoryEvents.updateBulk(items);
      window.removeEventListener(ArcModelEventTypes.History.updateBulk, spy);
      const e = spy.args[0][0] as ContextUpdateBulkEvent<IArcHttpRequest>;
      assert.deepEqual(e.detail.items, items);
    });
  });

  describe('delete()', () => {
    const key = 'test-id';

    it('dispatches the event on the default target', async () => {
      const spy = sinon.spy();
      window.addEventListener(ArcModelEventTypes.History.delete, spy);
      await HistoryEvents.delete(key);
      window.removeEventListener(ArcModelEventTypes.History.delete, spy);
      assert.isTrue(spy.called);
    });

    it('dispatches the event on the passed target', async () => {
      const spy = sinon.spy();
      document.body.addEventListener(ArcModelEventTypes.History.delete, spy);
      await HistoryEvents.delete(key, document.body);
      document.body.removeEventListener(ArcModelEventTypes.History.delete, spy);
      assert.isTrue(spy.called);
    });

    it('has the passed data', async () => {
      const spy = sinon.spy();
      window.addEventListener(ArcModelEventTypes.History.delete, spy);
      await HistoryEvents.delete(key);
      window.removeEventListener(ArcModelEventTypes.History.delete, spy);
      const e = spy.args[0][0] as ContextDeleteEvent;
      assert.equal(e.detail.key, key);
    });
  });

  describe('deleteBulk()', () => {
    const keys = ['test-id'];

    it('dispatches the event on the default target', async () => {
      const spy = sinon.spy();
      window.addEventListener(ArcModelEventTypes.History.deleteBulk, spy);
      await HistoryEvents.deleteBulk(keys);
      window.removeEventListener(ArcModelEventTypes.History.deleteBulk, spy);
      assert.isTrue(spy.called);
    });

    it('dispatches the event on the passed target', async () => {
      const spy = sinon.spy();
      document.body.addEventListener(ArcModelEventTypes.History.deleteBulk, spy);
      await HistoryEvents.deleteBulk(keys, document.body);
      document.body.removeEventListener(ArcModelEventTypes.History.deleteBulk, spy);
      assert.isTrue(spy.called);
    });

    it('has the passed data', async () => {
      const spy = sinon.spy();
      window.addEventListener(ArcModelEventTypes.History.deleteBulk, spy);
      await HistoryEvents.deleteBulk(keys);
      window.removeEventListener(ArcModelEventTypes.History.deleteBulk, spy);
      const e = spy.args[0][0] as ContextDeleteBulkEvent;
      assert.equal(e.detail.keys, keys);
    });
  });

  describe('undeleteBulk()', () => {
    const records = [{ key: 'test-id' }];

    it('dispatches the event on the default target', async () => {
      const spy = sinon.spy();
      window.addEventListener(ArcModelEventTypes.History.undeleteBulk, spy);
      await HistoryEvents.undeleteBulk(records);
      window.removeEventListener(ArcModelEventTypes.History.undeleteBulk, spy);
      assert.isTrue(spy.called);
    });

    it('dispatches the event on the passed target', async () => {
      const spy = sinon.spy();
      document.body.addEventListener(ArcModelEventTypes.History.undeleteBulk, spy);
      await HistoryEvents.undeleteBulk(records, document.body);
      document.body.removeEventListener(ArcModelEventTypes.History.undeleteBulk, spy);
      assert.isTrue(spy.called);
    });

    it('has the passed data', async () => {
      const spy = sinon.spy();
      window.addEventListener(ArcModelEventTypes.History.undeleteBulk, spy);
      await HistoryEvents.undeleteBulk(records);
      window.removeEventListener(ArcModelEventTypes.History.undeleteBulk, spy);
      const e = spy.args[0][0] as ContextRestoreEvent<IArcHttpRequest>;
      assert.equal(e.detail.records, records);
    });
  });

  describe('list()', () => {
    const opts: ContextListOptions = { limit: 5, nextPageToken: 'test-page-token' };

    it('dispatches the event on the default target', async () => {
      const spy = sinon.spy();
      window.addEventListener(ArcModelEventTypes.History.list, spy);
      await HistoryEvents.list(opts);
      window.removeEventListener(ArcModelEventTypes.History.list, spy);
      assert.isTrue(spy.called);
    });

    it('dispatches the event on the passed target', async () => {
      const spy = sinon.spy();
      document.body.addEventListener(ArcModelEventTypes.History.list, spy);
      await HistoryEvents.list(opts, document.body);
      document.body.removeEventListener(ArcModelEventTypes.History.list, spy);
      assert.isTrue(spy.called);
    });

    it('has the passed data', async () => {
      const spy = sinon.spy();
      window.addEventListener(ArcModelEventTypes.History.list, spy);
      await HistoryEvents.list(opts);
      window.removeEventListener(ArcModelEventTypes.History.list, spy);
      const e = spy.args[0][0] as ContextListEvent<IArcHttpRequest>;
      assert.equal(e.detail.limit, opts.limit);
      assert.equal(e.detail.nextPageToken, opts.nextPageToken);
    });
  });

  describe('query()', () => {
    const opts: IQueryDetail = { term: 'test' };

    it('dispatches the event on the default target', async () => {
      const spy = sinon.spy();
      window.addEventListener(ArcModelEventTypes.History.query, spy);
      await HistoryEvents.query(opts);
      window.removeEventListener(ArcModelEventTypes.History.query, spy);
      assert.isTrue(spy.called);
    });

    it('dispatches the event on the passed target', async () => {
      const spy = sinon.spy();
      document.body.addEventListener(ArcModelEventTypes.History.query, spy);
      await HistoryEvents.query(opts, document.body);
      document.body.removeEventListener(ArcModelEventTypes.History.query, spy);
      assert.isTrue(spy.called);
    });

    it('has the passed data', async () => {
      const spy = sinon.spy();
      window.addEventListener(ArcModelEventTypes.History.query, spy);
      await HistoryEvents.query(opts);
      window.removeEventListener(ArcModelEventTypes.History.query, spy);
      const e = spy.args[0][0] as ContextQueryEvent<IArcHttpRequest>;
      assert.equal(e.detail.term, opts.term);
    });
  });

  describe('State.update()', () => {
    const record: ContextChangeRecord<IArcHttpRequest> = {
      key: 'id',
      item: ArcHttpRequest.fromName('r1').toJSON(),
    };

    it('dispatches the event on the default target', () => {
      const spy = sinon.spy();
      window.addEventListener(ArcModelEventTypes.History.State.update, spy);
      HistoryEvents.State.update(record);
      window.removeEventListener(ArcModelEventTypes.History.State.update, spy);
      assert.isTrue(spy.called);
    });

    it('dispatches the event on the passed target', () => {
      const spy = sinon.spy();
      document.body.addEventListener(ArcModelEventTypes.History.State.update, spy);
      HistoryEvents.State.update(record, document.body);
      document.body.removeEventListener(ArcModelEventTypes.History.State.update, spy);
      assert.isTrue(spy.called);
    });

    it('has the passed data', () => {
      const spy = sinon.spy();
      window.addEventListener(ArcModelEventTypes.History.State.update, spy);
      HistoryEvents.State.update(record);
      window.removeEventListener(ArcModelEventTypes.History.State.update, spy);
      const e = spy.args[0][0] as ContextStateUpdateEvent<IArcHttpRequest>;
      assert.deepEqual(e.detail.key, record.key);
      assert.deepEqual(e.detail.item, record.item);
    });
  });

  describe('State.delete()', () => {
    const record: ContextDeleteRecord = {
      key: 'test-id',
    };

    it('dispatches the event on the default target', () => {
      const spy = sinon.spy();
      window.addEventListener(ArcModelEventTypes.History.State.delete, spy);
      HistoryEvents.State.delete(record);
      window.removeEventListener(ArcModelEventTypes.History.State.delete, spy);
      assert.isTrue(spy.called);
    });

    it('dispatches the event on the passed target', () => {
      const spy = sinon.spy();
      document.body.addEventListener(ArcModelEventTypes.History.State.delete, spy);
      HistoryEvents.State.delete(record, document.body);
      document.body.removeEventListener(ArcModelEventTypes.History.State.delete, spy);
      assert.isTrue(spy.called);
    });

    it('has the passed data', () => {
      const spy = sinon.spy();
      window.addEventListener(ArcModelEventTypes.History.State.delete, spy);
      HistoryEvents.State.delete(record);
      window.removeEventListener(ArcModelEventTypes.History.State.delete, spy);
      const e = spy.args[0][0] as ContextStateDeleteEvent;
      assert.equal(e.detail.key, record.key);
    });
  });
});
