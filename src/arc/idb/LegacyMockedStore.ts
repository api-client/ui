/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable class-methods-use-this */
import { 
  LegacyMock, ArcDataMockInit, RestApiIndexInit, VariableInit, ARCProject, ARCAuthData, 
  ARCCookie, ARCHostRule, ARCUrlHistory, ARCEnvironment, ARCVariable, ARCHistoryRequest, 
  ARCSavedRequest, ARCRestApiIndex, ARCRestApi, ARCCertificateIndex, ARCRequestCertificate,
  ProjectCreateInit, RequestHistoryInit, RequestSavedInit, CertificateCreateInit, Entity
} from '@api-client/core/build/legacy.js';
import 'pouchdb/dist/pouchdb.js';

export interface InsertSavedResult {
  projects: ARCProject[];
  requests: ARCSavedRequest[];
}

/**
 * @deprecated This relates to the data structure for ARC that is being deprecated. The full migration should finish in 2024.
 */
export class LegacyMockedStore {
  mock: LegacyMock;

  constructor(init: ArcDataMockInit = {}) {
    this.mock = new LegacyMock(init);
  }

  /**
   * @param name The data store name to create.
   */
  db(name: string): PouchDB.Database {
    return new PouchDB(name);
  }

  /**
   * Creates `_id` on the original insert object if it wasn't created before and
   * updates `_rev` property.
   * 
   * @param insertResponse PouchDB build insert response
   * @param insertedData The original array of inserted objects.
   * @returns This changes contents of te array items which is passed by reference.
   */
  updateRevsAndIds(insertResponse: (PouchDB.Core.Response | PouchDB.Core.Error)[], insertedData: Entity[]): unknown[] {
    const result: Entity[] = [];
    insertResponse.forEach((item, i) => {
      const error = item as PouchDB.Core.Error;
      if (error.error) {
        return;
      }
      const copy = { ...insertedData[i] };
      if (!copy._id) {
        copy._id = item.id;
      }
      copy._rev = item.rev;
      result.push(copy as Entity);
    });
    return result;
  }

  /**
   * Generates saved requests data and inserts them into the data store if they
   * are missing.
   * 
   * @returns Resolved promise when data are inserted into the datastore. The promise resolves to the generated data object
   */
  async insertSaved(requestsSize = 25, projectsSize = 5, requestsInit?: RequestSavedInit, projectInit?: ProjectCreateInit): Promise<InsertSavedResult> {
    const data = this.mock.http.savedData(requestsSize, projectsSize, requestsInit, projectInit);
    const result: InsertSavedResult = ({
      projects: [],
      requests: [],
    });
    const projectsDb = this.db('legacy-projects');
    const response = await projectsDb.bulkDocs(data.projects);
    result.projects = this.updateRevsAndIds(response, data.projects) as ARCProject[];
    const savedDb = this.db('saved-requests');
    const response2 = await savedDb.bulkDocs(data.requests);
    result.requests = this.updateRevsAndIds(response2, data.requests) as ARCSavedRequest[];
    return result;
  }

  /**
   * Generates and saves history data to the data store.
   *
   * @param size The number of requests to generate. Default to 25.
   * @param init History init options.
   * @returns A promise resolved to the generated history list.
   */
  async insertHistory(size?: number, init?: RequestHistoryInit): Promise<ARCHistoryRequest[]> {
    const data = this.mock.http.listHistory(size, init);
    const db = this.db('history-requests');
    const response = await db.bulkDocs(data);
    return this.updateRevsAndIds(response, data) as ARCHistoryRequest[];
  }

  /**
   * Generates and saves a list of project objects.
   *
   * @param size Number of projects to insert. Default to 5.
   */
  async insertProjects(size?: number, init?: ProjectCreateInit): Promise<ARCProject[]> {
    const data = this.mock.http.listProjects(size, init);
    const db = this.db('legacy-projects');
    const response = await db.bulkDocs(data);
    return this.updateRevsAndIds(response, data) as ARCProject[];
  }

  /**
   * Inserts saved data only if the store is empty.
   * @param requestsSize Default 25
   * @param projectsSize Default 5
   * @returns A resolved promise when data are inserted into the datastore.
   */
  async insertSavedIfNotExists(requestsSize?: number, projectsSize?: number, requestsInit?: RequestSavedInit, projectInit?: ProjectCreateInit): Promise<InsertSavedResult> {
    const savedDb = this.db('saved-requests');
    const response = await savedDb.allDocs<ARCSavedRequest>({
      include_docs: true,
    });
    if (!response.rows.length) {
      return this.insertSaved(requestsSize, projectsSize, requestsInit, projectInit);
    }
    const result: InsertSavedResult = {
      requests: response.rows.map(item => item.doc) as ARCSavedRequest[],
      projects: [],
    };
    const projectsDb = this.db('legacy-projects');
    const projectsResponse = await projectsDb.allDocs<ARCProject>({
      include_docs: true,
    });
    result.projects = projectsResponse.rows.map(item => item.doc) as ARCProject[];
    return result;
  }

