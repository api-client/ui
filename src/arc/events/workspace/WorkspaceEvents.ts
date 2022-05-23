/* eslint-disable max-classes-per-file */
/* eslint-disable class-methods-use-this */
import { ContextReadEvent, ContextUpdateEvent } from "@api-client/core/build/browser.js";
import { IArcWorkspace } from "../../models/ArcWorkspace.js";
import { ArcEventTypes } from "../ArcEventTypes.js";

export interface IWorkspaceAppendDetail {
  /**
   * The key of the object to append to the workspace.
   */
  key: string;
  /**
   * The kind of data to append.
   */
  kind: string;
  /**
   * Optional parent for the the data.
   */
  parent?: string;
}

export class WorkspaceEvents {
  /**
   * Appends a stored object to the workspace.
   * The data is recognized by the key and kind.
   */
  static append(key: string, kind: string, parent?: string, target: EventTarget = window): void {
    const e = new CustomEvent<IWorkspaceAppendDetail>(ArcEventTypes.Workspace.append, {
      bubbles: true,
      composed: true,
      detail: { key, kind, parent },
    });
    target.dispatchEvent(e);
  }

  /**
   * Reads the workspace data from the store.
   * 
   * @param key The key of the workspace.
   */
  static async read(key: string, target: EventTarget = window): Promise<IArcWorkspace | undefined> {
    const e = new ContextReadEvent<IArcWorkspace | undefined>(ArcEventTypes.Workspace.read, key);
    target.dispatchEvent(e);
    return e.detail.result;
  }

  /**
   * @param contents The workspace contents.
   */
  static async write(key: string, contents: IArcWorkspace, target: EventTarget = window): Promise<void> {
    const e = new ContextUpdateEvent(ArcEventTypes.Workspace.write, { item: contents, parent: key });
    target.dispatchEvent(e);
    await e.detail.result;
  }

  /**
   * Triggers workspace save action remotely. This is handled by the workspace itself.
   */
  static triggerWrite(target: EventTarget = window): void {
    const e = new Event(ArcEventTypes.Workspace.triggerWrite, {
      bubbles: true,
      composed: true,
    });
    target.dispatchEvent(e);
  }

  static State = class {
    /**
     * Informs the application that the workspace state is now committed to the store.
     */
    static write(target: EventTarget = window): void {
      const e = new Event(ArcEventTypes.Workspace.State.write, {
        bubbles: true,
        composed: true,
      });
      target.dispatchEvent(e);
    }
  }
}
