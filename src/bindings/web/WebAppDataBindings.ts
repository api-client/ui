import { IUrl } from '@api-client/core/build/browser';
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

  deleteUrlHistory(url: string): Promise<void> {
    return this.invoke('deleteUrlHistory', url);
  }

  clearUrlHistory(): Promise<void> {
    return this.invoke('clearUrlHistory');
  }
}
