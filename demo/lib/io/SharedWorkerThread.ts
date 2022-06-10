/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { IoThread } from '../../../src/bindings/base/IoThread.js';
import { IoCommand, IoEvent, IoNotification } from '../../../src/bindings/base/PlatformBindings.js';

/**
 * Base class for ShareWorker threads.
 */
export default class SharedWorkerThread extends IoThread {
  ports: MessagePort[] = [];

  async initialize(): Promise<void> {
    // @ts-ignore
    // eslint-disable-next-line no-restricted-globals
    self.onconnect = (e: any): void => {
      const port = e.ports[0] as MessagePort;
      this.ports.push(port);
      port.addEventListener('message', this._messageHandler.bind(this));
      port.start();
      port.postMessage('ready');
    }
  }

  postMessage(message: IoNotification | IoEvent): void {
    this.ports.forEach(p => p.postMessage(message));
  }

  protected _messageHandler(e: MessageEvent): void {
    const event = e.data as IoCommand | IoEvent;
    this.handleMessage(event);
  }
}
