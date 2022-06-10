import { IUrl, ContextDeleteEvent, ContextDeleteRecord, ContextUpdateEvent, IRequestUiMeta, ContextChangeRecord, ContextReadEvent, ContextQueryEvent, IQueryResponse } from '@api-client/core/build/browser.js';
import { PlatformBindings } from './PlatformBindings.js';
import { EventTypes } from '../../events/EventTypes.js';
import { IFileReadConfig, IFileWriteConfig, IRequestUiInsertDetail } from '../../events/AppDataEvents.js';

/**
 * The bindings for storing application data on a local machine.
 */
export abstract class AppDataBindings extends PlatformBindings {
  async initialize(): Promise<void> {
    window.addEventListener(EventTypes.AppData.Http.UrlHistory.add, this.addUrlHistoryHandler.bind(this));
    window.addEventListener(EventTypes.AppData.Http.UrlHistory.query, this.queryUrlHistoryHandler.bind(this));
    window.addEventListener(EventTypes.AppData.Http.UrlHistory.delete, this.deleteUrlHistoryHandler.bind(this));
    window.addEventListener(EventTypes.AppData.Http.UrlHistory.clear, this.clearUrlHistoryHandler.bind(this));

    window.addEventListener(EventTypes.AppData.Ws.UrlHistory.add, this.addWsHistoryHandler.bind(this));
    window.addEventListener(EventTypes.AppData.Ws.UrlHistory.query, this.queryWsHistoryHandler.bind(this));
    window.addEventListener(EventTypes.AppData.Ws.UrlHistory.delete, this.deleteWsHistoryHandler.bind(this));
    window.addEventListener(EventTypes.AppData.Ws.UrlHistory.clear, this.clearWsHistoryHandler.bind(this));

    window.addEventListener(EventTypes.AppData.File.read, this.readAppDataFileHandler.bind(this));
    window.addEventListener(EventTypes.AppData.File.write, this.writeAppDataFileHandler.bind(this));

    window.addEventListener(EventTypes.HttpProject.Ui.delete, this.deleteProjectUiHandler.bind(this) as EventListener);
    window.addEventListener(EventTypes.HttpProject.Ui.HttpRequest.set, this.setHttpRequestUiHandler.bind(this) as EventListener);
    window.addEventListener(EventTypes.HttpProject.Ui.HttpRequest.get, this.getHttpRequestUiHandler.bind(this) as EventListener);
    window.addEventListener(EventTypes.HttpProject.Ui.HttpRequest.delete, this.deleteHttpRequestUiHandler.bind(this) as EventListener);
  }

  protected addUrlHistoryHandler(event: Event): void {
    const e = event as CustomEvent;
    e.preventDefault();
    e.detail.result = this.addUrlHistory(e.detail.url);
  }

  protected queryUrlHistoryHandler(event: Event): void {
    const e = event as ContextQueryEvent<IUrl>;
    e.preventDefault();
    e.detail.result = this.queryUrlHistory(e.detail.term);
  }

  protected deleteUrlHistoryHandler(event: Event): void {
    const e = event as ContextDeleteEvent;
    e.preventDefault();
    e.detail.result = this.deleteUrlHistory(e.detail.key);
  }

  protected clearUrlHistoryHandler(event: Event): void {
    const e = event as CustomEvent;
    e.preventDefault();
    e.detail.result = this.clearUrlHistory();
  }

  protected addWsHistoryHandler(event: Event): void {
    const e = event as CustomEvent;
    e.preventDefault();
    e.detail.result = this.addWsHistory(e.detail.url);
  }

  protected queryWsHistoryHandler(event: Event): void {
    const e = event as ContextQueryEvent<IUrl>;
    e.preventDefault();
    e.detail.result = this.queryWsHistory(e.detail.term);
  }

  protected deleteWsHistoryHandler(event: Event): void {
    const e = event as ContextDeleteEvent;
    e.preventDefault();
    e.detail.result = this.deleteWsHistory(e.detail.key);
  }

  protected clearWsHistoryHandler(event: Event): void {
    const e = event as CustomEvent;
    e.preventDefault();
    e.detail.result = this.clearWsHistory();
  }

  protected readAppDataFileHandler(event: Event): void {
    if (event.defaultPrevented) {
      return;
    }
    const e = event as CustomEvent;
    e.preventDefault();
    e.detail.result = this.readAppDataFile(e.detail.path, e.detail.opts);
  }

