import { LitElement, html, TemplateResult, CSSResult, css, PropertyValueMap } from 'lit';
import { property, state } from 'lit/decorators.js';
import { 
  HttpProject, ProjectFolder, IProjectRunnerOptions, Events as CoreEvents, IProjectExecutionLog, IApplication, IHttpHistoryBulkAdd, IRequestLog,
} from '@api-client/core/build/browser.js';
import '@anypoint-web-components/awc/dist/define/anypoint-tabs.js';
import '@anypoint-web-components/awc/dist/define/anypoint-tab.js';
import '@anypoint-web-components/awc/dist/define/anypoint-checkbox.js';
import '@anypoint-web-components/awc/dist/define/anypoint-input.js';
import '@anypoint-web-components/awc/dist/define/anypoint-button.js';
import '@anypoint-web-components/awc/dist/define/anypoint-progress.js';
import { AnypointCheckboxElement, AnypointInputElement, AnypointTabsElement } from '@anypoint-web-components/awc';
import '../../define/project-run-report.js';
import { Events } from '../../events/Events.js';

export default class ProjectRunnerElement extends LitElement {
  static get styles(): CSSResult[] {
    return [
      css`
      :host {
        display: block;
      }

      .header {
        margin: 20px;
      }

      .parent-label {
        font-size: 1.5rem;
      }

      anypoint-tabs {
        border-bottom: 1px var(--divider-color) solid;
      }

      anypoint-input {
        margin: 0px 0px 12px 0px;
      }

      .run-config {
        margin: 20px;
      }

      .form-help {
        color: var(--secondary-text-color);
        margin: 0px 0px 0px 12px;
      }

      .form-row {
        margin: 28px 0px;
      }

      anypoint-progress {
        width: 100%;
        margin: 20px 0;
      }

      .section-title {
        font-size: 1.4rem;
        font-weight: 300;
        margin: 20px 0;
      }

      .report {
        margin-top: 40px;
        border-top: 1px var(--divider-color) solid;
        padding: 0 20px;
      }

      .exe-error {
        margin: 20px;
        border: 4px var(--error-color) solid;
        padding: 20px;
      }
      `,
    ];
  }

  /**
   * The instance of the current project.
   */
  @property({ type: Object }) project?: HttpProject;

  /**
   * This property is required for the API access to work.
   * Set it to the current application information.
   */
  @property({ type: Object }) appInfo?: IApplication;

  /**
   * The key of the folder to render the runner for.
   * When not set, it renders the runner for the project.
   */
  @property({ type: String, reflect: true }) folder?: string;

  /**
   * The object we operate on.
   */
  @state() protected _root?: HttpProject | ProjectFolder;

  /**
   * The currently rendered panel.
   */
  @state() protected selected: string = 'config';

  /**
   * Whether the element is currently running the project execution.
   */
  @state() protected _running?: boolean;

  protected _config?: IProjectRunnerOptions;

  @state() protected _lastError?: string;

  @state() protected _lastResult?: IProjectExecutionLog;

  updated(cp: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
    super.updated(cp);
    if (cp.has('project') || cp.has('folder')) {
      this._setupRoot();
    }
  }

  protected _setupRoot(): void {
    const { project, folder } = this;
    if (!project) {
      this._root = undefined;
      return;
    }
    if (!folder) {
      this._root = project;
    } else {
      this._root = project.findFolder(folder);
    }
  }

  protected _tabChangeHandler(e: Event): void {
    const tabs = e.target as AnypointTabsElement;
    this.selected = String(tabs.selected);
  }

  protected _checkboxHandler(e: Event): void {
    const input = e.target as AnypointCheckboxElement;
    const name = input.name as 'recursive' | 'parallel';
    const { _config = {} } = this;
    _config[name] = input.checked;
    this._config = _config;
  }

  protected _numberInputHandler(e: Event): void {
    const input = e.target as AnypointInputElement;
    const name = input.name as 'iterations' | 'iterationDelay';
    const { _config = {} } = this;
    _config[name] = parseInt(input.value, 10);
    this._config = _config;
  }

  protected _runHandler(): void {
    this.execute();
  }

  /**
   * Executes the current configuration.
   */
  async execute(): Promise<void> {
    this._lastError = undefined;
    const { _config: init = {}, folder, project } = this;
    if (!project) {
      return;
    }
    if (folder) {
      init.parent = folder;
    }
    this._running = true;
    try {
      const result = await CoreEvents.Transport.Project.send(this, project.key, init);
      if (!result) {
        this._lastError = 'The project execution event was not handled.';
      } else {
        this._lastResult = result;
        this._createHistory(result);
      }
    } catch (e) {
      this._lastError = (e as Error).message;
    }
    this._running = false;
  }

  protected async _createHistory(result: IProjectExecutionLog): Promise<void> {
    const { appInfo, project } = this;
    if (!appInfo) {
      throw new Error(`The appInfo is not set on ${this.localName}`);
    }
    if (!project) {
      return;
    }
    let log: IRequestLog[] = [];
    result.iterations.forEach((item) => {
      log = log.concat(item.executed);
    });
    if (!log.length) {
      return;
    }
    const info: IHttpHistoryBulkAdd = {
      app: appInfo.code,
      project: project.key,
      log,
    };
    await Events.Store.History.createBulk(info);
  }

