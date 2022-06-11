import { html, TemplateResult } from 'lit';
import { ProjectMock } from '@api-client/core/build/browser.js';
import { DemoPage } from '../../../src/pages/demo/DemoPage.js';
import { HistoryModel } from '../../../src/http-client/idb/HistoryModel.js';
import { ProjectModel } from '../../../src/http-client/idb/ProjectModel.js';
import appInfo from '../../../src/pages/http-client/AppInfo.js';
import { DemoBindings } from '../../lib/DemoBindings.js';
// import { reactive } from '../../../src/lib/decorators.js';
import '../../../src/define/http-client-navigation.js';
import { IConfigEnvironment } from '../../../src/lib/config/Config.js';
import { Events } from '../../../src/events/Events.js';

class ComponentDemoPage extends DemoPage {

  historyModel = new HistoryModel();

  projectModel = new ProjectModel();

  mock = new ProjectMock();

  constructor() {
    super();
    this.renderViewControls = true;
    this.componentName = 'http-client-navigation';

    this.historyModel.listen();
    this.projectModel.listen();

    this.initialize();
  }
  
  async initialize(): Promise<void> {
    let env: IConfigEnvironment | undefined;
    try {
      env = await Events.Config.Environment.read();
    } catch (e) { 
      return;
    }
    if (!env || !env.location) {
      return;
    }
    await Events.Store.Global.setEnv(env);
    const bindings = new DemoBindings(appInfo);
    await bindings.initialize();
  }

  async generateHistory(): Promise<void> {
    const data = this.mock.app.appRequests(100, { isoKey: true });
    const ps = data.map(async (request) => {
      request.log = await this.mock.projectRequest.log();
    });
    await Promise.all(ps);
    await this.historyModel.putBulk(data);
  }
  
  async clearHistory(): Promise<void> {
    await this.historyModel.deleteModel();
  }

  async generateProjects(): Promise<void> {
    const { mock, projectModel } = this;
    const projects = mock.app.appProjects(25);
    console.log(projects);
    
    await projectModel.putBulk(projects);
  }

  async clearProjects(): Promise<void> {
    await this.projectModel.deleteModel();
  }

  _populateHistoryHandler(): void {
    this.generateHistory();
  }

  _clearHistoryHandler(): void {
    this.clearHistory();
  }

  _populateProjectsHandler(): void {
    this.generateProjects();
  }

  _clearProjectsHandler(): void {
    this.clearProjects();
  }

  contentTemplate(): TemplateResult {
    return html`
    <section class="centered large demo-region">
      <http-client-navigation></http-client-navigation>
    </section>
    <section class="centered large data-control">
      <h2>Data control</h2>
      <button @click="${this._populateHistoryHandler}">Populate history</button>
      <button @click="${this._clearHistoryHandler}">Clear history</button>
      <button @click="${this._populateProjectsHandler}">Populate projects</button>
      <button @click="${this._clearProjectsHandler}">Clear projects</button>
    </section>
    `;
  }
}

const instance = new ComponentDemoPage();
instance.render();
