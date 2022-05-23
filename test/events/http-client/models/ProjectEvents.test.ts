/* eslint-disable @typescript-eslint/ban-ts-comment */
import { assert } from '@open-wc/testing';
import sinon from 'sinon';
import { 
  ContextChangeRecord, ContextDeleteEvent, ContextDeleteRecord, ContextListEvent, ContextListOptions, ContextReadEvent, 
  ContextStateDeleteEvent, ContextStateUpdateEvent, ContextUpdateEvent, IArcProject, ArcProject, ContextReadBulkEvent, 
  ContextUpdateBulkEvent, ContextDeleteBulkEvent, ContextRestoreEvent
} from '@api-client/core/build/browser.js';
import {
  ProjectEvents,
} from '../../../../src/events/http-client/models/ProjectEvents.js';
import { EventTypes } from '../../../../src/events/EventTypes.js';

describe('ProjectEvents', () => {
  describe('read()', () => {
    const key = 'test-id';

    it('dispatches the event on the default target', async () => {
      const spy = sinon.spy();
      window.addEventListener(EventTypes.HttpClient.Model.Project.read, spy);
      await ProjectEvents.read(key);
      window.removeEventListener(EventTypes.HttpClient.Model.Project.read, spy);
      assert.isTrue(spy.called);
    });

    it('dispatches the event on the passed target', async () => {
      const spy = sinon.spy();
      document.body.addEventListener(EventTypes.HttpClient.Model.Project.read, spy);
      await ProjectEvents.read(key, document.body);
      document.body.removeEventListener(EventTypes.HttpClient.Model.Project.read, spy);
      assert.isTrue(spy.called);
    });

    it('has the passed data', async () => {
      const spy = sinon.spy();
      window.addEventListener(EventTypes.HttpClient.Model.Project.read, spy);
      await ProjectEvents.read(key);
      window.removeEventListener(EventTypes.HttpClient.Model.Project.read, spy);
      const e = spy.args[0][0] as ContextReadEvent<IArcProject>;
      assert.equal(e.detail.key, key);
    });
  });

  describe('readBulk()', () => {
    const keys = ['test-id'];

    it('dispatches the event on the default target', async () => {
      const spy = sinon.spy();
      window.addEventListener(EventTypes.HttpClient.Model.Project.readBulk, spy);
      await ProjectEvents.readBulk(keys);
      window.removeEventListener(EventTypes.HttpClient.Model.Project.readBulk, spy);
      assert.isTrue(spy.called);
    });

    it('dispatches the event on the passed target', async () => {
      const spy = sinon.spy();
      document.body.addEventListener(EventTypes.HttpClient.Model.Project.readBulk, spy);
      await ProjectEvents.readBulk(keys, document.body);
      document.body.removeEventListener(EventTypes.HttpClient.Model.Project.readBulk, spy);
      assert.isTrue(spy.called);
    });

    it('has the passed data', async () => {
      const spy = sinon.spy();
      window.addEventListener(EventTypes.HttpClient.Model.Project.readBulk, spy);
      await ProjectEvents.readBulk(keys);
      window.removeEventListener(EventTypes.HttpClient.Model.Project.readBulk, spy);
      const e = spy.args[0][0] as ContextReadBulkEvent<IArcProject>;
      assert.equal(e.detail.keys, keys);
    });
  });

  describe('update()', () => {
    const item = ArcProject.fromName('r1').toJSON();

    it('dispatches the event on the default target', async () => {
      const spy = sinon.spy();
      window.addEventListener(EventTypes.HttpClient.Model.Project.update, spy);
      await ProjectEvents.update(item);
      window.removeEventListener(EventTypes.HttpClient.Model.Project.update, spy);
      assert.isTrue(spy.called);
    });

    it('dispatches the event on the passed target', async () => {
      const spy = sinon.spy();
      document.body.addEventListener(EventTypes.HttpClient.Model.Project.update, spy);
      await ProjectEvents.update(item, document.body);
      document.body.removeEventListener(EventTypes.HttpClient.Model.Project.update, spy);
      assert.isTrue(spy.called);
    });

    it('has the passed data', async () => {
      const spy = sinon.spy();
      window.addEventListener(EventTypes.HttpClient.Model.Project.update, spy);
      await ProjectEvents.update(item);
      window.removeEventListener(EventTypes.HttpClient.Model.Project.update, spy);
      const e = spy.args[0][0] as ContextUpdateEvent<IArcProject>;
      assert.deepEqual(e.detail.item, item);
    });
  });

  describe('updateBulk()', () => {
    const items = [ArcProject.fromName('r1').toJSON()];

    it('dispatches the event on the default target', async () => {
      const spy = sinon.spy();
      window.addEventListener(EventTypes.HttpClient.Model.Project.updateBulk, spy);
      await ProjectEvents.updateBulk(items);
      window.removeEventListener(EventTypes.HttpClient.Model.Project.updateBulk, spy);
      assert.isTrue(spy.called);
    });

    it('dispatches the event on the passed target', async () => {
      const spy = sinon.spy();
      document.body.addEventListener(EventTypes.HttpClient.Model.Project.updateBulk, spy);
      await ProjectEvents.updateBulk(items, document.body);
      document.body.removeEventListener(EventTypes.HttpClient.Model.Project.updateBulk, spy);
      assert.isTrue(spy.called);
    });

    it('has the passed data', async () => {
      const spy = sinon.spy();
      window.addEventListener(EventTypes.HttpClient.Model.Project.updateBulk, spy);
      await ProjectEvents.updateBulk(items);
      window.removeEventListener(EventTypes.HttpClient.Model.Project.updateBulk, spy);
      const e = spy.args[0][0] as ContextUpdateBulkEvent<IArcProject>;
      assert.deepEqual(e.detail.items, items);
    });
  });

  describe('delete()', () => {
    const key = 'test-id';

    it('dispatches the event on the default target', async () => {
      const spy = sinon.spy();
      window.addEventListener(EventTypes.HttpClient.Model.Project.delete, spy);
      await ProjectEvents.delete(key);
      window.removeEventListener(EventTypes.HttpClient.Model.Project.delete, spy);
      assert.isTrue(spy.called);
    });

    it('dispatches the event on the passed target', async () => {
      const spy = sinon.spy();
      document.body.addEventListener(EventTypes.HttpClient.Model.Project.delete, spy);
      await ProjectEvents.delete(key, document.body);
      document.body.removeEventListener(EventTypes.HttpClient.Model.Project.delete, spy);
      assert.isTrue(spy.called);
    });

    it('has the passed data', async () => {
      const spy = sinon.spy();
      window.addEventListener(EventTypes.HttpClient.Model.Project.delete, spy);
      await ProjectEvents.delete(key);
      window.removeEventListener(EventTypes.HttpClient.Model.Project.delete, spy);
      const e = spy.args[0][0] as ContextDeleteEvent;
      assert.equal(e.detail.key, key);
    });
  });

  describe('deleteBulk()', () => {
    const keys = ['test-id'];

    it('dispatches the event on the default target', async () => {
      const spy = sinon.spy();
      window.addEventListener(EventTypes.HttpClient.Model.Project.deleteBulk, spy);
      await ProjectEvents.deleteBulk(keys);
      window.removeEventListener(EventTypes.HttpClient.Model.Project.deleteBulk, spy);
      assert.isTrue(spy.called);
    });

    it('dispatches the event on the passed target', async () => {
      const spy = sinon.spy();
      document.body.addEventListener(EventTypes.HttpClient.Model.Project.deleteBulk, spy);
      await ProjectEvents.deleteBulk(keys, document.body);
      document.body.removeEventListener(EventTypes.HttpClient.Model.Project.deleteBulk, spy);
      assert.isTrue(spy.called);
    });

    it('has the passed data', async () => {
      const spy = sinon.spy();
      window.addEventListener(EventTypes.HttpClient.Model.Project.deleteBulk, spy);
      await ProjectEvents.deleteBulk(keys);
      window.removeEventListener(EventTypes.HttpClient.Model.Project.deleteBulk, spy);
      const e = spy.args[0][0] as ContextDeleteBulkEvent;
      assert.equal(e.detail.keys, keys);
    });
  });

  describe('undeleteBulk()', () => {
    const records = [{ key: 'test-id' }];

    it('dispatches the event on the default target', async () => {
      const spy = sinon.spy();
      window.addEventListener(EventTypes.HttpClient.Model.Project.undeleteBulk, spy);
      await ProjectEvents.undeleteBulk(records);
      window.removeEventListener(EventTypes.HttpClient.Model.Project.undeleteBulk, spy);
      assert.isTrue(spy.called);
    });

    it('dispatches the event on the passed target', async () => {
      const spy = sinon.spy();
      document.body.addEventListener(EventTypes.HttpClient.Model.Project.undeleteBulk, spy);
      await ProjectEvents.undeleteBulk(records, document.body);
      document.body.removeEventListener(EventTypes.HttpClient.Model.Project.undeleteBulk, spy);
      assert.isTrue(spy.called);
    });

    it('has the passed data', async () => {
      const spy = sinon.spy();
      window.addEventListener(EventTypes.HttpClient.Model.Project.undeleteBulk, spy);
      await ProjectEvents.undeleteBulk(records);
      window.removeEventListener(EventTypes.HttpClient.Model.Project.undeleteBulk, spy);
      const e = spy.args[0][0] as ContextRestoreEvent<IArcProject>;
      assert.equal(e.detail.records, records);
    });
  });

  describe('list()', () => {
    const opts: ContextListOptions = { limit: 5, nextPageToken: 'test-page-token' };

    it('dispatches the event on the default target', async () => {
      const spy = sinon.spy();
      window.addEventListener(EventTypes.HttpClient.Model.Project.list, spy);
      await ProjectEvents.list(opts);
      window.removeEventListener(EventTypes.HttpClient.Model.Project.list, spy);
      assert.isTrue(spy.called);
    });

    it('dispatches the event on the passed target', async () => {
      const spy = sinon.spy();
      document.body.addEventListener(EventTypes.HttpClient.Model.Project.list, spy);
      await ProjectEvents.list(opts, document.body);
      document.body.removeEventListener(EventTypes.HttpClient.Model.Project.list, spy);
      assert.isTrue(spy.called);
    });

    it('has the passed data', async () => {
      const spy = sinon.spy();
      window.addEventListener(EventTypes.HttpClient.Model.Project.list, spy);
      await ProjectEvents.list(opts);
      window.removeEventListener(EventTypes.HttpClient.Model.Project.list, spy);
      const e = spy.args[0][0] as ContextListEvent<IArcProject>;
      assert.equal(e.detail.limit, opts.limit);
      assert.equal(e.detail.nextPageToken, opts.nextPageToken);
    });
  });

  describe('State.update()', () => {
    const record: ContextChangeRecord<IArcProject> = {
      key: 'id',
      item: ArcProject.fromName('r1').toJSON(),
    };

    it('dispatches the event on the default target', () => {
      const spy = sinon.spy();
      window.addEventListener(EventTypes.HttpClient.Model.Project.State.update, spy);
      ProjectEvents.State.update(record);
      window.removeEventListener(EventTypes.HttpClient.Model.Project.State.update, spy);
      assert.isTrue(spy.called);
    });

    it('dispatches the event on the passed target', () => {
      const spy = sinon.spy();
      document.body.addEventListener(EventTypes.HttpClient.Model.Project.State.update, spy);
      ProjectEvents.State.update(record, document.body);
      document.body.removeEventListener(EventTypes.HttpClient.Model.Project.State.update, spy);
      assert.isTrue(spy.called);
    });

    it('has the passed data', () => {
      const spy = sinon.spy();
      window.addEventListener(EventTypes.HttpClient.Model.Project.State.update, spy);
      ProjectEvents.State.update(record);
      window.removeEventListener(EventTypes.HttpClient.Model.Project.State.update, spy);
      const e = spy.args[0][0] as ContextStateUpdateEvent<IArcProject>;
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
      window.addEventListener(EventTypes.HttpClient.Model.Project.State.delete, spy);
      ProjectEvents.State.delete(record);
      window.removeEventListener(EventTypes.HttpClient.Model.Project.State.delete, spy);
      assert.isTrue(spy.called);
    });

    it('dispatches the event on the passed target', () => {
      const spy = sinon.spy();
      document.body.addEventListener(EventTypes.HttpClient.Model.Project.State.delete, spy);
      ProjectEvents.State.delete(record, document.body);
      document.body.removeEventListener(EventTypes.HttpClient.Model.Project.State.delete, spy);
      assert.isTrue(spy.called);
    });

    it('has the passed data', () => {
      const spy = sinon.spy();
      window.addEventListener(EventTypes.HttpClient.Model.Project.State.delete, spy);
      ProjectEvents.State.delete(record);
      window.removeEventListener(EventTypes.HttpClient.Model.Project.State.delete, spy);
      const e = spy.args[0][0] as ContextStateDeleteEvent;
      assert.equal(e.detail.key, record.key);
    });
  });
});
