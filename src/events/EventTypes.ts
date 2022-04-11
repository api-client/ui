export const EventTypes = Object.freeze({
  Store: Object.freeze({
    info: 'storebackendinfo',
    initEnvironment: 'configstoreinitenv',
    Global: Object.freeze({
      setEnv: 'storesetgloablenvironment',
    }),
    Auth: Object.freeze({
      isAuthenticated: 'storeaisauthenticated',
      authenticate: 'storeauthenticate',
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
      State: Object.freeze({
        change: 'storefileschange',
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
    HttpProject: Object.freeze({
      open: 'navigationprojectopen',
    }),
    Store: Object.freeze({
      config: 'navigationstoreconfig',
    }),
  }),
});
