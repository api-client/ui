import { AppProject, IProjectExecutionLog, IProjectRunnerOptions, Events as CoreEvents, IAppProjectProxyInit, AppProjectKind } from '@api-client/core/build/browser.js';
import { html, CSSResult, css, TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { AnypointCheckboxElement, AnypointInputElement, AnypointTabsElement } from '@anypoint-web-components/awc';
import '@anypoint-web-components/awc/dist/define/anypoint-tabs.js';
import '@anypoint-web-components/awc/dist/define/anypoint-tab.js';
import '@anypoint-web-components/awc/dist/define/anypoint-input.js';
import '@anypoint-web-components/awc/dist/define/anypoint-button.js';
import '@anypoint-web-components/awc/dist/define/anypoint-checkbox.js';
import '@anypoint-web-components/awc/dist/define/anypoint-progress.js';
import '@anypoint-web-components/awc/dist/define/anypoint-dropdown-menu.js';
import '@anypoint-web-components/awc/dist/define/anypoint-listbox.js';
import '@anypoint-web-components/awc/dist/define/anypoint-item.js';
import ApiElement from "../ApiElement.js";
import Theme from '../theme.js';
import '../../define/confirm-delete-dialog.js'
import { Events } from '../../events/Events.js';

export type ITabName = 'general' | 'run' | 'integrations' | 'learn';

export default class AppProjectEditorElement extends ApiElement {
  static get styles(): CSSResult[] {
    return [
      Theme,
      css`
      :host {
        display: block;
      }

      anypoint-input {
        margin: 0;
        min-width: 320px;
      }

      anypoint-input:not([invalidMessage]) {
        --anypoint-input-assistive-height: 0;
      }

      anypoint-input[type="number"] {
        min-width: 200px;
      }

      anypoint-dropdown-menu {
        margin: 0;
      }

      .section-title {
        margin: 8px 0px;
      }

      .content-section {
        padding: 20px;
      }

      anypoint-tabs {
        border-bottom-color: var(--divider-color);
        border-bottom-width: 1px;
        border-bottom-style: solid;
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
      `
    ]
  }

  /**
   * The currently selected tab.
   */
  @property({ type: String, reflect: true }) selected: ITabName;

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

  @state() protected _lastError?: string;

  @state() protected _lastResult?: IProjectExecutionLog;

  /**
   * Whether the element is currently running the project execution.
   */
  @state() protected _running?: boolean;

  constructor() {
    super();

    this.selected = 'general';
  }

  protected _tabSelectionHandler(e: Event): void {
    const tabs = e.target as AnypointTabsElement;
    const name = tabs.selected as ITabName;
    this.selected = name;
  }

  protected _projectMetaHandler(e: Event): void {
    const { project } = this;
    if (!project) {
      return;
    }
    const input = e.target as AnypointInputElement;
    const { name, value } = input;
    if (name === 'name' && !value) {
      return;
    }
    project.info[name as 'name' | 'description'] = value;
    Events.HttpClient.Model.Project.update(project.toJSON(), this);
  }

  protected _deleteProjectHandler(): void {
    const dialog = document.createElement('confirm-delete-dialog');
    dialog.type = 'project';
    dialog.name = this.project?.info.renderLabel;
    document.body.appendChild(dialog);
    dialog.opened = true;
    dialog.addEventListener('closed', (ev: Event) => {
      document.body.removeChild(dialog);
      const event = ev as CustomEvent;
      const { canceled, confirmed } = event.detail;
      if (!canceled && confirmed) {
        const { project } = this;
        if (!project) {
          return;
        }
        Events.HttpClient.Model.Project.delete(project.key, this);
      }
    });
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
      console.log(result);
      
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

  protected render(): unknown {
    return html`
    ${this._tabsTemplate()}
    ${this._contentTemplate()}
    `;
  }

  /**
   * @returns The template for the editor tabs
   */
  protected _tabsTemplate(): TemplateResult {
    const { selected } = this;
    return html`
    <anypoint-tabs .selected="${selected}" attrForSelected="data-view" @selected="${this._tabSelectionHandler}">
      <anypoint-tab data-view="general">General</anypoint-tab>
      <anypoint-tab data-view="run">Run</anypoint-tab>
      <anypoint-tab data-view="integrations">Integrations</anypoint-tab>
      <anypoint-tab data-view="learn">Learn</anypoint-tab>
    </anypoint-tabs>
    `;
  }

  /**
   * @returns The template for the editor contents. The contents depends on current selection.
   */
  protected _contentTemplate(): TemplateResult {
    const { selected, project } = this;
    if (!project) {
      return this._noProjectTemplate();
    }
    switch (selected) {
      case 'general': return this._generalTemplate(project);
      case 'run': return this._projectRunTemplate(project);
      default: return html`<p>Invalid selection. This should not happen.</p>`;
    }
  }

  /**
   * @returns The template for when the project is not set.
   */
  protected _noProjectTemplate(): TemplateResult {
    return html`
    <p>A project is not set. Unable to render content.</p>
    `;
  }

  /**
   * @returns The template for the general project meta editor.
   */
  protected _generalTemplate(project: AppProject): TemplateResult {
    const { name='', description='' } = project.info;
    return html`
    <div class="content-section">
      <section aria-label="Project metadata">
        <div class="form-row">
          <anypoint-input label="Project name (required)" .value="${name}" name="name" required autoValidate invalidMessage="Project name is required" @change="${this._projectMetaHandler}"></anypoint-input>
        </div>
        <div class="form-row">
          <anypoint-input label="Project description" .value="${description}" name="description" @change="${this._projectMetaHandler}"></anypoint-input>
        </div>
      </section>
      <div class="section-divider"></div>
      <section aria-label="Delete project">
        <!-- We add aria-label to the parent section -->
        <p class="section-title" aria-hidden="true">Delete project</p>
        <p class="section-description">
          This removes the project from the projects list and marks it as deleted. 
          Depending on the store configuration the project will be permanently deleted after the set time (30 days by default).
        </p>
        <anypoint-button flat emphasis="high" class="destructive-button" @click="${this._deleteProjectHandler}">Delete project</anypoint-button>
      </section>
    </div>
    `;
  }

  protected _projectRunTemplate(project: AppProject): TemplateResult {
    return html`
    <div class="content-section">
      <details open>
        <summary>Configuration</summary>
        <form name="run-config" class="run-config">
          ${this._recursiveOptionTemplate()}
          ${this._parallelOptionTemplate()}
          ${this._iterationsOptionTemplate()}
          ${this._iterationDelayOptionTemplate()}
          ${this._environmentSelectorTemplate(project)}
        </form>
      </details>
      ${this._submitConfigTemplate()}
    </div>
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

  protected _environmentSelectorTemplate(project: AppProject): TemplateResult | string {
    const envs = project.listEnvironments();
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
}
