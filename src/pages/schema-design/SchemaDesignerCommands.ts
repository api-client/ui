/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/ban-types */
import { ContextMenuCommand } from '@api-client/context-menu';
import { DataEntityKind, DataModelKind, DataNamespace, DataNamespaceKind } from '@api-client/core/build/browser.js';
import { schemaNamespace, rename, schemaModel, deleteFile, schemaEntity } from '../../elements/icons/Icons.js';
import SchemaDesignNavigationElement from '../../elements/schema-design/SchemaDesignNavigationElement.js';
import '../../define/rename-file-dialog.js';

function findNavigation(element: HTMLElement): SchemaDesignNavigationElement {
  const root = element.getRootNode() as ShadowRoot;
  return root.host as SchemaDesignNavigationElement;
}

const commands: ContextMenuCommand[] = [
  //
  // NAVIGATION
  //

  {
    target: "schema-design-navigation",
    label: 'Add namespace',
    icon: schemaNamespace,
    execute: (init): void => {
      const domain = init.store.get('schema') as DataNamespace;
      const callback = init.store.get('callback') as Function;
      const created = domain.addNamespace('New namespace');
      callback();
      (init.target as SchemaDesignNavigationElement).edited = created.key;
    },
    visible: (init) => init.store.has('schema'),
  },

  {
    target: ".ns-selector",
    label: 'Add namespace',
    icon: schemaNamespace,
    execute: (init): void => {
      const domain = init.store.get('schema') as DataNamespace;
      const callback = init.store.get('callback') as Function;
      const created = domain.addNamespace('New namespace');
      callback();
      findNavigation(init.target as HTMLElement).edited = created.key;
    },
    visible: (init) => init.store.has('schema'),
  },

  // 
  // Navigation Data Namespace items
  // 
  {
    target: `li[data-kind="${DataNamespaceKind}"]`,
    label: 'Add namespace',
    icon: schemaNamespace,
    visible: (init) => init.store.has('schema'),
    execute: (init): void => {
      const key = init.target.dataset.key as string;
      const domain = init.store.get('schema') as DataNamespace;
      const callback = init.store.get('callback') as Function;
      const parent = key === domain.key ? domain : domain.findNamespace(key);
      if (!parent) {
        return;
      }
      const created = parent.addNamespace('New namespace');
      callback();
      const nav = findNavigation(init.target as HTMLElement);
      nav.edited = created.key;
      nav.openGroup(key);
    },
  },
  {
    target: `li[data-kind="${DataNamespaceKind}"]`,
    label: 'Add data model',
    icon: schemaModel,
    visible: (init) => init.store.has('schema'),
    execute: (init): void => {
      const key = init.target.dataset.key as string;
      const domain = init.store.get('schema') as DataNamespace;
      const callback = init.store.get('callback') as Function;
      const parentKey = key === domain.key ? undefined : key;
      const created = domain.addDataModel('New model', parentKey);
      callback();
      const nav = findNavigation(init.target as HTMLElement);
      nav.edited = created.key;
      nav.openGroup(key);
    },
  },
  {
    target: `li[data-kind="${DataNamespaceKind}"]`,
    type: 'separator',
    label: '',
  },
  {
    target: `li[data-kind="${DataNamespaceKind}"]`,
    label: 'Rename',
    icon: rename,
    title: 'Renames this namespace',
    visible: (init) => init.store.has('schema'),
    execute: (init): void => {
      const key = init.target.dataset.key as string;
      const nav = findNavigation(init.target as HTMLElement);
      nav.edited = key;
    },
  },
  {
    target: `li[data-kind="${DataNamespaceKind}"]`,
    label: 'Delete',
    icon: deleteFile,
    title: 'Deletes this namespace and its contents',
    execute: (init): void => {
      const domain = init.store.get('schema') as DataNamespace;
      const callback = init.store.get('callback') as Function;
      const key = init.target.dataset.key as string;
      domain.removeNamespace(key);
      callback();
    },
    visible: (init): boolean => {
      if (!init.store.has('schema')) {
        return false;
      }
      const domain = init.store.get('schema') as DataNamespace;
      const key = init.target.dataset.key as string;
      return domain.key !== key;
    },
  },

  // 
  // Navigation DataModel items
  // 

  {
    target: `li[data-kind="${DataModelKind}"]`,
    label: 'Add entity',
    icon: schemaEntity,
    visible: (init) => init.store.has('schema'),
    execute: (init): void => {
      const key = init.target.dataset.key as string;
      const domain = init.store.get('schema') as DataNamespace;
      const callback = init.store.get('callback') as Function;
      const parent = domain.findDataModel(key);
      if (!parent) {
        return;
      }
      const created = parent.addEntity('New entity');
      callback();
      const nav = findNavigation(init.target as HTMLElement);
      nav.edited = created.key;
      nav.openGroup(key);
    },
  },
  {
    target: `li[data-kind="${DataModelKind}"]`,
    type: 'separator',
    label: '',
  },
  {
    target: `li[data-kind="${DataModelKind}"]`,
    label: 'Rename',
    icon: rename,
    title: 'Renames this data model',
    visible: (init) => init.store.has('schema'),
    execute: (init): void => {
      const key = init.target.dataset.key as string;
      const nav = findNavigation(init.target as HTMLElement);
      nav.edited = key;
    },
  },
  {
    target: `li[data-kind="${DataModelKind}"]`,
    label: 'Delete',
    icon: deleteFile,
    title: 'Deletes this data model and its contents',
    execute: (init): void => {
      const domain = init.store.get('schema') as DataNamespace;
      const callback = init.store.get('callback') as Function;
      const key = init.target.dataset.key as string;
      domain.removeDataModel(key);
      callback();
    },
    visible: init => init.store.has('schema'),
  },

  // 
  // Navigation DataEntity items
  // 
  {
    target: `li[data-kind="${DataEntityKind}"]`,
    label: 'Rename',
    icon: rename,
    title: 'Renames this data model',
    visible: (init) => init.store.has('schema'),
    execute: (init): void => {
      const key = init.target.dataset.key as string;
      const nav = findNavigation(init.target as HTMLElement);
      nav.edited = key;
    },
  },
  {
    target: `li[data-kind="${DataEntityKind}"]`,
    label: 'Delete',
    icon: deleteFile,
    title: 'Deletes this entity',
    execute: (init): void => {
      const domain = init.store.get('schema') as DataNamespace;
      const callback = init.store.get('callback') as Function;
      const key = init.target.dataset.key as string;
      const entity = domain.definitions.entities.find(i => i.key === key);
      if (entity) {
        entity.remove();
        callback();
      }
    },
    visible: init => init.store.has('schema'),
  },
];

export default commands;