  protected writeAppDataFileHandler(event: Event): void {
    if (event.defaultPrevented) {
      return;
    }
    const e = event as CustomEvent;
    e.preventDefault();
    e.detail.result = this.writeAppDataFile(e.detail.path, e.detail.content, e.detail.opts);
  }

  protected deleteProjectUiHandler(e: ContextDeleteEvent): void {
    e.preventDefault();
    const { key } = e.detail;
    e.detail.result = this.deleteProjectUi(key);
  }

  protected setHttpRequestUiHandler(e: ContextUpdateEvent<IRequestUiInsertDetail, IRequestUiMeta>): void {
    e.preventDefault();
    const { item } = e.detail;
    e.detail.result = this.setHttpRequestUi(item.pid, item.id, item.meta);
  }

  protected getHttpRequestUiHandler(e: ContextReadEvent<IRequestUiMeta>): void {
    e.preventDefault();
    const { key, parent } = e.detail;
    e.detail.result = this.getHttpRequestUi(parent as string, key);
  }

  protected deleteHttpRequestUiHandler(e: ContextDeleteEvent): void {
    e.preventDefault();
    const { key, parent } = e.detail;
    e.detail.result = this.deleteHttpRequestUi(parent as string, key);
  }

  /**
   * Adds a new object to the URL history.
   * @param url The URL to add.
   */
  abstract addUrlHistory(url: string): Promise<void>;

  /**
   * Queries the URL history for suggestions.
   * @param q The part of URL to query for.
   */
  abstract queryUrlHistory(q: string): Promise<IQueryResponse<IUrl>>;

  /**
   * Deletes a single URL form the store.
   * @param url The full URL to delete
   */
  abstract deleteUrlHistory(url: string): Promise<ContextDeleteRecord>;

  /**
   * Clears the URL history store.
   */
  abstract clearUrlHistory(): Promise<void>;

  /**
   * Adds a new object to the web sockets URL history.
   * @param url The URL to add.
   */
  abstract addWsHistory(url: string): Promise<void>;

  /**
   * Queries the web sockets URL history for suggestions.
   * @param q The part of URL to query for.
   */
  abstract queryWsHistory(q: string): Promise<IQueryResponse<IUrl>>;

  /**
   * Deletes a single web sockets URL form the store.
   * @param url The full URL to delete
   */
  abstract deleteWsHistory(url: string): Promise<ContextDeleteRecord>;

  /**
   * Clears the web sockets URL history store.
   */
  abstract clearWsHistory(): Promise<void>;

  /**
   * Reads file content from the application's app data folder on the user filesystem.
   * In the web platform this can be a virtual FS made in IDB.
   * 
   * The content of the file is returned as string by default. Set the `binary` configuration option if it should return a binary content.
   * 
   * @param path The path to the file to read. Usually it is the file name and the background thread resolves the name to the actual path.
   * @param opts Optional configuration.
   */
  abstract readAppDataFile(path: string, opts?: IFileReadConfig): Promise<string | Buffer | ArrayBuffer | undefined>;

  /**
   * Writes a content to a file in the application's app data folder on the user filesystem.
   * In the web platform this can be a virtual FS made in IDB.
   * 
   * The content of the file is can be either a string or a buffer.
   * 
   * @param path The path to the file to read. Usually it is the file name and the background thread resolves the name to the actual path.
   * @param content The content to write.
   * @param opts Optional configuration.
   */
  abstract writeAppDataFile(path: string, content: string | Buffer | ArrayBuffer, opts?: IFileWriteConfig): Promise<void>;

  /**
   * Deletes an UI metadata for a project.
   * 
   * @param key The key of the project to remove the meta for.
   * @returns The delete record
   */
  abstract deleteProjectUi(key: string): Promise<ContextDeleteRecord>;

  /**
   * Sets an UI state for an HTTP request in a project
   * 
   * @param pid The project key.
   * @param key The key of the request.
   * @returns The created object
   */
  abstract setHttpRequestUi(pid: string, key: string, meta: IRequestUiMeta): Promise<ContextChangeRecord<IRequestUiMeta>>;

  /**
   * Reads an UI state for an HTTP request in a project
   * 
   * @param pid The project key.
   * @param key The key of the request.
   * @returns The meta object
   */
  abstract getHttpRequestUi(pid: string, key: string): Promise<IRequestUiMeta>;

  /**
   * Deletes an UI state for an HTTP request in a project
   * 
   * @param pid The project key.
   * @param key The key of the request.
   * @returns The delete record
   */
  abstract deleteHttpRequestUi(pid: string, key: string): Promise<ContextDeleteRecord>;
}
