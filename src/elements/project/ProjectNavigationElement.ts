/* eslint-disable no-continue */
/* eslint-disable class-methods-use-this */
import { html, TemplateResult, CSSResult, css } from 'lit';
import { property } from 'lit/decorators.js';
import { StyleInfo, styleMap } from 'lit/directives/style-map.js';
import { 
  HttpProject, ProjectFolder, ProjectRequest, ProjectFolderKind, ProjectRequestKind, 
  Environment, EnvironmentKind,
} from '@api-client/core/build/browser.js';
import '@anypoint-web-components/awc/dist/define/anypoint-icon-button.js';
import { Events } from '../../events/Events.js';
import '../../define/api-icon.js'
import AppNavigation from '../navigation/AppNavigationElement.js';

export default class ProjectNavigationElement extends AppNavigation {
  static get styles(): CSSResult[] {
    return [
      ...AppNavigation.styles, 
      css`
      .empty-state {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        font-style: italic;
      }

      li {
        padding-left: 0 !important;
      }
      `,
    ];
  }

  /**
   * The instance of the project to create the navigation for.
   */
  @property({ type: Object }) project?: HttpProject;

  /**
   * Computed value. Returns true when the project has any items to render in the view.
   */
  get hasItems(): boolean {
    const { project } = this;
    if (!project) {
      return false;
    }
    // the HttpProject doesn't do any computations when folder is not set. It's just a copy of the source array.
    const folders = project.listFolders();
    const requests = project.listRequests();
    const environments = project.listEnvironments();
    return !!folders.length || !!requests.length || !!environments.length;
  }

  constructor() {
    super();
    this.noVisualSelection = true;
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.setAttribute('aria-label', 'Project');
  }

  protected _setupDataTransfer(item: HTMLLIElement, dt: DataTransfer): void {
    super._setupDataTransfer(item, dt);
    dt.setData('text/httpproject', this.project!.key);
  }

  protected _commitName(key: string, kind: string, name: string): void {
    const { project } = this;
    if (!project) {
      return;
    }
    if (!name) {
      return;
    }
    if (kind === ProjectFolderKind) {
      const object = project.findFolder(key);
      if (!object) {
        throw new Error(`Invalid state. Folder not found.`);
      }
      object.info.name = name;
    } else if (kind === ProjectRequestKind) {
      const object = project.findRequest(key);
      if (!object) {
        throw new Error(`Invalid state. Request not found.`);
      }
      object.info.name = name;
    } else if (kind === EnvironmentKind) {
      const object = project.findEnvironment(key);
      if (!object) {
        throw new Error(`Invalid state. Environment not found.`);
      }
      object.info.name = name;
    } else {
      throw new Error(`Invalid state. Unknown kind.`);
    }
    this.edited = undefined;
    Events.HttpProject.changed(this);
    Events.HttpProject.State.nameChanged(key, kind, this);
  }

  render(): TemplateResult | string {
    const { project } = this;
    if (!project) {
      return html``;
    }
    if (!this.hasItems) {
      return this._emptyStateTemplate();
    }
    const content = this._renderParentChildrenTemplate(project);
    return this._outerListTemplate(content);
  }

  protected _renderParentChildrenTemplate(parent: HttpProject | ProjectFolder, indent = 0): TemplateResult | string {
    const { key } = parent;
    const folders = parent.listFolders();
    const requests = parent.listRequests();
    const environments = parent.listEnvironments();
    const isProject = parent.getProject() === undefined;
    const isEmpty = !folders.length && !environments.length && !requests.length;
    if (isEmpty) {
      const styles: StyleInfo = {
        'padding-left': `${this._computeIndent(indent)}px`,
      };
      return html`<p class="list-item-content empty" style="${styleMap(styles)}" aria-disabled="true">Empty folder</p>`;
    }
    return html`
    ${folders.map(f => this.renderFolder(f, indent, isProject ? undefined : key))}
    ${environments.map(r => this.renderEnvironment(r, indent, isProject ? undefined : key))}
    ${requests.map(r => this.renderRequest(r, indent, isProject ? undefined : key))}
    `;
  }

  protected _emptyStateTemplate(): TemplateResult | string {
    return html`
    <div class="empty-state">
      This project has no items.
    </div>
    `;
  }

  protected renderFolder(folder: ProjectFolder, indent: number, parentKey?: string): TemplateResult | string {
    const content = this._renderParentChildrenTemplate(folder, indent + 1);
    const name = folder.info.name || 'Unnamed folder';
    const { kind, key } = folder;
    return this._parentListItemTemplate(key, kind, name, content, {
      parent: parentKey,
      indent,
    });
  }

  protected renderRequest(request: ProjectRequest, indent: number, parentKey?: string): TemplateResult | string {
    const name = request.info.name || 'Unnamed request';
    const { key, kind } = request;
    const content = this._itemContentTemplate('request', name);
    return this._listItemTemplate(key, kind, name, content, {
      parent: parentKey,
      indent,
      draggable: true,
    });
  }

  protected renderEnvironment(environment: Environment, indent: number, parentKey?: string): TemplateResult | string {
    const name = environment.info.name || 'Unnamed environment';
    const { key, kind } = environment;
    const content = this._itemContentTemplate('environment', name);
    return this._listItemTemplate(key, kind, name, content, {
      parent: parentKey,
      indent,
      draggable: true,
    });
  }
}
