import { AppProject, IProjectExecutionLog, IProjectRunnerOptions, Events as CoreEvents, IAppProjectProxyInit, AppProjectKind, AppProjectFolder, IRequestLog, IHttpHistoryBulkAdd } from '@api-client/core/build/browser.js';
import { html, CSSResult, css, TemplateResult, PropertyValueMap } from 'lit';
import { property, state } from 'lit/decorators.js';
import { AnypointCheckboxElement, AnypointInputElement } from '@anypoint-web-components/awc';
import '@anypoint-web-components/awc/dist/define/anypoint-input.js';
import '@anypoint-web-components/awc/dist/define/anypoint-button.js';
import '@anypoint-web-components/awc/dist/define/anypoint-checkbox.js';
import '@anypoint-web-components/awc/dist/define/anypoint-progress.js';
import '@anypoint-web-components/awc/dist/define/anypoint-dropdown-menu.js';
import '@anypoint-web-components/awc/dist/define/anypoint-listbox.js';
import '@anypoint-web-components/awc/dist/define/anypoint-item.js';
import ApiElement from "../ApiElement.js";
import Theme from '../theme.js';
import { Events } from '../../events/Events.js';
import '../../define/project-run-report.js';

/**
 * An element that renders UI for the AppProject run configuration.
 */
export default class AppProjectRunnerElement extends ApiElement {
  static get styles(): CSSResult[] {
    return [
      Theme,
      css`
      :host {
        display: block;
      }

      anypoint-input {
        margin: 0;
      }

      anypoint-dropdown-menu {
        margin: 0;
      }

      .form-row {
        margin: 28px 0px;
      }

      anypoint-progress {
        width: 100%;
        margin: 20px 0;
      }

      .form-help {
        color: var(--secondary-text-color);
        font-size: var(--secondary-text-size);
        margin: 0px 0px 0px 12px;
        max-width: 800px;
      }

      .form-help.checkbox {
        margin: 0px 0px 0px 44px;
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
      `
    ]
  }

  @property({ type: Object }) project?: AppProject;

  /**
   * The key of the folder to render the runner for.
   * When not set, it renders the runner for the project.
   */
  @property({ type: String, reflect: true }) folder?: string;

  /**
   * The application id required when communication with the store to update the project data.
   */
  @property({ type: String, reflect: true }) appId?: string;

  protected _config?: IProjectRunnerOptions;

  @state() protected _root?: AppProjectFolder | AppProject;

  @state() protected _lastError?: string;

  @state() protected _lastResult?: IProjectExecutionLog;

  /**
   * Whether the element is currently running the project execution.
   */
  @state() protected _running?: boolean;

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
    _config[name] = parseInt(input.value as string, 10);
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
    const { _config = {}, folder, project, appId } = this;
    if (!project || !appId) {
      return;
    }
    if (folder) {
      _config.parent = folder;
    }
    const init: IAppProjectProxyInit = {
      kind: AppProjectKind,
      pid: project.key,
      options: _config,
      appId,
    };
    this._running = true;
    try {
      const result = await CoreEvents.Transport.Core.appProject(init, this);
      if (!result) {
        this._lastError = 'The project execution event was not handled.';
      } else {
        this._lastResult = result.result;
        // this._createHistory(result.result);
      }
    } catch (e) {
      this._lastError = (e as Error).message;
    }
    this._running = false;
  }

  protected async _createHistory(result: IProjectExecutionLog): Promise<void> {
    const { appId, project } = this;
    if (!appId) {
      throw new Error(`The appId is not set on ${this.localName}`);
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
      app: appId,
      project: project.key,

      log,
    };
    await Events.Store.History.createBulk(info);
  }

  protected render(): unknown {
    const { _root } = this;
    if (!_root) {
      return '';
    }
    return html`
    <details open>
      <summary>Configuration</summary>
      <form name="run-config" class="run-config">
        ${this._recursiveOptionTemplate()}
        ${this._parallelOptionTemplate()}
        ${this._iterationsOptionTemplate()}
        ${this._iterationDelayOptionTemplate()}
        ${this._environmentSelectorTemplate(_root)}
      </form>
    </details>
    ${this._loaderTemplate()}
    ${this._submitConfigTemplate()}
    ${this._lastErrorTemplate()}
    ${this._lastRunTemplate()}
    `;
  }

  protected _recursiveOptionTemplate(): TemplateResult {
    const { _config: c = {} } = this;
    const value = typeof c.recursive === 'boolean' ? c.recursive : false;
    return html`
    <div class="form-row">
      <anypoint-checkbox name="recursive" aria-labelledby="recursiveDescription" .checked="${value}" @change="${this._checkboxHandler}">Recursive</anypoint-checkbox>
      <p class="form-help checkbox" id="recursiveDescription">Runs all request from the current folder and its sub-folders</p>
    </div>
    `;
  }

  protected _parallelOptionTemplate(): TemplateResult {
    const { _config: c = {} } = this;
    const value = typeof c.parallel === 'boolean' ? c.parallel : false;
    return html`
    <div class="form-row">
      <anypoint-checkbox name="parallel" aria-labelledby="parallelDescription" .checked="${value}" @change="${this._checkboxHandler}">Parallel</anypoint-checkbox>
      <p class="form-help checkbox" id="parallelDescription">Runs each iteration in parallel. The number of actual execution depends on the number of cores on your device. This is ignored when number of iterations is 1.</p>
    </div>
    `;
  }

  protected _iterationsOptionTemplate(): TemplateResult {
    const { _config: c = {} } = this;
    const value = typeof c.iterations === 'number' ? c.iterations : 1;
    return html`
    <div class="form-row">
      <anypoint-input required label="Iterations" aria-required="true" aria-labelledby="iterationsDescription" name="iterations" type="number" min="1" step="1" .value="${String(value)}" @change="${this._numberInputHandler}">
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
      <anypoint-input name="iterationDelay" label="Iteration delay" aria-labelledby="iterationDelayDescription" type="number" min="0" step="1" .value="${String(value)}" @change="${this._numberInputHandler}">
        <span class="input-suffix" slot="suffix">ms</span>
      </anypoint-input>
      <p class="form-help" id="iterationDelayDescription">The number of milliseconds to wait between each iteration.</p>
    </div>
    `;
  }

  protected _environmentSelectorTemplate(root: AppProject | AppProjectFolder): TemplateResult | string {
    const envs = root.listEnvironments();
    if (!envs.length) {
      return '';
    }
    return html`
    <anypoint-dropdown-menu
      aria-label="Select the execution environment"
      class="role-selector"
      fitPositionTarget
    >
      <label slot="label">Execution environment</label>
      <anypoint-listbox slot="dropdown-content" attrForSelected="data-key">
        <anypoint-item data-key="">Not selected</anypoint-item>
        ${envs.map(e => html`<anypoint-item data-key="${e.key}">${e.info.renderLabel}</anypoint-item>`)}
      </anypoint-listbox>
    </anypoint-dropdown-menu>
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
}
