/* eslint-disable @typescript-eslint/no-explicit-any */
import { assert } from '@open-wc/testing';
import { ensureUnique } from './EventsTestHelpers.js';
import { EventTypes } from '../../src/events/EventTypes.js'

describe('events', () => {
  describe('EventTypes', () => {
    describe('HttpClient', () => {
      describe('Workspace', () => {
        it('has the namespace', () => {
          assert.typeOf(EventTypes.HttpClient.Workspace, 'object');
        });

        it('has the State namespace', () => {
          assert.typeOf(EventTypes.HttpClient.Workspace.State, 'object');
        });

        [
          ['read', 'httpclientwsread'],
          ['write', 'httpclientwswrite'],
          ['append', 'httpclientwsappend'],
          ['triggerWrite', 'httpclientwstriggerwrite'],
        ].forEach(([prop, value]) => {
          it(`has ${prop} property`, () => {
            assert.equal(EventTypes.HttpClient.Workspace[prop], value);
          });
        });
        
        [
          ['write', 'httpclientwsstatewrite'],
        ].forEach(([prop, value]) => {
          it(`has ${prop} property`, () => {
            assert.equal(EventTypes.HttpClient.Workspace.State[prop], value);
          });
        });
    
        it('has unique events', () => {
          ensureUnique('EventTypes.HttpClient.Workspace', EventTypes.HttpClient.Workspace);
        });

        it('has unique events on the State namespace', () => {
          ensureUnique('EventTypes.HttpClient.Workspace.State', EventTypes.HttpClient.Workspace.State);
        });
      });

      describe('Model', () => {
        describe('Project', () => {
          it('has Project namespace', () => {
            assert.typeOf(EventTypes.HttpClient.Model.Project, 'object');
          });
      
          [
            ['read', 'modelprojectread'],
            ['readBulk', 'modelprojectreadbulk'],
            ['update', 'modelprojectchange'],
            ['updateBulk', 'modelprojectupdatebulk'],
            ['delete', 'modelprojectdelete'],
            ['deleteBulk', 'modelprojectdeletebulk'],
            ['undeleteBulk', 'modelprojectundeletebulk'],
            ['list', 'modelprojectlist'],
          ].forEach(([prop, value]) => {
            it(`has ${prop} property`, () => {
              assert.equal(EventTypes.HttpClient.Model.Project[prop], value);
            });
          });
      
          it('has State namespace', () => {
            assert.typeOf(EventTypes.HttpClient.Model.Project.State, 'object');
          });
      
          [
            ['update', 'modelstateprojectchange'],
            ['delete', 'modelstateprojectdelete'],
          ].forEach(([prop, value]) => {
            it(`has ${prop} property`, () => {
              assert.equal(EventTypes.HttpClient.Model.Project.State[prop], value);
            });
          });

          it('has unique events', () => {
            ensureUnique('EventTypes.HttpClient.Model.Project', EventTypes.HttpClient.Model.Project);
          });
  
          it('has unique events on the State namespace', () => {
            ensureUnique('EventTypes.HttpClient.Model.Project.State', EventTypes.HttpClient.Model.Project.State);
          });
        });
      
        describe('History', () => {
          it('has the History namespace', () => {
            assert.typeOf(EventTypes.HttpClient.Model.History, 'object');
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
              assert.equal(EventTypes.HttpClient.Model.History[prop], value);
            });
          });
      
          it('has the State namespace', () => {
            assert.typeOf(EventTypes.HttpClient.Model.History.State, 'object');
          });
      
          [
            ['update', 'modelstatehistorychange'],
            ['delete', 'modelstatehistorydelete'],
          ].forEach(([prop, value]) => {
            it(`has ${prop} property`, () => {
              assert.equal(EventTypes.HttpClient.Model.History.State[prop], value);
            });
          });

          it('has unique events', () => {
            ensureUnique('EventTypes.HttpClient.Model.History', EventTypes.HttpClient.Model.History);
          });
  
          it('has unique events on the State namespace', () => {
            ensureUnique('EventTypes.HttpClient.Model.History.State', EventTypes.HttpClient.Model.History.State);
          });
        });
      
        describe('AuthData', () => {
          it('has AuthData namespace', () => {
            assert.typeOf(EventTypes.HttpClient.Model.AuthData, 'object');
          });
      
          [
            ['update', 'modelauthdataupdate'],
            ['query', 'modelauthdataquery'],
          ].forEach(([prop, value]) => {
            it(`has ${prop} property`, () => {
              assert.equal(EventTypes.HttpClient.Model.AuthData[prop], value);
            });
          });
      
          it('has the State namespace', () => {
            assert.typeOf(EventTypes.HttpClient.Model.AuthData.State, 'object');
          });
      
          [
            ['update', 'modelstateauthdataupdate'],
          ].forEach(([prop, value]) => {
            it(`has ${prop} property`, () => {
              assert.equal(EventTypes.HttpClient.Model.AuthData.State[prop], value);
            });
          });

          it('has unique events', () => {
            ensureUnique('EventTypes.HttpClient.Model.AuthData', EventTypes.HttpClient.Model.AuthData);
          });
  
          it('has unique events on the State namespace', () => {
            ensureUnique('EventTypes.HttpClient.Model.AuthData.State', EventTypes.HttpClient.Model.AuthData.State);
          });
        });
      
        describe('Host', () => {
          it('has Host namespace', () => {
            assert.typeOf(EventTypes.HttpClient.Model.Host, 'object');
          });
      
          [
            ['update', 'modelhostrulesupdate'],
            ['updateBulk', 'modelhostrulesupdatebulk'],
            ['delete', 'modelhostrulesdelete'],
            ['deleteBulk', 'modelhostrulesdeletebulk'],
            ['list', 'modelhostruleslist'],
          ].forEach(([prop, value]) => {
            it(`has ${prop} property`, () => {
              assert.equal(EventTypes.HttpClient.Model.Host[prop], value);
            });
          });
      
          it('has the State namespace', () => {
            assert.typeOf(EventTypes.HttpClient.Model.Host.State, 'object');
          });
      
          [
            ['update', 'modelstatehostrulesupdate'],
            ['delete', 'modelstatehostrulesdelete'],
          ].forEach(([prop, value]) => {
            it(`has ${prop} property`, () => {
              assert.equal(EventTypes.HttpClient.Model.Host.State[prop], value);
            });
          });

          it('has unique events', () => {
            ensureUnique('EventTypes.HttpClient.Model.Host', EventTypes.HttpClient.Model.Host);
          });
  
          it('has unique events on the State namespace', () => {
            ensureUnique('EventTypes.HttpClient.Model.Host.State', EventTypes.HttpClient.Model.Host.State);
          });
        });
      
        describe('Certificate', () => {
          it('has Certificate namespace', () => {
            assert.typeOf(EventTypes.HttpClient.Model.Certificate, 'object');
          });
      
          [
            ['read', 'modelclientcertificateread'],
            ['list', 'modelclientcertificatelist'],
            ['delete', 'modelclientcertificatedelete'],
            ['update', 'modelclientcertificateupdate'],
            ['insert', 'modelclientcertificateinsert'],
          ].forEach(([prop, value]) => {
            it(`has ${prop} property`, () => {
              assert.equal(EventTypes.HttpClient.Model.Certificate[prop], value);
            });
          });
      
          it('has the State namespace', () => {
            assert.typeOf(EventTypes.HttpClient.Model.Certificate.State, 'object');
          });
      
          [
            ['update', 'modelstateclientcertificateupdate'],
            ['delete', 'modelstateclientcertificatedelete'],
          ].forEach(([prop, value]) => {
            it(`has ${prop} property`, () => {
              assert.equal(EventTypes.HttpClient.Model.Certificate.State[prop], value);
            });
          });

          it('has unique events', () => {
            ensureUnique('EventTypes.HttpClient.Model.Certificate', EventTypes.HttpClient.Model.Certificate);
          });
  
          it('has unique events on the State namespace', () => {
            ensureUnique('EventTypes.HttpClient.Model.Certificate.State', EventTypes.HttpClient.Model.Certificate.State);
          });
        });
      });
    });

    describe('SchemaDesign', () => {
      it('has the namespace', () => {
        assert.typeOf(EventTypes.SchemaDesign, 'object');
      });

      [
        ['changed', 'schemadesignchange'],
      ].forEach(([prop, value]) => {
        it(`has ${prop} property`, () => {
          assert.equal(EventTypes.SchemaDesign[prop], value);
        });
      });
  
      it('has State namespace', () => {
        assert.typeOf(EventTypes.SchemaDesign.State, 'object');
      });
  
      [
        ['nameChanged', 'schemadesignnamechange'],
      ].forEach(([prop, value]) => {
        it(`has ${prop} property`, () => {
          assert.equal(EventTypes.SchemaDesign.State[prop], value);
        });
      });

      it('has unique events', () => {
        ensureUnique('EventTypes.SchemaDesign', EventTypes.SchemaDesign);
      });

      it('has unique events on the State namespace', () => {
        ensureUnique('EventTypes.SchemaDesign.State', EventTypes.SchemaDesign.State);
      });
    });

    describe('AppData', () => {
      describe('Http', () => {
        describe('UrlHistory', () => {
          it('has the namespace', () => {
            assert.typeOf(EventTypes.AppData.Http.UrlHistory, 'object');
          });
    
          [
            ['add', 'appdatahttpurlhistoryadd'],
            ['query', 'appdatahttpurlhistoryquery'],
            ['delete', 'appdatahttpurlhistorydelete'],
            ['clear', 'appdatahttpurlhistoryclear'],
          ].forEach(([prop, value]) => {
            it(`has ${prop} property`, () => {
              assert.equal(EventTypes.AppData.Http.UrlHistory[prop], value);
            });
          });
      
          it('has State namespace', () => {
            assert.typeOf(EventTypes.AppData.Http.UrlHistory.State, 'object');
          });
      
          [
            ['clear', 'appdatahttpurlhistorystateclear'],
            ['delete', 'appdatahttpurlhistorystatedelete'],
          ].forEach(([prop, value]) => {
            it(`has ${prop} property`, () => {
              assert.equal(EventTypes.AppData.Http.UrlHistory.State[prop], value);
            });
          });
    
          it('has unique events', () => {
            ensureUnique('EventTypes.AppData.Http.UrlHistory', EventTypes.AppData.Http.UrlHistory);
          });
    
          it('has unique events on the State namespace', () => {
            ensureUnique('EventTypes.AppData.Http.UrlHistory.State', EventTypes.AppData.Http.UrlHistory.State);
          });
        });
      });

      describe('Ws', () => {
        describe('UrlHistory', () => {
          it('has the namespace', () => {
            assert.typeOf(EventTypes.AppData.Ws.UrlHistory, 'object');
          });
    
          [
            ['add', 'appdatawsurlhistoryadd'],
            ['query', 'appdatawsurlhistoryquery'],
            ['delete', 'appdatawsurlhistorydelete'],
            ['clear', 'appdatawsurlhistoryclear'],
          ].forEach(([prop, value]) => {
            it(`has ${prop} property`, () => {
              assert.equal(EventTypes.AppData.Ws.UrlHistory[prop], value);
            });
          });
      
          it('has State namespace', () => {
            assert.typeOf(EventTypes.AppData.Ws.UrlHistory.State, 'object');
          });
      
          [
            ['clear', 'appdatawsstateurlhistoryclear'],
            ['delete', 'appdatawsstateurlhistorydelete'],
          ].forEach(([prop, value]) => {
            it(`has ${prop} property`, () => {
              assert.equal(EventTypes.AppData.Ws.UrlHistory.State[prop], value);
            });
          });
    
          it('has unique events', () => {
            ensureUnique('EventTypes.AppData.Ws.UrlHistory', EventTypes.AppData.Ws.UrlHistory);
          });
    
          it('has unique events on the State namespace', () => {
            ensureUnique('EventTypes.AppData.Ws.UrlHistory.State', EventTypes.AppData.Ws.UrlHistory.State);
          });
        });
      });
    });

    describe('HttpProject', () => {
      describe('namespace', () => {
        it('has the namespace', () => {
          assert.typeOf(EventTypes.HttpProject, 'object');
        });
  
        [
          ['changed', 'httpprojectchange'],
        ].forEach(([prop, value]) => {
          it(`has ${prop} property`, () => {
            assert.equal(EventTypes.HttpProject[prop], value);
          });
        });
    
        it('has State namespace', () => {
          assert.typeOf(EventTypes.HttpProject.State, 'object');
        });
    
        [
          ['nameChanged', 'httpprojectnamechange'],
        ].forEach(([prop, value]) => {
          it(`has ${prop} property`, () => {
            assert.equal(EventTypes.HttpProject.State[prop], value);
          });
        });
  
        it('has unique events', () => {
          ensureUnique('EventTypes.HttpProject', EventTypes.HttpProject);
        });
  
        it('has unique events on the State namespace', () => {
          ensureUnique('EventTypes.HttpProject.State', EventTypes.HttpProject.State);
        });
      });

      describe('Ui namespace', () => {
        it('has the namespace', () => {
          assert.typeOf(EventTypes.HttpProject.Ui, 'object');
        });
  
        [
          ['delete', 'appdatauiprojectdelete'],
        ].forEach(([prop, value]) => {
          it(`has ${prop} property`, () => {
            assert.equal(EventTypes.HttpProject.Ui[prop], value);
          });
        });
    
        it('has HttpRequest namespace', () => {
          assert.typeOf(EventTypes.HttpProject.Ui.HttpRequest, 'object');
        });
    
        [
          ['set', 'appdatauiprojectrequestset'],
          ['get', 'appdatauiprojectrequestget'],
          ['delete', 'appdatauiprojectrequestdelete'],
        ].forEach(([prop, value]) => {
          it(`has ${prop} property`, () => {
            assert.equal(EventTypes.HttpProject.Ui.HttpRequest[prop], value);
          });
        });
  
        it('has unique events', () => {
          ensureUnique('EventTypes.HttpProject.Ui', EventTypes.HttpProject.Ui);
        });
  
        it('has unique events on the State namespace', () => {
          ensureUnique('EventTypes.HttpProject.Ui.HttpRequest', EventTypes.HttpProject.Ui.HttpRequest);
        });
      });
    });

    describe('Http', () => {
      describe('Request namespace', () => {
        it('has the namespace', () => {
          assert.typeOf(EventTypes.Http.Request, 'object');
        });
  
        [
          ['send', 'requestsend'],
          ['rename', 'requestrename'],
        ].forEach(([prop, value]) => {
          it(`has ${prop} property`, () => {
            assert.equal(EventTypes.Http.Request[prop], value);
          });
        });
    
        it('has State namespace', () => {
          assert.typeOf(EventTypes.Http.Request.State, 'object');
        });
    
        [
          ['urlChange', 'requeststateurlchange'],
          ['contentTypeChange', 'requeststatecontenttypechange'],
        ].forEach(([prop, value]) => {
          it(`has ${prop} property`, () => {
            assert.equal(EventTypes.Http.Request.State[prop], value);
          });
        });
  
        it('has unique events', () => {
          ensureUnique('EventTypes.Http.Request', EventTypes.Http.Request);
        });
  
        it('has unique events on the State namespace', () => {
          ensureUnique('EventTypes.Http.Request.State', EventTypes.Http.Request.State);
        });
      });
    });

    describe('Store', () => {
      describe('Store namespace', () => {
        it('has the namespace', () => {
          assert.typeOf(EventTypes.Store, 'object');
        });
  
        [
          ['info', 'storebackendinfo'],
          ['initEnvironment', 'configstoreinitenv'],
        ].forEach(([prop, value]) => {
          it(`has ${prop} property`, () => {
            assert.equal(EventTypes.Store[prop], value);
          });
        });
    
        it('has unique events', () => {
          ensureUnique('EventTypes.Store', EventTypes.Store);
        });
      });

      describe('Global namespace', () => {
        it('has the namespace', () => {
          assert.typeOf(EventTypes.Store, 'object');
        });
  
        [
          ['setEnv', 'storesetgloablenvironment'],
          ['getEnv', 'storegetgloablenvironment'],
        ].forEach(([prop, value]) => {
          it(`has ${prop} property`, () => {
            assert.equal(EventTypes.Store.Global[prop], value);
          });
        });
    
        it('has unique events', () => {
          ensureUnique('EventTypes.Store.Global', EventTypes.Store.Global);
        });
      });

      describe('Auth namespace', () => {
        it('has the namespace', () => {
          assert.typeOf(EventTypes.Store, 'object');
        });
  
        [
          ['isAuthenticated', 'storeaisauthenticated'],
          ['authenticate', 'storeauthenticate'],
          ['getToken', 'storeauthgettoken'],
        ].forEach(([prop, value]) => {
          it(`has ${prop} property`, () => {
            assert.equal(EventTypes.Store.Auth[prop], value);
          });
        });
    
        it('has unique events', () => {
          ensureUnique('EventTypes.Store.Auth', EventTypes.Store.Auth);
        });
      });

      describe('File namespace', () => {
        it('has the namespace', () => {
          assert.typeOf(EventTypes.Store, 'object');
        });
  
        [
          ['list', 'storefileslist'],
          ['listShared', 'storefileslistshared'],
          ['create', 'storefilescreate'],
          ['createDefault', 'storefilescreatedefault'],
          ['read', 'storefilesread'],
          ['patch', 'storefilespatch'],
          ['delete', 'storefilesdelete'],
          ['patchUsers', 'storefilespatchusers'],
          ['listUsers', 'storefileslistusers'],
          ['observeFiles', 'storefilesobservefiles'],
          ['unobserveFiles', 'storefilesunobservefiles'],
          ['observeFile', 'storefilesobservefile'],
          ['unobserveFile', 'storefilesunobservefile'],
        ].forEach(([prop, value]) => {
          it(`has ${prop} property`, () => {
            assert.equal(EventTypes.Store.File[prop], value);
          });
        });
    
        it('has unique events', () => {
          ensureUnique('EventTypes.Store.File', EventTypes.Store.File);
        });
      });

      describe('File.State namespace', () => {
        it('has the namespace', () => {
          assert.typeOf(EventTypes.Store, 'object');
        });
  
        [
          ['change', 'storefileschange'],
          ['fileChange', 'storefilechange'],
        ].forEach(([prop, value]) => {
          it(`has ${prop} property`, () => {
            assert.equal(EventTypes.Store.File.State[prop], value);
          });
        });
    
        it('has unique events', () => {
          ensureUnique('EventTypes.Store.File.State', EventTypes.Store.File.State);
        });
      });

      describe('User namespace', () => {
        it('has the namespace', () => {
          assert.typeOf(EventTypes.Store, 'object');
        });
  
        [
          ['me', 'storeuserme'],
          ['list', 'storeuserlist'],
          ['read', 'storeuserread'],
        ].forEach(([prop, value]) => {
          it(`has ${prop} property`, () => {
            assert.equal(EventTypes.Store.User[prop], value);
          });
        });
    
        it('has unique events', () => {
          ensureUnique('EventTypes.Store.User', EventTypes.Store.User);
        });
      });

      describe('History namespace', () => {
        it('has the namespace', () => {
          assert.typeOf(EventTypes.Store, 'object');
        });
  
        [
          ['create', 'storehistorycreate'],
          ['createBulk', 'storehistorycreatebulk'],
          ['list', 'storehistorylist'],
          ['delete', 'storehistorydelete'],
          ['read', 'storehistoryread'],
        ].forEach(([prop, value]) => {
          it(`has ${prop} property`, () => {
            assert.equal(EventTypes.Store.History[prop], value);
          });
        });
    
        it('has unique events', () => {
          ensureUnique('EventTypes.Store.History', EventTypes.Store.History);
        });
      });
    });

    describe('Config', () => {
      describe('Environment namespace', () => {
        it('has the namespace', () => {
          assert.typeOf(EventTypes.Config.Environment, 'object');
        });
    
        it('has unique events', () => {
          ensureUnique('EventTypes.Config.Environment', EventTypes.Config.Environment);
        });
      });

      describe('Session namespace', () => {
        it('has the namespace', () => {
          assert.typeOf(EventTypes.Config.Session, 'object');
        });
    
        it('has unique events', () => {
          ensureUnique('EventTypes.Config.Session', EventTypes.Config.Session);
        });
      });

      describe('Local namespace', () => {
        it('has the namespace', () => {
          assert.typeOf(EventTypes.Config.Local, 'object');
        });
    
        it('has unique events', () => {
          ensureUnique('EventTypes.Config.Local', EventTypes.Config.Local);
        });
      });

      describe('Telemetry namespace', () => {
        it('has the namespace', () => {
          assert.typeOf(EventTypes.Config.Telemetry, 'object');
        });
    
        it('has unique events', () => {
          ensureUnique('EventTypes.Config.Telemetry', EventTypes.Config.Telemetry);
        });
      });

    });

    describe('Navigation', () => {
      describe('App namespace', () => {
        it('has the namespace', () => {
          assert.typeOf(EventTypes.Navigation.App, 'object');
        });
    
        it('has unique events', () => {
          ensureUnique('EventTypes.Navigation.App', EventTypes.Navigation.App);
        });
      });

      describe('Store namespace', () => {
        it('has the namespace', () => {
          assert.typeOf(EventTypes.Navigation.Store, 'object');
        });
    
        it('has unique events', () => {
          ensureUnique('EventTypes.Navigation.Store', EventTypes.Navigation.Store);
        });
      });

    });
  });
});
