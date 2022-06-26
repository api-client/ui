import { EventTypes as CoreEventTypes, ContextEvent, IRequestLog, IHttpRequest, IHttpRequestDetail, IProjectExecutionLog, IRequestProxyInit, IProxyResult, IHttpProjectProxyInit, IAppProjectProxyInit } from '@api-client/core/build/browser.js';
import { PlatformBindings } from './PlatformBindings.js';

/**
 * The bindings for making HTTP request in the application.
 * The purpose is to run API requests using the `CoreEngine` class or
 * to run entire projects or folders.
 */
export abstract class HttpBindings extends PlatformBindings {
  async initialize(): Promise<void> {
    window.addEventListener(CoreEventTypes.Transport.Core.request, this._coreRequestHandler.bind(this) as EventListener);
    window.addEventListener(CoreEventTypes.Transport.Core.httpProject, this._coreHttpProjectHandler.bind(this) as EventListener);
    window.addEventListener(CoreEventTypes.Transport.Core.appProject, this._coreAppProjectHandler.bind(this) as EventListener);
    window.addEventListener(CoreEventTypes.Transport.Http.send, this._httpSendHandler.bind(this) as EventListener);
  }

  protected _coreRequestHandler(e: ContextEvent<IRequestProxyInit, IProxyResult<IRequestLog>>): void {
    e.detail.result = this.coreRequest(e.detail);
  }

  protected _coreHttpProjectHandler(e: ContextEvent<IHttpProjectProxyInit, IProxyResult<IProjectExecutionLog>>): void {
    e.detail.result = this.coreHttpProject(e.detail);
  }

  protected _coreAppProjectHandler(e: ContextEvent<IAppProjectProxyInit, IProxyResult<IProjectExecutionLog>>): void {
    e.detail.result = this.coreAppProject(e.detail);
  }

  protected _httpSendHandler(e: ContextEvent<IHttpRequestDetail, Response>): void {
    const { request, init } = e.detail;
    e.detail.result = this.httpSend(request, init);
  }

  /**
   * Sends a single request without a context of a project.
   * 
   * @param init The request execution configuration
   * @returns The execution log with the variables evaluated during the run or `undefined` when the event was not handled.
   */
  abstract coreRequest(init: IRequestProxyInit): Promise<IProxyResult<IRequestLog>>;

  /**
   * For both a request or a folder (since it's all single configuration.)
   * 
   * @param init The project execution configuration
   * @returns The project execution log.
   */
  abstract coreHttpProject(init: IHttpProjectProxyInit): Promise<IProxyResult<IProjectExecutionLog>>;

  /**
   * Executes request from the AppProject.
   * 
   * @param init The project execution configuration
   * @returns The project execution log.
   */
  abstract coreAppProject(init: IAppProjectProxyInit): Promise<IProxyResult<IProjectExecutionLog>>;

  /**
   * Sends the request outside the Core engine, most probably using Fetch API.
   * Note, CORS may apply to the request.
   * 
   * @param request The base request definition.
   * @param init Optional request init options compatible with the Fetch API.
   * @returns Compatible with the Fetch API Response object.
   */
  abstract httpSend(request: IHttpRequest, init?: RequestInit): Promise<Response>;
}
