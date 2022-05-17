import { html, TemplateResult } from 'lit';
import { ProjectMock, IHttpRequest } from '@api-client/core/build/browser.js';
import { DemoPage } from '../../../src/pages/demo/DemoPage.js';
import { reactive } from '../../../src/lib/decorators.js';
import '../../../src/define/http-request.js';

const REQUEST_STORE_KEY = 'demo.arc-request-ui.editorRequest';

class ComponentDemoPage extends DemoPage {
  componentName = 'http-request';

  mock = new ProjectMock();

  @reactive() request?: IHttpRequest;

  @reactive() initialized: boolean;

  oauth2RedirectUri = 'https://auth.advancedrestclient.com/arc.html';
  
  oauth2AuthorizationUri = `${window.location.protocol}//${window.location.host}${window.location.pathname}oauth-authorize.html`;

  constructor() {
    super();
    this.initialized = false;
    this.renderViewControls = true;
    this.init();
  }

  async init(): Promise<void> {
    await this.loadMonaco();
    await this.restoreRequest();
    this.initialized = true;
  }

  async restoreRequest(): Promise<void> {
    const data = localStorage.getItem(REQUEST_STORE_KEY);
    if (!data) {
      return;
    }
    try {
      const tmp = JSON.parse(data);
      if (tmp) {
        this.request = tmp as IHttpRequest;
      }
    } catch (e) {
      // 
    }
  }


  contentTemplate(): TemplateResult {
    if (!this.initialized) {
      return html`
      <div class="screen-loader">
        <p>Loading demo page</p>
        <progress></progress>
      </div>
      `;
    }
    const { request } = this;
    const { url='', headers = '', method = 'GET' } = (request || {}) as IHttpRequest;
    return html`
    <section class="centered large">
      <http-request 
        .method="${method}" 
        .url="${url}" 
        .headers="${headers}"
        .oauth2RedirectUri="${this.oauth2RedirectUri}"
        .oauth2AuthorizationUri="${this.oauth2AuthorizationUri}"></http-request>
    </section>
    `;
  }
}

const instance = new ComponentDemoPage();
instance.render();
