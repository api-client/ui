/* eslint-disable max-classes-per-file */
/* eslint-disable class-methods-use-this */
import { 
  ContextUpdateEvent, IHostRule,
  ContextChangeRecord, ContextDeleteEvent, ContextDeleteRecord, ContextListEvent,
  ContextListOptions, ContextListResult, ContextUpdateBulkEvent,
  ContextStateUpdateEvent, ContextStateDeleteEvent, ContextDeleteBulkEvent,
} from "@api-client/core/build/browser.js";
import { ArcModelEventTypes } from "./ArcModelEventTypes.js";

export class HostsEvents {
  static update(item: IHostRule, target: EventTarget = window): Promise<ContextChangeRecord<IHostRule> | undefined> {
    const e = new ContextUpdateEvent<IHostRule>(ArcModelEventTypes.Host.update, {
      item,
    });
    target.dispatchEvent(e);
    return e.detail.result as Promise<ContextChangeRecord<IHostRule> | undefined>;
  }

  static updateBulk(items: IHostRule[], target: EventTarget = window): Promise<ContextChangeRecord<IHostRule>[] | undefined> {
    const e = new ContextUpdateBulkEvent<IHostRule>(ArcModelEventTypes.Host.updateBulk, {
      items,
    });
    target.dispatchEvent(e);
    return e.detail.result as Promise<ContextChangeRecord<IHostRule>[] | undefined>;
  }

  static delete(id: string, target: EventTarget = window): Promise<ContextDeleteRecord | undefined> {
    const e = new ContextDeleteEvent(ArcModelEventTypes.Host.delete, id);
    target.dispatchEvent(e);
    return e.detail.result as Promise<ContextDeleteRecord | undefined>;
  }

  static deleteBulk(ids: string[], target: EventTarget = window): Promise<ContextDeleteRecord[] | undefined> {
    const e = new ContextDeleteBulkEvent(ArcModelEventTypes.Host.deleteBulk, ids);
    target.dispatchEvent(e);
    return e.detail.result as Promise<ContextDeleteRecord[] | undefined>;
  }

  static list(opts?: ContextListOptions, target: EventTarget = window): Promise<ContextListResult<IHostRule> | undefined> {
    const e = new ContextListEvent<IHostRule>(ArcModelEventTypes.Host.list, opts);
    target.dispatchEvent(e);
    return e.detail.result as Promise<ContextListResult<IHostRule> | undefined>;
  }

  static State = class {
    static update(record: ContextChangeRecord<IHostRule>, target: EventTarget = window): void {
      const e = new ContextStateUpdateEvent(ArcModelEventTypes.Host.State.update, record);
      target.dispatchEvent(e);
    }

    static delete(record: ContextDeleteRecord, target: EventTarget = window): void {
      const e = new ContextStateDeleteEvent(ArcModelEventTypes.Host.State.delete, record);
      target.dispatchEvent(e);
    }
  }
}
