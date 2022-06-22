/* eslint-disable max-classes-per-file */
/* eslint-disable class-methods-use-this */
import { 
  IAppRequest, ContextReadEvent,ContextReadBulkEvent, ContextUpdateEvent, 
  ContextChangeRecord, ContextDeleteEvent, ContextDeleteRecord, ContextListEvent,
  ContextListOptions, ContextListResult, ContextUpdateBulkEvent, ContextDeleteBulkEvent,
  ContextRestoreEvent, IQueryDetail, ContextQueryEvent, ContextStateUpdateEvent, ContextStateDeleteEvent, IQueryResponse,
} from "@api-client/core/build/browser.js";
import { EventTypes } from '../../EventTypes.js';

export class HistoryEvents {
  static create(item: IAppRequest, target: EventTarget = window): Promise<ContextChangeRecord<IAppRequest> | undefined> {
    const e = new ContextUpdateEvent<IAppRequest>(EventTypes.HttpClient.Model.History.create, {
      item,
    });
    target.dispatchEvent(e);
    return e.detail.result as Promise<ContextChangeRecord<IAppRequest> | undefined>;
  }

  static read(id: string, target: EventTarget = window): Promise<IAppRequest | undefined> {
    const e = new ContextReadEvent<IAppRequest>(EventTypes.HttpClient.Model.History.read, id);
    target.dispatchEvent(e);
    return e.detail.result as Promise<IAppRequest | undefined>;
  }

  static readBulk(ids: string[], target: EventTarget = window): Promise<IAppRequest[] | undefined> {
    const e = new ContextReadBulkEvent<IAppRequest>(EventTypes.HttpClient.Model.History.readBulk, ids);
    target.dispatchEvent(e);
    return e.detail.result as Promise<IAppRequest[] | undefined>;
  }

  static update(item: IAppRequest, target: EventTarget = window): Promise<ContextChangeRecord<IAppRequest> | undefined> {
    const e = new ContextUpdateEvent<IAppRequest>(EventTypes.HttpClient.Model.History.update, {
      item,
    });
    target.dispatchEvent(e);
    return e.detail.result as Promise<ContextChangeRecord<IAppRequest> | undefined>;
  }

  static updateBulk(items: IAppRequest[], target: EventTarget = window): Promise<ContextChangeRecord<IAppRequest>[] | undefined> {
    const e = new ContextUpdateBulkEvent<IAppRequest>(EventTypes.HttpClient.Model.History.updateBulk, {
      items,
    });
    target.dispatchEvent(e);
    return e.detail.result as Promise<ContextChangeRecord<IAppRequest>[] | undefined>;
  }

  static delete(id: string, target: EventTarget = window): Promise<ContextDeleteRecord | undefined> {
    const e = new ContextDeleteEvent(EventTypes.HttpClient.Model.History.delete, id);
    target.dispatchEvent(e);
    return e.detail.result as Promise<ContextDeleteRecord | undefined>;
  }

  static deleteBulk(ids: string[], target: EventTarget = window): Promise<ContextDeleteRecord[] | undefined> {
    const e = new ContextDeleteBulkEvent(EventTypes.HttpClient.Model.History.deleteBulk, ids);
    target.dispatchEvent(e);
    return e.detail.result as Promise<ContextDeleteRecord[] | undefined>;
  }

  static undeleteBulk(records: ContextDeleteRecord[], target: EventTarget = window): Promise<ContextChangeRecord<IAppRequest>[] | undefined> {
    const e = new ContextRestoreEvent<IAppRequest>(EventTypes.HttpClient.Model.History.undeleteBulk, records);
    target.dispatchEvent(e);
    return e.detail.result as Promise<ContextChangeRecord<IAppRequest>[] | undefined>;
  }

  static list(opts?: ContextListOptions, target: EventTarget = window): Promise<ContextListResult<IAppRequest> | undefined> {
    const e = new ContextListEvent<IAppRequest>(EventTypes.HttpClient.Model.History.list, opts);
    target.dispatchEvent(e);
    return e.detail.result as Promise<ContextListResult<IAppRequest> | undefined>;
  }

  static query(query: IQueryDetail, target: EventTarget = window): Promise<IQueryResponse<IAppRequest> | undefined> {
    const e = new ContextQueryEvent<IAppRequest>(EventTypes.HttpClient.Model.History.query, query);
    target.dispatchEvent(e);
    return e.detail.result as Promise<IQueryResponse<IAppRequest> | undefined>;
  }

  static State = class {
    static update(record: ContextChangeRecord<IAppRequest>, target: EventTarget = window): void {
      const e = new ContextStateUpdateEvent(EventTypes.HttpClient.Model.History.State.update, record);
      target.dispatchEvent(e);
    }

    static delete(record: ContextDeleteRecord, target: EventTarget = window): void {
      const e = new ContextStateDeleteEvent(EventTypes.HttpClient.Model.History.State.delete, record);
      target.dispatchEvent(e);
    }
  }
}
