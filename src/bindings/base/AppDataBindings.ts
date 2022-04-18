import { IUrl } from '@api-client/core/build/browser.js';
import { PlatformBindings } from './PlatformBindings.js';
import { EventTypes } from '../../events/EventTypes.js';

/**
 * The bindings for storing application data on a local machine.
 */
export abstract class AppDataBindings extends PlatformBindings {
  async initialize(): Promise<void> {
    window.addEventListener(EventTypes.AppData.Http.UrlHistory.add, this.addUrlHistoryHandler.bind(this));
    window.addEventListener(EventTypes.AppData.Http.UrlHistory.query, this.queryUrlHistoryHandler.bind(this));
    window.addEventListener(EventTypes.AppData.Http.UrlHistory.delete, this.deleteUrlHistoryHandler.bind(this));
    window.addEventListener(EventTypes.AppData.Http.UrlHistory.clear, this.clearUrlHistoryHandler.bind(this));
  }

  protected addUrlHistoryHandler(event: Event): void {
    const e = event as CustomEvent;
    e.preventDefault();
    e.detail.result = this.addUrlHistory(e.detail.url);
  }

  protected queryUrlHistoryHandler(event: Event): void {
    const e = event as CustomEvent;
    e.preventDefault();
    e.detail.result = this.queryUrlHistory(e.detail.q);
  }

  protected deleteUrlHistoryHandler(event: Event): void {
    const e = event as CustomEvent;
    e.preventDefault();
    e.detail.result = this.deleteUrlHistory(e.detail.url);
  }

  protected clearUrlHistoryHandler(event: Event): void {
    const e = event as CustomEvent;
    e.preventDefault();
    e.detail.result = this.clearUrlHistory();
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
  abstract deleteUrlHistory(url: string): Promise<void>;

  /**
   * Clears the URL history store.
   */
  abstract clearUrlHistory(): Promise<void>;
}
