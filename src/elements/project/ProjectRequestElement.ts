/* eslint-disable class-methods-use-this */
import { css, CSSResult, html, PropertyValueMap, TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { ProjectRequest, HttpRequest, HttpProject, RequestAuthorization, RequestUiMeta, Events as CoreEvents, IProjectRunnerOptions, EventUtils, IHttpHistory, HttpHistoryKind, IRequestLog, IApplication, DeserializedPayload } from '@api-client/core/build/browser.js';
import { JsonPatchOperation } from '@api-client/json';
import HttpRequestElement from '../http/HttpRequestElement.js';
import { Events } from '../../events/Events.js';
// eslint-disable-next-line import/no-duplicates
import { ResizeEventDetail } from '../../lib/ResizableElements.js';
// eslint-disable-next-line import/no-duplicates
import '../../lib/ResizableElements.js';
import { EventTypes } from '../../events/EventTypes.js';
import '../../define/request-log.js';
import '../../define/request-history-browser.js';
import { midnightTimestamp } from '../../lib/time/Conversion.js';

/**
 * An element that specializes in rendering an HTTP request that is defined on an HttpProject.
 * 
 * When using this element set the `project` property to the currently opened
 * project and the `key` to the request to render.
 * The element will hook-up to the events to support project mutations.
 */
export default class ProjectRequestElement extends HttpRequestElement {
  static get styles(): CSSResult[] {
    return [
      ...HttpRequestElement.styles,
      css`
      .container {
        display: flex;
        flex-direction: column;
        height: 100%;
      }

      .request-editor,
      .response-view {
        /* height: 100%; */
        flex: 1;
        overflow: hidden;
      }

      .request-editor {
        border-bottom: 1px #e5e5e5 solid;
        display: flex;
        flex-direction: column;
      }

      .request-editor.resized {
        flex: unset;
      }

      request-log {
        overflow: auto;
        height: 100%;
      }
      `,
    ];
  }

  /**
   * The source project
   */
  @property({ type: Object }) project?: HttpProject;

  /**
   * The key of the request being processed.
   */
  @property({ type: String, reflect: true }) key?: string;

  /**
   * This property is required for the API access to work.
   * Set it to the current application information.
   */
  @property({ type: Object }) appInfo?: IApplication;

  @state() expects?: HttpRequest;

  protected request?: ProjectRequest;

  /**
   * Thr page cursor for the history list.
   */
  protected _historyCursor?: string;

  @state() protected _history?: IHttpHistory[];

  constructor() {
    super();
    this.eventsTarget = this;
    this.addEventListener(EventTypes.HttpProject.Request.State.urlChange, EventUtils.cancelEvent);
    this.addEventListener(EventTypes.HttpProject.Request.State.contentTypeChange, EventUtils.cancelEvent);
  }

  protected willUpdate(cp: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
    super.willUpdate(cp);
    if (cp.has('project') || cp.has('key')) {
      this._processRequestChange();
    }
  }

  applyPatch(info: JsonPatchOperation): void {
    // "/definitions/requests/\d+/..."
    const parts = info.path.split('/').slice(4);
    const [root] = parts;
    if (root === 'expects' || root === 'log') {
      this._processRequestChange();
    }
  }

  protected _cleanupRequest(): void {
    this.expects = undefined;
    this.url = '';
    this.method = 'GET';
    this.environments = undefined;
    this.environment = undefined;
    this.ui = undefined;
    this._history = undefined;
    this._historyCursor = undefined;
  }

  protected _processRequestChange(): void {
    const { project, key } = this;
    if (!project || !key) {
      this._cleanupRequest();
      return;
    }
    const request = project.findRequest(key);
    if (!request) {
      this._cleanupRequest();
      return;
    }
    this.request = request;
    const expects = request.getExpects();
    this.expects = expects;
    this.method = expects.method;
    this.url = expects.url;
    this.headers = expects.headers;
    this.authorization =  request.authorization;
    this._readPayload(expects);
    this._readAppliedEnvironments(request);
    this._computeSnippetsRequest();
    this.requestUpdate();
    this._readRequestUi(project.key, key);
    this._queryRequestHistory(project.key, key);
  }

  protected async _readPayload(expects: HttpRequest): Promise<void> {
    if (expects.payload) {
      const payload = await expects.readPayload();
      this.payload = payload;
    } else {
      this.payload = undefined;
    }
  }

  protected async _readAppliedEnvironments(request: ProjectRequest): Promise<void> {
    const project = request.getProject();
    let parent = request.getParent();
    if (parent === project) {
      parent = undefined;
    }
    const environments = await project.readEnvironments({ parent: parent?.key });
    this.environments = environments;
    if (environments.length) {
      this.environment = environments[environments.length - 1].key;
    } else {
      this.environment = undefined;
    }
  }

  protected _methodActivateHandler(e: CustomEvent): void {
    const { expects } = this;
    if (!expects) {
      // super._methodActivateHandler(e);
      return;
    }
    const { selected } = e.detail;
    expects.method = selected;
    super._methodActivateHandler(e);
  }

  protected _updateUrl(value: string): void {
    const { expects } = this;
    if (!expects) {
      return;
    }
    expects.url = value;
    super._updateUrl(value);
  }

  protected _updateHeaders(value: string): void {
    const { expects } = this;
    if (!expects) {
      return;
    }
    expects.headers = value;
    super._updateHeaders(value);
  }

  protected _updateAuthorization(auth: RequestAuthorization[]): void {
    const { request } = this;
    if (!request) {
      return;
    }
    request.authorization = auth;
    super._updateAuthorization(auth);
  }

  protected _updatePayload(value: DeserializedPayload): void {
    this._updatePayloadAsync(value);
  }

  protected async _updatePayloadAsync(value: DeserializedPayload): Promise<void> {
    const { expects } = this;
    if (!expects) {
      return;
    }
    await expects.writePayload(value);
    super._updatePayload(value);
  }

  protected async _readRequestUi(pid: string, id: string): Promise<void> {
    try {
      const data = await Events.AppData.Http.Ui.HttpProject.HttpRequest.get(pid, id, this);
      if (data) {
        this.ui = new RequestUiMeta(data);
      } else {
        this.ui = undefined;
      }
    } catch (e) {
      this.ui = undefined;
    }
  }

  protected async _queryRequestHistory(pid: string, key: string): Promise<void> {
    try {
      const result = await Events.Store.History.list({
        type: 'request',
        project: pid,
        id: key,
      });
      if (!result) {
        return;
      }
      const { data, cursor } = result;
      this._history = data;
      if (cursor) {
        this._historyCursor = cursor;
      }
    } catch (e) {
      // ...
    }
  }

  protected async _updateRequestUi(meta: RequestUiMeta): Promise<void> {
    const { project, key } = this;
    if (!project || !key) {
      this._cleanupRequest();
      return;
    }
    try {
      await Events.AppData.Http.Ui.HttpProject.HttpRequest.set(project.key, key, meta.toJSON(), this);
    } catch (e) {
      const cause = e as Error;
      CoreEvents.Telemetry.exception(cause.message, false, this);
    }
  }

  notifyChanged(type: string, value: unknown): void {
    if (type === 'ui') {
      this._updateRequestUi(value as RequestUiMeta);
    }
    super.notifyChanged(type, value);
  }

  protected _notifySend(): void {
    this._execute();
  }

  protected async _execute(): Promise<void> {
    const { project, key, request } = this;
    if (!project || !key || !request) {
      throw new Error(`The project request is not initialized.`);
    }
    const opts: IProjectRunnerOptions = {
      environment: this.environment,
      request: [key],
      recursive: true,
    };
    this.loading = true;
    try {
      const result = await CoreEvents.Transport.Project.send(project.key, opts, this);
      const report = result?.iterations[0]?.executed[0];
      if (report) {
        request.setLog(report);
        this.notifyRequestChanged();
        this.requestUpdate();
        this._addHistory(report);
      }
    } catch (e) {
      // 
    }
    this.loading = false;
  }

  protected async _addHistory(report: IRequestLog): Promise<void> {
    const { appInfo, project, key } = this;
    if (!appInfo) {
      throw new Error(`The appInfo is not set on ${this.localName}`);
    }
    if (!project || !key) {
      return;
    }
    const item: IHttpHistory = {
      created: Date.now(),
      kind: HttpHistoryKind,
      log: report,
      project: project.key,
      app: appInfo.code,
      request: key,
      user: '',
      midnight: midnightTimestamp(),
    };
    if (this._history) {
      this._history.splice(0, 0, item);
    }
    item.key = await Events.Store.History.create(item);
    const element = this.shadowRoot?.querySelector('request-history-browser');
    if (element) {
      element.addHistory(item, true);
    }
  }

  protected _beforeResizeHandler(e: CustomEvent<ResizeEventDetail>): void {
    const { height } = e.detail;
    if (height && height < 120) {
      e.preventDefault();
      return;
    }
    const pane = e.target as HTMLElement;
    if (!pane.classList.contains('resized')) {
      pane.classList.add('resized');
    }
  }

  protected render(): TemplateResult {
    const resizeDirection = 'south';
    return html`
    <div class="container">
      <div class="request-editor" .resize="${resizeDirection}" @beforeresize="${this._beforeResizeHandler}">
        ${super.render()}
      </div>
      <div class="response-view">
        ${this._responsePaneTemplate()}
      </div>
    </div>
    `;
  }

  protected _responsePaneTemplate(): TemplateResult {
    const { _history } = this;
    if (!_history) {
      return html`
      <p>Execute the request to see the response details.</p>
      `;
    }
    return html`
    <request-history-browser .history="${_history}"></request-history-browser>
    `;
  }
}
