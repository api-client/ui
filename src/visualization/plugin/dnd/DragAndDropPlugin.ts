/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable class-methods-use-this */
/* eslint-disable no-plusplus */
/* eslint-disable no-continue */
/* eslint-disable no-param-reassign */

import VizWorkspaceElement from '../../elements/VizWorkspaceElement.js';
import { notifyMoved } from '../../lib/PositionUtils.js';

export const observeItems = Symbol('observeItems');
export const mutationHandler = Symbol('mutationHandler');
export const mutationObserver = Symbol('mutationObserver');
export const processAddedNodes = Symbol('processAddedNodes');
export const processRemovedNodes = Symbol('processRemovedNodes');
export const processAttributeChanged = Symbol('processAttributeChanged');
export const dragEnterHandler = Symbol('dragEnterHandler');
export const dragOverHandler = Symbol('dragOverHandler');
export const dropHandler = Symbol('dropHandler');
export const dragHandler = Symbol('dragHandler');
export const observeCurrent = Symbol('observeCurrent');
export const unobserveCurrent = Symbol('unobserveCurrent');
export const connectedValue = Symbol('connectedValue');

interface DragInfo {
  /**
   * click x position inside the dragged element
   */
  sx: number;
  /**
   * click y position inside the dragged element
   */
  sy: number;
  target: HTMLElement;
}

/**
 * A plugin that adds drag and drop support to the visualization workspace.
 * 
 * This is a base class that meant to be extended depending on what the workspace visualizes.
 * The implementation for a specific type of a workspace should override the `dropExternal()` 
 * function to handle dropping onto the workspace a new object.
 * 
 * Additionally the `[dropHandler]()` can be updated to handle custom logic for drop action of 
 * already visualized object. The default behavior is to reposition all currently selected elements
 * relative to the dragged object position change.
 * 
 * After the workspace is created initialize this class and call the `connect()` function to initialize
 * event listeners. When the plugin is no longer needed call `disconnect()` function to clean up listeners.
 * 
 * For the visualized elements to be draggable set `draggable="true"` attribute on the element. If the attribute 
 * is removed or changed the internal logic adds or removed the events from the element.
 */
export class DragAndDropPlugin {
  [connectedValue]: boolean = false;

  [mutationObserver]?: MutationObserver;

  dragInfo?: DragInfo;

  /**
   * @returns True when the plug-in is listening for the input events.
   */
  get connected(): boolean {
    return this[connectedValue];
  }

  constructor(public workspace: VizWorkspaceElement) {
    this[dragEnterHandler] = this[dragEnterHandler].bind(this);
    this[dragOverHandler] = this[dragOverHandler].bind(this);
    this[dropHandler] = this[dropHandler].bind(this);
    this[dragHandler] = this[dragHandler].bind(this);

    this[mutationHandler] = this[mutationHandler].bind(this);
    this[connectedValue] = false;
  }

  connect(): void {
    this.workspace.addEventListener('dragenter', this[dragEnterHandler]);
    this.workspace.addEventListener('dragover', this[dragOverHandler]);
    this.workspace.addEventListener('drop', this[dropHandler]);
    this[mutationObserver] = this[observeItems]();
    this[observeCurrent]();
    this[connectedValue] = true;
  }

  disconnect(): void {
    this.workspace.removeEventListener('dragenter', this[dragEnterHandler]);
    this.workspace.removeEventListener('dragover', this[dragOverHandler]);
    this.workspace.removeEventListener('drop', this[dropHandler]);
    if (this[mutationObserver]) {
      this[mutationObserver]!.disconnect();
      this[mutationObserver] = undefined;
    }
    this[unobserveCurrent]();
    this[connectedValue] = false;
  }

  /**
   * Sets drag info value from the drag event
   */
  setDragInfo(e: DragEvent): void {
    const node = e.target as HTMLElement;
    const { left, top } = node.getBoundingClientRect();
    const { clientX, clientY } = e;
    const { scale } = this.workspace;
    this.dragInfo = {
      sx: (clientX - left) / scale,
      sy: (clientY - top) / scale,
      target: node,
    };
  }

  /**
   * Repositions currently selected elements from a drop event.
   * This is called when the dropped element onto the workspace comes from the same workspace.
   */
  repositionFromDrop(e: DragEvent): void {
    const { target, sx, sy } = this.dragInfo!;
    const dragTarget = target as HTMLElement;
    const { left, top } = dragTarget.getBoundingClientRect();
    const { scale } = this.workspace;
    const ex = (e.clientX - left) / scale;
    const ey = (e.clientY - top) / scale;
    // tests by how much the box was moved in the workspace so the same point can be applied
    // to all boxes in the move.
    const ddx = ex - sx;
    const ddy = ey - sy;
    let items: HTMLElement[] = [];
    const selectionManager = this.workspace.selection;
    selectionManager.selected.forEach((item) => {
      if (item.node.hasAttribute('draggable') && item.node.getAttribute('draggable') === 'true') {
        items.push(item.node as HTMLElement);
      }
    });
    if (!items.length || items.length === 1 && items[0] !== target) {
      items = [dragTarget];
    }
    items.forEach((item) => notifyMoved(item, ddx, ddy));
  }

