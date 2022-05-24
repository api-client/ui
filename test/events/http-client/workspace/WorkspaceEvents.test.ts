/* eslint-disable @typescript-eslint/ban-ts-comment */
import { assert } from '@open-wc/testing';
import sinon from 'sinon';
import { ContextReadEvent, ContextUpdateEvent, ICertificate } from '@api-client/core/build/browser.js';
import {
  IWorkspaceAppendDetail,
  WorkspaceEvents,
} from '../../../../src/events/http-client/workspace/WorkspaceEvents.js';
import { EventTypes } from '../../../../src/events/EventTypes.js';
import { IHttpWorkspace } from '../../../../src/http-client/models/HttpWorkspace.js';

describe('WorkspaceEvents', () => {
  describe('read()', () => {
    const key = 'test-id';

    it('dispatches the event on the default target', async () => {
      const spy = sinon.spy();
      window.addEventListener(EventTypes.HttpClient.Workspace.read, spy);
      await WorkspaceEvents.read(key);
      window.removeEventListener(EventTypes.HttpClient.Workspace.read, spy);
      assert.isTrue(spy.called);
    });

    it('dispatches the event on the passed target', async () => {
      const spy = sinon.spy();
      document.body.addEventListener(EventTypes.HttpClient.Workspace.read, spy);
      await WorkspaceEvents.read(key, document.body);
      document.body.removeEventListener(EventTypes.HttpClient.Workspace.read, spy);
      assert.isTrue(spy.called);
    });

    it('has the passed data', async () => {
      const spy = sinon.spy();
      window.addEventListener(EventTypes.HttpClient.Workspace.read, spy);
      await WorkspaceEvents.read(key);
      window.removeEventListener(EventTypes.HttpClient.Workspace.read, spy);
      const e = spy.args[0][0] as ContextReadEvent<ICertificate>;
      assert.equal(e.detail.key, key);
    });
  });

  describe('write()', () => {
    const key = 'test-id';
    const contents: IHttpWorkspace = {
      kind: 'HttpClient#Workspace',
    };

    it('dispatches the event on the default target', async () => {
      const spy = sinon.spy();
      window.addEventListener(EventTypes.HttpClient.Workspace.write, spy);
      await WorkspaceEvents.write(key, contents);
      window.removeEventListener(EventTypes.HttpClient.Workspace.write, spy);
      assert.isTrue(spy.called);
    });

    it('dispatches the event on the passed target', async () => {
      const spy = sinon.spy();
      document.body.addEventListener(EventTypes.HttpClient.Workspace.write, spy);
      await WorkspaceEvents.write(key, contents, document.body);
      document.body.removeEventListener(EventTypes.HttpClient.Workspace.write, spy);
      assert.isTrue(spy.called);
    });

    it('has the passed data', async () => {
      const spy = sinon.spy();
      window.addEventListener(EventTypes.HttpClient.Workspace.write, spy);
      await WorkspaceEvents.write(key, contents);
      window.removeEventListener(EventTypes.HttpClient.Workspace.write, spy);
      const e = spy.args[0][0] as ContextUpdateEvent<IHttpWorkspace>;
      assert.deepEqual(e.detail.item, contents);
    });
  });

  describe('append()', () => {
    const key = 'test-id';
    const kind = 'Core#Kind';
    const parent = 'parent-id';

    it('dispatches the event on the default target', async () => {
      const spy = sinon.spy();
      window.addEventListener(EventTypes.HttpClient.Workspace.append, spy);
      WorkspaceEvents.append(key, kind);
      window.removeEventListener(EventTypes.HttpClient.Workspace.append, spy);
      assert.isTrue(spy.called);
    });

    it('dispatches the event on the passed target', async () => {
      const spy = sinon.spy();
      document.body.addEventListener(EventTypes.HttpClient.Workspace.append, spy);
      WorkspaceEvents.append(key, kind, parent, document.body);
      document.body.removeEventListener(EventTypes.HttpClient.Workspace.append, spy);
      assert.isTrue(spy.called);
    });

    it('has the passed data', async () => {
      const spy = sinon.spy();
      window.addEventListener(EventTypes.HttpClient.Workspace.append, spy);
      WorkspaceEvents.append(key, kind, parent);
      window.removeEventListener(EventTypes.HttpClient.Workspace.append, spy);
      const e = spy.args[0][0] as CustomEvent<IWorkspaceAppendDetail>;
      assert.deepEqual(e.detail.key, key);
      assert.deepEqual(e.detail.kind, kind);
      assert.deepEqual(e.detail.parent, parent);
    });
  });

  describe('triggerWrite()', () => {
    it('dispatches the event on the default target', async () => {
      const spy = sinon.spy();
      window.addEventListener(EventTypes.HttpClient.Workspace.triggerWrite, spy);
      WorkspaceEvents.triggerWrite();
      window.removeEventListener(EventTypes.HttpClient.Workspace.triggerWrite, spy);
      assert.isTrue(spy.called);
    });

    it('dispatches the event on the passed target', async () => {
      const spy = sinon.spy();
      document.body.addEventListener(EventTypes.HttpClient.Workspace.triggerWrite, spy);
      WorkspaceEvents.triggerWrite(document.body);
      document.body.removeEventListener(EventTypes.HttpClient.Workspace.triggerWrite, spy);
      assert.isTrue(spy.called);
    });
  });

  describe('State.write()', () => {
    it('dispatches the event on the default target', async () => {
      const spy = sinon.spy();
      window.addEventListener(EventTypes.HttpClient.Workspace.State.write, spy);
      WorkspaceEvents.State.write();
      window.removeEventListener(EventTypes.HttpClient.Workspace.State.write, spy);
      assert.isTrue(spy.called);
    });

    it('dispatches the event on the passed target', async () => {
      const spy = sinon.spy();
      document.body.addEventListener(EventTypes.HttpClient.Workspace.State.write, spy);
      WorkspaceEvents.State.write(document.body);
      document.body.removeEventListener(EventTypes.HttpClient.Workspace.State.write, spy);
      assert.isTrue(spy.called);
    });
  });
});
