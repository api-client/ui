/* eslint-disable no-continue */
import { ContextMenu } from '@api-client/context-menu';
import commands from './HttpProjectCommands.js';

export class HttpProjectContextMenu extends ContextMenu {
  constructor() {
    super(document.body);
    this.registerCommands(commands);
  }

  /**
   * Finds the click target which can be one of the model objects
   * or SVG elements.
   */
  findTarget(e: PointerEvent): HTMLElement|SVGElement|undefined {
    const element = e.target as HTMLElement;
    if (element.localName === 'project-navigation') {
      return this.readNavigationElement(e, element);
    }
    return element;
  }

  readNavigationElement(e: Event, element: HTMLElement): HTMLElement|SVGElement|undefined {
    const path = e.composedPath();
    while (path.length) {
      const target = path.shift() as Node;
      if (target.nodeType !== Node.ELEMENT_NODE) {
        continue;
      }
      const elm = target as HTMLElement;
      if (elm.matches('li.project-tree-item')) {
        return elm;
      }
      // top most for the navigation
      if (elm.localName === 'project-navigation') {
        return elm;
      }
    }
    if (element === this.workspace) {
      return element;
    }
    return undefined;
  }
}
