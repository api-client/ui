/* eslint-disable @typescript-eslint/ban-ts-comment */
import { assert } from '@open-wc/testing';
import sinon from 'sinon';
import { ARCCertificateIndex, ClientCertificate } from '@api-client/core/build/legacy.js';
import {
  ARCClientCertificateReadEvent,
  ARCClientCertificateInsertEvent,
  ARCClientCertificateUpdatedEvent,
  ARCClientCertificateDeleteEvent,
  ARCClientCertificateDeletedEvent,
  ARCClientCertificateListEvent,
  CertificatesEvents,
} from '../../../../src/arc/events/models/CertificatesEvents.js';
import { ArcModelEventTypes } from '../../../../src/arc/events/models/ArcModelEventTypes.js';
import { IARCEntityChangeRecord, IARCModelListOptions } from '../../../../src/arc/idb/Base.js';

describe('CertificatesEvents', () => {
  describe('ARCClientCertificateReadEvent', () => {
    const id = 'test-cc-id';
    const rev = 'test-cc-rev-id';

    it('has readonly id property', () => {
      const e = new ARCClientCertificateReadEvent(id);
      assert.equal(e.id, id, 'has the id');
      assert.throws(() => {
        // @ts-ignore
        e.id = 'test';
      });
    });

    it('has readonly rev property', () => {
      const e = new ARCClientCertificateReadEvent(id, rev);
      assert.equal(e.rev, rev, 'has the rev');
      assert.throws(() => {
        // @ts-ignore
        e.rev = 'test';
      });
    });

    it('has the correct type', () => {
      const e = new ARCClientCertificateReadEvent(id, rev);
      assert.equal(e.type, ArcModelEventTypes.ClientCertificate.read);
    });
  });

  describe('ARCClientCertificateInsertEvent', () => {
    it('has readonly certificate property', () => {
      const item = ({ name: 'test' }) as ClientCertificate;
      const e = new ARCClientCertificateInsertEvent(item);
      assert.deepEqual(e.certificate, item);
      assert.throws(() => {
        // @ts-ignore
        e.certificate = 'test';
      });
    });

    it('has the correct type', () => {
      const item = ({ name: 'test' }) as ClientCertificate;
      const e = new ARCClientCertificateInsertEvent(item);
      assert.equal(e.type, ArcModelEventTypes.ClientCertificate.insert);
    });
  });

  describe('ARCClientCertificateUpdatedEvent', () => {
    const record: IARCEntityChangeRecord<ARCCertificateIndex> = {
      id: 'cc-id',
      rev: 'cc-rev',
      item: ({ name: 'test' }) as ARCCertificateIndex,
    };

    it('has readonly changeRecord property', () => {
      const e = new ARCClientCertificateUpdatedEvent(record);
      assert.deepEqual(e.changeRecord, record);
      assert.throws(() => {
        // @ts-ignore
        e.changeRecord = 'test';
      });
    });

    it('has the correct type', () => {
      const e = new ARCClientCertificateUpdatedEvent(record);
      assert.equal(e.type, ArcModelEventTypes.ClientCertificate.State.update);
    });
  });

  describe('ARCClientCertificateDeleteEvent', () => {
    const id = 'test-cc-id';
    const rev = 'test-cc-rev-id';

    it('has readonly id property', () => {
      const e = new ARCClientCertificateDeleteEvent(id);
      assert.equal(e.id, id, 'has the id');
      assert.throws(() => {
        // @ts-ignore
        e.id = 'test';
      });
    });

    it('has readonly rev property', () => {
      const e = new ARCClientCertificateDeleteEvent(id, rev);
      assert.equal(e.rev, rev, 'has the rev');
      assert.throws(() => {
        // @ts-ignore
        e.rev = 'test';
      });
    });

    it('has the correct type', () => {
      const e = new ARCClientCertificateDeleteEvent(id, rev);
      assert.equal(e.type, ArcModelEventTypes.ClientCertificate.delete);
    });
  });

  describe('ARCClientCertificateDeletedEvent', () => {
    const id = 'test-cc-id';
    const rev = 'test-cc-rev-id';

    it('has readonly id property', () => {
      const e = new ARCClientCertificateDeletedEvent(id, rev);
      assert.equal(e.id, id, 'has the id');
      assert.throws(() => {
        // @ts-ignore
        e.id = 'test';
      });
    });

    it('has readonly rev property', () => {
      const e = new ARCClientCertificateDeletedEvent(id, rev);
      assert.equal(e.rev, rev, 'has the rev');
      assert.throws(() => {
        // @ts-ignore
        e.rev = 'test';
      });
    });

    it('has the correct type', () => {
      const e = new ARCClientCertificateDeletedEvent(id, rev);
      assert.equal(e.type, ArcModelEventTypes.ClientCertificate.State.delete);
    });
  });

  describe('ARCClientCertificateListEvent', () => {
    const opts: IARCModelListOptions = { limit: 5, nextPageToken: 'test-page-token' };

    it('has readonly limit property', () => {
      const e = new ARCClientCertificateListEvent(opts);
      assert.deepEqual(e.limit, opts.limit);
      assert.throws(() => {
        // @ts-ignore
        e.limit = 'test';
      });
    });

    it('has readonly nextPageToken property', () => {
      const e = new ARCClientCertificateListEvent(opts);
      assert.deepEqual(e.nextPageToken, opts.nextPageToken);
      assert.throws(() => {
        // @ts-ignore
        e.nextPageToken = 'test';
      });
    });

    it('has the correct type', () => {
      const e = new ARCClientCertificateListEvent(opts);
      assert.equal(e.type, ArcModelEventTypes.ClientCertificate.list);
    });
  });

  describe('read()', () => {
    const id = 'test-cc-id';
    const rev = 'test-cc-rev-id';

    it('dispatches the event on the default target', async () => {
      const spy = sinon.spy();
      window.addEventListener(ArcModelEventTypes.ClientCertificate.read, spy);
      await CertificatesEvents.read(id, rev);
      window.removeEventListener(ArcModelEventTypes.ClientCertificate.read, spy);
      assert.isTrue(spy.called);
    });

    it('dispatches the event on the passed target', async () => {
      const spy = sinon.spy();
      document.body.addEventListener(ArcModelEventTypes.ClientCertificate.read, spy);
      await CertificatesEvents.read(id, rev, document.body);
      document.body.removeEventListener(ArcModelEventTypes.ClientCertificate.read, spy);
      assert.isTrue(spy.called);
    });

    it('has the passed data', async () => {
      const spy = sinon.spy();
      window.addEventListener(ArcModelEventTypes.ClientCertificate.read, spy);
      await CertificatesEvents.read(id, rev);
      window.removeEventListener(ArcModelEventTypes.ClientCertificate.read, spy);
      const e = spy.args[0][0] as ARCClientCertificateReadEvent;
      assert.equal(e.id, id);
      assert.equal(e.rev, rev);
    });
  });

  describe('insert()', () => {
    const item = ({ name: 'test' }) as ClientCertificate;

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
      const e = spy.args[0][0] as ARCClientCertificateInsertEvent;
      assert.deepEqual(e.certificate, item);
    });
  });

  describe('delete()', () => {
    const id = 'test-cc-id';
    const rev = 'test-cc-rev-id';

    it('dispatches the event on the default target', async () => {
      const spy = sinon.spy();
      window.addEventListener(ArcModelEventTypes.ClientCertificate.delete, spy);
      await CertificatesEvents.delete(id, rev);
      window.removeEventListener(ArcModelEventTypes.ClientCertificate.delete, spy);
      assert.isTrue(spy.called);
    });

    it('dispatches the event on the passed target', async () => {
      const spy = sinon.spy();
      document.body.addEventListener(ArcModelEventTypes.ClientCertificate.delete, spy);
      await CertificatesEvents.delete(id, rev, document.body);
      document.body.removeEventListener(ArcModelEventTypes.ClientCertificate.delete, spy);
      assert.isTrue(spy.called);
    });

    it('has the passed data', async () => {
      const spy = sinon.spy();
      window.addEventListener(ArcModelEventTypes.ClientCertificate.delete, spy);
      await CertificatesEvents.delete(id, rev);
      window.removeEventListener(ArcModelEventTypes.ClientCertificate.delete, spy);
      const e = spy.args[0][0] as ARCClientCertificateDeleteEvent;
      assert.equal(e.id, id);
      assert.equal(e.rev, rev);
    });
  });

  describe('list()', () => {
    const opts: IARCModelListOptions = { limit: 5, nextPageToken: 'test-page-token' };

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
      const e = spy.args[0][0] as ARCClientCertificateListEvent;
      assert.equal(e.limit, opts.limit);
      assert.equal(e.nextPageToken, opts.nextPageToken);
    });
  });

  describe('State.update()', () => {
    const record: IARCEntityChangeRecord<ARCCertificateIndex> = {
      id: 'cc-id',
      rev: 'cc-rev',
      item: ({ name: 'test' }) as ARCCertificateIndex,
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
      const e = spy.args[0][0] as ARCClientCertificateUpdatedEvent;
      assert.deepEqual(e.changeRecord, record);
    });
  });

  describe('State.delete()', () => {
    const id = 'test-cc-id';
    const rev = 'test-cc-rev-id';

    it('dispatches the event on the default target', () => {
      const spy = sinon.spy();
      window.addEventListener(ArcModelEventTypes.ClientCertificate.State.delete, spy);
      CertificatesEvents.State.delete(id, rev);
      window.removeEventListener(ArcModelEventTypes.ClientCertificate.State.delete, spy);
      assert.isTrue(spy.called);
    });

    it('dispatches the event on the passed target', () => {
      const spy = sinon.spy();
      document.body.addEventListener(ArcModelEventTypes.ClientCertificate.State.delete, spy);
      CertificatesEvents.State.delete(id, rev, document.body);
      document.body.removeEventListener(ArcModelEventTypes.ClientCertificate.State.delete, spy);
      assert.isTrue(spy.called);
    });

    it('has the passed data', () => {
      const spy = sinon.spy();
      window.addEventListener(ArcModelEventTypes.ClientCertificate.State.delete, spy);
      CertificatesEvents.State.delete(id, rev);
      window.removeEventListener(ArcModelEventTypes.ClientCertificate.State.delete, spy);
      const e = spy.args[0][0] as ARCClientCertificateDeletedEvent;
      assert.equal(e.id, id);
      assert.equal(e.rev, rev);
    });
  });
});