  /**
   * Inserts history data if the store is empty.
   * 
   * @param size The number of requests to generate. Default to 25.
   * @param init History init options.
   * @returns Resolved promise when data are inserted into the datastore.
   */
  async insertHistoryIfNotExists(size?: number, init?: RequestHistoryInit): Promise<ARCHistoryRequest[]> {
    const db = this.db('history-requests');
    const response = await db.allDocs<ARCHistoryRequest>({
      include_docs: true,
    });
    if (!response.rows.length) {
      return this.insertHistory(size, init);
    }
    return response.rows.map(item => item.doc) as ARCHistoryRequest[];
  }

  /**
   * Destroys saved and projects database.
   * @returns Resolved promise when the data are cleared.
   */
  async destroySaved(): Promise<void> {
    const savedDb = this.db('saved-requests');
    const projectsDb = this.db('legacy-projects');
    await savedDb.destroy();
    await projectsDb.destroy();
  }

  /**
   * Destroys history database.
   * @return Resolved promise when the data are cleared.
   */
  async destroyHistory(): Promise<void> {
    const db = this.db('history-requests');
    await db.destroy();
  }

  /**
   * Destroys legacy projects database.
   * @returns Resolved promise when the data are cleared.
   */
  async clearLegacyProjects(): Promise<void> {
    const db = this.db('legacy-projects');
    await db.destroy();
  }

  /**
   * Generates and saves websocket data to the data store.
   *
   * @param size The number of websocket data to insert.
   */
  async insertWebsockets(size?: number): Promise<ARCUrlHistory[]> {
    const data = this.mock.urls.urls(size);
    const db = this.db('websocket-url-history');
    const response = await db.bulkDocs(data);
    return this.updateRevsAndIds(response, data) as ARCUrlHistory[];
  }

  /**
   * Generates and saves url history data to the data store.
   *
   * @param size The number of URL history data to insert.
   */
  async insertUrlHistory(size?: number): Promise<ARCUrlHistory[]> {
    const data = this.mock.urls.urls(size);
    const db = this.db('url-history');
    const response = await db.bulkDocs(data);
    return this.updateRevsAndIds(response, data) as ARCUrlHistory[];
  }

  /**
   * Destroys websockets URL history database.
   * @return Resolved promise when the data are cleared.
   */
  async destroyWebsockets(): Promise<void> {
    const db = this.db('websocket-url-history');
    await db.destroy();
  }

  /**
   * Destroys URL history database.
   * @return Resolved promise when the data are cleared.
   */
  async destroyUrlHistory(): Promise<void> {
    const db = this.db('url-history');
    await db.destroy();
  }

  /**
   * Generates and saves variables data to the data store.
   *
   * @param size The number of variables to generate.
   * @returns Promise resolves to inserted variables.
   */
  async insertVariables(size?: number, init?: VariableInit): Promise<ARCVariable[]> {
    const data = this.mock.variables.listVariables(size, init);
    const db = this.db('variables');
    const response = await db.bulkDocs(data);
    return this.updateRevsAndIds(response, data) as ARCVariable[];
  }

  /**
   * Generates and saves variables data to the data store and then environments generated from the variables.
   *
   * @param size The number of variables to generate.
   * @returns Promise resolves to inserted variables.
   */
  async insertVariablesAndEnvironments(size?: number, init?: VariableInit): Promise<ARCVariable[]> {
    const result = await this.insertVariables(size, init);
    const items: ARCVariable[] = [];
    const names: string[] = [];
    result.forEach((variable) => {
      if (variable.environment !== 'default' && !names.includes(variable.environment)) {
        names.push(variable.environment)
        items.push({
          name: variable.environment,
          environment: '',
          value: '',
        });
      }
    });
    if (items.length) {
      const db = this.db('variables-environments');
      await db.bulkDocs(items);
    }
    return result;
  }

  /**
   * Destroys variables and environments database.
   * @return Resolved promise when the data are cleared.
   */
  async destroyVariables(): Promise<void> {
    const db = this.db('variables');
    const db2 = this.db('variables-environments');
    await db.destroy();
    await db2.destroy();
  }