  /**
   * This function is called when a new object is dropped onto the workspace.
   * A "new object" is an object that has a source different than the current workspace.
   */
  async dropExternal(e: DragEvent): Promise<void> {
    // to be implemented by child classes.
  }

  /**
   * @returns True if the element can be dragged.
   */
  isDraggable(element: Element): boolean {
    return element.hasAttribute('draggable') && element.getAttribute('draggable') === 'true';
  }

  // PRIVATE APIS

  /**
   * Observe items change in the element's light DOM
   * @returns The observer handler
   */
  [observeItems](): MutationObserver {
    const config = { 
      attributes: true, 
      childList: true, 
      subtree: true, 
      attributeFilter: ['draggable'],
    };
    const observer = new MutationObserver(this[mutationHandler]);
    observer.observe(this.workspace, config);
    return observer;
  }

  /**
   * Processes mutations in the workspace and manages selection state.
   * @param mutationsList List of mutations.
   */
  [mutationHandler](mutationsList: MutationRecord[]): void {
    for (const mutation of mutationsList) {
      // console.log(mutation);
      if (mutation.type === 'childList') {
        if (mutation.addedNodes.length) {
          this[processAddedNodes](mutation.addedNodes);
        }
        if (mutation.removedNodes.length) {
          this[processRemovedNodes](mutation.removedNodes);
        }
      } else if (mutation.type === 'attributes' && mutation.attributeName === 'draggable') {
        this[processAttributeChanged](mutation.target);
      }
    }
  }

  /**
   * Processes added children.
   * It adds drag and drop support.
   */
  [processAddedNodes](list: NodeList): void {
    Array.from(list).forEach((node) => {
      if (node.nodeType !== Node.ELEMENT_NODE) {
        return;
      }
      const element = node as HTMLElement;
      if (this.isDraggable(element)) {
        element.addEventListener('dragstart', this[dragHandler]);
      }
      const childList = element.querySelectorAll('[draggable]');
      this[processAddedNodes](childList);
    });
  }

  /**
   * Processes removed children.
   * It removes drag and drop support.
   */
  [processRemovedNodes](list: NodeList): void {
    Array.from(list).forEach((node) => {
      if (node.nodeType !== Node.ELEMENT_NODE) {
        return;
      }
      const element = node as HTMLElement;
      element.removeEventListener('dragstart', this[dragHandler]);
      const childList = element.querySelectorAll('[draggable]');
      this[processRemovedNodes](childList);
    });
  }

  /**
   * Adds or removes the `dragstart` event listener depending on the value oif the `draggable` attribute
   */
  [processAttributeChanged](node: Node): void {
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return;
    }
    const typed = node as Element;
    typed.removeEventListener('dragstart', this[dragHandler] as EventListener);
    if (this.isDraggable(typed)) {
      typed.addEventListener('dragstart', this[dragHandler] as EventListener);
    }
  }

  /**
   * Handles the drag event on one of the children.
   */
  [dragHandler](e: DragEvent): void {
    // only elements are getting drag support so it is safe to set.
    e.dataTransfer!.setData('modeling/source', this.workspace.localName);
    this.setDragInfo(e);
  }

  /**
   * Handles the drag enter event on one of the children.
   */
  [dragEnterHandler](e: DragEvent): void {
    e.preventDefault();
  }

  /**
   * Handles the drag over event on one of the children.
   */
  [dragOverHandler](e: DragEvent): void {
    e.preventDefault();
    const { clientX, clientY } = e;
    this.workspace.scrollIfNeeded(clientX, clientY);
  }


  /**
   * Handles the drop event on one of the visualization canvas to update position of them.
   * 
   * Note, some workspace elements can handle its own drop event and cancel it. In this case
   * this function won't be called.
   */
  async [dropHandler](e: DragEvent): Promise<void> {
    const source = e.dataTransfer!.getData('modeling/source');
    if (source !== this.workspace.localName) {
      this.dropExternal(e);
    } else {
      this.repositionFromDrop(e);
    }
  }

  /**
   * Observers all current draggable items in the workspace.
   */
  [observeCurrent](): void {
    const nodes = Array.from(this.workspace.querySelectorAll('[draggable="true"]')) as HTMLElement[];
    nodes.forEach((node) => node.addEventListener('dragstart', this[dragHandler]));
  }

  /**
   * Removes drag start listener from all current draggable items in the workspace.
   */
  [unobserveCurrent](): void {
    const nodes = Array.from(this.workspace.querySelectorAll('[draggable="true"]')) as HTMLElement[];
    nodes.forEach((node) => node.removeEventListener('dragstart', this[dragHandler]));
  }
}
