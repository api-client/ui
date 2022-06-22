/* eslint-disable max-classes-per-file */
/* eslint-disable class-methods-use-this */
import { 
  IAppProject, ContextReadEvent,ContextReadBulkEvent, ContextUpdateEvent, 
  ContextChangeRecord, ContextDeleteEvent, ContextDeleteRecord, ContextListEvent,
  ContextListOptions, ContextListResult, ContextUpdateBulkEvent,
  ContextStateUpdateEvent, ContextStateDeleteEvent, ContextDeleteBulkEvent, ContextRestoreEvent,
} from "@api-client/core/build/browser.js";
import { EventTypes } from '../../EventTypes.js';

export class ProjectEvents {
  static create(item: IAppProject, target: EventTarget = window): Promise<ContextChangeRecord<IAppProject> | undefined> {
    const e = new ContextUpdateEvent<IAppProject>(EventTypes.HttpClient.Model.Project.create, {
      item,
    });
    target.dispatchEvent(e);
    return e.detail.result as Promise<ContextChangeRecord<IAppProject> | undefined>;
  }

  static read(id: string, target: EventTarget = window): Promise<IAppProject | undefined> {
    const e = new ContextReadEvent<IAppProject>(EventTypes.HttpClient.Model.Project.read, id);
    target.dispatchEvent(e);
    return e.detail.result as Promise<IAppProject | undefined>;
  }

  static readBulk(ids: string[], target: EventTarget = window): Promise<IAppProject[] | undefined> {
    const e = new ContextReadBulkEvent<IAppProject>(EventTypes.HttpClient.Model.Project.readBulk, ids);
    target.dispatchEvent(e);
    return e.detail.result as Promise<IAppProject[] | undefined>;
  }

  static update(item: IAppProject, target: EventTarget = window): Promise<ContextChangeRecord<IAppProject> | undefined> {
    const e = new ContextUpdateEvent<IAppProject>(EventTypes.HttpClient.Model.Project.update, {
      item,
    });
    target.dispatchEvent(e);
    return e.detail.result as Promise<ContextChangeRecord<IAppProject> | undefined>;
  }

  static updateBulk(items: IAppProject[], target: EventTarget = window): Promise<ContextChangeRecord<IAppProject>[] | undefined> {
    const e = new ContextUpdateBulkEvent<IAppProject>(EventTypes.HttpClient.Model.Project.updateBulk, {
      items,
    });
    target.dispatchEvent(e);
    return e.detail.result as Promise<ContextChangeRecord<IAppProject>[] | undefined>;
  }

  static delete(id: string, target: EventTarget = window): Promise<ContextDeleteRecord | undefined> {
    const e = new ContextDeleteEvent(EventTypes.HttpClient.Model.Project.delete, id);
    target.dispatchEvent(e);
    return e.detail.result as Promise<ContextDeleteRecord | undefined>;
  }

  static deleteBulk(ids: string[], target: EventTarget = window): Promise<ContextDeleteRecord[] | undefined> {
    const e = new ContextDeleteBulkEvent(EventTypes.HttpClient.Model.Project.deleteBulk, ids);
    target.dispatchEvent(e);
    return e.detail.result as Promise<ContextDeleteRecord[] | undefined>;
  }

  static undeleteBulk(records: ContextDeleteRecord[], target: EventTarget = window): Promise<ContextChangeRecord<IAppProject>[] | undefined> {
    const e = new ContextRestoreEvent<IAppProject>(EventTypes.HttpClient.Model.Project.undeleteBulk, records);
    target.dispatchEvent(e);
    return e.detail.result as Promise<ContextChangeRecord<IAppProject>[] | undefined>;
  }

  static list(opts?: ContextListOptions, target: EventTarget = window): Promise<ContextListResult<IAppProject> | undefined> {
    const e = new ContextListEvent<IAppProject>(EventTypes.HttpClient.Model.Project.list, opts);
    target.dispatchEvent(e);
    return e.detail.result as Promise<ContextListResult<IAppProject> | undefined>;
  }

  // static query(query: IQueryDetail, target: EventTarget = window): Promise<IAppProject[] | undefined> {
  //   const e = new ContextQueryEvent<IAppProject>(EventTypes.HttpClient.Model.Project.query, query);
  //   target.dispatchEvent(e);
  //   return e.detail.result as Promise<IAppProject[] | undefined>;
  // }

  static State = class {
    static update(record: ContextChangeRecord<IAppProject>, target: EventTarget = window): void {
      const e = new ContextStateUpdateEvent(EventTypes.HttpClient.Model.Project.State.update, record);
      target.dispatchEvent(e);
    }

    static delete(record: ContextDeleteRecord, target: EventTarget = window): void {
      const e = new ContextStateDeleteEvent(EventTypes.HttpClient.Model.Project.State.delete, record);
      target.dispatchEvent(e);
    }
  }
}
