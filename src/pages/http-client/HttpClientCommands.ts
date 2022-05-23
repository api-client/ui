/* eslint-disable @typescript-eslint/ban-types */
import { ContextMenuCommand } from '@api-client/context-menu';
import { HttpProject, ProjectRequestKind } from '@api-client/core/build/browser.js';
import { rename, close } from '../../elements/icons/Icons.js';
import '../../define/rename-file-dialog.js';
import { Events } from '../../events/Events.js';
import { LayoutManager } from '../../elements/layout/LayoutManager.js';

const commands: ContextMenuCommand[] = [
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
          Events.Http.Request.rename(key, value);
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
