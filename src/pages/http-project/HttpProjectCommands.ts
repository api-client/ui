import { ContextMenuCommand } from '@api-client/context-menu';
import { EnvironmentKind, HttpProject, ProjectFolderKind, ProjectRequestKind } from '@api-client/core/build/browser.js';
import { folder, rename, deleteFile, environment, request, close } from '../../elements/icons/Icons.js';
import ProjectNavigationElement from '../../elements/project/ProjectNavigationElement.js';
import '../../define/rename-file-dialog.js';
import { Events } from '../../events/Events.js';
import { LayoutManager } from '../../elements/layout/LayoutManager.js';

function findNavigation(element: HTMLElement): ProjectNavigationElement {
  const root = element.getRootNode() as ShadowRoot;
  return root.host as ProjectNavigationElement;
}

const commands: ContextMenuCommand[] = [
  //
  // NAVIGATION
  //

  {
    target: "project-navigation",
    label: 'Add folder',
    title: 'Adds a new folder to the project',
    icon: folder,
    execute: (init): void => {
      const project = init.store.get('project') as HttpProject;
      const callback = init.store.get('callback') as Function;
      project.addFolder();
      callback();
    },
    visible: (init) => init.store.has('project'),
  },
  {
    target: "project-navigation",
    label: 'Add request',
    title: 'Adds a new HTTP request to the project',
    icon: request,
    execute: (init): void => {
      const project = init.store.get('project') as HttpProject;
      const callback = init.store.get('callback') as Function;
      project.addRequest('http://');
      callback();
    },
    visible: (init) => init.store.has('project'),
  },
  {
    target: "project-navigation",
    label: 'Add environment',
    title: 'Adds a new environment definition to the project',
    icon: environment,
    execute: (init): void => {
      const project = init.store.get('project') as HttpProject;
      const callback = init.store.get('callback') as Function;
      project.addEnvironment('New environment');
      callback();
    },
    visible: (init) => init.store.has('project'),
  },

  // 
  // Navigation items
  // 

  // folders
  {
    target: `li[data-kind="${ProjectFolderKind}"]`,
    label: 'Add folder',
    icon: folder,
    execute: (init): void => {
      const project = init.store.get('project') as HttpProject;
      const callback = init.store.get('callback') as Function;
      const key = init.target.dataset.key as string;
      const created = project.addFolder(undefined, { parent: key, });
      const nav = findNavigation(init.target as HTMLElement);
      nav.edited = created.key;
      nav.openGroup(key);
      callback();
      
    },
    visible: (init) => init.store.has('project'),
  },
  {
    target: `li[data-kind="${ProjectFolderKind}"]`,
    label: 'Add request',
    icon: request,
    execute: (init): void => {
      const project = init.store.get('project') as HttpProject;
      const callback = init.store.get('callback') as Function;
      const key = init.target.dataset.key as string;
      const f = project.findFolder(key);
      if (f) {
        const created = f.addRequest('http://');
        const nav = findNavigation(init.target as HTMLElement);
        nav.edited = created.key;
        nav.openGroup(key);
        callback();
      }
    },
    visible: (init) => init.store.has('project'),
  },
  {
    target: `li[data-kind="${ProjectFolderKind}"]`,
    label: 'Add environment',
    title: 'Adds a new environment definition to the folder',
    icon: environment,
    execute: (init): void => {
      const project = init.store.get('project') as HttpProject;
      const callback = init.store.get('callback') as Function;
      const key = init.target.dataset.key as string;
      const f = project.findFolder(key);
      if (f) {
        const created = f.addEnvironment('New environment');
        const nav = findNavigation(init.target as HTMLElement);
        nav.edited = created.key;
        nav.openGroup(key);
        callback();
      }
    },
    visible: (init) => init.store.has('project'),
  },
  {
    target: `li[data-kind="${ProjectFolderKind}"]`,
    type: 'separator',
    label: '',
  },
  {
    target: `li[data-kind="${ProjectFolderKind}"]`,
    label: 'Rename',
    icon: rename,
    title: 'Renames this folder',
    execute: (init): void => {
      const key = init.target.dataset.key as string;
      const nav = findNavigation(init.target as HTMLElement);
      nav.edited = key;
    },
  },
  {
    target: `li[data-kind="${ProjectFolderKind}"]`,
    label: 'Delete',
    icon: deleteFile,
    title: 'Deletes this folder',
    execute: (init): void => {
      const project = init.store.get('project') as HttpProject;
      const callback = init.store.get('callback') as Function;
      const key = init.target.dataset.key as string;
      const removed = project.removeFolder(key);
      if (removed) {
        callback();
      } else {
        throw new Error(`Folder not found in the project.`);
      }
    },
  },

  // requests
  {
    target: `li[data-kind="${ProjectRequestKind}"]`,
    label: 'Rename',
    icon: rename,
    title: 'Renames this request',
    execute: (init): void => {
      const key = init.target.dataset.key as string;
      const nav = findNavigation(init.target as HTMLElement);
      nav.edited = key;
    },
  },
  {
    target: `li[data-kind="${ProjectRequestKind}"]`,
    label: 'Duplicate',
    title: 'Makes a duplicate of this request',
    execute: (init): void => {
      const key = init.target.dataset.key as string;
      const project = init.store.get('project') as HttpProject;
      const obj = project.findRequest(key);
      if (!obj) {
        return;
      }
      const callback = init.store.get('callback') as Function;
      const parent = obj.getParent() || project;
      const cp = obj.clone();
      parent.addRequest(cp);
      callback();
    },
  },
  {
    target: `li[data-kind="${ProjectRequestKind}"]`,
    label: 'Delete',
    icon: deleteFile,
    title: 'Deletes this request',
    execute: (init): void => {
      const project = init.store.get('project') as HttpProject;
      const callback = init.store.get('callback') as Function;
      const key = init.target.dataset.key as string;
      const removed = project.removeRequest(key);
      if (removed) {
        callback();
      } else {
        throw new Error(`Request not found in the project.`);
      }
    },
  },

  // environments
  {
    target: `li[data-kind="${EnvironmentKind}"]`,
    label: 'Rename',
    icon: rename,
    title: 'Renames this environment',
    execute: (init): void => {
      const key = init.target.dataset.key as string;
      const nav = findNavigation(init.target as HTMLElement);
      nav.edited = key;
    },
  },
  
  {
    target: `li[data-kind="${EnvironmentKind}"]`,
    label: 'Delete',
    icon: deleteFile,
    title: 'Deletes this environment',
    execute: (init): void => {
      const project = init.store.get('project') as HttpProject;
      const callback = init.store.get('callback') as Function;
      const key = init.target.dataset.key as string;
      const parent = init.target.dataset.parent as string | undefined;
      const removed = project.removeEnvironment(key, { parent });
      if (removed) {
        callback();
      } else {
        throw new Error(`Request not found in the project.`);
      }
    },
  },

  // 
  // Workspace tabs
  // 
  {
    target: '.layout-tab',
    label: 'Rename',
    icon: rename,
    visible: (ctx): boolean => {
      const { kind, key } = ctx.target.dataset;
      if (!kind || !key) {
        return false;
      }
      if (kind !== ProjectRequestKind) {
        return false;
      }
      return true;
    },
    execute: (ctx): void => {
      const { kind, key } = ctx.target.dataset;
      if (!kind || !key) {
        return;
      }
      if (kind !== ProjectRequestKind) {
        return;
      }
      const dialog = document.createElement('rename-file-dialog');
      dialog.name = ctx.target.textContent?.trim();
      dialog.opened = true;
      document.body.appendChild(dialog);
      dialog.addEventListener('closed', (ev: Event) => {
        document.body.removeChild(dialog);
        const event = ev as CustomEvent;
        const { canceled, confirmed, value } = event.detail;
        if (!canceled && confirmed && value) {
          Events.HttpProject.Request.rename(key, value);
        }
      });
    }
  },

  {
    target: '.layout-tab',
    label: 'Duplicate',
    visible: (ctx): boolean => {
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
    execute: (init): void => {
      const { key } = init.target.dataset;
      if (!key) {
        return;
      }
      const layout = init.store.get('layout') as LayoutManager;
      layout.relativeClose(key, 'both');
    },
  },
  {
    target: '.layout-tab',
    label: 'Close on the right',
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
    execute: (init): void => {
      const { key } = init.target.dataset;
      if (!key) {
        return;
      }
      const layout = init.store.get('layout') as LayoutManager;
      layout.relativeClose(key, 'left');
    },
  }
];

export default commands;
