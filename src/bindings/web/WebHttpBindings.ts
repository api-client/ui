import { IHttpRequest, HttpRequest, IRequestAuthorization, IRequestBaseConfig, IRequestLog, HttpProject, IProjectRunnerOptions, IProjectExecutionLog, Headers, IApplication } from "@api-client/core/build/browser.js";
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

  async coreSend(request: IHttpRequest, authorization?: IRequestAuthorization[], config?: IRequestBaseConfig): Promise<IRequestLog> {
    const initBody: any = {
      request,
      kind: 'Core#Request',
    };
    if (Array.isArray(authorization)) {
      initBody.authorization = authorization;
    }
    if (config) {
      initBody.config = config;
    }
    // step 1: initialize a session on the proxy server.
    const location = await this._initProxySession(JSON.stringify(initBody), config && config.signal);
    // step 2: send the request with the method and the body (if any).
    const init: RequestInit = {
      method: request.method || 'GET',
    }
    if (!['get', 'head'].includes(init.method!.toLowerCase())) {
      if (request.payload) {
        const r = new HttpRequest(request);
        const payload = await r.readPayload();
        init.body = payload;
      }
    }
    const response = await fetch(location, init);
    if (response.status !== 200) {
      throw new Error(`Invalid status code from the proxy response: ${response.status}`);
    }
    return response.json();
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

  async projectSend(project: string | HttpProject, opts: IProjectRunnerOptions): Promise<IProjectExecutionLog> {
    const env = await Events.Store.Global.getEnv();
    if (!env || !env.token) {
      throw new Error(`You are not authorized in the store to read project data.`);
    }
    let pid: string;
    if (typeof project === 'string') {
      pid = project
    } else {
      pid = project.key;
    }
    const initBody: any = {
      pid,
      opts,
      kind: 'Core#Project',
      token: env.token,
      baseUri: env.location,
    };
    // step 1: initialize a session on the proxy server.
    const location = await this._initProxySession(JSON.stringify(initBody), opts.signal);
    // step 2: request the result. The proxy uses GET for project requests.
    const response = await fetch(location);
    if (response.status !== 200) {
      throw new Error(`Invalid status code from the proxy response: ${response.status}`);
    }
    return response.json();
  }

  /**
   * Initializes the proxy session on the proxy server.
   * 
   * @param body The body to send with the request details.
   * @param signal Optional abort signal.
   * @returns The location of the proxy endpoint where to send the actual request data.
   */
  protected async _initProxySession(body: string, signal?: AbortSignal): Promise<string> {
    const init: RequestInit = {
      body,
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      cache: 'no-cache',
    };
    if (signal) {
      init.signal = signal;
    }
    const url = `${this.proxyUrl}/init`;
    const response = await fetch(url, init);
    if (response.status !== 204) {
      throw new Error(`Invalid status code from the proxy server when initializing a proxy session: ${response.status}`);
    }
    const loc = response.headers.get('location');
    if (!loc) {
      throw new Error(`The proxy server did not return the location after session initialization.`);
    }
    const targetUrl = new URL(loc, this.proxyUrl);
    return targetUrl.toString();
  }
}
