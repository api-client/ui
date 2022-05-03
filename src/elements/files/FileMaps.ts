import { ProjectKind, WorkspaceKind, DataFileKind } from '@api-client/core/build/browser.js';
import { IconType } from '../icons/Icons.js';

export const IconsMap: Record<string, IconType> = {
  [ProjectKind]: 'cloud',
  [WorkspaceKind]: 'folder',
  [DataFileKind]: 'schema',
};

export const DefaultNamesMap: Record<string, string> = {
  [ProjectKind]: 'Unnamed project',
  [WorkspaceKind]: 'Unnamed space',
  [DataFileKind]: 'Unnamed data model',
};

export const AddLabelsMap: Record<string, string> = {
  [ProjectKind]: 'Project',
  [WorkspaceKind]: 'Space',
  [DataFileKind]: 'Data model',
};
