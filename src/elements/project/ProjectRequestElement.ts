import { PropertyValueMap } from 'lit';
import { property, state } from 'lit/decorators.js';
import { ProjectRequest, HttpRequest, Events as CoreEvents, HttpProject, DeserializedPayload } from '@api-client/core/build/browser.js';
import HttpRequestElement from '../http/HttpRequestElement.js';

/**
 * An element that specializes in rendering an HTTP request that is defined on an HttpProject.
 * 
 * When using this element set the `project` property to the currently opened
 * project and the `key` to the request to render.
 * The element will hook-up to the events to support project mutations.
 */
export default class ProjectRequestElement extends HttpRequestElement {
  /**
   * The source project
   */
  @property({ type: Object }) project?: HttpProject;

  /**
   * The key of the request being processed.
   */
  @property({ type: String, reflect: true }) key?: string;

  @state() expects?: HttpRequest;

  protected updated(cp: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
    super.updated(cp);
    if (cp.has('project') || cp.has('key')) {
      this._processRequestChange();
    }
  }

  protected _cleanupRequest(): void {
    this.expects = undefined;
    this.url = '';
    this.method = 'GET';
    this.environments = undefined;
    this.environment = undefined;
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
    const expects = request.getExpects();
    this.expects = expects;
    this.method = expects.method;
    this.url = expects.url;
    this.headers = expects.headers;
    this._readPayload(expects);
    this._readAppliedEnvironments(request);
    this.requestUpdate();
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
}
