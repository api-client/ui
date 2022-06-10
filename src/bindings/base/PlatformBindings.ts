/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { IApplication } from '@api-client/core/build/browser.js';
import { Events } from '../../events/Events.js';

/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * A command sent from the client to a IO thread.
 */
export interface IoCommand {
  kind: 'IO#Command',
  id: number;
  fn: string;
  args: any[];
}

/**
 * An event dispatched from the IO thread to the clients.
 */
export interface IoEvent {
  kind: 'IO#Event',
  id: number;
  type: 'error' | 'result'; 
  message?: string; 
  result?: any;
}

/**
 * A special kind of an event from the IO thread to the clients that asks to notify the client
 * using the events system.
 */
export interface IoNotification {
  kind: 'IO#Notification',
  path: string;
  args: any[];
}

/**
 * Events queue on the client side.
 * This is used when communication with the IO thread via Promises is impossible and event based.
 * The client wraps the execution into a promise and pushes this schema into the queue.
 * When the event is dispatched by the IO thread it resolves/rejects cached promise.
 */
export interface QueueItem {
  id: number;
  resolve: (value: any) => void;
  reject: (reason?: Error) => void;
}

/**
 * A base class for all platform bindings.
 * 
 * Platform bindings is the way how the application runs a platform specific logic.
 * 
 * For example, it implements how the application stores the state or implements file picker / file saver.
 * Depending on the platform (Electron, web, Chrome, more?)  it uses different set of bindings
 * defined in the target application. This creates a framework for the bindings to exist.
 * 
 * The IO thread can be any process that is separated from the browser tab context.
 * Can be a WebWorker, ServiceWorker, of an API call to a server.
 * When communication with the binding is not possible via the Promise API
 * this system should be used to communicate with the background page.
 * 
 * ```typescript 
 * class MyBinding extends ParentBaseBinding {
 *   channel: BroadcastChannel;
 *   constructor() {
 *     super();
 *     this.channel = new BroadcastChannel('my-channel');
 *   }
 *   
 *   doStuff(arg: any): Promise<any> {
 *      return this.invoke('doStuff', 'own argument', arg);
 *   }
 * }
 * ```
 * 
 * This assumes that the IO thread has the `doStuff` function implemented.
 * The IO thread extends the `IoThread` class which has the defined the communication logic.
 */
export abstract class PlatformBindings {
  /**
   * Used with the queue as the identifier of the request.
   * USe the `getId()` to read a unique request id.
   */
  private id = 0;

  protected queue: QueueItem[] = [];

  /**
   * The application id that initialized this binding.
   */
  app: IApplication;

  constructor(app: IApplication) {
    this.app = app;
  }

  /**
   * Initializes the bindings.
   */
  abstract initialize(): Promise<void>;

  /**
   * @returns A unique for the current session id.
   */
  protected getId(): number {
    this.id += 1;
    return this.id;
  }

  /**
   * This method to be implemented by child classes that uses the events system to communicate with the 
   * IO thread. The argument is the prepared command message ready to be sent to the IO thread.
   * Specific implementation of the communication channel is left to the child class.
   * 
   * @param cmd The command to send to the IO thread.
   */
  protected sendIoCommand(cmd: IoCommand): void {
    // 
  }

  /**
   * Invokes a function in the IO thread.
   * 
   * @param fn The function name to invoke (or an identifier understood by the IO thread)
   * @param args The function arguments to pass.
   * @returns A promise that should be returned to the client's application logic. 
   * The promise is resolved when the IO thread sends an event with the same identifier generated with this call.
   */
  protected invoke(fn: string, ...args: any[]): Promise<any> {
    return new Promise((resolve, reject) => {
      const id = this.getId();
      const item = {
        resolve, reject, id,
      };
      this.queue.push(item);
      const cmd: IoCommand = {
        id,
        fn,
        args,
        kind: 'IO#Command',
      };
      this.sendIoCommand(cmd);
    });
  }

  /**
   * To be called by the child class when the IO thread send an event.
   * It recognizes the type of the message sent by the IO thread an performs the requested operation.
   * 
   * @param message The message sent by the IO thread.
   */
  protected handleIoMessage(message: IoCommand | IoEvent | IoNotification): void {
    if (!message.kind) {
      // eslint-disable-next-line no-console
      console.warn('Invalid message received on the app-config-channel.', message);
      return;
    }
    if (message.kind === 'IO#Command') {
      // message sent by self.
      return;
    }
    if (message.kind === 'IO#Notification') {
      this.notify(message);
    } else if (message.kind === 'IO#Event') {
      this.resolve(message);
    }
  }

  /**
   * Resolves a pending promise stored in the `queue`.
   * 
   * @param event The IO thread event
   */
  protected resolve(event: IoEvent): void {
    const { id, type, message, result } = event;
    if (typeof id !== 'number') {
      // eslint-disable-next-line no-console
      console.warn(`Unknown event from the IO thread. Id is not a number.`, event);
      return;
    }
    const index = this.queue.findIndex(i => i.id === id);
    if (index < 0) {
      // this might be used by another tab.
      return;
    }
    const info = this.queue[index];
    this.queue.splice(index, 1);

    if (type === 'result') {
      info.resolve(result);
    } else if (type === 'error') {
      info.reject(new Error(message));
    } else {
      // eslint-disable-next-line no-console
      console.warn(`Unknown event from the IO thread`, event);
    }
  }

  /**
   * Notifies this tab about something using the `Events` definition.
   * 
   * This expects that the event has the path to the event function, for example `Events.Config.Environment.State.created`.
   * 
   * @param event The IO thread event
   */
  protected notify(event: IoNotification): void {
    const { path, args } = event;
    const parts = path.split('.');
    let current = Events as unknown;
    if (parts[0] === 'Events') {
      parts.shift();
    }
    for (const part of parts) {
      // @ts-ignore
      if (!current[part]) {
        // eslint-disable-next-line no-console
        console.warn(`Invalid notification path`, path);
        return
      }
      // @ts-ignore
      current = current[part];
    }
    (current as Function)(...args);
  }
}
