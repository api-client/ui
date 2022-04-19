import { ContextChangeRecord, ContextDeleteRecord, IRequestUiMeta, IUrl } from '@api-client/core/build/browser.js';
import SharedWorkerThread from './SharedWorkerThread.js';
import AppDataStore from '../../../src/bindings/web/AppDataStore.js';

/**
 * A worker that provides access to the application locally stored data.
 * 
 * Note, this worker is initialized from the web bindings. The URL is passed in the demo bindings.
 */
class AppData extends SharedWorkerThread {
  urlHistory = new AppDataStore();

  async addUrlHistory(url: string): Promise<void> {
    await this.urlHistory.addUrlHistory(url);
  }

  async queryUrlHistory(q: string): Promise<IUrl[]> {
    return this.urlHistory.queryUrlHistory(q);
  }

  async deleteUrlHistory(url: string): Promise<void> {
    await this.urlHistory.deleteUrlHistory(url);
    this.notifyClients('Events.AppData.Http.UrlHistory.State.delete', url);
  }

  async clearUrlHistory(): Promise<void> {
    await this.urlHistory.clearUrlHistory();
    this.notifyClients('Events.AppData.Http.UrlHistory.State.clear');
  }

  deleteProjectUi(id: string): Promise<ContextDeleteRecord> {
    return this.urlHistory.deleteProjectUi(id);
  }

  setHttpRequestUi(pid: string, id: string, meta: IRequestUiMeta): Promise<ContextChangeRecord<IRequestUiMeta>> {
    return this.urlHistory.setHttpRequestUi(pid, id, meta);
  }

  getHttpRequestUi(pid: string, id: string): Promise<IRequestUiMeta> {
    return this.urlHistory.getHttpRequestUi(pid, id);
  }

  deleteHttpRequestUi(pid: string, id: string): Promise<ContextDeleteRecord> {
    return this.urlHistory.deleteHttpRequestUi(pid, id);
  }
}

const instance = new AppData();
instance.initialize();
