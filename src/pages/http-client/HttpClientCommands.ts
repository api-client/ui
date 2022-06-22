/* eslint-disable @typescript-eslint/ban-types */
import { ContextMenuCommand, ExecuteOptions } from '@api-client/context-menu';
import { AppProject, AppProjectFolderKind, AppProjectKind, AppProjectRequestKind, EnvironmentKind, HttpProject, ProjectRequestKind } from '@api-client/core/build/browser.js';
import { rename, close, add, folder, environment, request, deleteFile, info } from '../../elements/icons/Icons.js';
import '../../define/rename-file-dialog.js';
import { Events } from '../../events/Events.js';
import { LayoutManager } from '../../elements/layout/LayoutManager.js';
import HttpClientNavigationElement from '../../elements/http-client/HttpClientNavigationElement.js';
import HttpProjectScreen from './HttpClientScreen.js';

function findNavigation(element: HTMLElement): HttpClientNavigationElement {
  const root = element.getRootNode() as ShadowRoot;
  return root.host as HttpClientNavigationElement;
}

function renameItem(init: ExecuteOptions): void {
  const { key } = init.target.dataset
  if (!key) {
    return;
  }
  const nav = findNavigation(init.target as HTMLElement);
  nav.edited = key;
}

const commands: ContextMenuCommand[] = [
  // 
  // Workspace tabs
  // 
  
  {
    target: '.layout-tab',
    label: 'Duplicate',
    enabled: (ctx): boolean => {
      const { kind, key } = ctx.target.dataset;
      if (!kind || !key) {
        return false;
      }
      if (kind !== ProjectRequestKind) {
        return false;
      }
      return true;
    },
    execute: (init): void => {
      const { kind, key } = init.target.dataset;
      if (!kind || !key) {
        return;
      }
      if (kind !== ProjectRequestKind) {
        return;
      }
      
      const project = init.store.get('project') as HttpProject;
      const obj = project.findRequest(key);
      if (!obj) {
        return;
      }
      const callback = init.store.get('callback') as Function;
      const layout = init.store.get('layout') as LayoutManager;
      const parent = obj.getParent() || project;
      const cp = obj.clone();
      parent.addRequest(cp);
      layout.addItem({
        key: cp.key,
        kind,
        label: 'New request'
      });
      callback();
    }
  },

  {
    target: '.layout-tab',
    label: '',
    type: 'separator',
  },

  {
    target: '.layout-tab',
    label: 'Close',
    icon: close,
    execute: (init): void => {
      const { key } = init.target.dataset;
      if (!key) {
        return;
      }
      const layout = init.store.get('layout') as LayoutManager;
      layout.removeItem(key);
    }
  },
  {
    target: '.layout-tab',
    label: 'Close others',
    enabled: (ctx): boolean => {
      const shadow = ctx.target.getRootNode() as ShadowRoot;
      const all = shadow.querySelectorAll('.layout-tab');
      if (all.length === 1) {
        return false;
      }
      return true;
    },
    execute: (init): void => {
      const { key } = init.target.dataset;
      if (!key) {
        return;
      }
      const layout = init.store.get('layout') as LayoutManager;
      layout.relativeClose(key, 'both');
      // $0.getRootNode().querySelectorAll('.layout-tab');
    },
  },
  {
    target: '.layout-tab',
    label: 'Close on the right',
    enabled: (ctx): boolean => {
      const next = ctx.target.nextElementSibling;
      if (!next) {
        return false;
      }
      return true;
    },
    execute: (init): void => {
      const { key } = init.target.dataset;
      if (!key) {
        return;
      }
      const layout = init.store.get('layout') as LayoutManager;
      layout.relativeClose(key, 'right');
    },
  },
  {
    target: '.layout-tab',
    label: 'Close on the left',
    enabled: (ctx): boolean => {
      const { index } = ctx.target.dataset;
      if (index === '0') {
        return false;
      }
      return true;
    },
    execute: (init): void => {
      const { key } = init.target.dataset;
      if (!key) {
        return;
      }
      const layout = init.store.get('layout') as LayoutManager;
      layout.relativeClose(key, 'left');
    },
  },

  {
    target: '.layout-tab',
    label: '',
    type: 'separator',
  },

  {
    target: '.layout-tab',
    label: 'Save',
    enabled: (ctx): boolean => {
      const { dirty } = ctx.target.dataset;
      if (dirty !== 'true') {
        return false;
      }
      return true;
    },
    execute: (init): void => {
      const { key } = init.target.dataset;
      if (!key) {
        return;
      }
      const page = init.store.get('page') as HttpProjectScreen;
      page.triggerSave(key);
    },
  },

  {
    target: 'http-client-navigation[rail="projects"]',
    label: 'Add project',
    icon: add,
    execute: async (init): Promise<void> => {
      const project = AppProject.fromName('New project');
      await Events.HttpClient.Model.Project.update(project.toJSON(), init.target);
      const nav = findNavigation(init.target as HTMLElement);
      nav.edited = project.key;
    },
  },

  {
    target: `li[data-kind="${AppProjectKind}"]`,
    label: 'Add folder',
    icon: folder,
    execute: async (init): Promise<void> => {
      const { key } = init.target.dataset
      if (!key) {
        return;
      }
      const schema = await Events.HttpClient.Model.Project.read(key, init.target);
      if (!schema) {
        return;
      }
      const project = new AppProject(schema);
      const created = project.addFolder('New folder');
      await Events.HttpClient.Model.Project.update(project.toJSON(), init.target);
      const nav = findNavigation(init.target as HTMLElement);
      nav.edited = created.key;
    },
  },

  {
    target: `li[data-kind="${AppProjectKind}"]`,
    label: 'Add environment',
    icon: environment,
    execute: async (init): Promise<void> => {
      const { key } = init.target.dataset
      if (!key) {
        return;
      }
      const schema = await Events.HttpClient.Model.Project.read(key, init.target);
      if (!schema) {
        return;
      }
      const project = new AppProject(schema);
      const created = project.addEnvironment('New environment');
      await Events.HttpClient.Model.Project.update(project.toJSON(), init.target);
      const nav = findNavigation(init.target as HTMLElement);
      nav.edited = created.key;
    },
  },

  {
    target: `li[data-kind="${AppProjectKind}"]`,
    label: 'Add HTTP request',
    icon: request,
    execute: async (init): Promise<void> => {
      const { key } = init.target.dataset
      if (!key) {
        return;
      }
      const schema = await Events.HttpClient.Model.Project.read(key, init.target);
      if (!schema) {
        return;
      }
      const project = new AppProject(schema);
      const created = project.addRequest('http://');
      await Events.HttpClient.Model.Project.update(project.toJSON(), init.target);
      const nav = findNavigation(init.target as HTMLElement);
      nav.edited = created.key;
    },
  },

  {
    target: `li[data-kind="${AppProjectKind}"]`,
    label: '',
    type: 'separator',
  },

  {
    target: `li[data-kind="${AppProjectKind}"]`,
    label: 'Delete project',
    icon: deleteFile,
    execute: async (init): Promise<void> => {
      const { key } = init.target.dataset
      if (!key) {
        return;
      }
      await Events.HttpClient.Model.Project.delete(key, init.target);
    },
  },

  {
    target: `li[data-kind="${AppProjectKind}"]`,
    label: '',
    type: 'separator',
  },

  {
    target: `li[data-kind="${AppProjectKind}"]`,
    label: 'Rename',
    icon: rename,
    execute: renameItem
  },

  {
    target: `li[data-kind="${AppProjectKind}"]`,
    label: 'Properties',
    icon: info,
  },


  // ///////////////////////
  {
    target: `li[data-kind="${AppProjectFolderKind}"]`,
    label: 'Add folder',
    icon: folder,
    execute: async (init): Promise<void> => {
      const { key, root } = init.target.dataset
      if (!key || !root) {
        return;
      }
      const schema = await Events.HttpClient.Model.Project.read(root, init.target);
      if (!schema) {
        return;
      }
      const project = new AppProject(schema);
      const parent = project.findFolder(key);
      if (!parent) {
        return;
      }
      const created = parent.addFolder('New folder');
      await Events.HttpClient.Model.Project.update(project.toJSON(), init.target);
      const nav = findNavigation(init.target as HTMLElement);
      nav.edited = created.key;
    },
  },

  {
    target: `li[data-kind="${AppProjectFolderKind}"]`,
    label: 'Add environment',
    icon: environment,
    execute: async (init): Promise<void> => {
      const { key, root } = init.target.dataset
      if (!key || !root) {
        return;
      }
      const schema = await Events.HttpClient.Model.Project.read(root, init.target);
      if (!schema) {
        return;
      }
      const project = new AppProject(schema);
      const parent = project.findFolder(key);
      if (!parent) {
        return;
      }
      const created = parent.addEnvironment('New environment');
      await Events.HttpClient.Model.Project.update(project.toJSON(), init.target);
      const nav = findNavigation(init.target as HTMLElement);
      nav.edited = created.key;
    },
  },

  {
    target: `li[data-kind="${AppProjectFolderKind}"]`,
    label: 'Add HTTP request',
    icon: request,
    execute: async (init): Promise<void> => {
      const { key, root } = init.target.dataset
      if (!key || !root) {
        return;
      }
      const schema = await Events.HttpClient.Model.Project.read(root, init.target);
      if (!schema) {
        return;
      }
      const project = new AppProject(schema);
      const parent = project.findFolder(key);
      if (!parent) {
        return;
      }
      const created = parent.addRequest('http://');
      await Events.HttpClient.Model.Project.update(project.toJSON(), init.target);
      const nav = findNavigation(init.target as HTMLElement);
      nav.edited = created.key;
    },
  },

  {
    target: `li[data-kind="${AppProjectFolderKind}"]`,
    label: '',
    type: 'separator',
  },

  {
    target: `li[data-kind="${AppProjectFolderKind}"]`,
    label: 'Delete folder',
    icon: deleteFile,
    execute: async (init): Promise<void> => {
      const { key, root } = init.target.dataset
      if (!key || !root) {
        return;
      }
      const schema = await Events.HttpClient.Model.Project.read(root, init.target);
      if (!schema) {
        return;
      }
      const project = new AppProject(schema);
      const parent = project.findFolder(key);
      if (!parent) {
        return;
      }
      parent.remove();
      await Events.HttpClient.Model.Project.update(project.toJSON(), init.target);
    },
  },

  {
    target: `li[data-kind="${AppProjectFolderKind}"]`,
    label: '',
    type: 'separator',
  },

  {
    target: `li[data-kind="${AppProjectFolderKind}"]`,
    label: 'Rename',
    icon: rename,
    execute: renameItem,
  },

  {
    target: `li[data-kind="${AppProjectFolderKind}"]`,
    label: 'Properties',
    icon: info,
  },

  // /////////////////////////////////

  {
    target: `li[data-kind="${EnvironmentKind}"]`,
    label: 'Delete environment',
    icon: deleteFile,
    execute: async (init): Promise<void> => {
      const { key, root } = init.target.dataset
      if (!key || !root) {
        return;
      }
      const schema = await Events.HttpClient.Model.Project.read(root, init.target);
      if (!schema) {
        return;
      }
      const project = new AppProject(schema);
      const parent = project.findParent(key);
      if (!parent) {
        return;
      }
      parent.removeEnvironment(key);
      await Events.HttpClient.Model.Project.update(project.toJSON(), init.target);
    },
  },

  {
    target: `li[data-kind="${EnvironmentKind}"]`,
    label: '',
    type: 'separator',
  },

  {
    target: `li[data-kind="${EnvironmentKind}"]`,
    label: 'Rename',
    icon: rename,
    execute: renameItem,
  },

  {
    target: `li[data-kind="${EnvironmentKind}"]`,
    label: 'Properties',
    icon: info,
  },

  // /////////////////////////////////////////
  
  {
    target: `li[data-kind="${AppProjectRequestKind}"]`,
    label: 'Delete request',
    icon: deleteFile,
    execute: async (init): Promise<void> => {
      const { key, root } = init.target.dataset
      if (!key || !root) {
        return;
      }
      const schema = await Events.HttpClient.Model.Project.read(root, init.target);
      if (!schema) {
        return;
      }
      const project = new AppProject(schema);
      project.removeRequest(key);
      await Events.HttpClient.Model.Project.update(project.toJSON(), init.target);
    },
  },

  {
    target: `li[data-kind="${AppProjectRequestKind}"]`,
    label: '',
    type: 'separator',
  },

  {
    target: `li[data-kind="${AppProjectRequestKind}"]`,
    label: 'Rename',
    icon: rename,
    execute: renameItem,
  },

  {
    target: `li[data-kind="${AppProjectRequestKind}"]`,
    label: 'Properties',
    icon: info,
  },
];

export default commands;
