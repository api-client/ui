/* eslint-disable max-classes-per-file */
/* eslint-disable class-methods-use-this */
import { 
  ContextUpdateEvent, IHostRule,
  ContextChangeRecord, ContextDeleteEvent, ContextDeleteRecord, ContextListEvent,
  ContextListOptions, ContextListResult, ContextUpdateBulkEvent,
  ContextStateUpdateEvent, ContextStateDeleteEvent, ContextDeleteBulkEvent,
} from "@api-client/core/build/browser.js";
import { EventTypes } from '../../EventTypes.js';

export class HostsEvents {
  static update(item: IHostRule, target: EventTarget = window): Promise<ContextChangeRecord<IHostRule> | undefined> {
    const e = new ContextUpdateEvent<IHostRule>(EventTypes.HttpClient.Model.Host.update, {
      item,
    });
    target.dispatchEvent(e);
    return e.detail.result as Promise<ContextChangeRecord<IHostRule> | undefined>;
  }

  static updateBulk(items: IHostRule[], target: EventTarget = window): Promise<ContextChangeRecord<IHostRule>[] | undefined> {
    const e = new ContextUpdateBulkEvent<IHostRule>(EventTypes.HttpClient.Model.Host.updateBulk, {
      items,
    });
    target.dispatchEvent(e);
    return e.detail.result as Promise<ContextChangeRecord<IHostRule>[] | undefined>;
  }

  static delete(id: string, target: EventTarget = window): Promise<ContextDeleteRecord | undefined> {
    const e = new ContextDeleteEvent(EventTypes.HttpClient.Model.Host.delete, id);
    target.dispatchEvent(e);
    return e.detail.result as Promise<ContextDeleteRecord | undefined>;
  }

  static deleteBulk(ids: string[], target: EventTarget = window): Promise<ContextDeleteRecord[] | undefined> {
    const e = new ContextDeleteBulkEvent(EventTypes.HttpClient.Model.Host.deleteBulk, ids);
    target.dispatchEvent(e);
    return e.detail.result as Promise<ContextDeleteRecord[] | undefined>;
  }

  static list(opts?: ContextListOptions, target: EventTarget = window): Promise<ContextListResult<IHostRule> | undefined> {
    const e = new ContextListEvent<IHostRule>(EventTypes.HttpClient.Model.Host.list, opts);
    target.dispatchEvent(e);
    return e.detail.result as Promise<ContextListResult<IHostRule> | undefined>;
  }

  static State = class {
    static update(record: ContextChangeRecord<IHostRule>, target: EventTarget = window): void {
      const e = new ContextStateUpdateEvent(EventTypes.HttpClient.Model.Host.State.update, record);
      target.dispatchEvent(e);
    }

    static delete(record: ContextDeleteRecord, target: EventTarget = window): void {
      const e = new ContextStateDeleteEvent(EventTypes.HttpClient.Model.Host.State.delete, record);
      target.dispatchEvent(e);
    }
  }
}
