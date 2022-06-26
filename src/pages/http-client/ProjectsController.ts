/* eslint-disable no-param-reassign */
import { AppProject, ContextListOptions, ContextStateDeleteEvent, ContextStateUpdateEvent, IAppProject, Events as CoreEvents, AppProjectFolderKind, AppProjectRequestKind, EnvironmentKind } from "@api-client/core/build/browser.js";
import { EventTypes } from "../../events/EventTypes.js";
import { ModelStateDeleteEvent } from "../../events/http-client/models/BaseEvents.js";
import { ProjectModel } from "../../http-client/idb/ProjectModel.js";
import { HttpWorkspace } from "../../http-client/models/HttpWorkspace.js";

interface IPageState {
  /**
   * The next page cursor.
   */
  cursor?: string;
  /**
   * Whether the last query resulted with an empty response.
   */
  ended?: boolean;
}

/**
 * A class that is responsible for keeping projects data up to date.
 * 
 * @fires projectchange - When a project on the list changed and the view should revalidate. The `detail` id the key of the changed project.
 * @fires projectremove - When a project on the list changed and the view should revalidate. The `detail` id the key of the changed project.
 */
export class ProjectsController extends EventTarget {
  /**
   * The currently opened projects.
   */
  projects: AppProject[] = [];

  /**
   * The projects data model.
   */
  projectModel = new ProjectModel();

  /**
   * The current state of the pagination.
   */
  protected _pageInfo: IPageState = {};

  constructor() {
    super();
    window.addEventListener(EventTypes.HttpClient.Model.destroyed, this._modelDestroyedHandler.bind(this) as EventListener);
    window.addEventListener(EventTypes.HttpClient.Model.Project.State.update, this._projectUpdatedHandler.bind(this) as EventListener);
    window.addEventListener(EventTypes.HttpClient.Model.Project.State.delete, this._projectDeletedHandler.bind(this) as EventListener);
    this.projectModel.listen(window);
  }

  /**
   * Persists one of the opened projects.
   * @param key The key of the project to persist.
   */
  async persist(key: string): Promise<void> {
    const current = this.projects;
    const project = current.find(i => i.key === key);
    if (!project) {
      return;
    }
    this.projectModel.update(project);
  }

  protected _modelDestroyedHandler(e: ModelStateDeleteEvent): void {
    const { store } = e;
    if (store === 'Projects') {
      this.projects = [];
      this._pageInfo = {};
    }
  }

  protected _projectUpdatedHandler(e: ContextStateUpdateEvent<IAppProject>): void {
    const { key, item } = e.detail;
    if (!item) {
      return;
    }
    const current = this.projects;
    const index = current.findIndex(i => i.key === key);
    if (index >= 0) {
      if (JSON.stringify(current[index]) !== JSON.stringify(item)) {
        current[index].new(item);
      }
    } else {
      current.push(new AppProject(item));
    }
    this.dispatchEvent(new CustomEvent('projectchange', { detail: key }));
  }

  protected _projectDeletedHandler(e: ContextStateDeleteEvent): void {
    const { key } = e.detail;
    const current = this.projects;
    const index = current.findIndex(i => i.key === key);
    if (index >= 0) {
      current.splice(index, 1);
      this.dispatchEvent(new CustomEvent('projectremove', { detail: key }));
    }
  }

  /**
   * Loads the next page of results from the data store.
   */
  async getProjectsPage(): Promise<void> {
    const info = this._pageInfo;
    if (info && info.ended) {
      return;
    }
    const opts: ContextListOptions = {};
    if (info && info.cursor) {
      opts.nextPageToken = info.cursor;
    } else {
      opts.limit = 100;
    }
    try {
      const data = await this.projectModel.list(opts);
      if (data) {
        if (data.nextPageToken) {
          this._pageInfo = { cursor: data.nextPageToken };
        }
        if (data.items.length) {
          const instances = data.items.map(i => new AppProject(i));
          this.projects = this.projects.concat(instances);
        } else {
          this._pageInfo = { ended: true };
        }
      }
    } catch (e) {
      const err = e as Error;
      CoreEvents.Telemetry.exception(err.message, false);
    }
  }

  /**
   * After opening a workspace we search for `AppProject`s and `AppRequest`s
   * to open from the store if necessary. 
   * 
   * The `layout` on the workspace references data kept in the workspace's `items`.
   * 
   * When the workspace's `item` has the data we don't need to lookup the data in the data store.
   * Otherwise, we read related projects and requests and set the `data` to the corresponding item
   * (except for the "project" type).
   * 
   * In the view, the function rendering the data looks up for the data in the `item`'s `data` property
   * only, unless type type is the project (project meta editor).
   */
  async synchronizeWorkspace(workspace: HttpWorkspace): Promise<void> {
    await this._openWorkspaceProjects(workspace);
    this._syncProjectItems(workspace);
  }

  protected async _openWorkspaceProjects(workspace: HttpWorkspace): Promise<void> {
    const { items } = workspace;
    const ids: string[] = this.projects.map(i => i.key);
    items.forEach((item) => {
      if (item.parent && !ids.includes(item.parent)) {
        // folders, envs, and project requests always have a parent set.
        ids.push(item.parent);
      }
    });
    if (!ids.length) {
      return;
    }
    const projects = await this.projectModel.getBulk(ids);
    if (projects) {
      const added = projects.filter(p => !!p).map(p => new AppProject(p));
      this.projects = this.projects.concat(added);
    }
  }

  protected _syncProjectItems(workspace: HttpWorkspace): void {
    const { projects } = this;
    if (!projects.length) {
      return;
    }
    const { items } = workspace;
    items.forEach((item) => {
      if (!item.parent) {
        // not a project item.
        return;
      }

      if (item.data) {
        // we don't override the data that are already set.
        // TODO: what about a situation when we have updated project and stalled data?
        return;
      }

      const project = projects.find(i => i.key === item.parent);
      if (!project) {
        // The UI will render missing project error.
        return;
      }
      if (item.kind === AppProjectFolderKind) {
        const data = project.findFolder(item.key);
        if (data) {
          item.data = data.toJSON();
        }
      } else if (item.kind === AppProjectRequestKind) {
        const data = project.findRequest(item.key);
        if (data) {
          item.data = data.toJSON();
        }
      } else if (item.kind === EnvironmentKind) {
        const data = project.findEnvironment(item.key);
        if (data) {
          item.data = data.toJSON();
        }
      }
    });
  }

  async ensureProject(key: string): Promise<AppProject> {
    let project = this.projects.find(i => i.key === key);
    if (!project) {
      const schema = await this.projectModel.get(key);
      if (!schema) {
        throw new Error(`The project was not found.`);
      }
      project = new AppProject(schema);
      this.projects.push(project);
    }
    return project;
  }
}
