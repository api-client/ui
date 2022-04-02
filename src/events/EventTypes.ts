export const EventTypes = Object.freeze({
  Auth: Object.freeze({
    createSession: 'storeauthcreatesession',
    createAuthSession: 'storeauthcreateauthsession',
    renewToken: 'storeauthrenewtoken',
    authenticate: 'storeauthenticate',
  }),
  Store: Object.freeze({
    info: 'storebackendinfo',
    initEnvironment: 'configstoreinitenv',
  }),
  Space: Object.freeze({
    list: 'storespacelist',
    create: 'storespacecreate',
    read: 'storespaceread',
    patch: 'storespacepatch',
    delete: 'storespacedelete',
    patchUsers: 'storespacepatchusers',
    listUsers: 'storespacelistusers',
  }),
  Project: Object.freeze({
    create: 'storeprojectcreate',
    read: 'storeprojectread',
    list: 'storeprojectlist',
    delete: 'storeprojectdelete',
    patch: 'storeprojectpatch',
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
  Config: Object.freeze({
    Environment: Object.freeze({
      add: 'configenvironmentadd',
      State: Object.freeze({
        created: 'configenvironmentcreated',
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
});
