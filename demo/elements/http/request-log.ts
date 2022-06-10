import { html, TemplateResult } from 'lit';
import { IRequestLog, ProjectMock, RequestLog, Headers, IRequestLogInit, Response } from '@api-client/core/build/browser.js';
import { DemoPage } from '../../../src/pages/demo/DemoPage.js';
import '../../../src/define/request-log.js';
import { reactive } from '../../../src/lib/decorators.js';

const ResourceIcons = [
  'favorite.png', 'fingerprint.png', 'stars.png', 'calendar-month.png', 'theaters.png', 'home-work.png',
  'print.png', 'mood.png',
];

class ComponentDemoPage extends DemoPage {
  componentName = 'Request Log';

  mock = new ProjectMock();

  @reactive() httpLog?: IRequestLog;

  constructor() {
    super();
    this.initLog();
  }

  async initLog(): Promise<void> {
    this.httpLog = await this.mock.projectRequest.log({
      response: {
        timings: true,
      },
      redirects: true,
    });
  }

  protected _generatorClick(e: Event): void {
    const node = e.target as HTMLButtonElement;
    const { generator, type } = node.dataset;
    if (generator && type) {
      this._runGenerator(generator, type);
    }
  }

  protected _generatorKeydown(e: KeyboardEvent): void {
    if (e.key !== 'Enter' && e.key !== 'Space') {
      return;
    }
    const node = e.target as HTMLButtonElement;
    const { generator, type } = node.dataset;
    if (generator && type) {
      this._runGenerator(generator, type);
    }
  }

  protected _runGenerator(generator: string, type: string): void {
    if (generator === 'response') {
      this.generateResponse(type);
    }
  }

  async generateResponse(type='json'): Promise<void> {
    let contentType: string | undefined;
    if (type === 'json') {
      contentType = 'application/json';
    } else if (type === 'xml') {
      contentType = 'application/xml';
    } else if (type === 'svg') {
      contentType = 'image/svg+xml';
    } else if (type === 'form-data') {
      contentType = 'multipart/form-data';
    } else if (type === 'urlencoded') {
      contentType = 'application/x-www-form-urlencoded';
    }
    const init: IRequestLogInit = {
      response: {
        statusGroup: 2,
        payload: {
          contentType,
          force: true,
        },
        timings: true,
      },
    };
    if (type === 'redirects') {
      init.redirects = true;
    }

    let log = await this.mock.projectRequest.log(init);

    if (type === 'png') {
      const icon = this.mock.random.pickOne(ResourceIcons);
      const r = await fetch(`/demo/resources/${icon}`);
      const data = await r.arrayBuffer();
      const instance = new RequestLog(log);
      const response = instance.response as Response;
      await response.writePayload(data);
      const headers = new Headers(response.headers);
      headers.set('content-type', 'image/png');
      response.headers = headers.toString()
      log = instance.toJSON();
    }

    this.httpLog = log;
  }

  contentTemplate(): TemplateResult {
    return html`
    <section class="centered">
      <request-log .httpLog="${this.httpLog}"></request-log>
    </section>
    `;
  }

  navigationTemplate(): TemplateResult {
    return html`
    <nav @click="${this._generatorClick}" @keydown="${this._generatorKeydown}">
      <button class="nav-item" data-generator="response" data-type="json">JSON response</button>
      <button class="nav-item" data-generator="response" data-type="xml">XML response</button>
      <button class="nav-item" data-generator="response" data-type="svg">SVG image response</button>
      <button class="nav-item" data-generator="response" data-type="png">PNG image response</button>
      <button class="nav-item" data-generator="response" data-type="form-data">Form Data response</button>
      <button class="nav-item" data-generator="response" data-type="urlencoded">URL encoded response</button>
      <button class="nav-item" data-generator="response" data-type="redirects">Redirects</button>
    </nav>
    `;
  }
}

const instance = new ComponentDemoPage();
instance.render();
