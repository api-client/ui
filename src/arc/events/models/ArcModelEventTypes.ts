export const ArcModelEventTypes = Object.freeze({
  destroy: 'modeldestroy',
  destroyed: 'modeldestroyed',
  Project: Object.freeze({
    read: 'modelprojectread',
    readBulk: 'modelprojectreadbulk',
    update: 'modelprojectchange',
    updateBulk: 'modelprojectupdatebulk',
    delete: 'modelprojectdelete',
    list: 'modelprojectlist',
    listAll: 'modelprojectlistall',
    State: Object.freeze({
      update: 'modelstateprojectchange',
      delete: 'modelstateprojectdelete',
    })
  }),
  Request: Object.freeze({
    read: 'modelrequestread',
    readBulk: 'modelrequestreadbulk',
    // updates metadata only
    update: 'modelrequestchange',
    updateBulk: 'modelrequestupdatebulk',
    // updates metadata, transforms body, takes care of dependencies
    store: 'modelrequeststore',
    delete: 'modelrequestdelete',
    deleteBulk: 'modelrequestdeletebulk',
    undeleteBulk: 'modelrequestsundelete',
    query: 'modelrequestquery',
    list: 'modelrequestlist',
    projectlist: 'modelrequestprojectlist',
    State: Object.freeze({
      update: 'modelstaterequestchange',
      delete: 'modelstaterequestdelete',
    }),
  }),
  UrlIndexer: Object.freeze({
    update: 'modelurlindexerupdate',
    query: 'modelurlindexerquery',
    State: Object.freeze({
      finished: 'modelstateurlindexerfinished',
    })
  }),
  AuthData: Object.freeze({
    query: 'modelauthdataquery',
    update: 'modelauthdataupdate',
    State: Object.freeze({
      update: 'modelstateauthdataupdate',
    }),
  }),
  HostRules: Object.freeze({
    update: 'modelhostrulesupdate',
    updateBulk: 'modelhostrulesupdatebulk',
    delete: 'modelhostrulesdelete',
    list: 'modelhostruleslist',
    State: Object.freeze({
      update: 'modelstatehostrulesupdate',
      delete: 'modelstatehostrulesdelete',
    }),
  }),
  ClientCertificate: Object.freeze({
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
  WSUrlHistory: Object.freeze({
    // read: 'modelwsurlhistoryread',
    list: 'modelwsurlhistorylist',
    insert: 'modelwsurlhistoryinsert',
    query: 'modelwsurlhistoryquery',
    State: Object.freeze({
      update: 'modelstatewsurlhistoryupdate',
    }),
  }),
  UrlHistory: Object.freeze({
    // read: 'modelwsurlhistoryread',
    list: 'modelurlhistorylist',
    insert: 'modelurlhistoryinsert',
    query: 'modelurlhistoryquery',
    delete: 'modelurlhistorydelete',
    State: Object.freeze({
      update: 'modelstateurlhistoryupdate',
      delete: 'modelstateurlhistorydelete',
    }),
  }),
  Environment: Object.freeze({
    read: 'modelenvironmentread',
    update: 'modelenvironmentupdate',
    delete: 'modelenvironmentdelete',
    list: 'modelenvironmentlist',
    current: 'modelenvironmentcurrent',
    select: 'modelenvironmentselect',
    State: Object.freeze({
      update: 'modelstateenvironmentupdate',
      delete: 'modelstateenvironmentdelete',
      select: 'modelstateenvironmentselect'
    }),
  }),
  Variable: Object.freeze({
    update: 'modelvariableupdate',
    delete: 'modelvariabledelete',
    list: 'modelvariablelist',
    set: 'modelvariableset',
    State: Object.freeze({
      update: 'modelstatevariableupdate',
      delete: 'modelstatevariabledelete',
    }),
  }),
  RestApi: Object.freeze({
    list: 'modelrestapilist',
    read: 'modelrestapiread',
    dataRead: 'modelrestapidataread',
    update: 'modelrestapiupdate',
    dataUpdate: 'modelrestapidataupdate',
    updateBulk: 'modelrestapiupdatebulk',
    delete: 'modelrestapidelete',
    versionDelete: 'modelrestapiversiondelete',
    State: Object.freeze({
      update: 'modelstaterestapiupdate',
      dataUpdate: 'modelstaterestapidataupdate',
      delete: 'modelstaterestapidelete',
      versionDelete: 'modelstaterestapiversiondelete',
    }),
  }),
});
