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
} from '../../../../src/events/http-client/models/HostsEvents.js';
import { EventTypes } from '../../../../src/events/EventTypes.js';

describe('HostsEvents', () => {
  describe('update()', () => {
    const item = HostRule.fromValues('a', 'b').toJSON();

    it('dispatches the event on the default target', async () => {
      const spy = sinon.spy();
      window.addEventListener(EventTypes.HttpClient.Model.Host.update, spy);
      await HostsEvents.update(item);
      window.removeEventListener(EventTypes.HttpClient.Model.Host.update, spy);
      assert.isTrue(spy.called);
    });

    it('dispatches the event on the passed target', async () => {
      const spy = sinon.spy();
      document.body.addEventListener(EventTypes.HttpClient.Model.Host.update, spy);
      await HostsEvents.update(item, document.body);
      document.body.removeEventListener(EventTypes.HttpClient.Model.Host.update, spy);
      assert.isTrue(spy.called);
    });

    it('has the passed data', async () => {
      const spy = sinon.spy();
      window.addEventListener(EventTypes.HttpClient.Model.Host.update, spy);
      await HostsEvents.update(item);
      window.removeEventListener(EventTypes.HttpClient.Model.Host.update, spy);
      const e = spy.args[0][0] as ContextUpdateEvent<IHostRule>;
      assert.deepEqual(e.detail.item, item);
    });
  });

  describe('updateBulk()', () => {
    const items = [HostRule.fromValues('a', 'b').toJSON()];

    it('dispatches the event on the default target', async () => {
      const spy = sinon.spy();
      window.addEventListener(EventTypes.HttpClient.Model.Host.updateBulk, spy);
      await HostsEvents.updateBulk(items);
      window.removeEventListener(EventTypes.HttpClient.Model.Host.updateBulk, spy);
      assert.isTrue(spy.called);
    });

    it('dispatches the event on the passed target', async () => {
      const spy = sinon.spy();
      document.body.addEventListener(EventTypes.HttpClient.Model.Host.updateBulk, spy);
      await HostsEvents.updateBulk(items, document.body);
      document.body.removeEventListener(EventTypes.HttpClient.Model.Host.updateBulk, spy);
      assert.isTrue(spy.called);
    });

    it('has the passed data', async () => {
      const spy = sinon.spy();
      window.addEventListener(EventTypes.HttpClient.Model.Host.updateBulk, spy);
      await HostsEvents.updateBulk(items);
      window.removeEventListener(EventTypes.HttpClient.Model.Host.updateBulk, spy);
      const e = spy.args[0][0] as ContextUpdateBulkEvent<IHostRule>;
      assert.deepEqual(e.detail.items, items);
    });
  });

  describe('delete()', () => {
    const key = 'test-id';

    it('dispatches the event on the default target', async () => {
      const spy = sinon.spy();
      window.addEventListener(EventTypes.HttpClient.Model.Host.delete, spy);
      await HostsEvents.delete(key);
      window.removeEventListener(EventTypes.HttpClient.Model.Host.delete, spy);
      assert.isTrue(spy.called);
    });

    it('dispatches the event on the passed target', async () => {
      const spy = sinon.spy();
      document.body.addEventListener(EventTypes.HttpClient.Model.Host.delete, spy);
      await HostsEvents.delete(key, document.body);
      document.body.removeEventListener(EventTypes.HttpClient.Model.Host.delete, spy);
      assert.isTrue(spy.called);
    });

    it('has the passed data', async () => {
      const spy = sinon.spy();
      window.addEventListener(EventTypes.HttpClient.Model.Host.delete, spy);
      await HostsEvents.delete(key);
      window.removeEventListener(EventTypes.HttpClient.Model.Host.delete, spy);
      const e = spy.args[0][0] as ContextDeleteEvent;
      assert.equal(e.detail.key, key);
    });
  });

  describe('deleteBulk()', () => {
    const keys = ['test-id'];

    it('dispatches the event on the default target', async () => {
      const spy = sinon.spy();
      window.addEventListener(EventTypes.HttpClient.Model.Host.deleteBulk, spy);
      await HostsEvents.deleteBulk(keys);
      window.removeEventListener(EventTypes.HttpClient.Model.Host.deleteBulk, spy);
      assert.isTrue(spy.called);
    });

    it('dispatches the event on the passed target', async () => {
      const spy = sinon.spy();
      document.body.addEventListener(EventTypes.HttpClient.Model.Host.deleteBulk, spy);
      await HostsEvents.deleteBulk(keys, document.body);
      document.body.removeEventListener(EventTypes.HttpClient.Model.Host.deleteBulk, spy);
      assert.isTrue(spy.called);
    });

    it('has the passed data', async () => {
      const spy = sinon.spy();
      window.addEventListener(EventTypes.HttpClient.Model.Host.deleteBulk, spy);
      await HostsEvents.deleteBulk(keys);
      window.removeEventListener(EventTypes.HttpClient.Model.Host.deleteBulk, spy);
      const e = spy.args[0][0] as ContextDeleteBulkEvent;
      assert.equal(e.detail.keys, keys);
    });
  });

  describe('list()', () => {
    const opts: ContextListOptions = { limit: 5, nextPageToken: 'test-page-token' };

    it('dispatches the event on the default target', async () => {
      const spy = sinon.spy();
      window.addEventListener(EventTypes.HttpClient.Model.Host.list, spy);
      await HostsEvents.list(opts);
      window.removeEventListener(EventTypes.HttpClient.Model.Host.list, spy);
      assert.isTrue(spy.called);
    });

    it('dispatches the event on the passed target', async () => {
      const spy = sinon.spy();
      document.body.addEventListener(EventTypes.HttpClient.Model.Host.list, spy);
      await HostsEvents.list(opts, document.body);
      document.body.removeEventListener(EventTypes.HttpClient.Model.Host.list, spy);
      assert.isTrue(spy.called);
    });

    it('has the passed data', async () => {
      const spy = sinon.spy();
      window.addEventListener(EventTypes.HttpClient.Model.Host.list, spy);
      await HostsEvents.list(opts);
      window.removeEventListener(EventTypes.HttpClient.Model.Host.list, spy);
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
      window.addEventListener(EventTypes.HttpClient.Model.Host.State.update, spy);
      HostsEvents.State.update(record);
      window.removeEventListener(EventTypes.HttpClient.Model.Host.State.update, spy);
      assert.isTrue(spy.called);
    });

    it('dispatches the event on the passed target', () => {
      const spy = sinon.spy();
      document.body.addEventListener(EventTypes.HttpClient.Model.Host.State.update, spy);
      HostsEvents.State.update(record, document.body);
      document.body.removeEventListener(EventTypes.HttpClient.Model.Host.State.update, spy);
      assert.isTrue(spy.called);
    });

    it('has the passed data', () => {
      const spy = sinon.spy();
      window.addEventListener(EventTypes.HttpClient.Model.Host.State.update, spy);
      HostsEvents.State.update(record);
      window.removeEventListener(EventTypes.HttpClient.Model.Host.State.update, spy);
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
      window.addEventListener(EventTypes.HttpClient.Model.Host.State.delete, spy);
      HostsEvents.State.delete(record);
      window.removeEventListener(EventTypes.HttpClient.Model.Host.State.delete, spy);
      assert.isTrue(spy.called);
    });

    it('dispatches the event on the passed target', () => {
      const spy = sinon.spy();
      document.body.addEventListener(EventTypes.HttpClient.Model.Host.State.delete, spy);
      HostsEvents.State.delete(record, document.body);
      document.body.removeEventListener(EventTypes.HttpClient.Model.Host.State.delete, spy);
      assert.isTrue(spy.called);
    });

    it('has the passed data', () => {
      const spy = sinon.spy();
      window.addEventListener(EventTypes.HttpClient.Model.Host.State.delete, spy);
      HostsEvents.State.delete(record);
      window.removeEventListener(EventTypes.HttpClient.Model.Host.State.delete, spy);
      const e = spy.args[0][0] as ContextStateDeleteEvent;
      assert.equal(e.detail.key, record.key);
    });
  });
});
