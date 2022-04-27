/* eslint-disable @typescript-eslint/no-unused-vars */
import { html, TemplateResult } from 'lit';
import { IProjectExecutionLog, ProjectMock, IRequestLog, IRequestLogInit, IProjectExecutionIteration } from '@api-client/core/build/browser.js';
import { DemoPage } from '../../../src/pages/demo/DemoPage.js';
import '../../../src/define/project-run-report.js';
import { reactive } from '../../../src/lib/decorators.js';

interface IProjectExecutionLogInit {
  iterations?: {
    size?: number;
  }
}

class ComponentDemoPage extends DemoPage {
  componentName = 'Project Run Report';

  mock = new ProjectMock();

  @reactive() report?: IProjectExecutionLog;

  constructor() {
    super();
    this._generateReport();
  }

  protected async _generateReport(opts: IProjectExecutionLogInit = {}): Promise<void> {
    const started = this.mock.time.timestamp();
    const ended = this.mock.time.timestamp({ min: started + 1 });
    const report: IProjectExecutionLog = {
      iterations: await this._generateIterations(opts),
      started,
      ended,
    };
    this.report = report;
  }

  protected async _generateIterations(opts: IProjectExecutionLogInit = {}): Promise<IProjectExecutionIteration[]> {
    const sizeParam = opts.iterations && opts.iterations.size;
    const size = typeof sizeParam === 'number' ? sizeParam : this.mock.types.number({ min: 1, max: 20 });
    const result: IProjectExecutionIteration[] = [];
    for (let i = 0; i < size; i++) {
      // eslint-disable-next-line no-await-in-loop
      const item = await this._generateIteration(i);
      result.push(item);
    }
    return result;
  }

  protected async _generateIteration(index: number): Promise<IProjectExecutionIteration> {
    const result: IProjectExecutionIteration = {
      executed: [],
      index,
    };
    const size = this.mock.types.number({ min: 1, max: 20 });
    for (let i = 0; i < size; i++) {
      // eslint-disable-next-line no-await-in-loop
      const item = await this.generateResponse();
      result.executed.push(item);
    }
    return result;
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
    if (generator === 'iteration') {
      this._generateReportIterations(type);
    }
  }

  protected async _generateReportIterations(type: string): Promise<void> {
    const opts: IProjectExecutionLogInit = {};

    if (type === 'single') {
      opts.iterations = {
        size: 1,
      };
    }
    await this._generateReport(opts);
  }

  async generateResponse(): Promise<IRequestLog> {
    const init: IRequestLogInit = {
      response: {
        // statusGroup: 2,
        // payload: {
        //   force: true,
        // },
        timings: true,
      },
    };
    const log = await this.mock.projectRequest.log(init);
    return log;
  }

  contentTemplate(): TemplateResult {
    return html`
    <section class="centered auto-width">
      <project-run-report .report="${this.report}"></project-run-report>
    </section>
    `;
  }

  navigationTemplate(): TemplateResult {
    return html`
    <nav @click="${this._generatorClick}" @keydown="${this._generatorKeydown}">
      <button class="nav-item" data-generator="iteration" data-type="any">Random</button>
      <button class="nav-item" data-generator="iteration" data-type="single">Single iteration</button>
    </nav>
    `;
  }
}

const instance = new ComponentDemoPage();
instance.render();
