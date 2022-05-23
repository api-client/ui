/* eslint-disable @typescript-eslint/ban-ts-comment */
import { assert } from '@open-wc/testing';
import sinon from 'sinon';
import { ContextChangeRecord, ContextDeleteEvent, ContextDeleteRecord, ContextListEvent, ContextListOptions, ContextReadEvent, ContextStateDeleteEvent, ContextStateUpdateEvent, ContextUpdateEvent, ICertificate } from '@api-client/core/build/browser.js';
import {
  CertificatesEvents,
} from '../../../../src/events/http-client/models/CertificatesEvents.js';
import { EventTypes } from '../../../../src/events/EventTypes.js';

describe('CertificatesEvents', () => {
  describe('read()', () => {
    const key = 'test-cc-id';

    it('dispatches the event on the default target', async () => {
      const spy = sinon.spy();
      window.addEventListener(EventTypes.HttpClient.Model.Certificate.read, spy);
      await CertificatesEvents.read(key);
      window.removeEventListener(EventTypes.HttpClient.Model.Certificate.read, spy);
      assert.isTrue(spy.called);
    });

    it('dispatches the event on the passed target', async () => {
      const spy = sinon.spy();
      document.body.addEventListener(EventTypes.HttpClient.Model.Certificate.read, spy);
      await CertificatesEvents.read(key, document.body);
      document.body.removeEventListener(EventTypes.HttpClient.Model.Certificate.read, spy);
      assert.isTrue(spy.called);
    });

    it('has the passed data', async () => {
      const spy = sinon.spy();
      window.addEventListener(EventTypes.HttpClient.Model.Certificate.read, spy);
      await CertificatesEvents.read(key);
      window.removeEventListener(EventTypes.HttpClient.Model.Certificate.read, spy);
      const e = spy.args[0][0] as ContextReadEvent<ICertificate>;
      assert.equal(e.detail.key, key);
    });
  });

  describe('insert()', () => {
    const item = ({ name: 'test' }) as ICertificate;

    it('dispatches the event on the default target', async () => {
      const spy = sinon.spy();
      window.addEventListener(EventTypes.HttpClient.Model.Certificate.insert, spy);
      await CertificatesEvents.insert(item);
      window.removeEventListener(EventTypes.HttpClient.Model.Certificate.insert, spy);
      assert.isTrue(spy.called);
    });

    it('dispatches the event on the passed target', async () => {
      const spy = sinon.spy();
      document.body.addEventListener(EventTypes.HttpClient.Model.Certificate.insert, spy);
      await CertificatesEvents.insert(item, document.body);
      document.body.removeEventListener(EventTypes.HttpClient.Model.Certificate.insert, spy);
      assert.isTrue(spy.called);
    });

    it('has the passed data', async () => {
      const spy = sinon.spy();
      window.addEventListener(EventTypes.HttpClient.Model.Certificate.insert, spy);
      await CertificatesEvents.insert(item);
      window.removeEventListener(EventTypes.HttpClient.Model.Certificate.insert, spy);
      const e = spy.args[0][0] as ContextUpdateEvent<ICertificate>;
      assert.deepEqual(e.detail.item, item);
    });
  });

  describe('delete()', () => {
    const key = 'test-cc-id';

    it('dispatches the event on the default target', async () => {
      const spy = sinon.spy();
      window.addEventListener(EventTypes.HttpClient.Model.Certificate.delete, spy);
      await CertificatesEvents.delete(key);
      window.removeEventListener(EventTypes.HttpClient.Model.Certificate.delete, spy);
      assert.isTrue(spy.called);
    });

    it('dispatches the event on the passed target', async () => {
      const spy = sinon.spy();
      document.body.addEventListener(EventTypes.HttpClient.Model.Certificate.delete, spy);
      await CertificatesEvents.delete(key, document.body);
      document.body.removeEventListener(EventTypes.HttpClient.Model.Certificate.delete, spy);
      assert.isTrue(spy.called);
    });

    it('has the passed data', async () => {
      const spy = sinon.spy();
      window.addEventListener(EventTypes.HttpClient.Model.Certificate.delete, spy);
      await CertificatesEvents.delete(key);
      window.removeEventListener(EventTypes.HttpClient.Model.Certificate.delete, spy);
      const e = spy.args[0][0] as ContextDeleteEvent;
      assert.equal(e.detail.key, key);
    });
  });

  describe('list()', () => {
    const opts: ContextListOptions = { limit: 5, nextPageToken: 'test-page-token' };

    it('dispatches the event on the default target', async () => {
      const spy = sinon.spy();
      window.addEventListener(EventTypes.HttpClient.Model.Certificate.list, spy);
      await CertificatesEvents.list(opts);
      window.removeEventListener(EventTypes.HttpClient.Model.Certificate.list, spy);
      assert.isTrue(spy.called);
    });

    it('dispatches the event on the passed target', async () => {
      const spy = sinon.spy();
      document.body.addEventListener(EventTypes.HttpClient.Model.Certificate.list, spy);
      await CertificatesEvents.list(opts, document.body);
      document.body.removeEventListener(EventTypes.HttpClient.Model.Certificate.list, spy);
      assert.isTrue(spy.called);
    });

    it('has the passed data', async () => {
      const spy = sinon.spy();
      window.addEventListener(EventTypes.HttpClient.Model.Certificate.list, spy);
      await CertificatesEvents.list(opts);
      window.removeEventListener(EventTypes.HttpClient.Model.Certificate.list, spy);
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
      window.addEventListener(EventTypes.HttpClient.Model.Certificate.State.update, spy);
      CertificatesEvents.State.update(record);
      window.removeEventListener(EventTypes.HttpClient.Model.Certificate.State.update, spy);
      assert.isTrue(spy.called);
    });

    it('dispatches the event on the passed target', () => {
      const spy = sinon.spy();
      document.body.addEventListener(EventTypes.HttpClient.Model.Certificate.State.update, spy);
      CertificatesEvents.State.update(record, document.body);
      document.body.removeEventListener(EventTypes.HttpClient.Model.Certificate.State.update, spy);
      assert.isTrue(spy.called);
    });

    it('has the passed data', () => {
      const spy = sinon.spy();
      window.addEventListener(EventTypes.HttpClient.Model.Certificate.State.update, spy);
      CertificatesEvents.State.update(record);
      window.removeEventListener(EventTypes.HttpClient.Model.Certificate.State.update, spy);
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
      window.addEventListener(EventTypes.HttpClient.Model.Certificate.State.delete, spy);
      CertificatesEvents.State.delete(record);
      window.removeEventListener(EventTypes.HttpClient.Model.Certificate.State.delete, spy);
      assert.isTrue(spy.called);
    });

    it('dispatches the event on the passed target', () => {
      const spy = sinon.spy();
      document.body.addEventListener(EventTypes.HttpClient.Model.Certificate.State.delete, spy);
      CertificatesEvents.State.delete(record, document.body);
      document.body.removeEventListener(EventTypes.HttpClient.Model.Certificate.State.delete, spy);
      assert.isTrue(spy.called);
    });

    it('has the passed data', () => {
      const spy = sinon.spy();
      window.addEventListener(EventTypes.HttpClient.Model.Certificate.State.delete, spy);
      CertificatesEvents.State.delete(record);
      window.removeEventListener(EventTypes.HttpClient.Model.Certificate.State.delete, spy);
      const e = spy.args[0][0] as ContextStateDeleteEvent;
      assert.equal(e.detail.key, record.key);
    });
  });
});
