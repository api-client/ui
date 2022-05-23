/* eslint-disable @typescript-eslint/no-explicit-any */
import { ContextChangeRecord, ContextDeleteRecord, IRequestUiMeta, IUrl } from '@api-client/core/build/browser.js';
import { openDB, DBSchema, IDBPDatabase } from 'idb/with-async-ittr';

export type StoreName = 'UrlHistory' | 'WsHistory' | 'ProjectRequestUi' | 'HttpRequestUi';

interface IStoredRequestUiMeta extends IRequestUiMeta {
  key: string;
}

interface AppDataDB extends DBSchema {
  UrlHistory: {
    key: string;
    value: IUrl;
  },
  WsHistory: {
    key: string;
    value: IUrl;
  },
  ProjectRequestUi: {
    key: string;
    value: IStoredRequestUiMeta;
  },
  HttpRequestUi: {
    key: string;
    value: IStoredRequestUiMeta,
  },
}

function setMidnight(date: Date): void {
  date.setHours(0, 0, 0, 0);
}

const HighChar = `\uffff`;

export default class AppDataStore {
  protected _db?: IDBPDatabase<AppDataDB>;

  /**
   * Opens the URL history store.
   * @returns The reference to the database
   */
  async open(): Promise<IDBPDatabase<AppDataDB>> {
    if (this._db) {
      return this._db;
    }
    const dbResult = await openDB<AppDataDB>('ApiClientData', 7, {
      upgrade(db) {
        const stores: StoreName[] = [
          'UrlHistory', 'ProjectRequestUi', 'HttpRequestUi', 'WsHistory',
        ];
        const names = db.objectStoreNames;
        for (const name of stores) {
          if (!names.contains(name)) {
            db.createObjectStore(name, { keyPath: 'key' });
          }
        }
      },
    });
    this._db = dbResult;
    return dbResult;
  }

  /**
   * It either creates a new URL history object in the store or updates
   * an existing one with the cnt, time, and midnight values.
   * 
   * @param url The URL to store.
   */
  async addUrlHistory(url: string): Promise<void> {
    const db = await this.open();
    const tx = db.transaction('UrlHistory', 'readwrite');
    const { store } = tx;
    let item = await store.get(url);
    const time = Date.now();
    const midnight = new Date(time);
    setMidnight(midnight);
    if (item) {
      item.cnt += 1;
      item.time = time;
      item.midnight = midnight.getTime();
    } else {
      item = {
        cnt: 1,
        time,
        key: url,
        midnight: midnight.getTime(),
      };
    }
    await store.put(item);
    await tx.done;
  }

  async queryUrlHistory(query: string): Promise<IUrl[]> {
    const q = String(query).toLowerCase();
    const db = await this.open();
    const tx = db.transaction('UrlHistory', 'readonly');
    const result: IUrl[] = [];
    for await (const cursor of tx.store) {
      const item = cursor.value;
      const url = String(item.key).toLowerCase();
      if (url.includes(q)) {
        result.push(item);
      }
    }
    return result;
  }

  async deleteUrlHistory(url: string): Promise<ContextDeleteRecord> {
    const db = await this.open();
    await db.delete('UrlHistory', url);
    return {
      key: url,
    }
  }

  async clearUrlHistory(): Promise<void> {
    const db = await this.open();
    await db.clear('UrlHistory');
  }

  async addWsHistory(url: string): Promise<void> {
    const db = await this.open();
    const tx = db.transaction('WsHistory', 'readwrite');
    const { store } = tx;
    let item = await store.get(url);
    const time = Date.now();
    const midnight = new Date(time);
    setMidnight(midnight);
    if (item) {
      item.cnt += 1;
      item.time = time;
      item.midnight = midnight.getTime();
    } else {
      item = {
        cnt: 1,
        time,
        key: url,
        midnight: midnight.getTime(),
      };
    }
    await store.put(item);
    await tx.done;
  }

  async queryWsHistory(query: string): Promise<IUrl[]> {
    const q = String(query).toLowerCase();
    const db = await this.open();
    const tx = db.transaction('WsHistory', 'readonly');
    const result: IUrl[] = [];
    for await (const cursor of tx.store) {
      const item = cursor.value;
      const url = String(item.key).toLowerCase();
      if (url.includes(q)) {
        result.push(item);
      }
    }
    return result;
  }

  async deleteWsHistory(url: string): Promise<ContextDeleteRecord> {
    const db = await this.open();
    await db.delete('WsHistory', url);
    return {
      key: url,
    }
  }

  async clearWsHistory(): Promise<void> {
    const db = await this.open();
    await db.clear('WsHistory');
  }

  async deleteProjectUi(id: string): Promise<ContextDeleteRecord> {
    const db = await this.open();
    const keyRange = IDBKeyRange.bound(id, `${id}${HighChar}${HighChar}`, false, false);
    await db.delete('UrlHistory', keyRange);
    return { key: id };
  }

  protected _requestUiKey(pid: string, id: string): string {
    return `${pid}${HighChar}${id}`;
  }

  async setHttpRequestUi(pid: string, id: string, meta: IRequestUiMeta): Promise<ContextChangeRecord<IRequestUiMeta>> {
    const key = this._requestUiKey(pid, id);
    const db = await this.open();
    const item = { ...meta, key };
    await db.put('ProjectRequestUi', item);
    return {
      key: id,
      parent: pid,
      item: meta,
    };
  }

  async getHttpRequestUi(pid: string, id: string): Promise<IRequestUiMeta | undefined> {
    const key = this._requestUiKey(pid, id);
    const db = await this.open();
    const item = await db.get('ProjectRequestUi', key);
    if (item) {
      const typed = item as IRequestUiMeta;
      // delete (typed as any).key;
      return typed;
    }
    return undefined;
  }

  async deleteHttpRequestUi(pid: string, id: string): Promise<ContextDeleteRecord> {
    const key = this._requestUiKey(pid, id);
    const db = await this.open();
    await db.delete('ProjectRequestUi', key);
    return {
      key: id,
      parent: pid,
    };
  }
}
