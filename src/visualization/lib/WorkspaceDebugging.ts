/* eslint-disable class-methods-use-this */
import VizWorkspaceElement from '../elements/VizWorkspaceElement.js';
import { getRelativeClickPoint, getObjectBoundingClientRect, getWorkspaceClick } from './PositionUtils.js';

const mousePortioningValue = Symbol('mousePortioningValue');
const setupMousePositioning = Symbol('setupMousePositioning');
const disableMousePositioning = Symbol('disableMousePositioning');
const mouseMoveHandler = Symbol('mouseMoveHandler');
const mousePositionAnchor = Symbol('mousePositionAnchor');
const workspacePositioningValue = Symbol('workspacePositioningValue');
const setupWorkspacePositioning = Symbol('setupWorkspacePositioning');
const disableWorkspacePositioning = Symbol('disableWorkspacePositioning');
const mutationHandler = Symbol('mutationHandler');
const mutationObserver = Symbol('mutationObserver');
const observeItems = Symbol('observeItems');
const processAddedNodes = Symbol('processAddedNodes');
const processRemovedNodes = Symbol('processRemovedNodes');
const updateVisualizationItem = Symbol('updateVisualizationItem');
const positionedElements = Symbol('positionedElements');
const scrollHandler = Symbol('scrollHandler');
const scrollTimeout = Symbol('scrollTimeout');
const onScroll = Symbol('onScroll');
const createPositioningInfoElement = Symbol('createPositioningInfoElement');
const ensurePositioningInfoElement = Symbol('ensurePositioningInfoElement');
const updatePositioningInfoElement = Symbol('updatePositioningInfoElement');

let elementIndex = 0;

const ignoredElements = ['viz-association'];

/**
 * Debugging helpers for the visualization workspace.
 */
export class WorkspaceDebugging {
  [mousePortioningValue]: boolean = false;

  /**
   * @return Whether a mouse position value is rendered in the workspace
   */
  get mousePositioning(): boolean {
    return this[mousePortioningValue];
  }

  /**
   * @param value Whether a mouse position value is rendered in the workspace
   */
  set mousePositioning(value: boolean) {
    const old = this[mousePortioningValue];
    if (old === value) {
      return;
    }
    this[mousePortioningValue] = value;
    if (value) {
      this[setupMousePositioning]();
    } else {
      this[disableMousePositioning]();
    }
  }

  [workspacePositioningValue]: boolean = false;

  /**
   * @return Whether the position of each visualized element is rendered in the workspace
   */
  get workspacePositioning(): boolean {
    return this[workspacePositioningValue];
  }

  set workspacePositioning(value: boolean) {
    const old = this[workspacePositioningValue];
    if (old === value) {
      return;
    }
    this[workspacePositioningValue] = old;
    if (value) {
      this[setupWorkspacePositioning]();
    } else {
      this[disableWorkspacePositioning]();
    }
  }

  [positionedElements] = new WeakMap<HTMLElement, string>();

  [mousePositionAnchor]?: HTMLDivElement;

  [mutationObserver]?: MutationObserver;

  constructor(public workspace: VizWorkspaceElement) {
    this[mouseMoveHandler] = this[mouseMoveHandler].bind(this);
    this[mutationHandler] = this[mutationHandler].bind(this);
    this[scrollHandler] = this[scrollHandler].bind(this);
  }

  [setupMousePositioning](): void {
    this.workspace.addEventListener('mousemove', this[mouseMoveHandler]);
  }

  [disableMousePositioning](): void {
    this.workspace.removeEventListener('mousemove', this[mouseMoveHandler]);
    if (this[mousePositionAnchor]) {
      this.workspace.shadowRoot!.removeChild(this[mousePositionAnchor]!);
      this[mousePositionAnchor] = undefined;
    }
  }

  /**
   * Redraws the position anchor
   */
  [mouseMoveHandler](e: MouseEvent): void {
    const { clientX, clientY } = e;
    const rPos = getRelativeClickPoint(clientX, clientY, this.workspace);
    const pos = getWorkspaceClick(clientX, clientY, this.workspace);
    if (!this[mousePositionAnchor]) {
      const a = document.createElement('div');
      a.style.position = 'absolute';
      a.style.backgroundColor = 'rgb(253 216 53 / 54%)';
      a.style.padding = '4px 8px';
      a.style.pointerEvents = 'none';
      this.workspace.shadowRoot!.appendChild(a);
      this[mousePositionAnchor] = a;
    }
    this[mousePositionAnchor]!.style.left = `${pos.x + 8}px`;
    this[mousePositionAnchor]!.style.top = `${pos.y}px`;
    this[mousePositionAnchor]!.innerText = `${Math.round(rPos.x)} x ${Math.round(rPos.y)}`;
  }

  [setupWorkspacePositioning](): void {
    this[mutationObserver] = this[observeItems]();
    this.workspace.addEventListener('scroll', this[scrollHandler]);
    this.workspace.addEventListener('zoomchange', this[scrollHandler]);
    const nodes = this.workspace.querySelectorAll('*');
    this[processAddedNodes](nodes);
  }

  [disableWorkspacePositioning](): void {
    this.workspace.removeEventListener('scroll', this[scrollHandler]);
    this.workspace.removeEventListener('zoomchange', this[scrollHandler]);
    if (this[mutationObserver]) {
      this[mutationObserver]!.disconnect();
      this[mutationObserver] = undefined;
    }
    const nodes = this.workspace.shadowRoot!.querySelectorAll('.debug-viz-positioning');
    nodes.forEach((node) => {
      node.parentNode!.removeChild(node);
    });
    this[positionedElements] = new WeakMap();
  }

