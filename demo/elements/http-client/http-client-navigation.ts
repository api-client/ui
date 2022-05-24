import { html, TemplateResult } from 'lit';
import { ProjectMock, ArcProject, ArcProjectRequest } from '@api-client/core/build/browser.js';
import { DemoPage } from '../../../src/pages/demo/DemoPage.js';
import { HistoryModel } from '../../../src/http-client/idb/HistoryModel.js';
import { ProjectModel } from '../../../src/http-client/idb/ProjectModel.js';
// import { reactive } from '../../../src/lib/decorators.js';
import '../../../src/define/http-client-navigation.js';

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
  }

  async generateHistory(): Promise<void> {
    const data = this.mock.arc.arcRequests(100);
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
    const projects: ArcProject[] = [];
    const { mock, projectModel } = this;
    for (let i = 0; i<25; i++) {
      const project = ArcProject.fromName(mock.lorem.words());
      projects.push(project);
      const foldersSize = mock.types.number({min: 0, max: 10});
      const requests = this.mock.arc.arcRequests(mock.types.number({min: foldersSize, max: foldersSize * 2}));
      for (let j = 0; j<foldersSize; j++) {
        const folder = project.addFolder(mock.lorem.words());
        const requestLen = mock.types.number({min: 0, max: 2})
        if (requestLen) {
          const folderRequests = requests.splice(0, requestLen);
          folderRequests.forEach((item) => {
            const adapted = ArcProjectRequest.fromRequest(item, project);
            folder.addRequest(adapted);
          });
        }
      }
      if (requests.length) {
        requests.forEach((item) => {
          const adapted = ArcProjectRequest.fromRequest(item, project);
          project.addRequest(adapted);
        });
      }
    }
    console.log(projects);
    
    await projectModel.putBulk(projects);
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

  contentTemplate(): TemplateResult {
    return html`
    <section class="centered large">
      <http-client-navigation></http-client-navigation>
    </section>
    <section class="centered large">
      <h2>Data control</h2>
      <button @click="${this._populateHistoryHandler}">Populate history</button>
      <button @click="${this._clearHistoryHandler}">Clear history</button>
      <button @click="${this._populateProjectsHandler}">Populate projects</button>
    </section>
    `;
  }
}

const instance = new ComponentDemoPage();
instance.render();
