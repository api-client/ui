import { AppProject, AppProjectFolder } from '@api-client/core/build/browser.js';
import { html, CSSResult, css, TemplateResult, PropertyValueMap } from 'lit';
import { property, state } from 'lit/decorators.js';
import { AnypointInputElement, AnypointTabsElement } from '@anypoint-web-components/awc';
import '@anypoint-web-components/awc/dist/define/anypoint-tabs.js';
import '@anypoint-web-components/awc/dist/define/anypoint-tab.js';
import '@anypoint-web-components/awc/dist/define/anypoint-input.js';
import '@anypoint-web-components/awc/dist/define/anypoint-button.js';
import ApiElement from "../ApiElement.js";
import Theme from '../theme.js';
import { Events } from '../../events/Events.js';
import '../../define/confirm-delete-dialog.js'
import '../../define/app-project-runner.js'

export type ITabName = 'general' | 'run' | 'integrations' | 'learn';

/**
 * Renders an meta editor for an AppProject or AppProjectFolder.
 */
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

      .empty-content {
        margin: 12px 20px;
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

  @state() protected _root?: AppProjectFolder | AppProject;

  constructor() {
    super();

    this.selected = 'general';
  }

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

  protected _tabSelectionHandler(e: Event): void {
    const tabs = e.target as AnypointTabsElement;
    const name = tabs.selected as ITabName;
    this.selected = name;
  }

  protected _projectMetaHandler(e: Event): void {
    const { project, _root } = this;
    if (!project || !_root) {
      return;
    }
    const input = e.target as AnypointInputElement;
    const { name, value } = input;
    if (name === 'name' && !value) {
      return;
    }
    _root.info[name as 'name' | 'description'] = value;
    Events.HttpClient.Model.Project.update(project.toJSON(), this);
  }

  protected _deleteProjectHandler(): void {
    const { folder, project } = this;
    if (!project) {
      return;
    }
    if (folder) {
      project.removeFolder(folder);
      Events.HttpClient.Model.Project.update(project.toJSON(), this);
      return;
    }
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
        Events.HttpClient.Model.Project.delete(project.key, this);
      }
    });
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
      <!-- <anypoint-tab data-view="integrations">Integrations</anypoint-tab>
      <anypoint-tab data-view="learn">Learn</anypoint-tab> -->
    </anypoint-tabs>
    `;
  }

  /**
   * @returns The template for the editor contents. The contents depends on current selection.
   */
  protected _contentTemplate(): TemplateResult {
    const { selected, _root, project } = this;
    if (!project) {
      return this._noProjectTemplate();
    }
    if (!_root) {
      return this._noFolderTemplate();
    }
    switch (selected) {
      case 'general': return this._generalTemplate(_root);
      case 'run': return this._projectRunTemplate(project);
      default: return html`<p>Invalid selection. This should not happen.</p>`;
    }
  }

  /**
   * @returns The template for when the project is not set.
   */
  protected _noProjectTemplate(): TemplateResult {
    return html`
    <p class="empty-content">A project is not set. Unable to render content.</p>
    `;
  }

  /**
   * @returns The template for when the folder is not found.
   */
  protected _noFolderTemplate(): TemplateResult {
    return html`
    <p class="empty-content">It looks like this folder was removed and no longer available.</p>
    `;
  }

  /**
   * @returns The template for the general project meta editor.
   */
  protected _generalTemplate(root: AppProject | AppProjectFolder): TemplateResult {
    const { name='', description='' } = root.info;
    const isFolder = root.getParent() !== undefined;
    const label1 = isFolder ? 'Folder' : 'Project';
    const label2 = isFolder ? 'folder' : 'project';
    return html`
    <div class="content-section">
      <section aria-label="${label1} metadata">
        <div class="form-row">
          <anypoint-input label="${label1} name (required)" .value="${name}" name="name" required autoValidate invalidMessage="${label1} name is required" @change="${this._projectMetaHandler}"></anypoint-input>
        </div>
        <div class="form-row">
          <anypoint-input label="${label1} description" .value="${description}" name="description" @change="${this._projectMetaHandler}"></anypoint-input>
        </div>
      </section>
      <div class="section-divider"></div>
      <section aria-label="Delete ${label1}">
        <!-- We add aria-label to the parent section -->
        <p class="section-title" aria-hidden="true">Delete ${label2}</p>
        <p class="section-description">
          ${isFolder ? html`
          This removes the folder from the project and all its contents.
          ` : html`
          This removes the project from the projects list and marks it as deleted. 
          Depending on the store configuration the project will be permanently deleted after the set time (30 days by default).
          `}
          
        </p>
        <anypoint-button flat emphasis="high" class="destructive-button" @click="${this._deleteProjectHandler}">Delete ${label2}</anypoint-button>
      </section>
    </div>
    `;
  }

  protected _projectRunTemplate(project: AppProject): TemplateResult {
    return html`
    <div class="content-section">
      <app-project-runner .project="${project}" .appId="${this.appId}" .folder="${this.folder}"></app-project-runner>
    </div>
    `;
  }
}
