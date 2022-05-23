/* eslint-disable max-classes-per-file */
/* eslint-disable class-methods-use-this */
import { 
  IArcHttpRequest, ContextReadEvent,ContextReadBulkEvent, ContextUpdateEvent, 
  ContextChangeRecord, ContextDeleteEvent, ContextDeleteRecord, ContextListEvent,
  ContextListOptions, ContextListResult, ContextUpdateBulkEvent, ContextDeleteBulkEvent,
  ContextRestoreEvent, IQueryDetail, ContextQueryEvent, ContextStateUpdateEvent, ContextStateDeleteEvent,
} from "@api-client/core/build/browser.js";
import { ArcModelEventTypes } from "./ArcModelEventTypes.js";

export class HistoryEvents {
  static read(id: string, target: EventTarget = window): Promise<IArcHttpRequest | undefined> {
    const e = new ContextReadEvent<IArcHttpRequest>(ArcModelEventTypes.History.read, id);
    target.dispatchEvent(e);
    return e.detail.result as Promise<IArcHttpRequest | undefined>;
  }

  static readBulk(ids: string[], target: EventTarget = window): Promise<IArcHttpRequest[] | undefined> {
    const e = new ContextReadBulkEvent<IArcHttpRequest>(ArcModelEventTypes.History.readBulk, ids);
    target.dispatchEvent(e);
    return e.detail.result as Promise<IArcHttpRequest[] | undefined>;
  }

  static update(item: IArcHttpRequest, target: EventTarget = window): Promise<ContextChangeRecord<IArcHttpRequest> | undefined> {
    const e = new ContextUpdateEvent<IArcHttpRequest>(ArcModelEventTypes.History.update, {
      item,
    });
    target.dispatchEvent(e);
    return e.detail.result as Promise<ContextChangeRecord<IArcHttpRequest> | undefined>;
  }

  static updateBulk(items: IArcHttpRequest[], target: EventTarget = window): Promise<ContextChangeRecord<IArcHttpRequest>[] | undefined> {
    const e = new ContextUpdateBulkEvent<IArcHttpRequest>(ArcModelEventTypes.History.updateBulk, {
      items,
    });
    target.dispatchEvent(e);
    return e.detail.result as Promise<ContextChangeRecord<IArcHttpRequest>[] | undefined>;
  }

  static delete(id: string, target: EventTarget = window): Promise<ContextDeleteRecord | undefined> {
    const e = new ContextDeleteEvent(ArcModelEventTypes.History.delete, id);
    target.dispatchEvent(e);
    return e.detail.result as Promise<ContextDeleteRecord | undefined>;
  }

  static deleteBulk(ids: string[], target: EventTarget = window): Promise<ContextDeleteRecord[] | undefined> {
    const e = new ContextDeleteBulkEvent(ArcModelEventTypes.History.deleteBulk, ids);
    target.dispatchEvent(e);
    return e.detail.result as Promise<ContextDeleteRecord[] | undefined>;
  }

  static undeleteBulk(records: ContextDeleteRecord[], target: EventTarget = window): Promise<ContextChangeRecord<IArcHttpRequest>[] | undefined> {
    const e = new ContextRestoreEvent<IArcHttpRequest>(ArcModelEventTypes.History.undeleteBulk, records);
    target.dispatchEvent(e);
    return e.detail.result as Promise<ContextChangeRecord<IArcHttpRequest>[] | undefined>;
  }

  static list(opts?: ContextListOptions, target: EventTarget = window): Promise<ContextListResult<IArcHttpRequest> | undefined> {
    const e = new ContextListEvent<IArcHttpRequest>(ArcModelEventTypes.History.list, opts);
    target.dispatchEvent(e);
    return e.detail.result as Promise<ContextListResult<IArcHttpRequest> | undefined>;
  }

  static query(query: IQueryDetail, target: EventTarget = window): Promise<IArcHttpRequest[] | undefined> {
    const e = new ContextQueryEvent<IArcHttpRequest>(ArcModelEventTypes.History.query, query);
    target.dispatchEvent(e);
    return e.detail.result as Promise<IArcHttpRequest[] | undefined>;
  }

  static State = class {
    static update(record: ContextChangeRecord<IArcHttpRequest>, target: EventTarget = window): void {
      const e = new ContextStateUpdateEvent(ArcModelEventTypes.History.State.update, record);
      target.dispatchEvent(e);
    }

    static delete(record: ContextDeleteRecord, target: EventTarget = window): void {
      const e = new ContextStateDeleteEvent(ArcModelEventTypes.History.State.delete, record);
      target.dispatchEvent(e);
    }
  }
}