  protected render(): TemplateResult {
    const { _root } = this;
    if (!_root) {
      return html``;
    }
    return html`
    ${this._headerTemplate(_root)}
    ${this._tabsTemplate()}
    ${this._contentTemplate()}
    `;
  }

  protected _headerTemplate(root: HttpProject | ProjectFolder): TemplateResult {
    const label = root.info.name || '(unnamed)';
    return html`
    <div class="header">
      <div class="parent-label">${label}</div>
    </div>
    `;
  }

  protected _tabsTemplate(): TemplateResult {
    const { selected } = this;
    return html`
    <anypoint-tabs
      .selected="${selected}"
      @selectedchange="${this._tabChangeHandler}"
      class="editor-tabs"
      attrForSelected="data-tab"
      fallbackSelection="config"
    >
      <anypoint-tab data-tab="config">Config</anypoint-tab>
      <anypoint-tab data-tab="history">History</anypoint-tab>
    </anypoint-tabs>
    `;
  }

  protected _contentTemplate(): TemplateResult {
    if (this.selected === 'history') {
      return this._historyTemplate();
    }
    return this._configTemplate();
  }

  protected _configTemplate(): TemplateResult {
    return html`
    <form name="run-config" class="run-config">
      ${this._recursiveOptionTemplate()}
      ${this._parallelOptionTemplate()}
      ${this._iterationsOptionTemplate()}
      ${this._iterationDelayOptionTemplate()}
      ${this._submitConfigTemplate()}
    </form>
    ${this._lastErrorTemplate()}
    ${this._loaderTemplate()}
    ${this._lastRunTemplate()}
    `;
  }

  protected _recursiveOptionTemplate(): TemplateResult {
    const { _config: c = {} } = this;
    const value = typeof c.recursive === 'boolean' ? c.recursive : false;
    return html`
    <div class="form-row">
      <anypoint-checkbox name="recursive" aria-labelledby="recursiveDescription" .checked="${value}" @change="${this._checkboxHandler}">Recursive</anypoint-checkbox>
      <p class="form-help" id="recursiveDescription">Runs all request from the current folder and its sub-folders</p>
    </div>
    `;
  }

  protected _parallelOptionTemplate(): TemplateResult {
    const { _config: c = {} } = this;
    const value = typeof c.parallel === 'boolean' ? c.parallel : false;
    return html`
    <div class="form-row">
      <anypoint-checkbox name="parallel" aria-labelledby="parallelDescription" .checked="${value}" @change="${this._checkboxHandler}">Parallel</anypoint-checkbox>
      <p class="form-help" id="parallelDescription">Runs each iteration in parallel. The number of actual execution depends on the number of cores on your device. This is ignored when number of iterations is 1.</p>
    </div>
    `;
  }

  protected _iterationsOptionTemplate(): TemplateResult {
    const { _config: c = {} } = this;
    const value = typeof c.iterations === 'number' ? c.iterations : 1;
    return html`
    <div class="form-row">
      <anypoint-input required aria-required="true" aria-labelledby="iterationsDescription" name="iterations" type="number" min="1" step="1" .value="${value}" @change="${this._numberInputHandler}">
        <label slot="label">Iterations</label>
      </anypoint-input>
      <p class="form-help" id="iterationsDescription">The number of times the execution should be repeated.</p>
    </div>
    `;
  }

  protected _iterationDelayOptionTemplate(): TemplateResult {
    const { _config: c = {} } = this;
    const value = typeof c.iterationDelay === 'number' ? c.iterationDelay : 0;
    return html`
    <div class="form-row">
      <anypoint-input name="iterationDelay" aria-labelledby="iterationDelayDescription" type="number" min="0" step="1" .value="${value}" @change="${this._numberInputHandler}">
        <label slot="label">Iteration delay</label>
        <span class="input-suffix" slot="suffix">ms</span>
      </anypoint-input>
      <p class="form-help" id="iterationDelayDescription">The number of milliseconds to wait between each iteration.</p>
    </div>
    `;
  }

  protected _submitConfigTemplate(): TemplateResult {
    return html`
    <div class="form-row">
      <anypoint-button emphasis="high" flat @click="${this._runHandler}" ?disabled="${this._running}">Run</anypoint-button>
    </div>
    `;
  }

  protected _loaderTemplate(): TemplateResult | string {
    if (!this._running) {
      return '';
    }
    return html`
    <anypoint-progress indeterminate></anypoint-progress>
    `;
  }

  protected _lastErrorTemplate(): TemplateResult | string {
    const { _lastError: message } = this;
    if (!message) {
      return '';
    }
    return html`<div class="exe-error">${message}</div>`;
  }

  protected _lastRunTemplate(): TemplateResult | string {
    const { _lastResult: report } = this;
    if (!report) {
      return '';
    }
    return html`
    <section aria-label="Latest report" class="report">
      <div class="section-title">Latest report</div>
      <project-run-report .report="${report}"></project-run-report>
    </section>
    `;
  }

  protected _historyTemplate(): TemplateResult {
    return html`<p>History is not yet supported.</p>`;
  }
}