  /**
   * Generates and saves cookies data to the data store.
   *
   * @param size Number of cookies to insert. Default to 25.
   */
  async insertCookies(size?: number): Promise<ARCCookie[]> {
    const data = this.mock.cookies.cookies(size);
    const db = this.db('cookies');
    const response = await db.bulkDocs(data);
    return this.updateRevsAndIds(response, data as any[]) as ARCCookie[];
  }

  /**
   * Destroys cookies database.
   * @return Resolved promise when the data are cleared.
   */
  async destroyCookies(): Promise<void> {
    const db = this.db('cookies');
    await db.destroy();
  }

  /**
   * Generates and saves basic auth data to the data store.
   *
   * @param size Number of auth data to insert. Default to 25.
   * @returns Promise resolved to created auth data.
   */
  async insertBasicAuth(size?: number): Promise<ARCAuthData[]> {
    const data = this.mock.authorization.basicList(size);
    const db = this.db('auth-data');
    const response = await db.bulkDocs(data);
    return this.updateRevsAndIds(response, data) as ARCAuthData[];
  }

  /**
   * Destroys auth data database.
   * @return Resolved promise when the data are cleared.
   */
  async destroyBasicAuth(): Promise<void> {
    const db = this.db('auth-data');
    await db.destroy();
  }

  /**
   * Generates and saves host rules data to the data store.
   *
   * @param size Number of rules to insert. Default to 25.
   * @return {Promise<PouchDB.Core.ExistingDocument<ARCHostRule>[]>} 
   */
  async insertHostRules(size?: number): Promise<ARCHostRule[]> {
    const data = this.mock.hostRules.rules(size);
    const db = this.db('host-rules');
    const response = await db.bulkDocs(data);
    return this.updateRevsAndIds(response, data) as ARCHostRule[];
  }

  /**
   * Destroys hosts data database.
   * @return Resolved promise when the data are cleared.
   */
  async destroyHostRules(): Promise<void> {
    const db = this.db('host-rules');
    await db.destroy();
  }

  async insertApis(size?: number, init?: RestApiIndexInit): Promise<(ARCRestApi[] | ARCRestApiIndex[])[]> {
    let index = this.mock.restApi.apiIndexList(size, init);
    let data = this.mock.restApi.apiDataList(index);
    const indexDb = this.db('api-index');
    const indexResponse = await indexDb.bulkDocs(index);
    index = this.updateRevsAndIds(indexResponse, index) as ARCRestApiIndex[];
    const dataDb = this.db('api-data');
    const dataResponse = await dataDb.bulkDocs(data);
    data = this.updateRevsAndIds(dataResponse, data) as ARCRestApi[];
    return [index, data];
  }

  /**
   * Destroys api-index data database.
   * @return Resolved promise when the data are cleared.
   */
  async destroyApiIndexes(): Promise<void> {
    const db = this.db('api-index');
    await db.destroy();
  }

  /**
   * Destroys api-data database.
   * @return Resolved promise when the data are cleared.
   */
  async destroyApiData(): Promise<void> {
    const db = this.db('api-data');
    await db.destroy();
  }

  async destroyApisAll(): Promise<void> {
    await this.destroyApiIndexes();
    await this.destroyApiData();
  }

  /**
   * @param size The number of certificates to generate.
   * @param opts Create options
   */
  async insertCertificates(size?: number, opts?: CertificateCreateInit): Promise<ARCCertificateIndex[]> {
    const data = this.mock.certificates.clientCertificates(size, opts);
    const responses = [];
    const indexDb = this.db('client-certificates');
    const dataDb = this.db('client-certificates-data');
    for (let i = 0; i < data.length; i++) {
      const cert = data[i];
      const dataEntity: ARCRequestCertificate = ({
        cert: this.mock.certificates.toStore(cert.cert),
        type: cert.type,
      });
      if (cert.key) {
        dataEntity.key = this.mock.certificates.toStore(cert.key);
      }
      const indexEntity: ARCCertificateIndex = ({
        name: cert.name,
        type: cert.type,
      });
      if (cert.created) {
        indexEntity.created = cert.created;
      } else {
        indexEntity.created = Date.now();
      }

      /* eslint-disable-next-line no-await-in-loop */
      const dataRes = await dataDb.post(dataEntity);
      indexEntity._id = dataRes.id;
      /* eslint-disable-next-line no-await-in-loop */
      responses[responses.length] = await indexDb.post(indexEntity);
    }
    return this.updateRevsAndIds(responses, data as any[]) as ARCCertificateIndex[];
  }

