import { ContextChangeRecord, ContextDeleteRecord, IQueryResponse, IRequestUiMeta, IUrl } from '@api-client/core/build/browser.js';
import SharedWorkerThread from './SharedWorkerThread.js';
import AppDataStore from '../../../src/bindings/web/AppDataStore.js';
import { IFileReadConfig, IFileWriteConfig } from '../../../src/events/AppDataEvents.js';

/**
 * A worker that provides access to the application locally stored data.
 * 
 * Note, this worker is initialized from the web bindings. The URL is passed in the demo bindings.
 */
class AppData extends SharedWorkerThread {
  store = new AppDataStore();

  async addUrlHistory(url: string): Promise<void> {
    await this.store.addUrlHistory(url);
  }

  async queryUrlHistory(q: string): Promise<IQueryResponse<IUrl>> {
    return this.store.queryUrlHistory(q);
  }

  async deleteUrlHistory(url: string): Promise<ContextDeleteRecord> {
    const result = await this.store.deleteUrlHistory(url);
    this.notifyClients('Events.AppData.Http.UrlHistory.State.delete', url);
    return result;
  }

  async clearUrlHistory(): Promise<void> {
    await this.store.clearUrlHistory();
    this.notifyClients('Events.AppData.Http.UrlHistory.State.clear');
  }

  async addWsHistory(url: string): Promise<void> {
    await this.store.addWsHistory(url);
  }

  queryWsHistory(q: string): Promise<IQueryResponse<IUrl>> {
    return this.store.queryWsHistory(q);
  }

  async deleteWsHistory(url: string): Promise<ContextDeleteRecord> {
    const result = await this.store.deleteWsHistory(url);
    this.notifyClients('Events.AppData.Ws.UrlHistory.delete', url);
    return result;
  }
  
  async clearWsHistory(): Promise<void> {
    await this.store.clearUrlHistory();
    this.notifyClients('Events.AppData.Ws.UrlHistory.State.clear');
  }

  deleteProjectUi(id: string): Promise<ContextDeleteRecord> {
    return this.store.deleteProjectUi(id);
  }

  setHttpRequestUi(pid: string, id: string, meta: IRequestUiMeta): Promise<ContextChangeRecord<IRequestUiMeta>> {
    return this.store.setHttpRequestUi(pid, id, meta);
  }

  getHttpRequestUi(pid: string, id: string): Promise<IRequestUiMeta | undefined> {
    return this.store.getHttpRequestUi(pid, id);
  }

  deleteHttpRequestUi(pid: string, id: string): Promise<ContextDeleteRecord> {
    return this.store.deleteHttpRequestUi(pid, id);
  }

  readAppDataFile(path: string, opts?: IFileReadConfig): Promise<string | Buffer | ArrayBuffer | undefined> {
    return this.store.readAppDataFile(path, opts);
  }

  writeAppDataFile(path: string, content: string | Buffer | ArrayBuffer, opts?: IFileWriteConfig): Promise<void> {
    return this.store.writeAppDataFile(path, content, opts);
  }
}

const instance = new AppData();
instance.initialize();
