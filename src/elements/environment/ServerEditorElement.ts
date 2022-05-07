/* eslint-disable class-methods-use-this */
import { LitElement, html, TemplateResult, CSSResult, css, PropertyValueMap } from 'lit';
import { property, query } from 'lit/decorators.js';
import { IServer, Server, IProperty } from '@api-client/core/build/browser.js';
import '@anypoint-web-components/awc/dist/define/anypoint-input.js';
import '@anypoint-web-components/awc/dist/define/anypoint-autocomplete.js';

export const DefaultProtocols = ['http:', 'https:'];

/**
 * An element to render a view for a server definition with a form to edit it.
 */
export default class ServerEditorElement extends LitElement {
  static get styles(): CSSResult {
    return css`
    :host {
      display: block;
    }

    .form-item {
      margin: 20px 0;
    }

    anypoint-input {
      margin: 0;
      width: 100%;
    }

    /* For autocomplete */
    .highlight {
      background-color: rgba(0, 0, 0, 0.12);
    }

    .uri-label {
      font-weight: 500;
      font-size: small;
    }

    .value-preview {
      margin-top: 4px;
      padding: 8px 12px;
      font-family: var(--code-font-family);
      background: var(--server-editor-uri-background, #e5e5e5);
    }

    .section-title {
      font-size: 0.867rem;
      font-weight: 400;
      margin: 8px 0;
    }
    `;
  }

  /**
   * The base URI of the server.
   * 
   * Note, the URL can contain URI templates (e.g. `http://{host}.api.com/v1`)
   * In this case the variable is replaced with the system or project variables.
   * 
   * For simplicity, the `uri` can be the full base URI with protocol, host, and the `basePath`
   */
  @property({ type: String }) uri?: string;

  /**
   * Usually included in the `uri`. When the `uri` is missing a protocol 
   * this is then used.
   */
  @property({ type: String }) protocol?: string;

  /**
   * The base path for the server. It starts with the `/`.
   * When set, it is appended to the `uri` value.
   */
  @property({ type: String }) basePath?: string;

  /**
   * Optional description of the server.
   */
  @property({ type: String }) description?: string;

  /**
   * Optional list of variables to set on the environment.
   * When set it evaluates the final URI value against these properties.
   */
  @property({ type: Array }) variables?: IProperty[];

  /**
   * The computed value of the full URI from the values.
   */
  protected _value?: string;

  /**
   * The server logic used with computations.
   */
  protected _server = new Server();

  @query('#protocolInput', false)
  _protocolInput?: HTMLInputElement;

  protected willUpdate(cp: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
    if (cp.has('uri') || cp.has('protocol') || cp.has('basePath') || cp.has('description')) {
      this._generateValue();
    }
    super.willUpdate(cp);
  }

  /**
   * Updates the value of the generated base URI.
   * This can be called from the outside of the component to force computation.
   * This is helpful when deep-updating variables.
   */
  generateValue(): void {
    this._generateValue();
    this.requestUpdate();
  }

  protected _generateValue(): void {
    const { _server } = this;
    this._updateServer();
    this._value = _server.readUri(this.variables);
  }

  protected _updateServer(): void {
    const { _server, uri = '', protocol, basePath, description } = this;
    _server.uri = uri;
    _server.protocol = protocol;
    _server.basePath = basePath;
    _server.description = description;
  }

  /**
   * Creates a schema for the current values.
   */
  getSchema(): IServer {
    this._updateServer();
    return this._server.toJSON();
  }

  protected _inputHandler(e: Event): void {
    const node = e.target as HTMLInputElement;
    if (!node.name) {
      return;
    }
    // @ts-ignore
    this[node.name] = node.value;
    this._notifyChanged();
  }

  protected _notifyChanged(): void {
    this.dispatchEvent(new Event('change'));
  }

  render(): TemplateResult {
    return html`
    <div class="section-title">Server</div>
    <form>
      ${this._uriInputTemplate()}
      ${this._protocolInputTemplate()}
      ${this._basePathInputTemplate()}
    </form>
    ${this._valueTemplate()}
    `;
  }

  protected _uriInputTemplate(): TemplateResult {
    return html`
    <div class="form-item">
      <anypoint-input required name="uri" .value="${this.uri}" @input="${this._inputHandler}" label="URI"></anypoint-input>
    </div>
    `;
  }

  protected _protocolInputTemplate(): TemplateResult {
    return html`<div class="form-item">
      <anypoint-input name="protocol" .value="${this.protocol}" @input="${this._inputHandler}" id="protocolInput" label="Protocol (optional)">
      </anypoint-input>
      <anypoint-autocomplete 
        .source="${DefaultProtocols}" 
        .target="${this._protocolInput}" 
        openOnFocus
        noOverlap
      ></anypoint-autocomplete>
    </div>`;
  }

  protected _basePathInputTemplate(): TemplateResult {
    return html`<div class="form-item">
      <anypoint-input name="basePath" .value="${this.basePath}" @input="${this._inputHandler}" label="Base path (optional)">
      </anypoint-input>
    </div>`;
  }

  protected _valueTemplate(): TemplateResult | string {
    const { _value } = this;
    if (!_value) {
      return '';
    }
    return html`
    <div class="uri-label">Server URI</div>
    <div class="value-preview">
      ${_value}
    </div>
    `;
  }
}
