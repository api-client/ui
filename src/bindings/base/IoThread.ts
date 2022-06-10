/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import { IoEvent, IoCommand, IoNotification } from './PlatformBindings.js';

/**
 * The base IO thread class containing the communication logic with the clients.
 */
export abstract class IoThread {
  /**
   * Initializes the communication channel with the clients.
   */
  abstract initialize(): Promise<void>;

  /**
   * The IO thread must implement this method to send the message to the client with
   * their particular implementation of message passing.
   * 
   * @param message The message to send.
   */
  abstract postMessage(message: IoNotification | IoEvent): void;

  /**
   * To be called by the IO thread implementation when receiving a message from the client.
   */
  protected handleMessage(event: IoCommand | IoEvent): void {
    if (!event.kind) {
      console.warn('Invalid message received on the app-config-channel.', event);
      return;
    }
    if (event.kind === 'IO#Event') {
      // message sent by self.
      return;
    }
    const { args, fn, id } = event;

    if (typeof id !== 'number') {
      console.warn('Invalid message received on the app-config-channel. The id must be a number.');
      return;
    }

    if (typeof fn !== 'string' || !fn) {
      console.warn('Invalid message received on the app-config-channel. The second argument must be a function name to call.');
      return;
    }

    const isFunction = typeof this[fn as keyof IoThread] === 'function';

    if (!isFunction) {
      console.warn(`Invalid message received on the app-config-channel. The function "${fn}" is either not implemented or invalid.`);
      return;
    }
    
    this.call(fn as keyof IoThread, id, args);
  }

  /**
   * Calls the function on self, creates a response event, and dispatches it.
   * 
   * @param fnName The function name to call.
   * @param id The request id sent back to the client.
   * @param args The function arguments.
   */
  protected async call(fnName: keyof IoThread, id: number, args: any[]): Promise<void> {
    const event: IoEvent = {
      kind: 'IO#Event',
      id,
      type: 'result',
    };
    try {
      const promise = (this[fnName] as (...init: any[]) => Promise<any>)(...args);
      event.result = await promise;
      this.postMessage(event);
    } catch (e) {
      event.type = 'error';
      event.message = (e as Error).message;
      this.postMessage(event);
    }
  }

  /**
   * Sends a message to the clients that is a request to send a client DOM event.
   * 
   * @param eventPath The path in the `Events` prototype.
   * @param args The arguments to call the event with.
   */
  protected notifyClients(eventPath: string, ...args: any[]): void {
    const info: IoNotification = {
      kind: 'IO#Notification',
      args,
      path: eventPath,
    };
    this.postMessage(info);
  }
}
