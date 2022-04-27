import { TemplateResult, html } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { HttpProject, ProjectFolder, ProjectRequest, ProjectRequestKind } from '@api-client/core/build/browser.js';
import ProjectNavigationElement from './ProjectNavigationElement.js';

export default class ProjectRunnerNavigationElement extends ProjectNavigationElement {
  protected _renderParentChildrenTemplate(parent: HttpProject | ProjectFolder): TemplateResult | string {
    const { key } = parent;
    const folders = parent.listFolders();
    const requests = parent.listRequests();
    const isProject = parent.getProject() === undefined;
    return html`
    ${folders.map(f => this.renderFolder(f, isProject ? undefined : key))}
    ${requests.map(r => this.renderRequest(r, isProject ? undefined : key))}
    `;
  }

  protected renderRequest(request: ProjectRequest, parentKey?: string): TemplateResult | string {
    const { key } = request;
    const name = request.info.name || 'Unnamed request';
    const classes = {
      'request-item': true,
      'project-tree-item': true,
    };
    return html`
    <li 
      class="${classMap(classes)}" 
      role="treeitem" 
      tabindex="0" 
      data-parent="${ifDefined(parentKey)}"
      data-key="${key}"
      data-kind="${ProjectRequestKind}"
      draggable="true"
      aria-disabled="true"
      data-disabled="true"
    >
      <div class="list-item-content">
        <api-icon icon="request" class="object-icon"></api-icon>
        <span class="item-label">${name}</span>
      </div>
    </li>
    `;
  }
}
