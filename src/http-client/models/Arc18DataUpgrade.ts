/* eslint-disable class-methods-use-this */
import 'pouchdb/dist/pouchdb.js';
import { get, set } from 'idb-keyval';
import { ArcHttpRequest, IArcHttpRequest, ArcProject, IAuthorizationData, Certificate, IHostRule, HostRuleKind } from '@api-client/core/build/browser.js';
import { ARCHistoryRequest, Normalizer, ARCProject, ARCSavedRequest, ARCAuthData, ARCCertificateIndex, ARCRequestCertificate, HostRule as LegacyHostRule } from '@api-client/core/build/legacy.js';
import { LegacyBodyProcessor } from './LegacyBodyProcessor.js';
import { HistoryModel } from '../idb/HistoryModel.js';
import { ProjectModel } from '../idb/ProjectModel.js';
import { AuthDataModel } from '../idb/AuthDataModel.js';
import { CertificateModel } from '../idb/CertificateModel.js';
import { HostsModel } from '../idb/HostsModel.js';

const upgradeKey = 'CHL5v3fUMx';

/**
 * Version 18 data upgrade.
 * 
 * This upgrade reads thr PouchDB data and moves it to own data store.
 * 
 * This must be performed in the UI thread (or a worker of the UI thread)
 * so it has access to the same data store.
 */
export default class Arc18DataUpgrade {
  static async needsUpgrade(): Promise<boolean> {
    const value = get(upgradeKey);
    return !value;
  }

  static async runIfNeeded(): Promise<void> {
    const needed = await Arc18DataUpgrade.needsUpgrade();
    if (!needed) {
      return undefined;
    }
    const instance = new Arc18DataUpgrade();
    return instance.run();
  }

  /**
   * Sets a flag sealing the upgrade. Next call to the `run()` will result with no operation.
   */
  async seal(): Promise<void> {
    await set(upgradeKey, true);
  }

  async run(): Promise<void> {
    await this.upgradeHistory();
    await this.upgradeProjects();
    await this.upgradeSaved();
    await this.upgradeAuthData();
    await this.upgradeCertificates();
    await this.hostRules();

    await this.seal();
  }

  async upgradeHistory(): Promise<void> {
    const sourceDb = new PouchDB('history-requests');
    await sourceDb.compact();
    const targetDb = new HistoryModel();
    await this._upgradeHistoryPage(sourceDb, targetDb);
  }

  async upgradeProjects(): Promise<void> {
    const projectsDb = new PouchDB<ARCProject>('legacy-projects');
    const savedDb = new PouchDB<ARCSavedRequest>('saved-requests');

    const response = await projectsDb.allDocs({ include_docs: true });
    if (!response || !response.rows || !response.rows.length) {
      return;
    }
    const projects: ARCProject[] = [];
    const ids: string[] = [];
    response.rows.forEach((item) => {
      const { doc } = item;
      if (!doc) {
        return;
      }
      projects.push(doc);
      if (Array.isArray(doc.requests)) {
        doc.requests.forEach((id) => {
          if (!ids.includes(id)) {
            ids.push(id);
          }
        });
      }
    });
    const requestsResponse = await savedDb.allDocs({
      keys: ids,
      include_docs: true,
    });
    const requests: ARCSavedRequest[] = [];
    requestsResponse.rows.forEach(i => {
      if (!i || !i.doc) {
        return;
      }
      const normalized = Normalizer.normalizeRequest(i.doc) as ARCSavedRequest;
      const restored = LegacyBodyProcessor.restorePayload(normalized) as ARCSavedRequest
      requests.push(restored);
    });
    const ps = projects.map(async (legacy) => {
      const instance = await ArcProject.fromLegacyProject(legacy, requests);
      return instance.toJSON();
    });
    const upgrades = await Promise.all(ps);
    const targetDb = new ProjectModel();
    await targetDb.putBulk(upgrades);
  }

