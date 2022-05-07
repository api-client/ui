/* eslint-disable class-methods-use-this */
import VizWorkspaceElement from "../elements/VizWorkspaceElement.js";
import { ISelectedDomain } from "./types.js";

export const clickHandler = Symbol('clickHandler');
export const observeItems = Symbol('observeItems');
export const mutationHandler = Symbol('mutationHandler');
export const mutationObserver = Symbol('mutationObserver');
export const processAddedNodes = Symbol('processAddedNodes');
export const processRemovedNodes = Symbol('processRemovedNodes');
export const processAttributeChanged = Symbol('processAttributeChanged');
export const propagateSelection = Symbol('propagateSelection');
export const selectAssociations = Symbol('selectAssociation');
export const selectReverseAssociations = Symbol('selectReverseAssociations');
export const propagateDeselection = Symbol('propagateDeselection');
export const deselectAssociations = Symbol('deselectAssociations');
export const deselectReverseAssociations = Symbol('deselectReverseAssociations');
export const notifyChanged = Symbol('notifyChanged');
export const selectedItemsValue = Symbol('selectedItemsValue');
export const selectedIdsValue = Symbol('selectedIdsValue');

/**
 * A class that takes care of selection in the visualization workspace.
 */
export class SelectionManager {
  /** 
   * The list of currently selected elements
   */
  [selectedItemsValue] = new Set<Element>();

  /** 
   * The list of currently selected domain ids
   */
  [selectedIdsValue]: ISelectedDomain[] = [];

  [mutationObserver]?: MutationObserver;

  /**
   * @returns A set of currently selected items.
   */
  get selectedItems(): Set<Element> {
    return this[selectedItemsValue];
  }

  /**
   * @returns A list of currently selected domain ids.
   */
  get selected(): ISelectedDomain[] {
    return this[selectedIdsValue];
  }

  /**
   * @returns A list of all selectable items
   */
  get selectable(): Element[] {
    const nodes = this.target.querySelectorAll('[data-selectable]');
    return Array.from(nodes) as Element[];
  }

  constructor(public target: VizWorkspaceElement) {
    this[clickHandler] = this[clickHandler].bind(this);
    this[mutationHandler] = this[mutationHandler].bind(this);
  }

  /**
   * Initializes the library. Should be called when the workspace is ready to render content.
   */
  connect(): void {
    this.target.addEventListener('click', this[clickHandler] as EventListener);
    this[mutationObserver] = this[observeItems]();
  }

  /**
   * Cleans up and removes listeners
   */
  disconnect(): void {
    const mo = this[mutationObserver];
    if (mo) {
      mo.disconnect();
      this[mutationObserver] = undefined;
    }
    this.target.removeEventListener('click', this[clickHandler] as EventListener);
  }

  /**
   * Checks if given element is marked as selectable target
   * @param selectable The element to test for `selectable` or `data-selectable` attribute
   * @returns True if the element can be selected
   */
  isSelectable(selectable: Element): boolean {
    return selectable.hasAttribute('data-selectable');
  }

  /**
   * Checks if given element is marked as selected
   * @param selectable The element to test for `selected` or `data-selected` attribute
   * @returns True if the element is marked as selected
   */
  isSelected(selectable: Element): boolean {
    return selectable.hasAttribute('data-selected');
  }

  /**
   * Marks an element as selected
   * @param selectable The element to add the selected mark to.
   */
  setSelected(selectable: Element): void {
    selectable.setAttribute('data-selected', '');
  }

  /**
   * Marks an element as not selected
   * @param selectable The element to remove the selected mark from.
   */
  setUnselected(selectable: Element): void {
    selectable.removeAttribute('data-selected');
  }

  /**
   * Deselects all currently selected items.
   */
  selectAll(): void {
    this.selectable.forEach((node) => {
      if (!this.isSelected(node)) {
        this.setSelected(node);
      }
    });
  }

  /**
   * Deselects all currently selected items.
   */
  deselectAll(): void {
    this.selectable.forEach((node) => {
      if (this.isSelected(node)) {
        this.setUnselected(node);
      }
    });
    const ids = [...this[selectedIdsValue]];
    ids.forEach((info) => {
      const elm = this.getDomainTarget(info.id);
      if (!elm) {
        const index = this[selectedIdsValue].indexOf(info);
        this[selectedIdsValue].splice(index, 1);
      } else if (this.isSelected(elm)) {
        this.setUnselected(elm);
      }
    });
  }

