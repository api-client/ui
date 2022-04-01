export const EventTypes = Object.freeze({
  auth: Object.freeze({
    createSession: 'storeauthcreatesession',
    createAuthSession: 'storeauthcreateauthsession',
    renewToken: 'storeauthrenewtoken',
  }),
  store: Object.freeze({
    info: 'storebackendinfo'
  }),
  space: Object.freeze({
    list: 'storespacelist',
    create: 'storespacecreate',
    read: 'storespaceread',
    patch: 'storespacepatch',
    delete: 'storespacedelete',
    patchUsers: 'storespacepatchusers',
    listUsers: 'storespacelistusers',
  }),
  project: Object.freeze({
    create: 'storeprojectcreate',
    read: 'storeprojectread',
    list: 'storeprojectlist',
    delete: 'storeprojectdelete',
    patch: 'storeprojectpatch',
  }),
  user: Object.freeze({
    me: 'storeuserme',
    list: 'storeuserlist',
    read: 'storeuserread',
  }),
  history: Object.freeze({
    create: 'storehistorycreate',
    createBulk: 'storehistorycreatebulk',
    list: 'storehistorylist',
    delete: 'storehistorydelete',
    read: 'storehistoryread',
  }),
});
