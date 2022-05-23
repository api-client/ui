/* eslint-disable @typescript-eslint/ban-ts-comment */
import { assert } from '@open-wc/testing';
import sinon from 'sinon';
import { 
  ContextChangeRecord, ContextDeleteEvent, ContextDeleteRecord, ContextListEvent, ContextListOptions,  
  ContextStateDeleteEvent, ContextStateUpdateEvent, ContextUpdateEvent, IHostRule, HostRule, 
  ContextUpdateBulkEvent, ContextDeleteBulkEvent,
} from '@api-client/core/build/browser.js';
import {
  HostsEvents,
} from '../../../../src/arc/events/models/HostsEvents.js';
import { ArcModelEventTypes } from '../../../../src/arc/events/models/ArcModelEventTypes.js';

describe('HostsEvents', () => {
  describe('update()', () => {
    const item = HostRule.fromValues('a', 'b').toJSON();

    it('dispatches the event on the default target', async () => {
      const spy = sinon.spy();
      window.addEventListener(ArcModelEventTypes.Host.update, spy);
      await HostsEvents.update(item);
      window.removeEventListener(ArcModelEventTypes.Host.update, spy);
      assert.isTrue(spy.called);
    });

    it('dispatches the event on the passed target', async () => {
      const spy = sinon.spy();
      document.body.addEventListener(ArcModelEventTypes.Host.update, spy);
      await HostsEvents.update(item, document.body);
      document.body.removeEventListener(ArcModelEventTypes.Host.update, spy);
      assert.isTrue(spy.called);
    });

    it('has the passed data', async () => {
      const spy = sinon.spy();
      window.addEventListener(ArcModelEventTypes.Host.update, spy);
      await HostsEvents.update(item);
      window.removeEventListener(ArcModelEventTypes.Host.update, spy);
      const e = spy.args[0][0] as ContextUpdateEvent<IHostRule>;
      assert.deepEqual(e.detail.item, item);
    });
  });

  describe('updateBulk()', () => {
    const items = [HostRule.fromValues('a', 'b').toJSON()];

    it('dispatches the event on the default target', async () => {
      const spy = sinon.spy();
      window.addEventListener(ArcModelEventTypes.Host.updateBulk, spy);
      await HostsEvents.updateBulk(items);
      window.removeEventListener(ArcModelEventTypes.Host.updateBulk, spy);
      assert.isTrue(spy.called);
    });

    it('dispatches the event on the passed target', async () => {
      const spy = sinon.spy();
      document.body.addEventListener(ArcModelEventTypes.Host.updateBulk, spy);
      await HostsEvents.updateBulk(items, document.body);
      document.body.removeEventListener(ArcModelEventTypes.Host.updateBulk, spy);
      assert.isTrue(spy.called);
    });

    it('has the passed data', async () => {
      const spy = sinon.spy();
      window.addEventListener(ArcModelEventTypes.Host.updateBulk, spy);
      await HostsEvents.updateBulk(items);
      window.removeEventListener(ArcModelEventTypes.Host.updateBulk, spy);
      const e = spy.args[0][0] as ContextUpdateBulkEvent<IHostRule>;
      assert.deepEqual(e.detail.items, items);
    });
  });

  describe('delete()', () => {
    const key = 'test-id';

    it('dispatches the event on the default target', async () => {
      const spy = sinon.spy();
      window.addEventListener(ArcModelEventTypes.Host.delete, spy);
      await HostsEvents.delete(key);
      window.removeEventListener(ArcModelEventTypes.Host.delete, spy);
      assert.isTrue(spy.called);
    });

    it('dispatches the event on the passed target', async () => {
      const spy = sinon.spy();
      document.body.addEventListener(ArcModelEventTypes.Host.delete, spy);
      await HostsEvents.delete(key, document.body);
      document.body.removeEventListener(ArcModelEventTypes.Host.delete, spy);
      assert.isTrue(spy.called);
    });

    it('has the passed data', async () => {
      const spy = sinon.spy();
      window.addEventListener(ArcModelEventTypes.Host.delete, spy);
      await HostsEvents.delete(key);
      window.removeEventListener(ArcModelEventTypes.Host.delete, spy);
      const e = spy.args[0][0] as ContextDeleteEvent;
      assert.equal(e.detail.key, key);
    });
  });

  describe('deleteBulk()', () => {
    const keys = ['test-id'];

    it('dispatches the event on the default target', async () => {
      const spy = sinon.spy();
      window.addEventListener(ArcModelEventTypes.Host.deleteBulk, spy);
      await HostsEvents.deleteBulk(keys);
      window.removeEventListener(ArcModelEventTypes.Host.deleteBulk, spy);
      assert.isTrue(spy.called);
    });

    it('dispatches the event on the passed target', async () => {
      const spy = sinon.spy();
      document.body.addEventListener(ArcModelEventTypes.Host.deleteBulk, spy);
      await HostsEvents.deleteBulk(keys, document.body);
      document.body.removeEventListener(ArcModelEventTypes.Host.deleteBulk, spy);
      assert.isTrue(spy.called);
    });

    it('has the passed data', async () => {
      const spy = sinon.spy();
      window.addEventListener(ArcModelEventTypes.Host.deleteBulk, spy);
      await HostsEvents.deleteBulk(keys);
      window.removeEventListener(ArcModelEventTypes.Host.deleteBulk, spy);
      const e = spy.args[0][0] as ContextDeleteBulkEvent;
      assert.equal(e.detail.keys, keys);
    });
  });

  describe('list()', () => {
    const opts: ContextListOptions = { limit: 5, nextPageToken: 'test-page-token' };

    it('dispatches the event on the default target', async () => {
      const spy = sinon.spy();
      window.addEventListener(ArcModelEventTypes.Host.list, spy);
      await HostsEvents.list(opts);
      window.removeEventListener(ArcModelEventTypes.Host.list, spy);
      assert.isTrue(spy.called);
    });

    it('dispatches the event on the passed target', async () => {
      const spy = sinon.spy();
      document.body.addEventListener(ArcModelEventTypes.Host.list, spy);
      await HostsEvents.list(opts, document.body);
      document.body.removeEventListener(ArcModelEventTypes.Host.list, spy);
      assert.isTrue(spy.called);
    });

    it('has the passed data', async () => {
      const spy = sinon.spy();
      window.addEventListener(ArcModelEventTypes.Host.list, spy);
      await HostsEvents.list(opts);
      window.removeEventListener(ArcModelEventTypes.Host.list, spy);
      const e = spy.args[0][0] as ContextListEvent<IHostRule>;
      assert.equal(e.detail.limit, opts.limit);
      assert.equal(e.detail.nextPageToken, opts.nextPageToken);
    });
  });

  describe('State.update()', () => {
    const record: ContextChangeRecord<IHostRule> = {
      key: 'id',
      item: HostRule.fromValues('a', 'b').toJSON(),
    };

    it('dispatches the event on the default target', () => {
      const spy = sinon.spy();
      window.addEventListener(ArcModelEventTypes.Host.State.update, spy);
      HostsEvents.State.update(record);
      window.removeEventListener(ArcModelEventTypes.Host.State.update, spy);
      assert.isTrue(spy.called);
    });

    it('dispatches the event on the passed target', () => {
      const spy = sinon.spy();
      document.body.addEventListener(ArcModelEventTypes.Host.State.update, spy);
      HostsEvents.State.update(record, document.body);
      document.body.removeEventListener(ArcModelEventTypes.Host.State.update, spy);
      assert.isTrue(spy.called);
    });

    it('has the passed data', () => {
      const spy = sinon.spy();
      window.addEventListener(ArcModelEventTypes.Host.State.update, spy);
      HostsEvents.State.update(record);
      window.removeEventListener(ArcModelEventTypes.Host.State.update, spy);
      const e = spy.args[0][0] as ContextStateUpdateEvent<IHostRule>;
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
      window.addEventListener(ArcModelEventTypes.Host.State.delete, spy);
      HostsEvents.State.delete(record);
      window.removeEventListener(ArcModelEventTypes.Host.State.delete, spy);
      assert.isTrue(spy.called);
    });

    it('dispatches the event on the passed target', () => {
      const spy = sinon.spy();
      document.body.addEventListener(ArcModelEventTypes.Host.State.delete, spy);
      HostsEvents.State.delete(record, document.body);
      document.body.removeEventListener(ArcModelEventTypes.Host.State.delete, spy);
      assert.isTrue(spy.called);
    });

    it('has the passed data', () => {
      const spy = sinon.spy();
      window.addEventListener(ArcModelEventTypes.Host.State.delete, spy);
      HostsEvents.State.delete(record);
      window.removeEventListener(ArcModelEventTypes.Host.State.delete, spy);
      const e = spy.args[0][0] as ContextStateDeleteEvent;
      assert.equal(e.detail.key, record.key);
    });
  });
});