  /**
   * Selects objects that are selectable by their `key`.
   * 
   * The `addToSelection` argument is equivalent of calling `deselectAll()` and then `select(...)`.
   * 
   * @param keys The list of domain ids of objects to select. 
   * @param addToSelection If true it adds to the current selection rather than replacing it.
   */
  select(keys: string[], addToSelection: boolean=false): void {
    if (!addToSelection) {
      this.deselectAll();
    }
    keys.forEach((id) => {
      const node = this.getSelectableDomainTarget(id);
      if (!node) {
        return;
      }
      if (this.isSelectable(node) && !this.isSelected(node)) {
        this.setSelected(node);
      }
    });
  }

  /**
   * Removes objects from selection.
   * 
   * @param keys The list of domain ids of objects to deselect. 
   */
  deselect(keys: string[]): void {
    keys.forEach((id) => {
      const node = this.getSelectableDomainTarget(id);
      if (!node) {
        return;
      }
      if (this.isSelectable(node) && this.isSelected(node)) {
        this.setUnselected(node);
      }
    });
  }

  /**
   * Synchronizes the selection state with the view
   */
  syncView(): void {
    const nodes = this.target.querySelectorAll(`[data-selectable][data-selected]`);
    if (this[selectedItemsValue].size !== nodes.length) {
      // eslint-disable-next-line no-console
      console.log('invalid selection', this[selectedItemsValue], nodes);
    }
  }

  /**
   * Reads the attribute value to get the `key` property.
   * @param selectable 
   * @returns The domain id of the object or `null` when not found
   */
  readKey(selectable: Element): string | null {
    if (selectable.hasAttribute('data-key')) {
      return selectable.getAttribute('data-key');
    }
    return null;
  }

  /**
   * Finds a workspace element that has the domain id.
   * @param id Target domain id
   */
  getDomainTarget(id: string): Element | null {
    return this.target.querySelector(`[data-key="${id}"]`);
  }

  /**
   * Finds a workspace element that has the domain id and is selectable.
   * @param id Target domain id
   */
  getSelectableDomainTarget(id: string): Element|null {
    const node = this.target.querySelector(`[data-key="${id}"][data-selectable]`);
    return node;
  }

  // PRIVATE APIS

  [clickHandler](e: PointerEvent): void {
    const path = e.composedPath();
    const svg = this.target.associationSvg;
    if (path[0] !== svg && path.includes(svg)) {
      // Selection of the edges is managed by the workspace edges manager.
      return;
    }
    let selectableTarget;
    while (path.length > 0) {
      const tmp = path.shift() as Node;
      if (tmp.nodeType !== Node.ELEMENT_NODE) {
        continue;
      }
      const typed = tmp as Element;
      if (this.isSelectable(typed)) {
        selectableTarget = typed;
        break
      }
    }
    if (!selectableTarget) {
      this.deselectAll();
      return;
    }
    const isSelected = this.isSelected(selectableTarget);
    // note: if toggle mode is required then this should toggle the attribute
    if (isSelected) {
      if (e.shiftKey) {
        this.setUnselected(selectableTarget);
      }
      return;
    }
    if (!e.shiftKey) {
      this.deselectAll();
    }
    this.setSelected(selectableTarget);
  }