  async upgradeSaved(): Promise<void> {
    const savedDb = new PouchDB<ARCSavedRequest>('saved-requests');
    const response = await savedDb.allDocs({ include_docs: true });
    const requests: ARCSavedRequest[] = [];
    response.rows.forEach(i => {
      if (!i || !i.doc) {
        return;
      }
      const normalized = Normalizer.normalizeRequest(i.doc) as ARCSavedRequest;
      const restored = LegacyBodyProcessor.restorePayload(normalized) as ARCSavedRequest
      requests.push(restored);
    });
    if (!requests.length) {
      return;
    }
    const project = ArcProject.fromName('Saved requests');
    const ps = requests.map(i => project.addLegacyRequest(i));
    await Promise.allSettled(ps);
    const targetDb = new ProjectModel();
    await targetDb.put(project.toJSON());
  }

  async upgradeAuthData(): Promise<void> {
    const src = new PouchDB<ARCAuthData>('auth-data');
    const response = await src.allDocs({ include_docs: true });
    const items: IAuthorizationData[] = [];
    response.rows.forEach(item => {
      const { doc } = item;
      if (!doc) {
        return;
      }
      const transformed: IAuthorizationData = {
        key: doc._id,
      };
      if (doc.domain) {
        transformed.domain = doc.domain;
      }
      if (doc.password) {
        transformed.password = doc.password;
      }
      if (doc.password) {
        transformed.password = doc.password;
      }
      items.push(transformed);
    });
    const model = new AuthDataModel();
    await model.putBulk(items);
  }

  protected async _upgradeHistoryPage(sourceDb: PouchDB.Database, targetDb: HistoryModel, lastKey?: string): Promise<void> {
    const opts: PouchDB.Core.AllDocsOptions | PouchDB.Core.AllDocsWithinRangeOptions = {
      include_docs: true,
      limit: 500,
    };
    if (lastKey) {
      opts.skip = 1;
      (opts as PouchDB.Core.AllDocsWithinRangeOptions).startkey = lastKey;
    }
    const response = await sourceDb.allDocs(opts);
    if (!response || !response.rows || !response.rows.length) {
      return;
    }
    const pageKey = response.rows[response.rows.length - 1].key;
    const upgradePromises = response.rows.map(async (item) => {
      const old = item.doc as ARCHistoryRequest | undefined;
      if (!old) {
        return undefined;
      }
      const restored = LegacyBodyProcessor.restorePayload(Normalizer.normalizeRequest(old) as ARCHistoryRequest) as ARCHistoryRequest;
      const upgraded = await ArcHttpRequest.fromLegacy(restored) as ArcHttpRequest;
      const date = new Date(upgraded.created);
      upgraded.key = date.toJSON();
      return upgraded.toJSON();
    });
    const upgrades = (await Promise.all(upgradePromises)).filter(i => !!i) as IArcHttpRequest[];
    await targetDb.putBulk(upgrades);
    if (pageKey) {
      await this._upgradeHistoryPage(sourceDb, targetDb, pageKey);
    }
  }

  async upgradeCertificates(): Promise<void> {
    const indexDb = new PouchDB<ARCCertificateIndex>('client-certificates');
    const dataDb = new PouchDB<ARCRequestCertificate>('client-certificates-data');
    const upgrades: Certificate[] = [];
    const indexResponse = await indexDb.allDocs({ include_docs: true });
    const ps = indexResponse.rows.map(async (item) => {
      const { doc } = item;
      if (!doc || !doc.dataKey) {
        return;
      }
      try {
        const data = await dataDb.get(doc.dataKey) as ARCRequestCertificate;
        if (data) {
          const upgraded = Certificate.fromLegacy(doc, data);
          upgrades.push(upgraded);
        }
      } catch (e) {
        // ...
      }
    });
    await Promise.all(ps);
    if (!upgrades.length) {
      return;
    }
    const model = new CertificateModel();
    await model.putBulk(upgrades);
  }

  async hostRules(): Promise<void> {
    const srcDb = new PouchDB<LegacyHostRule>('host-rules');
    const response = await srcDb.allDocs({ include_docs: true });
    const items: IHostRule[] = [];
    response.rows.forEach(item => {
      const { doc } = item;
      if (!doc) {
        return;
      }
      const transformed: IHostRule = {
        kind: HostRuleKind,
        from: doc.from,
        to: doc.to,
        key: doc._id,
      };
      if (doc.comment) {
        transformed.comment = doc.comment;
      }
      if (typeof doc.enabled === 'boolean') {
        transformed.enabled = doc.enabled;
      }
      items.push(transformed);
    });
    const model = new HostsModel();
    await model.putBulk(items);
  }
}
