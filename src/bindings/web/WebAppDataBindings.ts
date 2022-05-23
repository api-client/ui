import { ContextChangeRecord, ContextDeleteRecord, IRequestUiMeta, IUrl } from '@api-client/core/build/browser';
import { AppDataBindings } from '../base/AppDataBindings.js';
import { IoCommand, IoEvent, IoNotification } from '../base/PlatformBindings.js';

export class WebAppDataBindings extends AppDataBindings {
  worker?: SharedWorker;

  constructor(protected workerUrl: string) {
    super();
  }

  async initialize(): Promise<void> {
    await super.initialize();
    await this.createWorker();
  }

  async createWorker(): Promise<void> {
    return new Promise((resolve, reject) => {
      const worker = new SharedWorker(this.workerUrl, {
        type: 'module',
        name: 'AppData',
      });
      worker.port.start();
      worker.onerror = (): void => reject(new Error('Unable to initialize the IO process.'));
      this.worker = worker;
      const binder = this._ioHandler.bind(this);
      worker.port.addEventListener('message', function init () {
        worker.port.removeEventListener('message', init);
        worker.port.addEventListener('message', binder);
        resolve();
      });
    });
  }

  protected sendIoCommand(cmd: IoCommand): void {
    const { worker } = this;
    if (!worker) {
      throw new Error(`IO not ready.`);
    }
    worker.port.postMessage(cmd);
  }

  protected _ioHandler(e: MessageEvent): void {
    const event = e.data as IoCommand | IoEvent | IoNotification;
    this.handleIoMessage(event);
  }

  addUrlHistory(url: string): Promise<void> {
    return this.invoke('addUrlHistory', url);
  }

  queryUrlHistory(q: string): Promise<IUrl[]> {
    return this.invoke('queryUrlHistory', q);
  }

  deleteUrlHistory(url: string): Promise<ContextDeleteRecord> {
    return this.invoke('deleteUrlHistory', url);
  }

  clearUrlHistory(): Promise<void> {
    return this.invoke('clearUrlHistory');
  }

  addWsHistory(url: string): Promise<void> {
    return this.invoke('addWsHistory', url);
  }

  queryWsHistory(q: string): Promise<IUrl[]> {
    return this.invoke('queryWsHistory', q);
  }

  deleteWsHistory(url: string): Promise<ContextDeleteRecord> {
    return this.invoke('deleteWsHistory', url);
  }
  
  clearWsHistory(): Promise<void> {
    return this.invoke('clearWsHistory');
  }

  deleteProjectUi(id: string): Promise<ContextDeleteRecord> {
    return this.invoke('deleteProjectUi', id);
  }

  setHttpRequestUi(pid: string, id: string, meta: IRequestUiMeta): Promise<ContextChangeRecord<IRequestUiMeta>> {
    return this.invoke('setHttpRequestUi', pid, id, meta);
  }

  getHttpRequestUi(pid: string, id: string): Promise<IRequestUiMeta> {
    return this.invoke('getHttpRequestUi', pid, id);
  }

  deleteHttpRequestUi(pid: string, id: string): Promise<ContextDeleteRecord> {
    return this.invoke('deleteHttpRequestUi', pid, id);
  }
}
