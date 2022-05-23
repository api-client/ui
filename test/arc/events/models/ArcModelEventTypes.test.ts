/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { assert } from '@open-wc/testing';
import { ArcModelEventTypes } from  '../../../../src/arc/events/models/ArcModelEventTypes.js';

describe('ArcModelEventTypes', () => {
  describe('Project', () => {
    it('has Project namespace', () => {
      assert.typeOf(ArcModelEventTypes.Project, 'object');
    });

    it('is frozen', () => {
      assert.throws(() => {
        // @ts-ignore
        ArcModelEventTypes.Project = { read: '' };
      });
    });

    [
      ['read', 'modelprojectread'],
      ['readBulk', 'modelprojectreadbulk'],
      ['update', 'modelprojectchange'],
      ['updateBulk', 'modelprojectupdatebulk'],
      ['delete', 'modelprojectdelete'],
      ['list', 'modelprojectlist'],
    ].forEach(([prop, value]) => {
      it(`has ${prop} property`, () => {
        assert.equal(ArcModelEventTypes.Project[prop], value);
      });
    });

    it('has State namespace', () => {
      assert.typeOf(ArcModelEventTypes.Project.State, 'object');
    });

    it('has frozen State namespace', () => {
      assert.throws(() => {
        // @ts-ignore
        ArcModelEventTypes.Project.State = { read: '' };
      });
    });

    [
      ['update', 'modelstateprojectchange'],
      ['delete', 'modelstateprojectdelete'],
    ].forEach(([prop, value]) => {
      it(`has ${prop} property`, () => {
        assert.equal(ArcModelEventTypes.Project.State[prop], value);
      });
    });
  });

  describe('History', () => {
    it('has the History namespace', () => {
      assert.typeOf(ArcModelEventTypes.History, 'object');
    });

    it('is frozen', () => {
      assert.throws(() => {
        // @ts-ignore
        ArcModelEventTypes.History = { read: '' };
      });
    });

    [
      ['read', 'modelhistoryread'],
      ['readBulk', 'modelhistoryreadbulk'],
      ['update', 'modelhistorychange'],
      ['updateBulk', 'modelhistoryupdatebulk'],
      ['delete', 'modelhistorydelete'],
      ['deleteBulk', 'modelhistorydeletebulk'],
      ['undeleteBulk', 'modelhistorysundelete'],
      ['query', 'modelhistoryquery'],
      ['list', 'modelhistorylist'],
    ].forEach(([prop, value]) => {
      it(`has ${prop} property`, () => {
        assert.equal(ArcModelEventTypes.History[prop], value);
      });
    });

    it('has the State namespace', () => {
      assert.typeOf(ArcModelEventTypes.History.State, 'object');
    });

    it('has frozen State namespace', () => {
      assert.throws(() => {
        // @ts-ignore
        ArcModelEventTypes.History.State = { read: '' };
      });
    });

    [
      ['update', 'modelstatehistorychange'],
      ['delete', 'modelstatehistorydelete'],
    ].forEach(([prop, value]) => {
      it(`has ${prop} property`, () => {
        assert.equal(ArcModelEventTypes.History.State[prop], value);
      });
    });
  });

  describe('AuthData', () => {
    it('has AuthData namespace', () => {
      assert.typeOf(ArcModelEventTypes.AuthData, 'object');
    });

    it('is frozen', () => {
      assert.throws(() => {
        // @ts-ignore
        ArcModelEventTypes.AuthData = { read: '' };
      });
    });

    [
      ['update', 'modelauthdataupdate'],
      ['query', 'modelauthdataquery'],
    ].forEach(([prop, value]) => {
      it(`has ${prop} property`, () => {
        assert.equal(ArcModelEventTypes.AuthData[prop], value);
      });
    });

    it('has the State namespace', () => {
      assert.typeOf(ArcModelEventTypes.AuthData.State, 'object');
    });

    it('has frozen State namespace', () => {
      assert.throws(() => {
        // @ts-ignore
        ArcModelEventTypes.AuthData.State = { read: '' };
      });
    });

    [
      ['update', 'modelstateauthdataupdate'],
    ].forEach(([prop, value]) => {
      it(`has ${prop} property`, () => {
        assert.equal(ArcModelEventTypes.AuthData.State[prop], value);
      });
    });
  });

  describe('Host', () => {
    it('has Host namespace', () => {
      assert.typeOf(ArcModelEventTypes.Host, 'object');
    });

    it('is frozen', () => {
      assert.throws(() => {
        // @ts-ignore
        ArcModelEventTypes.Host = { read: '' };
      });
    });

    [
      ['update', 'modelhostrulesupdate'],
      ['updateBulk', 'modelhostrulesupdatebulk'],
      ['delete', 'modelhostrulesdelete'],
      ['list', 'modelhostruleslist'],
    ].forEach(([prop, value]) => {
      it(`has ${prop} property`, () => {
        assert.equal(ArcModelEventTypes.Host[prop], value);
      });
    });

    it('has the State namespace', () => {
      assert.typeOf(ArcModelEventTypes.Host.State, 'object');
    });

    it('has frozen State namespace', () => {
      assert.throws(() => {
        // @ts-ignore
        ArcModelEventTypes.Host.State = { read: '' };
      });
    });

    [
      ['update', 'modelstatehostrulesupdate'],
      ['delete', 'modelstatehostrulesdelete'],
    ].forEach(([prop, value]) => {
      it(`has ${prop} property`, () => {
        assert.equal(ArcModelEventTypes.Host.State[prop], value);
      });
    });
  });

  describe('ClientCertificate', () => {
    it('has ClientCertificate namespace', () => {
      assert.typeOf(ArcModelEventTypes.ClientCertificate, 'object');
    });

    it('is frozen', () => {
      assert.throws(() => {
        // @ts-ignore
        ArcModelEventTypes.ClientCertificate = { read: '' };
      });
    });

    [
      ['read', 'modelclientcertificateread'],
      ['list', 'modelclientcertificatelist'],
      ['delete', 'modelclientcertificatedelete'],
      ['update', 'modelclientcertificateupdate'],
      ['insert', 'modelclientcertificateinsert'],
    ].forEach(([prop, value]) => {
      it(`has ${prop} property`, () => {
        assert.equal(ArcModelEventTypes.ClientCertificate[prop], value);
      });
    });

    it('has the State namespace', () => {
      assert.typeOf(ArcModelEventTypes.ClientCertificate.State, 'object');
    });

    it('has frozen State namespace', () => {
      assert.throws(() => {
        // @ts-ignore
        ArcModelEventTypes.ClientCertificate.State = { read: '' };
      });
    });

    [
      ['update', 'modelstateclientcertificateupdate'],
      ['delete', 'modelstateclientcertificatedelete'],
    ].forEach(([prop, value]) => {
      it(`has ${prop} property`, () => {
        assert.equal(ArcModelEventTypes.ClientCertificate.State[prop], value);
      });
    });
  });

  describe('WSUrlHistory', () => {
    it('has ClientCertificate namespace', () => {
      assert.typeOf(ArcModelEventTypes.WSUrlHistory, 'object');
    });

    it('is frozen', () => {
      assert.throws(() => {
        // @ts-ignore
        ArcModelEventTypes.WSUrlHistory = { read: '' };
      });
    });

    [
      ['list', 'modelwsurlhistorylist'],
      ['insert', 'modelwsurlhistoryinsert'],
      ['query', 'modelwsurlhistoryquery'],
    ].forEach(([prop, value]) => {
      it(`has ${prop} property`, () => {
        assert.equal(ArcModelEventTypes.WSUrlHistory[prop], value);
      });
    });

    it('has the State namespace', () => {
      assert.typeOf(ArcModelEventTypes.WSUrlHistory.State, 'object');
    });

    it('has frozen State namespace', () => {
      assert.throws(() => {
        // @ts-ignore
        ArcModelEventTypes.WSUrlHistory.State = { read: '' };
      });
    });

    [
      ['update', 'modelstatewsurlhistoryupdate'],
    ].forEach(([prop, value]) => {
      it(`has ${prop} property`, () => {
        assert.equal(ArcModelEventTypes.WSUrlHistory.State[prop], value);
      });
    });
  });

  describe('UrlHistory', () => {
    it('has UrlHistory namespace', () => {
      assert.typeOf(ArcModelEventTypes.UrlHistory, 'object');
    });

    it('is frozen', () => {
      assert.throws(() => {
        // @ts-ignore
        ArcModelEventTypes.UrlHistory = { read: '' };
      });
    });

    [
      ['list', 'modelurlhistorylist'],
      ['insert', 'modelurlhistoryinsert'],
      ['query', 'modelurlhistoryquery'],
      ['delete', 'modelurlhistorydelete'],
    ].forEach(([prop, value]) => {
      it(`has ${prop} property`, () => {
        assert.equal(ArcModelEventTypes.UrlHistory[prop], value);
      });
    });

    it('has the State namespace', () => {
      assert.typeOf(ArcModelEventTypes.UrlHistory.State, 'object');
    });

    it('has frozen State namespace', () => {
      assert.throws(() => {
        // @ts-ignore
        ArcModelEventTypes.UrlHistory.State = { read: '' };
      });
    });

    [
      ['update', 'modelstateurlhistoryupdate'],
      ['delete', 'modelstateurlhistorydelete'],
    ].forEach(([prop, value]) => {
      it(`has ${prop} property`, () => {
        assert.equal(ArcModelEventTypes.UrlHistory.State[prop], value);
      });
    });
  });

  describe('Environment', () => {
    it('has UrlHistory namespace', () => {
      assert.typeOf(ArcModelEventTypes.Environment, 'object');
    });

    it('is frozen', () => {
      assert.throws(() => {
        // @ts-ignore
        ArcModelEventTypes.Environment = { read: '' };
      });
    });

    [
      ['read', 'modelenvironmentread'],
      ['update', 'modelenvironmentupdate'],
      ['delete', 'modelenvironmentdelete'],
      ['list', 'modelenvironmentlist'],
      ['current', 'modelenvironmentcurrent'],
      ['select', 'modelenvironmentselect'],
    ].forEach(([prop, value]) => {
      it(`has ${prop} property`, () => {
        assert.equal(ArcModelEventTypes.Environment[prop], value);
      });
    });

    it('has the State namespace', () => {
      assert.typeOf(ArcModelEventTypes.Environment.State, 'object');
    });

    it('has frozen State namespace', () => {
      assert.throws(() => {
        // @ts-ignore
        ArcModelEventTypes.Environment.State = { read: '' };
      });
    });

    [
      ['update', 'modelstateenvironmentupdate'],
      ['delete', 'modelstateenvironmentdelete'],
      ['select', 'modelstateenvironmentselect'],
    ].forEach(([prop, value]) => {
      it(`has ${prop} property`, () => {
        assert.equal(ArcModelEventTypes.Environment.State[prop], value);
      });
    });
  });

  describe('Variable', () => {
    it('has Variable namespace', () => {
      assert.typeOf(ArcModelEventTypes.Variable, 'object');
    });

    it('is frozen', () => {
      assert.throws(() => {
        // @ts-ignore
        ArcModelEventTypes.Variable = { read: '' };
      });
    });

    [
      ['update', 'modelvariableupdate'],
      ['delete', 'modelvariabledelete'],
      ['list', 'modelvariablelist'],
      ['set', 'modelvariableset'],
    ].forEach(([prop, value]) => {
      it(`has ${prop} property`, () => {
        assert.equal(ArcModelEventTypes.Variable[prop], value);
      });
    });

    it('has the State namespace', () => {
      assert.typeOf(ArcModelEventTypes.Variable.State, 'object');
    });

    it('has frozen State namespace', () => {
      assert.throws(() => {
        // @ts-ignore
        ArcModelEventTypes.Variable.State = { read: '' };
      });
    });

    [
      ['update', 'modelstatevariableupdate'],
      ['delete', 'modelstatevariabledelete'],
    ].forEach(([prop, value]) => {
      it(`has ${prop} property`, () => {
        assert.equal(ArcModelEventTypes.Variable.State[prop], value);
      });
    });
  });

  describe('RestApi', () => {
    it('has RestApi namespace', () => {
      assert.typeOf(ArcModelEventTypes.RestApi, 'object');
    });

    it('is frozen', () => {
      assert.throws(() => {
        // @ts-ignore
        ArcModelEventTypes.RestApi = { read: '' };
      });
    });

    [
      ['list', 'modelrestapilist'],
      ['read', 'modelrestapiread'],
      ['dataRead', 'modelrestapidataread'],
      ['update', 'modelrestapiupdate'],
      ['dataUpdate', 'modelrestapidataupdate'],
      ['updateBulk', 'modelrestapiupdatebulk'],
      ['delete', 'modelrestapidelete'],
      ['versionDelete', 'modelrestapiversiondelete'],
    ].forEach(([prop, value]) => {
      it(`has ${prop} property`, () => {
        assert.equal(ArcModelEventTypes.RestApi[prop], value);
      });
    });

    it('has the State namespace', () => {
      assert.typeOf(ArcModelEventTypes.RestApi.State, 'object');
    });

    it('has frozen State namespace', () => {
      assert.throws(() => {
        // @ts-ignore
        ArcModelEventTypes.RestApi.State = { read: '' };
      });
    });

    [
      ['update', 'modelstaterestapiupdate'],
      ['dataUpdate', 'modelstaterestapidataupdate'],
      ['delete', 'modelstaterestapidelete'],
      ['versionDelete', 'modelstaterestapiversiondelete'],
    ].forEach(([prop, value]) => {
      it(`has ${prop} property`, () => {
        assert.equal(ArcModelEventTypes.RestApi.State[prop], value);
      });
    });
  });

  describe('unique events', () => {
    const names = [];

    function ensureUnique(namespace: string, src: any): void {
      for (const [key, value] of Object.entries(src)) {
        if (names.includes(value)) {
          throw new Error(`${namespace}.${key} has duplicated event name ${value}`);
        }
        names.push(value);
      }
    }

    it('has unique events for Project', () => {
      ensureUnique('ModelingEventTypes.Project', ArcModelEventTypes.Project);
    });

    it('has unique events for Project.State', () => {
      ensureUnique('ModelingEventTypes.Project.State', ArcModelEventTypes.Project.State);
    });

    it('has unique events for History', () => {
      ensureUnique('ModelingEventTypes.History', ArcModelEventTypes.History);
    });

    it('has unique events for History.State', () => {
      ensureUnique('ModelingEventTypes.History.State', ArcModelEventTypes.History.State);
    });

    it('has unique events for AuthData', () => {
      ensureUnique('ModelingEventTypes.AuthData', ArcModelEventTypes.AuthData);
    });

    it('has unique events for AuthData.State', () => {
      ensureUnique('ModelingEventTypes.AuthData.State', ArcModelEventTypes.AuthData.State);
    });

    it('has unique events for Host', () => {
      ensureUnique('ModelingEventTypes.Host', ArcModelEventTypes.Host);
    });

    it('has unique events for Host.State', () => {
      ensureUnique('ModelingEventTypes.Host.State', ArcModelEventTypes.Host.State);
    });

    it('has unique events for ClientCertificate', () => {
      ensureUnique('ModelingEventTypes.ClientCertificate', ArcModelEventTypes.ClientCertificate);
    });

    it('has unique events for ClientCertificate.State', () => {
      ensureUnique('ModelingEventTypes.ClientCertificate.State', ArcModelEventTypes.ClientCertificate.State);
    });

    it('has unique events for WSUrlHistory', () => {
      ensureUnique('ModelingEventTypes.WSUrlHistory', ArcModelEventTypes.WSUrlHistory);
    });

    it('has unique events for WSUrlHistory.State', () => {
      ensureUnique('ModelingEventTypes.WSUrlHistory.State', ArcModelEventTypes.WSUrlHistory.State);
    });

    it('has unique events for UrlHistory', () => {
      ensureUnique('ModelingEventTypes.UrlHistory', ArcModelEventTypes.UrlHistory);
    });

    it('has unique events for UrlHistory.State', () => {
      ensureUnique('ModelingEventTypes.UrlHistory.State', ArcModelEventTypes.UrlHistory.State);
    });

    it('has unique events for Environment', () => {
      ensureUnique('ModelingEventTypes.Environment', ArcModelEventTypes.Environment);
    });

    it('has unique events for Environment.State', () => {
      ensureUnique('ModelingEventTypes.Environment.State', ArcModelEventTypes.Environment.State);
    });

    it('has unique events for Variable', () => {
      ensureUnique('ModelingEventTypes.Variable', ArcModelEventTypes.Variable);
    });

    it('has unique events for Variable.State', () => {
      ensureUnique('ModelingEventTypes.Variable.State', ArcModelEventTypes.Variable.State);
    });

    it('has unique events for RestApi', () => {
      ensureUnique('ModelingEventTypes.RestApi', ArcModelEventTypes.RestApi);
    });

    it('has unique events for RestApi.State', () => {
      ensureUnique('ModelingEventTypes.RestApi.State', ArcModelEventTypes.RestApi.State);
    });
  });
});
