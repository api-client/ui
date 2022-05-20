/* eslint-disable class-methods-use-this */
import { AnypointRadioButtonElement, AnypointRadioGroupElement } from '@anypoint-web-components/awc';
import { 
  ICCAuthorization, HttpCertificate, Events as CoreEvents, EventTypes as CoreEventTypes, ContextStateUpdateEvent, 
  ContextStateDeleteEvent,
} from '@api-client/core/build/browser.js';
import '@anypoint-web-components/awc/dist/define/date-time.js';
import { html, TemplateResult } from 'lit';
import { AuthUiInit } from '../types.js';
import AuthUiBase from "./AuthUiBase.js";

export default class ClientCertificate extends AuthUiBase {
  /**
     * @returns `true` if `items` is set and has cookies
     */
  get hasItems(): boolean {
    const { items } = this;
    if (!Array.isArray(items)) {
      return false;
    }
    return !!items.length;
  }

  /** 
   * The selected certificate.
   */
  certificate?: HttpCertificate;

  items?: HttpCertificate[];

  querying = false;

  loadingError?: string;

  constructor(init: AuthUiInit) {
    super(init);

    this.selectedHandler = this.selectedHandler.bind(this);
    this.importHandler = this.importHandler.bind(this);
    this._certificateUpdateHandler = this._certificateUpdateHandler.bind(this);
    this._certificateDeleteHandler = this._certificateDeleteHandler.bind(this);
  }

  startup(): void {
    this.target.addEventListener(CoreEventTypes.Model.ClientCertificate.State.update, this._certificateUpdateHandler);
    this.target.addEventListener(CoreEventTypes.Model.ClientCertificate.State.delete, this._certificateDeleteHandler);
  }

  cleanup(): void {
    this.target.removeEventListener(CoreEventTypes.Model.ClientCertificate.State.update, this._certificateUpdateHandler);
    this.target.removeEventListener(CoreEventTypes.Model.ClientCertificate.State.delete, this._certificateDeleteHandler);
  }

  protected _certificateUpdateHandler(input: Event): void {
    const e = input as ContextStateUpdateEvent<HttpCertificate>;
    const cert = e.detail.item;
    if (!cert) {
      return;
    }
    if (!this.items) {
      this.items = [];
    }
    const index = this.items.findIndex(i => i.key === cert.key);
    if (index >= 0) {
      this.items[index] = cert;
    } else {
      this.items.push(cert);
    }
    this.requestUpdate();
  }

  protected _certificateDeleteHandler(input: Event): void {
    if (!this.items) {
      return;
    }
    const e = input as ContextStateDeleteEvent;
    const { id } = e.detail;
    const index = this.items.findIndex(i => i.key === id);
    if (index >= 0) {
      this.items.splice(index, 1);
      this.requestUpdate();
    }
  }

  async queryCertificates(): Promise<void> {
    if (this.querying) {
      return;
    }
    this.querying = true;
    try {
      const data = await CoreEvents.Model.ClientCertificate.list(undefined, this.target);
      if (!data) {
        this.items = undefined;
        return;
      }
      this.items = data.items;
      await this.requestUpdate();
    } catch (cause) {
      this.loadingError = (cause as Error).message;
      await this.requestUpdate();
    } finally {
      this.querying = false;
    }
  }

  reset(): void {
    this.certificate = undefined;
  }

  defaults(): void {
    this.certificate = undefined;
    if (!this.items) {
      this.queryCertificates();
    }
  }

  /**
   * Restores previously serialized Basic authentication values.
   * @param state Previously serialized values
   */
  restore(state: ICCAuthorization): void {
    if (!state || !state.certificate) {
      this.certificate = undefined;
    }
    this.certificate = state.certificate;
  }

  /**
   * Creates a settings object with user provided data for current method.
   *
   * @returns User provided data
   */
  serialize(): ICCAuthorization {
    const { certificate } = this;
    if (!certificate) {
      return {};
    }
    return {
      certificate,
    };
  }

  selectedHandler(e: Event): void {
    const { items } = this;
    const selectedItem = (e.target as AnypointRadioGroupElement).selectedItem as AnypointRadioButtonElement;
    if (!selectedItem || !items) {
      return;
    }
    const { checked, dataset } = selectedItem;
    if (!checked || (this.certificate && this.certificate.key === dataset.id)) {
      return;
    }
    const cert = items.find(i => i.key === dataset.id);
    this.certificate = cert;
    this.notifyChange();

    CoreEvents.Telemetry.event({
      category: 'Certificates',
      action: 'Authorization',
      label: 'selected-certificate'
    }, this.target);
  }

  importHandler(): void {
    // ArcNavigationEvents.navigate(this.target, 'client-certificate-import');
    CoreEvents.Telemetry.event({
      category: 'Certificates',
      action: 'Authorization',
      label: 'navigate-import'
    }, this.target);
  }

  render(): TemplateResult {
    const { hasItems } = this;
    return html`
    ${this.importTemplate()}
    ${this.errorTemplate()}
    ${hasItems ? this.contentTemplate() : this.emptyTemplate()}`;
  }

  contentTemplate(): TemplateResult {
    const { items=[], certificate } = this;
    return html`
    <div class="list">
      <anypoint-radio-group
        attrForSelected="data-id"
        .selected="${certificate && certificate.key}"
        @selected="${this.selectedHandler}"
      >
        ${this.defaultItemTemplate()}
        ${items.map((item) => this.certItemTemplate(item))}
      </anypoint-radio-group>
    </div>`;
  }

  errorTemplate(): TemplateResult | string {
    const { loadingError } = this;
    if (!loadingError) {
      return '';
    }
    return html`<p class="error-message">Unable to load certificates: ${loadingError}.</p>`;
  }

  emptyTemplate(): TemplateResult | string {
    const { loadingError } = this;
    if (loadingError) {
      return '';
    }
    return html`<p class="empty-screen">There are no certificates installed in this application.</p>`;
  }

  defaultItemTemplate(): TemplateResult {
    return html`<anypoint-radio-button data-id="none" class="default">None</anypoint-radio-button>`;
  }

  /**
   * @param item The item to render
   * @returns The template for the dropdown item.
   */
  certItemTemplate(item: HttpCertificate): TemplateResult {
    return html`
    <anypoint-radio-button data-id="${item.key}">
      <div class="cert-meta">
        <span class="name">${item.name}</span>
        <span class="created">Added: ${this.dateTimeTemplate(item.created)}</span>
      </div>
    </anypoint-radio-button>`;
  }

  /**
   * @param created The certificate created time.
   * @returns The template for the cert time element.
   */
  dateTimeTemplate(created?: number): TemplateResult {
    if (!created) {
      return html`<span>Unknown</span>`;
    }
    return html`<date-time
      .date="${created}"
      year="numeric"
      month="numeric"
      day="numeric"
      hour="numeric"
      minute="numeric"
    ></date-time>`;
  }

  importTemplate(): TemplateResult {
    return html`
    <anypoint-button
      title="Opens a dialog that allows to import client certificate"
      aria-label="Activate to open import certificate dialog"
      @click="${this.importHandler}"
    >Import certificate</anypoint-button>`;
  }
}
