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
    Request: Object.freeze({
      send: 'requestsend',
      rename: 'projectrequestrename',
      State: Object.freeze({
        urlChange: 'requeststateurlchange',
        contentTypeChange: 'requeststatecontenttypechange',
      }),
    }),
  }),
  AppData: Object.freeze({
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
    Ui: Object.freeze({
      HttpProject: Object.freeze({
        delete: 'appdatauiprojectdelete',
        HttpRequest: Object.freeze({
          set: 'appdatauiprojectrequestset',
          get: 'appdatauiprojectrequestget',
          delete: 'appdatauiprojectrequestdelete',
        }),
      }),
    }),
  }),
});