  /**
   * Observe items change in the element's light DOM
   * @returns The observer handler
   */
  [observeItems](): MutationObserver {
    const config = { attributes: true, childList: true, subtree: true, };
    const observer = new MutationObserver(this[mutationHandler]);
    observer.observe(this.target, config);
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
        const { attributeName, target } = mutation;
        this[processAttributeChanged](target as Element, attributeName!);
      }
    }
    requestAnimationFrame(() => this.syncView());
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
      const typed = node as Element;
      const children = typed.querySelectorAll('*');
      this[processAddedNodes](children);
      if (!this.isSelectable(typed)) {
        return;
      }
      if (this.isSelected(typed)) {
        this[propagateSelection](typed);
      }
    });
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
      const typed = node as Element;
      const children = typed.querySelectorAll('*');
      this[processRemovedNodes](children);
      // An item might not be selectable but it may have a secondary selection 
      // through association.
      // if (!this.isSelectable(typed)) {
      //   return;
      // }
      if (this.isSelected(typed)) {
        this[propagateDeselection](typed);
      }
    });
  }

  /**
   * Processes changed attribute on any element in the canvas
   * @param node Changed element
   * @param prop Changed property
   */
  [processAttributeChanged](node: Element, prop: string): void {
    if (!['data-selected'].includes(prop)) {
      return;
    }
    if (node.hasAttribute(prop)) {
      this[propagateSelection](node);
    } else {
      this[propagateDeselection](node);
    }
  }

  /**
   * Sets selection to the elements that are related to the `selectable` element.
   * 
   * A related element is an element that is an association target to the `selectable`
   * ot the `selectable` has `parent` attribute.
   * 
   * The related are not added to the `selectedItems` set and does not have `selected` attribute.
   * They are marked with `second-selected` attribute.
   */
  [propagateSelection](selectable: Element): void {
    if (this.selectedItems.has(selectable)) {
      return;
    }
    this.selectedItems.add(selectable);
    const id = this.readKey(selectable);
    if (!id) {
      this[notifyChanged]();
      return;
    }
    const selected = this[selectedIdsValue];
    const index = selected.findIndex((item) => item.id === id);
    if (index === -1) {
      selected.push({
        id,
        name: selectable.localName,
        node: selectable,
      });
    }
    this[selectAssociations](selectable);
    this[selectReverseAssociations](selectable);
    this[notifyChanged]();
  }

  /**
   * Marks `viz-association` and referenced targets of the `selectable` as a secondary selection.
   */
  [selectAssociations](selectable: Element): void {
    const nodes = selectable.querySelectorAll('viz-association');
    if (!nodes.length) {
      return;
    }
    Array.from(nodes).forEach((node) => {
      const target = node.getAttribute('data-target');
      if (!target) {
        return;
      }
      node.setAttribute('secondary-selected', '');
      const targetElement = this.getDomainTarget(target);
      if (targetElement) {
        targetElement.setAttribute('secondary-selected', '');
      }
    });
  }

  /**
   * Similar to `[selectAssociations]()` but it selects associations where  
   * the `selectable` is the target.
   */
  [selectReverseAssociations](selectable: Element): void {
    const id = this.readKey(selectable);
    if (!id) {
      return;
    }
    const nodes = this.target.querySelectorAll(`viz-association[data-target="${id}"]`);
    if (!nodes.length) {
      return;
    }
    Array.from(nodes).forEach((node) => {
      const target = node.getAttribute('data-target');
      if (!target) {
        return;
      }
      node.setAttribute('secondary-selected', '');
      const targetElement = node.parentElement;
      if (targetElement) {
        targetElement.setAttribute('secondary-selected', '');
      }
    });
  }

  /**
   * Removes secondary selection from the elements that are related to the `selectable` element.
   * 
   * A related element is an element that is an association target to the `selectable`
   * ot the `selectable` has `parent` attribute.
   */
  [propagateDeselection](selectable: Element): void {
    if (!this.selectedItems.has(selectable)) {
      return;
    }
    this.selectedItems.delete(selectable);
    const id = this.readKey(selectable);
    if (!id) {
      this[notifyChanged]();
      return;
    }
    const selected = this[selectedIdsValue];
    const index = selected.findIndex((item) => item.id === id);
    if (index !== -1) {
      this[selectedIdsValue].splice(index, 1);
    }
    this[deselectAssociations](selectable);
    this[deselectReverseAssociations](selectable);
    this[notifyChanged]();
  }

  /**
   * Removes secondary selection mark from `viz-association`
   */
  [deselectAssociations](selectable: Element): void {
    const nodes = selectable.querySelectorAll('viz-association');
    if (!nodes.length) {
      return;
    }
    Array.from(nodes).forEach((node) => {
      const target = node.getAttribute('data-target');
      if (!target) {
        return;
      }
      node.removeAttribute('secondary-selected');
      const targetElement = this.getDomainTarget(target);
      if (targetElement) {
        targetElement.removeAttribute('secondary-selected');
      }
    });
  }

  /**
   * Similar to `[selectAssociation]()` but it selects associations where  
   * the `selectable` is the target.
   */
  [deselectReverseAssociations](selectable: Element): void {
    const id = this.readKey(selectable);
    if (!id) {
      return;
    }
    const nodes = this.target.querySelectorAll(`viz-association[data-target="${id}"]`);
    if (!nodes.length) {
      return;
    }
    Array.from(nodes).forEach((node) => {
      const target = node.getAttribute('data-target');
      if (!target) {
        return;
      }
      node.removeAttribute('secondary-selected');
      const targetElement = node.parentElement;
      if (targetElement) {
        targetElement.removeAttribute('secondary-selected');
      }
    });
  }

  [notifyChanged](): void {
    this.target.dispatchEvent(new Event('selectedchange'));
  }
}
