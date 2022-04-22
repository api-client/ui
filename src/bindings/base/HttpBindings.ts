import { EventTypes as CoreEventTypes, HttpProject, ContextEvent, IRequestLog, IHttpRequest, IRequestAuthorization, IRequestBaseConfig, ICoreRequestDetail, IHttpRequestDetail, IProjectRequestDetail, IProjectRunnerOptions, IProjectExecutionLog } from '@api-client/core/build/browser.js';
import { PlatformBindings } from './PlatformBindings.js';

/**
 * The bindings for making HTTP request in the application.
 * The purpose is to run API requests using the `CoreEngine` class or
 * to run entire projects or folders.
 */
export abstract class HttpBindings extends PlatformBindings {
  async initialize(): Promise<void> {
    window.addEventListener(CoreEventTypes.Transport.Core.send, this._coreSendHandler.bind(this) as EventListener);
    window.addEventListener(CoreEventTypes.Transport.Http.send, this._httpSendHandler.bind(this) as EventListener);
    window.addEventListener(CoreEventTypes.Transport.Project.send, this._projectSendHandler.bind(this) as EventListener);
  }

  protected _coreSendHandler(e: ContextEvent<ICoreRequestDetail, IRequestLog>): void {
    const { request, authorization, config } = e.detail;
    e.detail.result = this.coreSend(request, authorization, config);
  }

  protected _httpSendHandler(e: ContextEvent<IHttpRequestDetail, Response>): void {
    const { request, init } = e.detail;
    e.detail.result = this.httpSend(request, init);
  }

  protected _projectSendHandler(e: ContextEvent<IProjectRequestDetail, IProjectExecutionLog>): void {
    const { project, opts } = e.detail;
    e.detail.result = this.projectSend(project, opts);
  }

  /**
   * Sends a single request without a context of a project.
   * 
   * @param request The request definition
   * @param authorization When known, a list of authorization configuration to apply to the request.
   * @param config Optional request configuration.
   * @returns The execution log
   */
  abstract coreSend(request: IHttpRequest, authorization?: IRequestAuthorization[], config?: IRequestBaseConfig): Promise<IRequestLog>;

  /**
   * Sends the request outside the Core engine, most probably using Fetch API.
   * Note, CORS may apply to the request.
   * 
   * @param request The base request definition.
   * @param init Optional request init options compatible with the Fetch API.
   * @returns Compatible with the Fetch API Response object.
   */
  abstract httpSend(request: IHttpRequest, init?: RequestInit): Promise<Response>;

  /**
   * For both a request or a folder (since it's all single configuration.)
   * 
   * @param project The instance of a project or an id of the project to execute. The current user has to be already authenticated.
   * @param opts The project execution options.
   * @returns The project execution log.
   */
  abstract projectSend(project: HttpProject | string, opts: IProjectRunnerOptions): Promise<IProjectExecutionLog>;
}
