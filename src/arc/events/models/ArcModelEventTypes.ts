export const ArcModelEventTypes = Object.freeze({
  destroy: 'modeldestroy',
  destroyed: 'modeldestroyed',
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
