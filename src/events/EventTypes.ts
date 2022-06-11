export const EventTypes = Object.freeze({
  Store: Object.freeze({
    info: 'storebackendinfo',
    initEnvironment: 'configstoreinitenv',
    Global: Object.freeze({
      setEnv: 'storesetgloablenvironment',
      getEnv: 'storegetgloablenvironment',
    }),
    Auth: Object.freeze({
      isAuthenticated: 'storeaisauthenticated',
      authenticate: 'storeauthenticate',
      getToken: 'storeauthgettoken',
    }),
    File: Object.freeze({
      list: 'storefileslist',
      listShared: 'storefileslistshared',
      create: 'storefilescreate',
      createDefault: 'storefilescreatedefault',
      read: 'storefilesread',
      patch: 'storefilespatch',
      delete: 'storefilesdelete',
      patchUsers: 'storefilespatchusers',
      listUsers: 'storefileslistusers',
      observeFiles: 'storefilesobservefiles',
      unobserveFiles: 'storefilesunobservefiles',
      observeFile: 'storefilesobservefile',
      unobserveFile: 'storefilesunobservefile',
      State: Object.freeze({
        change: 'storefileschange',
        fileChange: 'storefilechange',
      }),
    }),
    User: Object.freeze({
      me: 'storeuserme',
      list: 'storeuserlist',
      read: 'storeuserread',
    }),
    History: Object.freeze({
      create: 'storehistorycreate',
      createBulk: 'storehistorycreatebulk',
      list: 'storehistorylist',
      delete: 'storehistorydelete',
      read: 'storehistoryread',
    }),
    App: Object.freeze({
      Project: Object.freeze({
        createBulk: 'appprojectcreatebulk',
        deleteBulk: 'appprojectdeletebulk',
        undeleteBulk: 'appprojectundeletebulk',
        patch: 'appprojectpatch',
        list: 'appprojectlist',
      }),
      Request: Object.freeze({
        createBulk: 'apprequestcreatebulk',
        deleteBulk: 'apprequestdeletebulk',
        undeleteBulk: 'apprequestundeletebulk',
        patch: 'apprequestpatch',
        list: 'apprequestlist',
      }),
    }),
  }),
  Config: Object.freeze({
    Environment: Object.freeze({
      add: 'configenvironmentadd',
      read: 'configenvironmentread',
      delete: 'configenvironmentdelete',
      setDefault: 'configenvironmentsetdefault',
      update: 'configenvironmentupdate',
      list: 'configenvironmentlist',
      State: Object.freeze({
        created: 'configenvironmentcreated',
        deleted:'configenvironmentdeleted',
        updated:'configenvironmentupdated',
        defaultChange: 'configenvironmentdefaultchange'
      }),
    }),
    /**  
     * Properties stored in a session storage.
     */
    Session: Object.freeze({  
      set: 'configsessionset',
      get: 'configsessionget',
      delete: 'configsessiondelete',
    }),
    /**  
     * Properties stored in a local storage.
     */
    Local: Object.freeze({
      set: 'configlocalset',
      get: 'configlocalget',
      delete: 'configlocaldelete',
    }),
    Telemetry: Object.freeze({
      set: 'configtelemetryset',
      read: 'configtelemetryread',
      State: {
        set: 'configtelemetrystateset',
      },
    }),
  }),
  Navigation: Object.freeze({
    // inter-app navigation
    App: Object.freeze({
      runProjectRunner: 'navapprunprojectrunner',
      runHttpProject: 'navapprunhttpproject',
      runSchemaDesigner: 'navapprunschemadesigner',
      runStart: 'navapprunstart',
    }),
    Store: Object.freeze({
      config: 'navigationstoreconfig',
      authenticate: 'navigationstoreauthenticate',
    }),
  }),
  HttpProject: Object.freeze({
    changed: 'httpprojectchange',
    State: Object.freeze({
      nameChanged: 'httpprojectnamechange',
    }),
    Ui: Object.freeze({
      // HTTP project's UI data
      delete: 'appdatauiprojectdelete',
      HttpRequest: Object.freeze({
        set: 'appdatauiprojectrequestset',
        get: 'appdatauiprojectrequestget',
        delete: 'appdatauiprojectrequestdelete',
      }),
    }),
  }),
  AppData: Object.freeze({
    // shared HTTP data
    Http: Object.freeze({
      UrlHistory: Object.freeze({
        add: 'appdatahttpurlhistoryadd',
        query: 'appdatahttpurlhistoryquery',
        delete: 'appdatahttpurlhistorydelete',
        clear: 'appdatahttpurlhistoryclear',
        State: Object.freeze({
          clear: 'appdatahttpurlhistorystateclear',
          delete: 'appdatahttpurlhistorystatedelete',
        }),
      }),
    }),
    Ws: Object.freeze({
      UrlHistory: Object.freeze({
        add: 'appdatawsurlhistoryadd',
        query: 'appdatawsurlhistoryquery',
        delete: 'appdatawsurlhistorydelete',
        clear: 'appdatawsurlhistoryclear',
        State: Object.freeze({
          clear: 'appdatawsstateurlhistoryclear',
          delete: 'appdatawsstateurlhistorydelete',
        }),
      }),
    }),
    // manipulating application data file
    File: Object({
      read: 'appdatafileread',
      write: 'appdatafilewrite',
    }),
  }),
  SchemaDesign: Object.freeze({
    changed: 'schemadesignchange',
    State: Object.freeze({
      nameChanged: 'schemadesignnamechange',
    })
  }),
  // HTTP Client's application data
  HttpClient: Object.freeze({
    Workspace: Object.freeze({
      read: 'httpclientwsread',
      write: 'httpclientwswrite',
      append: 'httpclientwsappend',
      triggerWrite: 'httpclientwstriggerwrite',
      State: Object.freeze({
        write: 'httpclientwsstatewrite'
      }),
    }),
    Model: Object.freeze({
      destroy: 'modeldestroy',
      destroyed: 'modeldestroyed',
      restored: 'modelrestored',
      Project: Object.freeze({
        read: 'modelprojectread',
        readBulk: 'modelprojectreadbulk',
        update: 'modelprojectchange',
        updateBulk: 'modelprojectupdatebulk',
        delete: 'modelprojectdelete',
        deleteBulk: 'modelprojectdeletebulk',
        undeleteBulk: 'modelprojectundeletebulk',
        list: 'modelprojectlist',
        State: Object.freeze({
          update: 'modelstateprojectchange',
          delete: 'modelstateprojectdelete',
        })
      }),
      History: Object.freeze({
        read: 'modelhistoryread',
        readBulk: 'modelhistoryreadbulk',
        update: 'modelhistorychange',
        updateBulk: 'modelhistoryupdatebulk',
        delete: 'modelhistorydelete',
        deleteBulk: 'modelhistorydeletebulk',
        undeleteBulk: 'modelhistorysundelete',
        query: 'modelhistoryquery',
        list: 'modelhistorylist',
        State: Object.freeze({
          update: 'modelstatehistorychange',
          delete: 'modelstatehistorydelete',
        }),
      }),
      AuthData: Object.freeze({
        query: 'modelauthdataquery',
        update: 'modelauthdataupdate',
        State: Object.freeze({
          update: 'modelstateauthdataupdate',
        }),
      }),
      Host: Object.freeze({
        update: 'modelhostrulesupdate',
        updateBulk: 'modelhostrulesupdatebulk',
        delete: 'modelhostrulesdelete',
        deleteBulk: 'modelhostrulesdeletebulk',
        list: 'modelhostruleslist',
        State: Object.freeze({
          update: 'modelstatehostrulesupdate',
          delete: 'modelstatehostrulesdelete',
        }),
      }),
      Certificate: Object.freeze({
        read: 'modelclientcertificateread',
        list: 'modelclientcertificatelist',
        delete: 'modelclientcertificatedelete',
        update: 'modelclientcertificateupdate',
        insert: 'modelclientcertificateinsert',
        State: Object.freeze({
          update: 'modelstateclientcertificateupdate',
          delete: 'modelstateclientcertificatedelete',
        }),
      }),
      // Environment: Object.freeze({
      //   read: 'modelenvironmentread',
      //   update: 'modelenvironmentupdate',
      //   delete: 'modelenvironmentdelete',
      //   list: 'modelenvironmentlist',
      //   current: 'modelenvironmentcurrent',
      //   select: 'modelenvironmentselect',
      //   State: Object.freeze({
      //     update: 'modelstateenvironmentupdate',
      //     delete: 'modelstateenvironmentdelete',
      //     select: 'modelstateenvironmentselect'
      //   }),
      // }),
      // Variable: Object.freeze({
      //   update: 'modelvariableupdate',
      //   delete: 'modelvariabledelete',
      //   list: 'modelvariablelist',
      //   set: 'modelvariableset',
      //   State: Object.freeze({
      //     update: 'modelstatevariableupdate',
      //     delete: 'modelstatevariabledelete',
      //   }),
      // }),
      // RestApi: Object.freeze({
      //   list: 'modelrestapilist',
      //   read: 'modelrestapiread',
      //   dataRead: 'modelrestapidataread',
      //   update: 'modelrestapiupdate',
      //   dataUpdate: 'modelrestapidataupdate',
      //   updateBulk: 'modelrestapiupdatebulk',
      //   delete: 'modelrestapidelete',
      //   versionDelete: 'modelrestapiversiondelete',
      //   State: Object.freeze({
      //     update: 'modelstaterestapiupdate',
      //     dataUpdate: 'modelstaterestapidataupdate',
      //     delete: 'modelstaterestapidelete',
      //     versionDelete: 'modelstaterestapiversiondelete',
      //   }),
      // }),
    }),
  }),
  // common events for HTTP editors
  Http: Object.freeze({
    Request: Object.freeze({
      send: 'requestsend',
      rename: 'requestrename',
      State: Object.freeze({
        urlChange: 'requeststateurlchange',
        contentTypeChange: 'requeststatecontenttypechange',
      }),
    }),
  }),
});