  /**
   * Observe items change in the element's light DOM
   * @return The observer handler
   */
  [observeItems](): MutationObserver {
    const config = { attributes: true, childList: true, subtree: true, };
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
      if (mutation.type === 'childList') {
        this[processAddedNodes](mutation.addedNodes);
        this[processRemovedNodes](mutation.removedNodes);
      } else if (mutation.type === 'attributes') {
        const { target } = mutation;
        this[updateVisualizationItem](target);
      }
    }
  }

  /**
   * Processes added to the canvas elements.
   * @param nodes The list of added nodes
   */
  [processAddedNodes](nodes: NodeList): void {
    nodes.forEach((node) => this[updateVisualizationItem](node));
  }

  isVisualizedObject(element: Element): boolean {
    const { localName } = element;
    if (localName.startsWith('viz-')) {
      return true;
    }
    return element.hasAttribute('data-key');
  }

  /**
   * Processes removed from the canvas elements.
   * @param nodes The list of removed nodes
   */
  [processRemovedNodes](nodes: NodeList): void {
    nodes.forEach((node) => {
      if (node.nodeType !== Node.ELEMENT_NODE) {
        return;
      }
      const typed = node as HTMLElement;
      if (!this.isVisualizedObject(typed)) {
        return;
      }
      if (this[positionedElements].has(typed)) {
        const id = this[positionedElements].get(typed);
        this[positionedElements].delete(typed);
        const label = this.workspace.shadowRoot!.querySelector(`#${id}`) as HTMLDivElement;
        if (label) {
          label.parentNode!.removeChild(label);
        }
      }
      this[processRemovedNodes](typed.childNodes);
    });
  }

  [updateVisualizationItem](node: Node): void {
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return;
    }
    const typed = node as HTMLElement;
    const { localName } = typed;
    if (!this.isVisualizedObject(typed) || ignoredElements.includes(localName)) {
      return;
    }
    const rect = typed.getBoundingClientRect();
    const { width, height } = rect;
    if (!width || !height) {
      // don't need them
      return;
    }
    this[ensurePositioningInfoElement](typed);
    this[updatePositioningInfoElement](typed, rect);
  }

  /**
   * Ensures that element that is positioned relative to each visualized item exists.
   */
  [ensurePositioningInfoElement](targetElement: HTMLElement): void {
    if (!this[positionedElements].has(targetElement)) {
      const label = this[createPositioningInfoElement](targetElement);
      this.workspace.shadowRoot!.appendChild(label);
      this[positionedElements].set(targetElement, label.id);
    }
  }

  /**
   * Creates an element that is positioned relative to each visualized item.
   * @param {HTMLElement} targetElement 
   * @returns {HTMLDivElement}
   */
  [createPositioningInfoElement](targetElement: HTMLElement): HTMLDivElement {
    const label = document.createElement('div');
    label.style.position = 'absolute';
    label.style.backgroundColor = 'rgb(253 216 53 / 54%)';
    label.style.padding = '4px 8px';
    label.style.pointerEvents = 'none';
    label.id = `debug-position${elementIndex++}`;
    label.classList.add('debug-viz-positioning');
    label.dataset.target = targetElement.getAttribute('data-key')!;
    return label;
  }

  /**
   * Updates the position of the visualized element position label
   * @param {HTMLElement} targetElement 
   * @param {DOMRect} rect 
   */
  [updatePositioningInfoElement](targetElement: HTMLElement, rect: DOMRect): void {
    const { x, y } = rect;
    const rPos = getRelativeClickPoint(x, y, this.workspace);
    const pos = getWorkspaceClick(x, y, this.workspace);
    const sizedRect = getObjectBoundingClientRect(targetElement, this.workspace);

    const id = this[positionedElements].get(targetElement);
    const label = this.workspace.shadowRoot!.querySelector(`#${id}`) as HTMLDivElement;
    label.style.left = `${pos.x + 8}px`;
    label.style.top = `${pos.y + rect.height}px`;
    const position = `(x,y) ${Math.round(rPos.x)} x ${Math.round(rPos.y)}`;
    const realSize = `(w,h) ${Math.round(sizedRect.width)} x ${Math.round(sizedRect.height)}`;
    const scaledSize = `(sw,sh) ${Math.round(rect.width)} x ${Math.round(rect.height)}`;
    label.innerText = `${position}\n${realSize}\n${scaledSize}`;
  }

  [scrollTimeout]?: any;

  /**
   * Updates the labels on each visualized item after the workspace scroll
   */
  [scrollHandler](): void {
    if (this[scrollTimeout]) {
      clearTimeout(this[scrollTimeout]);
    }
    this[scrollTimeout] = setTimeout(() => {
      this[scrollTimeout] = undefined;
      this[onScroll]();
    }, 1);
  }

  /**
   * Updates the labels on each visualized item after the workspace scroll
   */
  [onScroll](): void {
    const nodes = Array.from(this.workspace.shadowRoot!.querySelectorAll('.debug-viz-positioning')) as HTMLDivElement[];
    nodes.forEach((node) => {
      const { target } = node.dataset;
      const item = this.workspace.querySelector(`[data-key="${target}"]`);
      if (item) {
        this[updateVisualizationItem](item);
      }
    });
  }
}
