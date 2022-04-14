/* eslint-disable class-methods-use-this */
import { LitElement, html, TemplateResult, CSSResult, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import { IEnvironment, Environment, IServer, Server } from '@api-client/core/build/browser.js';
import { AnypointSwitchElement } from '@anypoint-web-components/awc';
import '@anypoint-web-components/awc/dist/define/anypoint-input.js';
import '@anypoint-web-components/awc/dist/define/anypoint-switch.js';
import '@anypoint-web-components/awc/dist/define/anypoint-button.js';
import '@anypoint-web-components/awc/dist/define/anypoint-icon-button.js';
import ServerEditorElement from './ServerEditorElement.js';
import VariablesEditorElement from './VariablesEditorElement.js';
import { Events } from '../../events/Events.js';
import '../../define/server-editor.js';
import '../../define/variables-editor.js';
import '../../define/api-icon.js';

/**
 * An element that renders a form to set up an environment.
 */
export default class EnvironmentEditor extends LitElement {
  static get styles(): CSSResult {
    return css`
    :host {
      display: block;
    }

    .name-input {
      margin: 0;
      width: 100%;
    }

    .section-title {
      font-size: 0.867rem;
      font-weight: 400;
      margin: 8px 0;
    }

    section {
      margin: 20px 0;
    }

    .encapsulate-item {
      margin: 20px 0;
      display: flex;
      align-items: center;
    }
    `;
  }

  /**
   * The environment schema to edit.
   */
  @property({ type: Object }) environment: IEnvironment = new Environment().toJSON();

  @state() encapsulateHelp = false;

  protected _notifyChanged(): void {
    this.dispatchEvent(new Event('change'));
  }

  protected _nameHandler(e: Event): void {
    const node = e.target as HTMLInputElement;
    this.environment.info.name = node.value;
    this._notifyChanged();
    Events.HttpProject.State.nameChanged(this.environment.key, this.environment.kind, this);
  }

  protected _serverChangeHandler(e: Event): void {
    const editor = e.target as ServerEditorElement;
    const value = editor.getSchema();
    this.environment.server = value;
    this._notifyChanged();
  }

  protected _varChangeHandler(e: Event): void {
    const editor = e.target as VariablesEditorElement;
    const { variables } = editor;
    if (variables) {
      this.environment.variables = variables;
    }
    this._notifyChanged();
    // when modifying variables they won't be reflected in the server editor.
    const node = this.shadowRoot!.querySelector('server-editor');
    if (node) {
      node.generateValue();
    }
  }

  protected _createServerHandler(): void {
    const server = new Server();
    this.environment.server = server.toJSON();
    this.requestUpdate();
  }

  protected _toggleEncapsulatedHandler(e: Event): void {
    const toggle = e.target as AnypointSwitchElement;
    this.environment.encapsulated = toggle.checked;
    this._notifyChanged();
  }

  protected render(): TemplateResult {
    return html`
    ${this._titleTemplate()}
    ${this._nameTemplate()}
    ${this._encapsulatedTemplate()}
    ${this._serverTemplate()}
    ${this._variablesTemplate()}
    `;
  }

  protected _titleTemplate(): TemplateResult {
    return html`
    <div class="section-title">Environment</div>
    `;
  }

  protected _nameTemplate(): TemplateResult {
    const { environment } = this;
    return html`
    <anypoint-input required name="name" .value="${environment.info.name}" @change="${this._nameHandler}" class="name-input">
      <label slot="label">Environment name</label>
    </anypoint-input>
    `;
  }

  protected _encapsulatedTemplate(): TemplateResult {
    const { environment, encapsulateHelp } = this;
    return html`
    <div class="encapsulate-item">
      <anypoint-switch
        .checked="${environment.encapsulated}"
        @change="${this._toggleEncapsulatedHandler}"
        title="Toggle the encapsulated state"
        aria-label="Toggles the encapsulated state"
        name="encapsulated"
      >
        Encapsulate the environment
      </anypoint-switch>
      <anypoint-icon-button @click="${(): void => { this.encapsulateHelp = !this.encapsulateHelp }}">
        <api-icon icon="info"></api-icon>
      </anypoint-icon-button>
    </div>
    ${encapsulateHelp ? html`
    <div class="help-banner">
      By default when running requests in a folder the application reads all environments
      up to the project root. The variables are then combined into a single object.
      When <i>encapsulated</i> is enabled, the program stops reading environments above the folder
      the environment is defined.
    </div>
    ` : ''}
    `;
  }

  protected _serverTemplate(): TemplateResult {
    const { server } = this.environment;
    if (server) {
      return this._serverEditorTemplate(server);
    }
    return this._emptyServerTemplate();
  }

  protected _emptyServerTemplate(): TemplateResult {
    return html`
    <section aria-label="Server">
      <div class="section-title">Server</div>
      <p class="empty-info">No server defined.</p>
      <anypoint-button emphasis="medium" @click="${this._createServerHandler}">Create</anypoint-button>
    </section>
    `;
  }

  protected _serverEditorTemplate(server: IServer): TemplateResult {
    const { uri, basePath, description, protocol } = server;
    return html`
    <section aria-label="Server">
      <server-editor 
        .uri="${uri}" 
        .basePath="${basePath}" 
        .description="${description}" 
        .protocol="${protocol}" 
        .variables="${this.environment.variables}"
        @change="${this._serverChangeHandler}"></server-editor>
    </section>
    `;
  }

  protected _variablesTemplate(): TemplateResult {
    const { variables } = this.environment;
    return html`
    <section aria-label="Variables">
      <variables-editor .variables="${variables}" @change="${this._varChangeHandler}"></variables-editor>
    </section>
    `;
  }
}
