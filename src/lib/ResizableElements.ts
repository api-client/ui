/* eslint-disable max-classes-per-file */
/* eslint-disable no-inner-declarations */
/* eslint-disable no-param-reassign */

export declare type ResizableElementMode = 'north' | 'east' | 'south' | 'north';

export interface ResizeEventDetail {
  /**
   * The resize direction
   */
  direction: string;
  /**
   * The width set on the element
   */
  width?: number;
  /**
   * The height set on the element
   */
  height?: number;
}

interface ResizedInfo {
  /**
   * The element that is being resized
   */
  resize: HTMLElement;
  /**
   * The active area drag element.
   */
  drag: HTMLDivElement;
  /**
   * The initial resize element rectangle sizing
   */
  rect: DOMRect;
}


declare global {
  interface HTMLElement {
    resize: ResizableElementMode;
  }

  interface HTMLAttributes {
    resize: DOMTokenList;
  }

  interface HTMLElementEventMap {
    /**
     * The event dispatched when the user resized the element in one of the directions defined 
     * in the `resize` attribute, but before the new styles has been applied to the element.
     * 
     * You can cancel the event to prohibit changing the layout.
     * 
     * This event can be canceled but it doesn't bubble.
     */
    beforeresize: CustomEvent<Readonly<ResizeEventDetail>>;
    /**
     * The event dispatched after the element has been resized by the user in one of the directions defined 
     * in the `resize` attribute. The new width or height has been applied to the element.
     * 
     * This event does not bubble or can be canceled.
     */
    resized: CustomEvent<Readonly<ResizeEventDetail>>;
  }
}

interface ResizeConfigItem {
  resize: ResizableElementMode;
  resizeList: string[];
  originalPosition?: string;
  mousedownHandler?: (this: HTMLElement, ev: MouseEvent) => any;
}

