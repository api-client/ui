import { IUrl, ContextDeleteEvent, ContextDeleteRecord, ContextUpdateEvent, IRequestUiMeta, ContextChangeRecord, ContextReadEvent, ContextQueryEvent } from '@api-client/core/build/browser.js';
import { PlatformBindings } from './PlatformBindings.js';
import { EventTypes } from '../../events/EventTypes.js';
import { IRequestUiInsertDetail } from '../../events/AppDataEvents.js';

/**
 * The bindings for storing application data on a local machine.
 */
export abstract class AppDataBindings extends PlatformBindings {
  async initialize(): Promise<void> {
    window.addEventListener(EventTypes.AppData.Http.UrlHistory.add, this.addUrlHistoryHandler.bind(this));
    window.addEventListener(EventTypes.AppData.Http.UrlHistory.query, this.queryUrlHistoryHandler.bind(this));
    window.addEventListener(EventTypes.AppData.Http.UrlHistory.delete, this.deleteUrlHistoryHandler.bind(this));
    window.addEventListener(EventTypes.AppData.Http.UrlHistory.clear, this.clearUrlHistoryHandler.bind(this));

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
    e.detail.result = this.getHttpRequestUi(parent!, key);
  }

  protected deleteHttpRequestUiHandler(e: ContextDeleteEvent): void {
    e.preventDefault();
    const { key, parent } = e.detail;
    e.detail.result = this.deleteHttpRequestUi(parent!, key);
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
  abstract queryUrlHistory(q: string): Promise<IUrl[]>;

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
