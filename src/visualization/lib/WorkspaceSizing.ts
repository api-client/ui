import VizWorkspaceElement from '../elements/VizWorkspaceElement.js';
import { getObjectBoundingClientRect } from './PositionUtils.js';

export const observeItems = Symbol('observeItems');
export const mutationHandler = Symbol('mutationHandler');
export const mutationObserver = Symbol('mutationObserver');
export const processAddedNodes = Symbol('processAddedNodes');
export const processAttributeChanged = Symbol('processAttributeChanged');
export const connectedValue = Symbol('connectedValue');
export const queueDebouncer = Symbol('queueDebouncer');

/**
 * A class that controls the `autoResize` property of the workspace.
 * When this property is set it keeps track of elements moving in the workspace and when they
 * are positioned outside the bounds of the current workspace it resizes it.
 * 
 * Note, currently it only works when placing items to the right or below workspace.
 */
export class WorkspaceSizing {
  [connectedValue]: boolean = false;

  /**
   * @returns True when the plug-in is listening for the input events.
   */
  get connected(): boolean {
    return this[connectedValue];
  }

  processElementsQueue: HTMLElement[] = [];

  [mutationObserver]?: MutationObserver;

  constructor(public workspace: VizWorkspaceElement) {
    this[mutationHandler] = this[mutationHandler].bind(this);
  }

  /**
   * Starts listening on user events
   */
  connect(): void {
    if (this[connectedValue]) {
      return;
    }
    this[mutationObserver] = this[observeItems]();
    this[connectedValue] = true;
  }

  /**
   * Cleans up the listeners
   */
  disconnect(): void {
    const mo = this[mutationObserver];
    if (mo) {
      mo.disconnect();
      this[mutationObserver] = undefined;
    }
    this[connectedValue] = false;
  }

  /**
   * Processes a single element to check whether the workspace has to be resized
   * to account for the element's position.
   */
  processElement(node: HTMLElement): void {
    const box = getObjectBoundingClientRect(node, this.workspace);
    const { width, height } = this.workspace;
    if (box.right > width) {
      this.workspace.width = box.right + 40;
    }
    if (box.bottom > height) {
      this.workspace.height = box.bottom + 40;
    }
  }

  [queueDebouncer]?: any;

  /**
   * Adds an element to the processing queue. The queue runs after a next frame so the workspace is computed.
   */
  queueElement(node: HTMLElement): void {
    if (!Array.isArray(this.processElementsQueue)) {
      this.processElementsQueue = [];
    }
    this.processElementsQueue.push(node);
    if (this[queueDebouncer]) {
      clearTimeout(this[queueDebouncer]);
    }
    this[queueDebouncer] = setTimeout(() => {
      this[queueDebouncer] = undefined;
      this.runQueue();
    }, 0);
  }
  
  runQueue(): void {
    const { processElementsQueue } = this;
    if (!Array.isArray(processElementsQueue) || !processElementsQueue.length) {
      return;
    }
    processElementsQueue.forEach(node => this.processElement(node));
    this.processElementsQueue = [];
  }

  /**
   * Observe items change in the element's light DOM
   * @return The observer handler
   */
  [observeItems](): MutationObserver {
    const config: MutationObserverInit = { attributes: true, childList: true, subtree: true, attributeOldValue: true, };
    const observer = new MutationObserver(this[mutationHandler]);
    observer.observe(this.workspace, config);
    return observer;
  }

  /**
   * Processes mutations in the workspace and manages selection state.
   * @param mutationsList List of mutations.
   */
  async [mutationHandler](mutationsList: MutationRecord[]): Promise<void> {
    await this.workspace.updateComplete;
    for (const mutation of mutationsList) {
      if (mutation.type === 'childList') {
        this[processAddedNodes](mutation.addedNodes);
      } else if (mutation.type === 'attributes') {
        this[processAttributeChanged](mutation);
      }
    }
  }

  /**
   * Processes added to the canvas elements.
   * @param nodes The list of added nodes
   */
  [processAddedNodes](nodes: NodeList): void {
    nodes.forEach((node) => {
      if (node.nodeType !== Node.ELEMENT_NODE) {
        return;
      }
      const typed = node as HTMLElement;
      const name = typed.localName;
      if (['viz-workspace', 'viz-association'].includes(name)) {
        return;
      }
      const { dataset } = typed;
      if (!dataset) {
        return;
      }
      if (dataset.associationSlot) {
        return;
      }
      this.queueElement(typed);
      this[processAddedNodes](typed.querySelectorAll('*'));
    });
  }

  /**
   * Processes changed attribute on any element in the canvas
   * @param mutation The record associated with the change
   */
  [processAttributeChanged](mutation: MutationRecord): void {
    const att = mutation.attributeName!;
    const nodeName = mutation.target.nodeName.toLowerCase();
    if (['viz-workspace', 'viz-association'].includes(nodeName)) {
      return;
    }
    const isView = nodeName === 'modeling-view';
    const { processElementsQueue } = this;
    let typed = mutation.target as HTMLElement;
    if (isView && ['name', 'value'].includes(att)) {
      typed = typed.parentElement as HTMLElement;
    } else if (isView) {
      return;
    }
    if (processElementsQueue.includes(typed)) {
      return;
    }
    if (isView) {
      this.queueElement(typed);
    }
  }
}