  async destroyClientCertificates(): Promise<void> {
    await this.db('client-certificates').destroy();
    await this.db('client-certificates-data').destroy();
  }

  /**
   * Destroys all databases.
   * @return Resolved promise when the data are cleared.
   */
  async destroyAll(): Promise<void> {
    await this.destroySaved();
    await this.destroyHistory();
    await this.destroyWebsockets();
    await this.destroyUrlHistory();
    await this.destroyVariables();
    await this.destroyCookies();
    await this.destroyBasicAuth();
    await this.destroyHostRules();
    await this.destroyApiIndexes();
    await this.destroyApiData();
    await this.destroyClientCertificates();
  }

  /**
   * Deeply clones an object.
   * @param {any[]|Date|object} obj Object to be cloned
   * @return {any[]|Date|object} Copied object
   */
  clone<T>(obj: T): T {
    let copy: any;
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    if (obj instanceof Date) {
      copy = new Date();
      copy.setTime(obj.getTime());
      return copy;
    }
    if (Array.isArray(obj)) {
      copy = [];
      for (let i = 0, len = obj.length; i < len; i++) {
        copy[i] = this.clone(obj[i]);
      }
      return copy;
    }
    if (obj instanceof Object) {
      copy = {};
      Object.keys(obj).forEach((key) => {
        copy[key] = this.clone((obj as any)[key]);
      });
      return copy;
    }
    throw new Error("Unable to copy obj! Its type isn't supported.");
  }

  /**
   * Reads all data from a data store.
   * @param name Name of the data store to read from. Without `_pouch_` prefix
   * @returns Promise resolved to all read docs.
   */
  async getDatastoreData(name: string): Promise<unknown[]> {
    const db = this.db(name);
    const response = await db.allDocs({
      include_docs: true,
    });
    return response.rows.map(item => item.doc);
  }

  async getDatastoreRequestData(): Promise<ARCSavedRequest[]> {
    return this.getDatastoreData('saved-requests') as Promise<ARCSavedRequest[]>;
  }

  async getDatastoreProjectsData(): Promise<ARCProject[]> {
    return this.getDatastoreData('legacy-projects') as Promise<ARCProject[]>;
  }

  async getDatastoreHistoryData(): Promise<ARCHistoryRequest[]> {
    return this.getDatastoreData('history-requests') as Promise<ARCHistoryRequest[]>;
  }

  async getDatastoreVariablesData(): Promise<ARCVariable[]> {
    return this.getDatastoreData('variables') as Promise<ARCVariable[]>;
  }

  async getDatastoreEnvironmentsData(): Promise<ARCEnvironment[]> {
    return this.getDatastoreData('variables-environments') as Promise<ARCEnvironment[]>;
  }

  async getDatastoreCookiesData(): Promise<ARCCookie[]> {
    return this.getDatastoreData('cookies') as Promise<ARCCookie[]>;
  }

  async getDatastoreWebsocketsData(): Promise<ARCUrlHistory[]> {
    return this.getDatastoreData('websocket-url-history') as Promise<ARCUrlHistory[]>;
  }

  async getDatastoreUrlsData(): Promise<ARCUrlHistory[]> {
    return this.getDatastoreData('url-history') as Promise<ARCUrlHistory[]>;
  }

  async getDatastoreAuthData(): Promise<ARCAuthData[]> {
    return this.getDatastoreData('auth-data') as Promise<ARCAuthData[]>;
  }

  async getDatastoreHostRulesData(): Promise<ARCHostRule[]> {
    return this.getDatastoreData('host-rules') as Promise<ARCHostRule[]>;
  }

  async getDatastoreApiIndexData(): Promise<ARCRestApiIndex[]> {
    return this.getDatastoreData('api-index') as Promise<ARCRestApiIndex[]>;
  }

  async getDatastoreHostApiData(): Promise<ARCRestApi[]> {
    return this.getDatastoreData('api-data') as Promise<ARCRestApi[]>;
  }

  async getDatastoreClientCertificates(): Promise<(ARCCertificateIndex[] | ARCRequestCertificate[])[]> {
    const certs = await this.getDatastoreData('client-certificates') as ARCCertificateIndex[];
    const data = await this.getDatastoreData('client-certificates-data') as ARCRequestCertificate[];
    return [certs, data];
  }

  /**
   * Updates an object in an data store.
   *
   * @param dbName Name of the data store.
   * @param obj The object to be stored.
   * @returns A promise resolved to insert result.
   */
  async updateObject(dbName: string, obj: any): Promise<PouchDB.Core.Response> {
    const db = this.db(dbName);
    return db.put(obj, {
      force: true,
    });
  }
}
