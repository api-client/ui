/* eslint-disable @typescript-eslint/ban-ts-comment */
import { assert } from '@open-wc/testing';
import sinon from 'sinon';
import { ARCAuthData } from '@api-client/core/build/legacy.js';
import {
  ARCAuthDataUpdateEvent,
  ARCAuthDataQueryEvent,
  ARCAuthDataUpdatedEvent,
  AuthDataEvents,
} from  '../../../../src/arc/events/models/AuthDataEvents.js';
import { ArcModelEventTypes } from '../../../../src/arc/events/models/ArcModelEventTypes.js';
import { IARCEntityChangeRecord } from '../../../../src/arc/idb/Base.js';

describe('AuthDataEvents', () => {
  describe('ARCAuthDataUpdateEvent', () => {
    const url = 'http://domain.com/auth';
    const method = 'x-ntlm';
    const authData = { username: 'uname', password: 'other' };

    it('throws when no url argument', () => {
      let e: ARCAuthDataUpdateEvent;
      assert.throws(() => {
        e = new ARCAuthDataUpdateEvent(undefined, method, authData);
      });
      assert.isUndefined(e);
    });

    it('throws when no method argument', () => {
      let e: ARCAuthDataUpdateEvent;
      assert.throws(() => {
        e = new ARCAuthDataUpdateEvent(url, undefined, authData);
      });
      assert.isUndefined(e);
    });

    it('throws when no authData argument', () => {
      let e: ARCAuthDataUpdateEvent;
      assert.throws(() => {
        e = new ARCAuthDataUpdateEvent(url, method, undefined);
      });
      assert.isUndefined(e);
    });

    it('has readonly url property', () => {
      const e = new ARCAuthDataUpdateEvent(url, method, authData);
      assert.equal(e.url, url, 'has the URL');
      assert.throws(() => {
        // @ts-ignore
        e.url = 'test';
      });
    });

    it('has readonly method property', () => {
      const e = new ARCAuthDataUpdateEvent(url, method, authData);
      assert.equal(e.method, method, 'has the method');
      assert.throws(() => {
        // @ts-ignore
        e.method = 'test';
      });
    });

    it('has readonly authData property', () => {
      const e = new ARCAuthDataUpdateEvent(url, method, authData);
      assert.deepEqual(e.authData, authData, 'has the URL');
      assert.throws(() => {
        // @ts-ignore
        e.authData = 'test';
      });
    });
  });

  describe('ARCAuthDataQueryEvent', () => {
    const url = 'http://domain.com/auth';
    const method = 'x-ntlm';

    it('throws when no url argument', () => {
      let e: ARCAuthDataQueryEvent;
      assert.throws(() => {
        e = new ARCAuthDataQueryEvent(undefined, method);
      });
      assert.isUndefined(e);
    });

    it('throws when no method argument', () => {
      let e: ARCAuthDataQueryEvent;
      assert.throws(() => {
        e = new ARCAuthDataQueryEvent(url, undefined);
      });
      assert.isUndefined(e);
    });

    it('has readonly url property', () => {
      const e = new ARCAuthDataQueryEvent(url, method);
      assert.equal(e.url, url, 'has the URL');
      assert.throws(() => {
        // @ts-ignore
        e.url = 'test';
      });
    });

    it('has readonly method property', () => {
      const e = new ARCAuthDataQueryEvent(url, method);
      assert.equal(e.method, method, 'has the method');
      assert.throws(() => {
        // @ts-ignore
        e.method = 'test';
      });
    });
  });

  describe('ARCAuthDataUpdatedEvent', () => {
    const record: IARCEntityChangeRecord<ARCAuthData> = {
      id: 'test-id',
      rev: 'test-rev',
      oldRev: 'test-old-rev',
      item: {},
    };

    it('throws when no url argument', () => {
      let e: ARCAuthDataUpdatedEvent;
      assert.throws(() => {
        e = new ARCAuthDataUpdatedEvent(undefined);
      });
      assert.isUndefined(e);
    });

    it('has changeRecord url property', () => {
      const e = new ARCAuthDataUpdatedEvent(record);
      assert.deepEqual(e.changeRecord, record, 'has the changeRecord');
      assert.throws(() => {
        // @ts-ignore
        e.changeRecord = 'test';
      });
    });

  });

  describe('update()', () => {
    const url = 'http://domain.com/auth';
    const method = 'x-ntlm';
    const authData = { username: 'uname', password: 'other' };

    it('dispatches the event on the default target', async () => {
      const spy = sinon.spy();
      window.addEventListener(ArcModelEventTypes.AuthData.update, spy);
      await AuthDataEvents.update(url, method, authData);
      window.removeEventListener(ArcModelEventTypes.AuthData.update, spy);
      assert.isTrue(spy.called);
    });

    it('dispatches the event on the passed target', async () => {
      const spy = sinon.spy();
      document.body.addEventListener(ArcModelEventTypes.AuthData.update, spy);
      await AuthDataEvents.update(url, method, authData, document.body);
      document.body.removeEventListener(ArcModelEventTypes.AuthData.update, spy);
      assert.isTrue(spy.called);
    });

    it('has the passed data', async () => {
      const spy = sinon.spy();
      window.addEventListener(ArcModelEventTypes.AuthData.update, spy);
      await AuthDataEvents.update(url, method, authData);
      window.removeEventListener(ArcModelEventTypes.AuthData.update, spy);
      const e = spy.args[0][0] as ARCAuthDataUpdateEvent;
      assert.equal(e.url, url);
      assert.equal(e.method, method);
      assert.deepEqual(e.authData, authData);
    });
  });

  describe('query()', () => {
    const url = 'http://domain.com/auth';
    const method = 'x-ntlm';

    it('dispatches the event on the default target', async () => {
      const spy = sinon.spy();
      window.addEventListener(ArcModelEventTypes.AuthData.query, spy);
      await AuthDataEvents.query(url, method);
      window.removeEventListener(ArcModelEventTypes.AuthData.query, spy);
      assert.isTrue(spy.called);
    });

    it('dispatches the event on the passed target', async () => {
      const spy = sinon.spy();
      document.body.addEventListener(ArcModelEventTypes.AuthData.query, spy);
      await AuthDataEvents.query(url, method, document.body);
      document.body.removeEventListener(ArcModelEventTypes.AuthData.query, spy);
      assert.isTrue(spy.called);
    });

    it('has the passed data', async () => {
      const spy = sinon.spy();
      window.addEventListener(ArcModelEventTypes.AuthData.query, spy);
      await AuthDataEvents.query(url, method);
      window.removeEventListener(ArcModelEventTypes.AuthData.query, spy);
      const e = spy.args[0][0] as ARCAuthDataQueryEvent;
      assert.equal(e.url, url);
      assert.equal(e.method, method);
    });
  });

  describe('State.update()', () => {
    const record: IARCEntityChangeRecord<ARCAuthData> = {
      id: 'test-id',
      rev: 'test-rev',
      oldRev: 'test-old-rev',
      item: {},
    };

    it('dispatches the event on the default target', () => {
      const spy = sinon.spy();
      window.addEventListener(ArcModelEventTypes.AuthData.State.update, spy);
      AuthDataEvents.State.update(record);
      window.removeEventListener(ArcModelEventTypes.AuthData.State.update, spy);
      assert.isTrue(spy.called);
    });

    it('dispatches the event on the passed target', () => {
      const spy = sinon.spy();
      document.body.addEventListener(ArcModelEventTypes.AuthData.State.update, spy);
      AuthDataEvents.State.update(record, document.body);
      document.body.removeEventListener(ArcModelEventTypes.AuthData.State.update, spy);
      assert.isTrue(spy.called);
    });

    it('has the passed data', () => {
      const spy = sinon.spy();
      window.addEventListener(ArcModelEventTypes.AuthData.State.update, spy);
      AuthDataEvents.State.update(record);
      window.removeEventListener(ArcModelEventTypes.AuthData.State.update, spy);
      const e = spy.args[0][0] as ARCAuthDataUpdatedEvent;
      assert.deepEqual(e.changeRecord, record);
    });
  });
});
