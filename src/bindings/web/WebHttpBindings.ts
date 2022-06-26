import { 
  IHttpRequest, HttpRequest, IRequestLog, IProjectExecutionLog, Headers, IApplication, 
  IRequestProxyInit, IProxyResult, IAppProjectProxyInit, IHttpProjectProxyInit, 
  IApiError, ApiError 
} from "@api-client/core/build/browser.js";
import { Events } from "../../events/Events.js";
import { HttpBindings } from "../base/HttpBindings.js";

/**
 * A class that acts as an HTTP proxy for the application.
 * Since the Project runner and the CoreEngine are strictly NodeJS modules, this needs to proxy the request to the server that supports 
 * this API to make the request.
 * 
 * When using the proxy, the logic first sends request to the proxy with initialization values: the request data, authorization, and configuration.
 * In response, the proxy server responds with a URL (or a path) to use to send the body. The method of the request is used with the second request.
 * The proxy detects payload for requests other than GET and HEAD.
 */
export class WebHttpBindings extends HttpBindings {
  /**
   * @param proxyUrl The base URI to the HTTP proxy. 
   */
  constructor(app: IApplication, public proxyUrl: string) {
    super(app);
  }

  protected async _proxy(body: IRequestProxyInit | IHttpProjectProxyInit | IAppProjectProxyInit): Promise<IProxyResult> {
    const env = await Events.Store.Global.getEnv();
    if (!env || !env.token) {
      throw new Error(`You are not authorized in the store to make a proxy request.`);
    }
    const init: RequestInit = {
      body: JSON.stringify(body),
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'authorization': `Bearer ${env.token}, ${env.location}`,
      },
      cache: 'no-cache',
    };
    const response = await fetch(this.proxyUrl, init);
    if (response.status !== 200) {
      const error = await response.json() as IApiError;
      throw new ApiError(error);
    }
    return response.json() as Promise<IProxyResult>;
  }

  async coreRequest(init: IRequestProxyInit): Promise<IProxyResult<IRequestLog>> {
    return this._proxy(init) as Promise<IProxyResult<IRequestLog>>;
  }

  async coreHttpProject(init: IHttpProjectProxyInit): Promise<IProxyResult<IProjectExecutionLog>> {
    return this._proxy(init) as Promise<IProxyResult<IProjectExecutionLog>>;
  }

  async coreAppProject(init: IAppProjectProxyInit): Promise<IProxyResult<IProjectExecutionLog>> {
    return this._proxy(init) as Promise<IProxyResult<IProjectExecutionLog>>;
  }

  async httpSend(request: IHttpRequest, init: RequestInit = {}): Promise<Response> {
    const config: RequestInit = { ...init };
    if (request.headers) {
      if (!config.headers) {
        config.headers = {};
      }
      const parser = new Headers(request.headers);
      const headers = config.headers as Record<string, string>;
      parser.forEach((value: string, name: string) => {
        if (headers[name]) {
          headers[name] += `, ${value}`;
        } else {
          headers[name] = value;
        }
      });
    }
    if (request.method) {
      config.method = request.method;
    }
    if (request.payload) {
      const r = new HttpRequest(request);
      const payload = await r.readPayload();
      config.body = payload;
    }
    return fetch(request.url, config);
  }
}
