import { IUrl } from '@api-client/core/build/browser.js';

function setMidnight(date: Date): void {
  date.setHours(0, 0, 0, 0);
}

export default class AppDataStore {
  protected _db?: IDBDatabase;

  /**
   * Opens the URL history store.
   * @returns The reference to the database
   */
  async open(): Promise<IDBDatabase> {
    if (this._db) {
      return this._db;
    }
    return new Promise((resolve, reject) => {
      const request = globalThis.indexedDB.open("ApiClientData", 1)
      request.onerror = (): void => {
        reject(new Error('Unable to open URL history database.'));
      };
      request.onsuccess = (): void => {
        const db = request.result;
        this._db = db;
        resolve(db);
      };

      request.onupgradeneeded = this._versionchange.bind(this);
    });
  }

  protected _versionchange(e: IDBVersionChangeEvent): void {
    const db = (e.target as IDBOpenDBRequest).result;
    // URL history
    db.createObjectStore('UrlHistory', { keyPath: 'url' });
  }

  /**
   * It either creates a new URL history object in the store or updates
   * an existing one with the cnt, time, and midnight values.
   * 
   * @param url The URL to store.
   */
  async addUrlHistory(url: string): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['UrlHistory'], 'readwrite');
      tx.oncomplete = (): void => resolve();
      tx.onerror = (): void => reject(new Error('Unable to insert into the history URL store.'));
      const store = tx.objectStore("UrlHistory");
      const request = store.get(url);
      const time = Date.now();
      const midnight = new Date(time);
      setMidnight(midnight);

      request.onsuccess = (): void => {
        let data: IUrl;
        if (request.result) {
          data = request.result as IUrl;
          data.cnt += 1;
          data.time = time;
          data.midnight = midnight.getTime();
        } else {
          data = {
            cnt: 1,
            time,
            url,
            midnight: midnight.getTime(),
          };
        }
        store.put(data);
      };
    });
  }

  protected async queryUrlHistoryKeys(query: string): Promise<string[]> {
    const db = await this.open();
    const q = String(query).toLowerCase();
    return new Promise((resolve, reject) => {
      const result: string[] = [];
      const tx = db.transaction(['UrlHistory'], 'readonly');
      tx.oncomplete = (): void => resolve(result);
      tx.onerror = (): void => reject(new Error('Unable to query for history URL keys.'));
      const store = tx.objectStore("UrlHistory");
      store.openKeyCursor().onsuccess = (e: Event): void => {
        const cursor = (e.target as IDBRequest<IDBCursor | null>).result;
        if (cursor) {
          const url = cursor.key.toString().toLowerCase();
          if (url.includes(q)) {
            result.push(url);
          }
          cursor.continue();
        }
      }
    });
  }

  protected async queryUrlHistoryValues(keys: string[]): Promise<IUrl[]> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const result: IUrl[] = [];
      const tx = db.transaction(['UrlHistory'], 'readonly');
      tx.oncomplete = (): void => resolve(result);
      tx.onerror = (): void => reject(new Error('Unable to query for history URL keys.'));
      const store = tx.objectStore("UrlHistory");
      keys.forEach((key) => {
        const request = store.get(key);
        request.onsuccess = (): void => {
          const data = request.result as IUrl;
          result.push(data);
        };
      });
    });
  }

  async queryUrlHistory(query: string): Promise<IUrl[]> {
    const keys = await this.queryUrlHistoryKeys(query);
    if (!keys.length) {
      return [];
    }
    return this.queryUrlHistoryValues(keys);
  }

  async deleteUrlHistory(url: string): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['UrlHistory'], 'readwrite');
      tx.oncomplete = (): void => resolve();
      tx.onerror = (): void => reject(new Error('Unable to delete from the history URL store.'));
      const store = tx.objectStore("UrlHistory");
      store.delete(url);
    });
  }

  async clearUrlHistory(): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['UrlHistory'], 'readwrite');
      tx.oncomplete = (): void => resolve();
      tx.onerror = (): void => reject(new Error('Unable to clear the history URL store.'));
      const store = tx.objectStore("UrlHistory");
      store.clear();
    });
  }
}
