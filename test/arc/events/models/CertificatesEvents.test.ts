/* eslint-disable @typescript-eslint/ban-ts-comment */
import { assert } from '@open-wc/testing';
import sinon from 'sinon';
import { ContextChangeRecord, ContextDeleteEvent, ContextDeleteRecord, ContextListEvent, ContextListOptions, ContextReadEvent, ContextStateDeleteEvent, ContextStateUpdateEvent, ContextUpdateEvent, ICertificate } from '@api-client/core/build/browser.js';
import {
  CertificatesEvents,
} from '../../../../src/arc/events/models/CertificatesEvents.js';
import { ArcModelEventTypes } from '../../../../src/arc/events/models/ArcModelEventTypes.js';

describe('CertificatesEvents', () => {
  describe('read()', () => {
    const key = 'test-cc-id';

    it('dispatches the event on the default target', async () => {
      const spy = sinon.spy();
      window.addEventListener(ArcModelEventTypes.ClientCertificate.read, spy);
      await CertificatesEvents.read(key);
      window.removeEventListener(ArcModelEventTypes.ClientCertificate.read, spy);
      assert.isTrue(spy.called);
    });

    it('dispatches the event on the passed target', async () => {
      const spy = sinon.spy();
      document.body.addEventListener(ArcModelEventTypes.ClientCertificate.read, spy);
      await CertificatesEvents.read(key, document.body);
      document.body.removeEventListener(ArcModelEventTypes.ClientCertificate.read, spy);
      assert.isTrue(spy.called);
    });

    it('has the passed data', async () => {
      const spy = sinon.spy();
      window.addEventListener(ArcModelEventTypes.ClientCertificate.read, spy);
      await CertificatesEvents.read(key);
      window.removeEventListener(ArcModelEventTypes.ClientCertificate.read, spy);
      const e = spy.args[0][0] as ContextReadEvent<ICertificate>;
      assert.equal(e.detail.key, key);
    });
  });

  describe('insert()', () => {
    const item = ({ name: 'test' }) as ICertificate;

    it('dispatches the event on the default target', async () => {
      const spy = sinon.spy();
      window.addEventListener(ArcModelEventTypes.ClientCertificate.insert, spy);
      await CertificatesEvents.insert(item);
      window.removeEventListener(ArcModelEventTypes.ClientCertificate.insert, spy);
      assert.isTrue(spy.called);
    });

    it('dispatches the event on the passed target', async () => {
      const spy = sinon.spy();
      document.body.addEventListener(ArcModelEventTypes.ClientCertificate.insert, spy);
      await CertificatesEvents.insert(item, document.body);
      document.body.removeEventListener(ArcModelEventTypes.ClientCertificate.insert, spy);
      assert.isTrue(spy.called);
    });

    it('has the passed data', async () => {
      const spy = sinon.spy();
      window.addEventListener(ArcModelEventTypes.ClientCertificate.insert, spy);
      await CertificatesEvents.insert(item);
      window.removeEventListener(ArcModelEventTypes.ClientCertificate.insert, spy);
      const e = spy.args[0][0] as ContextUpdateEvent<ICertificate>;
      assert.deepEqual(e.detail.item, item);
    });
  });

  describe('delete()', () => {
    const key = 'test-cc-id';

    it('dispatches the event on the default target', async () => {
      const spy = sinon.spy();
      window.addEventListener(ArcModelEventTypes.ClientCertificate.delete, spy);
      await CertificatesEvents.delete(key);
      window.removeEventListener(ArcModelEventTypes.ClientCertificate.delete, spy);
      assert.isTrue(spy.called);
    });

    it('dispatches the event on the passed target', async () => {
      const spy = sinon.spy();
      document.body.addEventListener(ArcModelEventTypes.ClientCertificate.delete, spy);
      await CertificatesEvents.delete(key, document.body);
      document.body.removeEventListener(ArcModelEventTypes.ClientCertificate.delete, spy);
      assert.isTrue(spy.called);
    });

    it('has the passed data', async () => {
      const spy = sinon.spy();
      window.addEventListener(ArcModelEventTypes.ClientCertificate.delete, spy);
      await CertificatesEvents.delete(key);
      window.removeEventListener(ArcModelEventTypes.ClientCertificate.delete, spy);
      const e = spy.args[0][0] as ContextDeleteEvent;
      assert.equal(e.detail.key, key);
    });
  });

  describe('list()', () => {
    const opts: ContextListOptions = { limit: 5, nextPageToken: 'test-page-token' };

    it('dispatches the event on the default target', async () => {
      const spy = sinon.spy();
      window.addEventListener(ArcModelEventTypes.ClientCertificate.list, spy);
      await CertificatesEvents.list(opts);
      window.removeEventListener(ArcModelEventTypes.ClientCertificate.list, spy);
      assert.isTrue(spy.called);
    });

    it('dispatches the event on the passed target', async () => {
      const spy = sinon.spy();
      document.body.addEventListener(ArcModelEventTypes.ClientCertificate.list, spy);
      await CertificatesEvents.list(opts, document.body);
      document.body.removeEventListener(ArcModelEventTypes.ClientCertificate.list, spy);
      assert.isTrue(spy.called);
    });

    it('has the passed data', async () => {
      const spy = sinon.spy();
      window.addEventListener(ArcModelEventTypes.ClientCertificate.list, spy);
      await CertificatesEvents.list(opts);
      window.removeEventListener(ArcModelEventTypes.ClientCertificate.list, spy);
      const e = spy.args[0][0] as ContextListEvent<ICertificate>;
      assert.equal(e.detail.limit, opts.limit);
      assert.equal(e.detail.nextPageToken, opts.nextPageToken);
    });
  });

  describe('State.update()', () => {
    const record: ContextChangeRecord<ICertificate> = {
      key: 'cc-id',
      item: ({ name: 'test' }) as ICertificate,
    };

    it('dispatches the event on the default target', () => {
      const spy = sinon.spy();
      window.addEventListener(ArcModelEventTypes.ClientCertificate.State.update, spy);
      CertificatesEvents.State.update(record);
      window.removeEventListener(ArcModelEventTypes.ClientCertificate.State.update, spy);
      assert.isTrue(spy.called);
    });

    it('dispatches the event on the passed target', () => {
      const spy = sinon.spy();
      document.body.addEventListener(ArcModelEventTypes.ClientCertificate.State.update, spy);
      CertificatesEvents.State.update(record, document.body);
      document.body.removeEventListener(ArcModelEventTypes.ClientCertificate.State.update, spy);
      assert.isTrue(spy.called);
    });

    it('has the passed data', () => {
      const spy = sinon.spy();
      window.addEventListener(ArcModelEventTypes.ClientCertificate.State.update, spy);
      CertificatesEvents.State.update(record);
      window.removeEventListener(ArcModelEventTypes.ClientCertificate.State.update, spy);
      const e = spy.args[0][0] as ContextStateUpdateEvent<ICertificate>;
      assert.deepEqual(e.detail.key, record.key);
      assert.deepEqual(e.detail.item, record.item);
    });
  });

  describe('State.delete()', () => {
    const record: ContextDeleteRecord = {
      key: 'test-cc-id',
    };

    it('dispatches the event on the default target', () => {
      const spy = sinon.spy();
      window.addEventListener(ArcModelEventTypes.ClientCertificate.State.delete, spy);
      CertificatesEvents.State.delete(record);
      window.removeEventListener(ArcModelEventTypes.ClientCertificate.State.delete, spy);
      assert.isTrue(spy.called);
    });

    it('dispatches the event on the passed target', () => {
      const spy = sinon.spy();
      document.body.addEventListener(ArcModelEventTypes.ClientCertificate.State.delete, spy);
      CertificatesEvents.State.delete(record, document.body);
      document.body.removeEventListener(ArcModelEventTypes.ClientCertificate.State.delete, spy);
      assert.isTrue(spy.called);
    });

    it('has the passed data', () => {
      const spy = sinon.spy();
      window.addEventListener(ArcModelEventTypes.ClientCertificate.State.delete, spy);
      CertificatesEvents.State.delete(record);
      window.removeEventListener(ArcModelEventTypes.ClientCertificate.State.delete, spy);
      const e = spy.args[0][0] as ContextStateDeleteEvent;
      assert.equal(e.detail.key, record.key);
    });
  });
});
