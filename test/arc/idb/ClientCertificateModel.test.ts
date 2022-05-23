/* eslint-disable @typescript-eslint/ban-ts-comment */
import { fixture, assert } from '@open-wc/testing';
import sinon from 'sinon';
import { IPemCertificate, ProjectMock, Certificate, ICertificateData, CertificateKind, ContextStateUpdateEvent, ICertificate } from '@api-client/core/build/browser.js';
import { CertificateModel } from  '../../../src/arc/idb/CertificateModel.js';
import { ArcModelEventTypes } from '../../../src/arc/events/models/ArcModelEventTypes.js';
import { ArcModelEvents } from '../../../src/arc/events/models/ArcModelEvents.js';

describe('ClientCertificateModel', () => {
  const mock = new ProjectMock();

  async function etFixture(): Promise<HTMLElement> {
    return fixture(`<div></div>`);
  }

  describe('list()', () => {
    describe('with data', () => {
      let instance: CertificateModel;

      before(async () => {
        instance = new CertificateModel();
        const certs = mock.certificates.certificates(30);
        await instance.putBulk(certs);
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

    describe('Without data', () => {
      let instance: CertificateModel;
      let et: Element;
      beforeEach(async () => {
        et = await etFixture();
        instance = new CertificateModel();
        instance.listen(et);
      });

      it('returns empty array', async () => {
        const result = await instance.list();
        assert.typeOf(result, 'object', 'result is an object');
        assert.lengthOf(result.items, 0, 'result has no items');
        assert.isUndefined(result.nextPageToken, 'nextPageToken is undefined');
      });
    });

    describe('Events', () => {
      before(async () => {
        const model = new CertificateModel();
        const certs = mock.certificates.certificates(30);
        await model.putBulk(certs);
      });

      after(async () => {
        const model = new CertificateModel();
        await model.deleteModel();
      });

      let instance: CertificateModel;
      let et: Element;
      beforeEach(async () => {
        et = await etFixture();
        instance = new CertificateModel();
        instance.listen(et);
      });

      it('returns a query result for default parameters', async () => {
        const result = await ArcModelEvents.ClientCertificate.list(undefined, et);
        assert.typeOf(result, 'object', 'result is an object');
        assert.typeOf(result.nextPageToken, 'string', 'has page token');
        assert.typeOf(result.items, 'array', 'has response items');
        assert.lengthOf(result.items, instance.defaultQueryOptions.limit, 'has default limit of items');
      });

      it('respects the "limit" parameter', async () => {
        const result = await ArcModelEvents.ClientCertificate.list({
          limit: 5,
        }, et);
        assert.lengthOf(result.items, 5);
      });

      it('respects the "nextPageToken" parameter', async () => {
        const result1 = await ArcModelEvents.ClientCertificate.list({
          limit: 10,
        }, et);
        const result2 = await ArcModelEvents.ClientCertificate.list({
          nextPageToken: result1.nextPageToken,
        }, et);
        assert.lengthOf(result2.items, 10);
        const all = await ArcModelEvents.ClientCertificate.list({
          limit: 20,
        }, et);
        assert.deepEqual(all.items, result1.items.concat(result2.items), 'has both pages');
      });
    });
  });

  describe('get()', () => {
    describe('String data', () => {
      let id: string;
      let instance: CertificateModel;
      before(async () => {
        instance = new CertificateModel();
        const cert = mock.certificates.certificate({ type: 'pem' });
        await instance.put(cert);
        id = cert.key;
      });

      after(async () => {
        await instance.deleteModel();
      });

      it('returns the document', async () => {
        const doc = await instance.get(id);
        assert.typeOf(doc, 'object');
      });

      it('returns the document meta', async () => {
        const result = await instance.get(id);
        assert.equal(result.kind, CertificateKind, 'has the certificate object');
        assert.typeOf(result.created, 'number', 'has the created');
        assert.typeOf(result.name, 'string', 'has the name');
        assert.equal(result.type, 'pem', 'has the type');
      });

      it('has the certificate', async () => {
        const doc = await instance.get(id);
        const certificate = doc.cert;
        assert.typeOf(certificate, 'object', 'certificate is set');
        assert.typeOf(certificate.data, 'string', 'certificate data is set');
        assert.typeOf(certificate.passphrase, 'string', 'passphrase is set');
      });

      it('has the key', async () => {
        const doc = await instance.get(id) as IPemCertificate;
        const info = doc.certKey;
        assert.typeOf(info, 'object', 'certificate is set');
        assert.typeOf(info.data, 'string', 'certificate data is set');
        assert.typeOf(info.passphrase, 'string', 'passphrase is set');
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

    describe('Binary data', () => {
      let instance: CertificateModel;
      let id: string;
      before(async () => {
        instance = new CertificateModel();
        const cert = mock.certificates.certificate({ type: 'pem', binary: true });
        instance.put(cert);
        id = cert.key;
      });

      after(async () => {
        await instance.deleteModel();
      });

      it('has the certificate', async () => {
        const doc = await instance.get(id);
        const info = new Certificate(doc).cert;
        assert.typeOf(info, 'object', 'certificate is set');
        assert.typeOf(info.data, 'Uint8Array', 'certificate data is set');
        assert.typeOf(info.passphrase, 'string', 'passphrase is set');
      });

      it('has the key', async () => {
        const doc = await instance.get(id);
        const info = new Certificate(doc).certKey as ICertificateData;
        assert.typeOf(info, 'object', 'certificate is set');
        assert.typeOf(info.data, 'Uint8Array', 'certificate data is set');
        assert.typeOf(info.passphrase, 'string', 'passphrase is set');
      });
    });

    describe('Events', () => {
      let id: string;
      before(async () => {
        const cert = mock.certificates.certificate();
        const model = new CertificateModel();
        await model.put(cert);
        id = cert.key;
      });

      after(async () => {
        const model = new CertificateModel();
        await model.deleteModel();
      });

      let instance: CertificateModel;
      let et: Element;
      beforeEach(async () => {
        et = await etFixture();
        instance = new CertificateModel();
        instance.listen(et);
      });

      it('reads the certificate through the event', async () => {
        const result = await ArcModelEvents.ClientCertificate.read(id, et);
        assert.typeOf(result, 'object', 'has the result');
        assert.equal(result.kind, CertificateKind, 'has the certificate object');
      });

      it('returns undefined when no certificate', async () => {
        const result = await ArcModelEvents.ClientCertificate.read('another', et);
        assert.isUndefined(result);
      });
    });
  });

  describe('delete()', () => {
    let instance: CertificateModel;
    let id: string;
    beforeEach(async () => {
      instance = new CertificateModel();
      const cert = mock.certificates.certificate();
      await instance.put(cert);
      id = cert.key;
    });

    after(async () => {
      await instance.deleteModel();
    });

    it('marks the document deletes', async () => {
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

    it('throws when no ID', async () => {
      let err: Error | undefined;
      try {
        await instance.delete(undefined);
      } catch (e) {
        err = e;
      }
      assert.equal(err.message, 'The "key" argument is missing.');
    });

    it('deletes the certificate through the event', async () => {
      instance.listen();
      await ArcModelEvents.ClientCertificate.delete(id);
      const item = await instance.get(id);
      assert.isUndefined(item);
    });
  });

  describe('put()', () => {
    let instance: CertificateModel;
    before(async () => {
      instance = new CertificateModel();
    });

    after(async () => {
      await instance.deleteModel();
    });

    it('creates an item', async () => {
      const cert = mock.certificates.certificate();
      await instance.put(cert);
      const all = await instance.list();
      assert.lengthOf(all.items, 1);
    });

    it('returns the change record', async () => {
      const cert = mock.certificates.certificate();
      const result = await instance.put(cert);
      assert.typeOf(result, 'object', 'returns an object');
      assert.typeOf(result.key, 'string', 'has an key');
      assert.deepEqual(result.item, cert, 'has the created object');
    });

    it('stores a binary data', async () => {
      const cert = mock.certificates.certificate({ binary: true });
      const record = await instance.put(cert);
      const doc = await instance.get(record.key);
      const certInstance = new Certificate(doc);
      const info = certInstance.cert;
      assert.typeOf(info, 'object', 'certificate is set');
      assert.typeOf(info.data, 'Uint8Array', 'certificate data is set');
      assert.typeOf(info.passphrase, 'string', 'passphrase is set');
    });

    it('throws when no cert', async () => {
      let err: Error;
      try {
        // @ts-ignore
        await instance.put();
      } catch (e) {
        err = e;
      }
      assert.equal(err.message, 'Expected a value when inserting a client certificate.');
    });

    it('dispatches the change event', async () => {
      const et = await etFixture();
      instance.listen(et);
      const cert = mock.certificates.certificate();
      const spy = sinon.spy();
      et.addEventListener(ArcModelEventTypes.ClientCertificate.State.update, spy);
      await instance.put(cert);
      instance.unlisten(et);
      instance.eventsTarget = window;

      assert.isTrue(spy.called, 'Event was dispatched');
      const e = spy.args[0][0] as ContextStateUpdateEvent<ICertificate>;
      const changeRecord = e.detail;
      assert.typeOf(changeRecord, 'object', 'returns an object');
      assert.equal(changeRecord.key, cert.key, 'has an key');
      assert.equal(changeRecord.kind, cert.kind, 'has an kind');
      assert.deepEqual(changeRecord.item, cert, 'has created object');
    });
  });

  describe('deleteModel()', () => {
    after(async () => {
      const model = new CertificateModel();
      await model.deleteModel();
    });

    let instance: CertificateModel;
    let et: Element;
    beforeEach(async () => {
      et = await etFixture();
      instance = new CertificateModel();
      instance.listen(et);
      const cert = mock.certificates.certificate();
      await instance.put(cert);
    });

    it('clears the data', async () => {
      await instance.deleteModel();
      const all = await instance.list();
      assert.lengthOf(all.items, 0);
    });

    it('clears the data through the event', async () => {
      await ArcModelEvents.destroy(['Certificates'], et);
      const all = await instance.list();
      assert.lengthOf(all.items, 0);
    });
  });
});
