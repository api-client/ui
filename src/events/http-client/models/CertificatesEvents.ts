/* eslint-disable max-classes-per-file */
import { ContextChangeRecord, ContextDeleteEvent, ContextDeleteRecord, ContextListEvent, ContextListOptions, ContextListResult, ContextReadEvent, ContextStateDeleteEvent, ContextStateUpdateEvent, ContextUpdateEvent, ICertificate } from '@api-client/core/build/browser.js';
import { EventTypes } from '../../EventTypes.js';

export class CertificatesEvents {
  /**
   * Dispatches an event handled by the data store to read the client certificate.
   *
   * @param id The id of the client certificate
   * @param target A node on which to dispatch the event.
   * @returns Promise resolved to a client certificate model.
   */
  static async read(id: string, target: EventTarget = window): Promise<ICertificate | undefined> {
    const e = new ContextReadEvent<ICertificate>(EventTypes.HttpClient.Model.Certificate.read, id);
    target.dispatchEvent(e);
    return e.detail.result;
  }

  /**
   * Dispatches an event handled by the data store to insert a new client certificate.
   *
   * @param item The certificate object.
   * @param target A node on which to dispatch the event.
   * @returns Promise resolved to the change record
   */
  static async insert(item: ICertificate, target: EventTarget = window): Promise<ContextChangeRecord<ICertificate> | undefined> {
    const e = new ContextUpdateEvent<ICertificate>(EventTypes.HttpClient.Model.Certificate.insert, { item });
    target.dispatchEvent(e);
    return e.detail.result;
  }

  /**
   * Dispatches an event handled by the data store to delete a client certificate
   *
   * @param id The id of the project to delete.
   * @param target A node on which to dispatch the event.
   */
  static async delete(id: string, target: EventTarget = window): Promise<ContextDeleteRecord | undefined> {
    const e = new ContextDeleteEvent(EventTypes.HttpClient.Model.Certificate.delete, id);
    target.dispatchEvent(e);
    return e.detail.result;
  }

  /**
   * Dispatches an event to list the client certificates data.
   *
   * @param target A node on which to dispatch the event.
   * @param opts Query options.
   * @returns The list result.
   */
  static async list(opts?: ContextListOptions, target: EventTarget = window): Promise<ContextListResult<ICertificate> | undefined> {
    const e = new ContextListEvent(EventTypes.HttpClient.Model.Certificate.list, opts);
    target.dispatchEvent(e);
    return e.detail.result as Promise<ContextListResult<ICertificate> | undefined>;
  }

  static State = class {
    /**
     * Dispatches an event after a client certificate was updated
     *
     * @param record Change record
     * @param target A node on which to dispatch the event.
     */
    static update(record: ContextChangeRecord<ICertificate>, target: EventTarget = window): void {
      const e = new ContextStateUpdateEvent(EventTypes.HttpClient.Model.Certificate.State.update, record);
      target.dispatchEvent(e);
    }

    /**
     * Dispatches an event after a client certificate was deleted
     *
     * @param record Certificate delete record.
     * @param target A node on which to dispatch the event.
     */
    static delete(record: ContextDeleteRecord, target: EventTarget = window): void {
      const e = new ContextStateDeleteEvent(EventTypes.HttpClient.Model.Certificate.State.delete, record);
      target.dispatchEvent(e);
    }
  }
}
