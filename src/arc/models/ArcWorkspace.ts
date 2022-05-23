import { Environment, IEnvironment, IThing, Thing, uuidV4 } from "@api-client/core/build/browser.js";
import { Core as JsonCore } from "@api-client/json";
import { ILayoutPanelState } from "../../elements/layout/LayoutManager.js";

export const Kind = 'ARC#HttpWorkspace';

export interface IWorkspaceItem {
  /**
   * The kind of the rendered item.
   */
  kind: string;
  /**
   * The key of the rendered item.
   */
  key: string;
  /**
   * Optional parent this item belongs to.
   */
  parent?: string;
  /**
   * Indicates the item has been changed and is out of sync with the store.
   * The copy of the data are stored in the `data`. The user can commit the change to the store.
   */
  isDirty?: boolean;
  /**
   * Item's data. Format depends on the kind.
   */
  data: unknown;
}

export interface IWorkspaceState {
  /**
   * Settings for the application navigation
   */
  navigation?: INavigationState;

  /**
   * The layout configuration for the workspace.
   */
  layout?: ILayoutPanelState;
}

export interface INavigationState {
  /**
   * The index of currently selected navigation rail.
   */
  selected?: number;
}

export interface IArcWorkspace {
  /**
   * The data kind. The workspace file parser ignores the data with an unknown `kind`.
   */
  kind: typeof Kind;
  /**
   * Auto generated uuid of the workspace. When not defined it is auto added to the workspace when first opened.
   */
  key?: string;
  /**
   * The list of environments in this workspace.
   * Note, this is unrelated to ArcProject's environments.
   */
  environments?: IEnvironment[];
  /**
   * Workspace meta.
   */
  info?: IThing;
  /**
   * The list of items currently rendered in the workspace.
   */
  items?: IWorkspaceItem[];
  /**
   * The workspace UI state.
   */
  state?: IWorkspaceState;
}

export class ArcWorkspace {
  /**
   * The data kind. The workspace file parser ignores the data with an unknown `kind`.
   */
  kind = Kind;

  /**
   * Auto generated uuid of the workspace. When not defined it is auto added to the workspace when first opened.
   */
  key = '';

  /**
   * The list of environments in this workspace.
   * Note, this is unrelated to ArcProject's environments.
   */
  environments: Environment[] = [];

  /**
   * Workspace meta.
   */
  info = Thing.fromName('');

  /**
   * The list of items currently rendered in the workspace.
   */
  items: IWorkspaceItem[] = [];

  /**
   * The workspace UI state.
   */
  state?: IWorkspaceState

  constructor(input?: string | IArcWorkspace) {
    let init: IArcWorkspace;
    if (typeof input === 'string') {
      init = JSON.parse(input);
    } else if (typeof input === 'object') {
      init = input;
    } else {
      init = {
        kind: Kind,
        key: uuidV4(),
        info: Thing.fromName('').toJSON(),
      };
    }
    this.new(init);
  }

  /**
   * Creates a new environment clearing anything that is so far defined.
   * 
   * Note, this throws an error when the environment is not a space. 
   */
  new(init: IArcWorkspace): void {
    if (!ArcWorkspace.isWorkspace(init)) {
      throw new Error(`Not an HTTP Client workspace.`);
    }
    const { environments, info, items, key = uuidV4(), state, } = init;
    this.kind = Kind;
    this.key = key;

    if (info) {
      this.info = new Thing(info);
    } else {
      this.info = Thing.fromName('');
    }

    if (Array.isArray(environments)) {
      this.environments = environments.map(i => new Environment(i));
    } else {
      this.environments = [];
    }
    if (Array.isArray(items)) {
      this.items = items.map(i => JsonCore.clone(i));
    } else {
      this.items = [];
    }
    if (state) {
      this.state = JsonCore.clone(state);
    } else {
      this.state = undefined;
    }
  }

  /**
   * Checks whether the input is a definition of an user space.
   */
  static isWorkspace(input: unknown): boolean {
    const typed = input as IArcWorkspace;
    if (!input || typed.kind !== Kind) {
      return false;
    }
    return true;
  }

  toJSON(): IArcWorkspace {
    const result: IArcWorkspace = {
      kind: Kind,
      key: this.key,
      info: this.info.toJSON(),
    };
    if (this.state) {
      result.state = JsonCore.clone(this.state);
    }
    if (Array.isArray(this.environments)) {
      result.environments = this.environments.map(i => i.toJSON());
    }
    if (Array.isArray(this.items)) {
      result.items = this.items.map(i => JsonCore.clone(i));
    }
    return result;
  }
}
