/* eslint-disable max-classes-per-file */
import { ClientCertificate, ARCCertificateIndex } from '@api-client/core/build/legacy.js';
import { IARCEntityChangeRecord, IARCModelListOptions, IARCModelListResult, IDeletedEntity } from '../../idb/Base.js';
import { ArcModelEventTypes } from './ArcModelEventTypes.js';
import { ARCEntityDeletedEvent, ARCEntityListEvent, IArcEventWithResult } from './BaseEvents.js';

export const certificateValue = Symbol('projectValue');
export const idValue = Symbol('idValue');
export const revisionValue = Symbol('revisionValue');
export const changeRecordValue = Symbol('changeRecordValue');

/**
 * An event to be dispatched to read an client certificate from the data store.
 */
export class ARCClientCertificateReadEvent extends CustomEvent<IArcEventWithResult<ClientCertificate>> {
  [revisionValue]?: string;

  [idValue]: string;

  /**
   * Client certificate revision ID used to initialize the event.
   */
  get rev(): string | undefined {
    return this[revisionValue];
  }

  /**
   * Client certificate id used to initialize the event.
   */
  get id(): string {
    return this[idValue];
  }

  /**
   * @param id The client certificate ID
   * @param rev The client certificate revision
   */
  constructor(id: string, rev?: string) {
    super(ArcModelEventTypes.ClientCertificate.read, {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: {
        result: undefined,
      },
    });
    this[idValue] = id;
    this[revisionValue] = rev;
  }
}

/**
 * An event dispatched to insert a new client certificate
 */
export class ARCClientCertificateInsertEvent extends CustomEvent<IArcEventWithResult<IARCEntityChangeRecord<ARCCertificateIndex>>> {
  [certificateValue]: ClientCertificate;

  /**
   * @param certificate The certificate to create.
   */
  constructor(certificate: ClientCertificate) {
    super(ArcModelEventTypes.ClientCertificate.insert, {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: {
        result: undefined,
      }
    });
    this[certificateValue] = certificate;
  }

  /**
   * The certificate to update.
   */
  get certificate(): ClientCertificate {
    return this[certificateValue];
  }
}

/**
 * An event dispatched from the store after a certificate model has changed
 */
export class ARCClientCertificateUpdatedEvent extends Event {
  [changeRecordValue]: IARCEntityChangeRecord<ARCCertificateIndex>;

  /**
   * @param record The client certificate change record.
   */
  constructor(record: IARCEntityChangeRecord<ARCCertificateIndex>) {
    super(ArcModelEventTypes.ClientCertificate.State.update, {
      bubbles: true,
      composed: true,
    });
    this[changeRecordValue] = record;
  }

  get changeRecord(): IARCEntityChangeRecord<ARCCertificateIndex> {
    return this[changeRecordValue];
  }
}

/**
 * An event dispatched to the store to delete a client certificate.
 */
export class ARCClientCertificateDeleteEvent extends CustomEvent<IArcEventWithResult<IDeletedEntity>> {
  [idValue]: string;

  [revisionValue]?: string;

  /**
   * @param id The client certificate id
   * @param rev The client certificate's revision
   */
  constructor(id: string, rev?: string) {
    super(ArcModelEventTypes.ClientCertificate.delete, {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: {
        result: undefined,
      }
    });
    this[idValue] = id;
    this[revisionValue] = rev;
  }

  /**
   * The client certificate id used to initialize the event.
   */
  get id(): string {
    return this[idValue];
  }

  /**
   * The client certificate's revision used to initialize the event.
   */
  get rev(): string | undefined {
    return this[revisionValue];
  }
}

/**
 * An event dispatched by the store after a client certificate was deleted.
 */
export class ARCClientCertificateDeletedEvent extends ARCEntityDeletedEvent {
  /**
   * @param id Deleted client certificate id
   * @param rev Updated revision
   */
  constructor(id: string, rev: string) {
    super(ArcModelEventTypes.ClientCertificate.State.delete, id, rev);
  }
}

/**
 * An event to be dispatched to list client certificate data in the data store.
 */
export class ARCClientCertificateListEvent extends ARCEntityListEvent<IARCModelListResult<ARCCertificateIndex>> {
  /**
   * @param opts Query options.
   */
  constructor(opts?: IARCModelListOptions) {
    super(ArcModelEventTypes.ClientCertificate.list, opts);
  }
}

export class CertificatesEvents {
  /**
   * Dispatches an event handled by the data store to read the client certificate.
   *
   * @param id The id of the client certificate
   * @param rev The revision of the client certificate. If not set then the latest revision is used.
   * @param target A node on which to dispatch the event.
   * @returns Promise resolved to a client certificate model.
   */
  static async read(id: string, rev?: string, target: EventTarget = window): Promise<ClientCertificate | undefined> {
    const e = new ARCClientCertificateReadEvent(id, rev);
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
  static async insert(item: ClientCertificate, target: EventTarget = window): Promise<IARCEntityChangeRecord<ARCCertificateIndex> | undefined> {
    const e = new ARCClientCertificateInsertEvent(item);
    target.dispatchEvent(e);
    return e.detail.result;
  }

  /**
   * Dispatches an event handled by the data store to delete a client certificate
   *
   * @param id The id of the project to delete.
   * @param rev The revision of the project. If not set then the latest revision is used.
   * @param target A node on which to dispatch the event.
   * @returns Promise resolved to a new revision after delete.
   */
  static async delete(id: string, rev?: string, target: EventTarget = window): Promise<IDeletedEntity | undefined> {
    const e = new ARCClientCertificateDeleteEvent(id, rev);
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
  static async list(opts: IARCModelListOptions, target: EventTarget = window): Promise<IARCModelListResult<ARCCertificateIndex> | undefined> {
    const e = new ARCClientCertificateListEvent(opts);
    target.dispatchEvent(e);
    return e.detail.result;
  }

  static State = class {
    /**
     * Dispatches an event after a client certificate was updated
     *
     * @param record Change record
     * @param target A node on which to dispatch the event.
     */
    static update(record: IARCEntityChangeRecord<ARCCertificateIndex>, target: EventTarget = window): void {
      const e = new ARCClientCertificateUpdatedEvent(record);
      target.dispatchEvent(e);
    }

    /**
     * Dispatches an event after a client certificate was deleted
     *
     * @param id Deleted client certificate id.
     * @param rev Updated revision of the client certificate.
     * @param target A node on which to dispatch the event.
     */
    static delete(id: string, rev: string, target: EventTarget = window): void {
      const e = new ARCClientCertificateDeletedEvent(id, rev);
      target.dispatchEvent(e);
    }
  }
}
