/* eslint-disable max-classes-per-file */
/* eslint-disable class-methods-use-this */
import { 
  IArcProject, ContextReadEvent,ContextReadBulkEvent, ContextUpdateEvent, 
  ContextChangeRecord, ContextDeleteEvent, ContextDeleteRecord, ContextListEvent,
  ContextListOptions, ContextListResult, ContextUpdateBulkEvent,
  ContextStateUpdateEvent, ContextStateDeleteEvent, ContextDeleteBulkEvent, ContextRestoreEvent,
} from "@api-client/core/build/browser.js";
import { ArcModelEventTypes } from "./ArcModelEventTypes.js";

export class ProjectEvents {
  static read(id: string, target: EventTarget = window): Promise<IArcProject | undefined> {
    const e = new ContextReadEvent<IArcProject>(ArcModelEventTypes.Project.read, id);
    target.dispatchEvent(e);
    return e.detail.result as Promise<IArcProject | undefined>;
  }

  static readBulk(ids: string[], target: EventTarget = window): Promise<IArcProject[] | undefined> {
    const e = new ContextReadBulkEvent<IArcProject>(ArcModelEventTypes.Project.readBulk, ids);
    target.dispatchEvent(e);
    return e.detail.result as Promise<IArcProject[] | undefined>;
  }

  static update(item: IArcProject, target: EventTarget = window): Promise<ContextChangeRecord<IArcProject> | undefined> {
    const e = new ContextUpdateEvent<IArcProject>(ArcModelEventTypes.Project.update, {
      item,
    });
    target.dispatchEvent(e);
    return e.detail.result as Promise<ContextChangeRecord<IArcProject> | undefined>;
  }

  static updateBulk(items: IArcProject[], target: EventTarget = window): Promise<ContextChangeRecord<IArcProject>[] | undefined> {
    const e = new ContextUpdateBulkEvent<IArcProject>(ArcModelEventTypes.Project.updateBulk, {
      items,
    });
    target.dispatchEvent(e);
    return e.detail.result as Promise<ContextChangeRecord<IArcProject>[] | undefined>;
  }

  static delete(id: string, target: EventTarget = window): Promise<ContextDeleteRecord | undefined> {
    const e = new ContextDeleteEvent(ArcModelEventTypes.Project.delete, id);
    target.dispatchEvent(e);
    return e.detail.result as Promise<ContextDeleteRecord | undefined>;
  }

  static deleteBulk(ids: string[], target: EventTarget = window): Promise<ContextDeleteRecord[] | undefined> {
    const e = new ContextDeleteBulkEvent(ArcModelEventTypes.Project.deleteBulk, ids);
    target.dispatchEvent(e);
    return e.detail.result as Promise<ContextDeleteRecord[] | undefined>;
  }

  static undeleteBulk(records: ContextDeleteRecord[], target: EventTarget = window): Promise<ContextChangeRecord<IArcProject>[] | undefined> {
    const e = new ContextRestoreEvent<IArcProject>(ArcModelEventTypes.Project.undeleteBulk, records);
    target.dispatchEvent(e);
    return e.detail.result as Promise<ContextChangeRecord<IArcProject>[] | undefined>;
  }

  static list(opts?: ContextListOptions, target: EventTarget = window): Promise<ContextListResult<IArcProject> | undefined> {
    const e = new ContextListEvent<IArcProject>(ArcModelEventTypes.Project.list, opts);
    target.dispatchEvent(e);
    return e.detail.result as Promise<ContextListResult<IArcProject> | undefined>;
  }

  // static query(query: IQueryDetail, target: EventTarget = window): Promise<IArcProject[] | undefined> {
  //   const e = new ContextQueryEvent<IArcProject>(ArcModelEventTypes.Project.query, query);
  //   target.dispatchEvent(e);
  //   return e.detail.result as Promise<IArcProject[] | undefined>;
  // }

  static State = class {
    static update(record: ContextChangeRecord<IArcProject>, target: EventTarget = window): void {
      const e = new ContextStateUpdateEvent(ArcModelEventTypes.Project.State.update, record);
      target.dispatchEvent(e);
    }

    static delete(record: ContextDeleteRecord, target: EventTarget = window): void {
      const e = new ContextStateDeleteEvent(ArcModelEventTypes.Project.State.delete, record);
      target.dispatchEvent(e);
    }
  }
}