if (!('resize' in document.createElement('div'))) {
  const configMap = new WeakMap<HTMLElement, ResizeConfigItem>();
  /** 
   * The `width` or `height` of the activation area on the 
   * active resize corner.
   */
  const activeAreaSize: number = 8;
  /** 
   * Since only one `resize` action can be performed per document
   * this is a global flag indicating that a resize is triggered.
   */
  let resizing = false;

  let resizeInfo: ResizedInfo | undefined;

  /**
   * Resets the originally set `position` CSS value on the element.
   */
  function resetPosition(elm: HTMLElement, info: ResizeConfigItem): void {
    const { originalPosition } = info;
    if (originalPosition) {
      elm.style.position = originalPosition;
    }
  }

  /**
   * Sets the relative position on the element, when required.
   */
  function setPosition(elm: HTMLElement, info: ResizeConfigItem): void {
    const originalPosition = elm.style.position;
    info.originalPosition = originalPosition;
    elm.style.position = 'relative';
  }

  /**
   * Removes any existing event listeners added to the element related to the resize.
   */
  function cleanupResize(elm: HTMLElement, info: ResizeConfigItem): void {
    resetPosition(elm, info);
    if (info.mousedownHandler) {
      elm.removeEventListener('mousedown', info.mousedownHandler);
      info.mousedownHandler = undefined;
    }
    if (elm.shadowRoot) {
      const activeRegions = Array.from(elm.shadowRoot.querySelectorAll('[data-resize-region]'));
      activeRegions.forEach((node) => node.parentNode!.removeChild(node));
    }
  }

  function activeRegionMouseDownHandler(e: MouseEvent): void {
    resizing = true;
    e.preventDefault();
    const node = e.target as HTMLDivElement;
    const src = node.offsetParent as HTMLElement;
    resizeInfo = {
      resize: src,
      drag: node,
      rect: src.getClientRects()[0],
    };
  }

  /**
   * Adds the `shadowRoot` to the element, when missing.
   * The activation regions are added to the shadow root of the 
   * element.
   */
  function applyShadowRoot(elm: HTMLElement): void {
    if (!elm.shadowRoot) {
      const root = elm.attachShadow({ mode: 'open' });
      root.innerHTML = `<slot></slot>`;
    }
  }

  /**
   * @return The East or West drag region with common properties.
   */
  function createWestEstRegion(): HTMLDivElement {
    const region = document.createElement('div');
    region.style.width = `${activeAreaSize}px`;
    region.style.top = '0px';
    region.style.bottom = '0px';
    region.style.position = 'absolute';
    return region;
  }

  /**
   * Adds the mousedown event listener to the region, adds it into
   * the shadow DOM, and updates the info object.
   */
  function activateRegion(elm: HTMLElement, info: ResizeConfigItem, region: HTMLDivElement): void {
    region.addEventListener('mousedown', activeRegionMouseDownHandler);
    info.mousedownHandler = activeRegionMouseDownHandler;
    if (customElements.get(elm.localName)) {
      // custom elements can have its own logic related to the local DOM rendering.
      // To be on the safe side (??) lets put the region in a timeout so the local DOM 
      // is expected to be rendered
      setTimeout(() => {
        elm.shadowRoot!.append(region);
      });
    } else {
      elm.shadowRoot!.append(region);
    }
  }

  /**
   * Adds the East activation region.
   */
  function addEastRegion(elm: HTMLElement, info: ResizeConfigItem): void {
    applyShadowRoot(elm);
    const region = createWestEstRegion();
    region.style.right = `-${activeAreaSize / 2}px`;
    region.style.cursor = 'e-resize';
    region.dataset.resizeRegion = 'east';
    activateRegion(elm, info, region);
  }

  /**
   * Adds the West activation region.
   */
  function addWestRegion(elm: HTMLElement, info: ResizeConfigItem): void {
    applyShadowRoot(elm);
    const region = createWestEstRegion();
    region.style.left = `-${activeAreaSize / 2}px`;
    region.style.cursor = 'w-resize';
    region.dataset.resizeRegion = 'west';
    activateRegion(elm, info, region);
  }

  /**
   * @returns The North or South drag region with common properties.
   */
  function createNorthSouthRegion(): HTMLDivElement {
    const region = document.createElement('div');
    region.style.height = `${activeAreaSize}px`;
    region.style.right = '0px';
    region.style.left = '0px';
    region.style.position = 'absolute';
    return region;
  }

  /**
   * Adds the North activation region.
   */
  function addNorthRegion(elm: HTMLElement, info: ResizeConfigItem): void {
    applyShadowRoot(elm);
    const region = createNorthSouthRegion();
    region.style.top = `-${activeAreaSize / 2}px`;
    region.style.cursor = 'n-resize';
    region.dataset.resizeRegion = 'north';
    activateRegion(elm, info, region);
  }

  /**
   * Adds the South activation region.
   */
  function addSouthRegion(elm: HTMLElement, info: ResizeConfigItem): void {
    applyShadowRoot(elm);
    const region = createNorthSouthRegion();
    region.style.bottom = `-${activeAreaSize / 2}px`;
    region.style.cursor = 's-resize';
    region.dataset.resizeRegion = 'south';
    activateRegion(elm, info, region);
  }

  function updateResize(elm: HTMLElement): void {
    const info = configMap.get(elm)!;
    cleanupResize(elm, info);
    const { resizeList } = info;
    if (!Array.isArray(resizeList) || !resizeList.length) {
      return;
    }
    setPosition(elm, info);
    if (resizeList.includes('east')) {
      addEastRegion(elm, info);
    }
    if (resizeList.includes('west')) {
      addWestRegion(elm, info);
    }
    if (resizeList.includes('north')) {
      addNorthRegion(elm, info);
    }
    if (resizeList.includes('south')) {
      addSouthRegion(elm, info);
    }
  }

  /**
   * Dispatches the beforeresize event on the target element.
   * 
   * @returns Whether the event was cancelled.
   */
  function notifyBeforeResize(opts: ResizeEventDetail): boolean {
    const e = new CustomEvent('beforeresize', {
      cancelable: true,
      detail: Object.freeze(opts),
    });
    resizeInfo!.resize.dispatchEvent(e);
    return e.defaultPrevented;
  }

  /**
   * Dispatches the resize event on the target element.
   * 
   * @returns Whether the event was cancelled.
   */
  function notifyResize(opts: ResizeEventDetail): void {
    const e = new CustomEvent('resized', {
      cancelable: true,
      detail: Object.freeze(opts),
    });
    resizeInfo!.resize.dispatchEvent(e);
  }

  /**
   * Resizes the resize element on the West side
   */
  function resizeWest(pageX: number): void {
    const { left, width } = resizeInfo!.rect;
    const dx = pageX - left;
    const newWidth = width - dx;
    const info: ResizeEventDetail = { width: newWidth, direction: 'west' };
    if (!notifyBeforeResize(info)) {
      resizeInfo!.resize.style.width = `${newWidth}px`;
      notifyResize(info);
      // resizeInfo!.resize.style.width = `${width}px`;
    }
  }

  /**
   * Resizes the resize element on the East side
   */
  function resizeEast(pageX: number): void {
    const { right, width } = resizeInfo!.rect;
    const dx = right - pageX;
    const newWidth = width - dx;
    const info: ResizeEventDetail = { width: newWidth, direction: 'east' };
    if (!notifyBeforeResize(info)) {
      resizeInfo!.resize.style.width = `${newWidth}px`;
      notifyResize(info);
      // resizeInfo!.resize.style.width = `${width}px`;
    }
  }

  /**
   * Resizes the resize element on the North side
   */
  function resizeNorth(pageY: number): void {
    const { top, height } = resizeInfo!.rect;
    const dx = pageY - top;
    const newHeight = height - dx;
    const info: ResizeEventDetail = { height: newHeight, direction: 'north' };
    if (!notifyBeforeResize(info)) {
      resizeInfo!.resize.style.height = `${newHeight}px`;
      notifyResize(info);
      // resizeInfo!.resize.style.height = `${height}px`;
    }
  }

  /**
   * Resizes the resize element on the North side
   */
  function resizeSouth(pageY: number): void {
    const { bottom, height } = resizeInfo!.rect;
    const dx = bottom - pageY;
    const newHeight = height - dx;
    const info: ResizeEventDetail = { height: newHeight, direction: 'south' };
    if (!notifyBeforeResize(info)) {
      resizeInfo!.resize.style.height = `${newHeight}px`;
      notifyResize(info);
      // resizeInfo!.resize.style.height = `${height}px`;
    }
  }

  function moveTarget(e: MouseEvent): void {
    const { pageX, pageY } = e;
    const { resizeRegion } = resizeInfo!.drag.dataset;
    switch (resizeRegion) {
      case 'west': resizeWest(pageX); break;
      case 'east': resizeEast(pageX); break;
      case 'north': resizeNorth(pageY); break;
      case 'south': resizeSouth(pageY); break;
      default: // ...
    }
  }

  // 1. add support for the `resize` attribute that is translated to a property.
  // 2. when the property change run the logic that supports the resize of the element depending on the values.

  // 
  // Configuring the mutation observer
  // 

  /**
   * Updates HTMLElement's `resize` property from it's current `resize` attribute value.
   */
  function updateHtmlElementResize(node: Element): void {
    if (!node.hasAttribute('resize')) {
      return;
    }
    const value = node.getAttribute('resize') as ResizableElementMode;
    (node as HTMLElement).resize = value;
  }

  const traverseAllNodes = (parent: Node, out: Element[] = []): Element[] => {
    if (parent.nodeType !== Node.ELEMENT_NODE) {
      return out;
    }
    const typed = parent as Element;
    out.push(typed);
    Array.from(typed.children).forEach((current) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      traverseAllNodes(current, out);
    });
    if (typed.shadowRoot) {
      typed.querySelectorAll('*').forEach((current) => {
        if (current.nodeType !== Node.ELEMENT_NODE) {
          return;
        }
        traverseAllNodes(current, out);
      });
    }
    return out;
  };

  const mutationConfig: MutationObserverInit = {
    attributes: true,
    childList: true,
    subtree: true,
    attributeFilter: ['resize'],
    // attributeOldValue: true, // to unregister previous listeners? Probably gonna keep a reference to this.
  };
  const mutationCallback = (mutationsList: MutationRecord[]): void => {
    for (const mutation of mutationsList) {
      if (mutation.type === 'attributes') {
        const node = mutation.target as HTMLElement;
        updateHtmlElementResize(node);
      } else if (mutation.type === 'childList') {
        const node = mutation.target as HTMLElement;
        const nodes = traverseAllNodes(node);
        // const resizables = Array.from(node.querySelectorAll('[resize]')) as HTMLElement[];
        nodes.forEach((item) => updateHtmlElementResize(item));
      }
    }
  };
  const mutationObserver = new MutationObserver(mutationCallback);
  mutationObserver.observe(document.body, mutationConfig);

  Object.defineProperty(HTMLElement.prototype, 'resize', {
    get(): ResizableElementMode | undefined {
      const item = configMap.get(this)!;
      if (item) {
        return item.resize;
      }
      return undefined;
    },
    set(newValue: ResizableElementMode | undefined) {
      if (!configMap.has(this)) {
        // @ts-ignore
        configMap.set(this, { resize: '', resizeList: [] });
      }
      const item = configMap.get(this)!;
      if (item.resize === newValue) {
        // do not set a new value when it's already set.
        return;
      }
      item.resize = newValue!;
      let listValue;
      if (typeof newValue === 'string') {
        listValue = newValue.split(' ').map((part) => part.trim().toLowerCase());
      }
      item.resizeList = listValue || [];
      updateResize(this);
    },
    enumerable: true,
    configurable: true,
  });

  // 
  // Processing already existing nodes
  // @todo: how to handle existing shadow DOM elements?
  // 

  const resizables = Array.from(document.body.querySelectorAll('[resize]')) as HTMLElement[];
  resizables.forEach((node) => updateHtmlElementResize(node));

  // 
  // Registers global mousemove and mouseup event listeners 
  // to handle the resize. These listeners are inactive while
  // the `resizing` flag is not set.
  // 

  function mousemoveHandler(e: MouseEvent): void {
    if (!resizing) {
      return;
    }
    moveTarget(e);
  }

  function mouseupHandler(e: MouseEvent): void {
    if (!resizing) {
      return;
    }
    resizing = false;
    resizeInfo = undefined;
    e.preventDefault();
  }

  document.body.addEventListener('mousemove', mousemoveHandler);
  document.body.addEventListener('mouseup', mouseupHandler);
}
