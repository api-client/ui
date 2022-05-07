/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable class-methods-use-this */
/* eslint-disable prefer-destructuring */
/* eslint-disable no-param-reassign */
import { getObjectBoundingClientRect, findDirection } from './PositionUtils.js';
import { closestAnchors, anchorToPoint } from './AnchorUtils.js';
import { LineSketch } from './LineSketch.js';
import { TipSketch } from './TipSketch.js';
import { LabelSketch } from './LabelSketch.js';
import { anchorPadding, findClosestAnchors } from './AnchorFinder.js';
import { ICalculateEdgeOptions, IEdgeDirections, IWorkspaceEdge } from './types.js';
import VizWorkspaceElement from '../elements/VizWorkspaceElement.js';
import VizAssociationElement from '../elements/VizAssociationElement.js';
import { IAssociationShape, IAssociationSlots, IAssociationVertexes, ILineTips, IVisualizationAssociationShape, IVisualizationRectilinearLineShape } from './VisualizationTypes.js';
import { Point } from './Point.js';

const DefaultLineType = 'rectilinear';

export const observeItems = Symbol('observeItems');
export const clickHandler = Symbol('clickHandler');
export const mouseOverHandler = Symbol('mouseOverHandler');
export const mouseOutHandler = Symbol('mouseOutHandler');
export const mutationHandler = Symbol('mutationHandler');
export const mutationObserver = Symbol('mutationObserver');
export const processAddedNodes = Symbol('processAddedNodes');
export const processRemovedNodes = Symbol('processRemovedNodes');
export const processAttributeChanged = Symbol('processAttributeChanged');
export const connectedValue = Symbol('connectedValue');
export const processAddedAssociation = Symbol('processAddedAssociation');
export const processRemovedAssociation = Symbol('processRemovedAssociation');
export const processAddedNode = Symbol('processAddedNode');
export const processRemovedNode = Symbol('processRemovedNode');
export const edgesValue = Symbol('edgesValue');
export const associationClickHandler = Symbol('associationClickHandler');
export const deselectAllEdges = Symbol('deselectAllEdges');
export const calculateEdge = Symbol('calculateEdge');
export const processQueue = Symbol('processQueue');
export const processQueueDebouncer = Symbol('processQueueDebouncer');
export const updateAssociationById = Symbol('updateAssociationById');
export const calculateNearestPoints = Symbol('calculateNearestPoints');
export const readEventTarget = Symbol('readEventTarget');

/**
 * A class that manages drawing edges between the nodes in the workspace visualization.
 * 
 * This class looks for the `viz-association` elements inside other elements
 * and when the association has a valid (existing) target then it creates an internal model for the edge 
 * visualization and sets it on the workspace to be rendered.
 * 
 * This class also manages selection state of the edge.
 */
export class WorkspaceEdges {
  [connectedValue]: boolean = false;

  /**
   * @returns True when the plug-in is listening for the input events.
   */
  get connected(): boolean {
    return this[connectedValue];
  }

  [edgesValue]: Map<string, IWorkspaceEdge> = new Map<string, IWorkspaceEdge>();

  /**
   * @returns The edges to be visualized in the workspace.
   */
  get edges(): Map<string, IWorkspaceEdge> {
    return this[edgesValue];
  }

  /** 
   * When an association is changed in the DOM it is held in this array to process them asynchronously
   * in the future, when the workspace is updated.
   */
  [processQueue]: VizAssociationElement[] = [];

  /** 
   * The processor used to draw lines
   */
  lineProcessor = new LineSketch();

  /** 
   * The processor used to draw tips on the line
   */
  tipProcessor = new TipSketch();

  [mutationObserver]?: MutationObserver;

  constructor(public workspace: VizWorkspaceElement) {
    this[mutationHandler] = this[mutationHandler].bind(this);
    this[clickHandler] = this[clickHandler].bind(this);
    this[mouseOverHandler] = this[mouseOverHandler].bind(this);
    this[mouseOutHandler] = this[mouseOutHandler].bind(this);
  }

  /**
   * Starts listening on user events
   */
  connect(): void {
    this[mutationObserver] = this[observeItems]();
    this[connectedValue] = true;
    if (this.workspace.associationSvg) {
      this.listenContent();
    }
    this.associateCurrent();
  }

  /**
   * Creates associations for the current state of the canvas.
   */
  associateCurrent(): void {
    const nodes = Array.from(this.workspace.querySelectorAll('viz-association')) as VizAssociationElement[];
    nodes.forEach((assoc) => this[processAddedAssociation](assoc));
  }

  /**
   * Initializes events when the workspace DOM is rendered.
   */
  listenContent(): void {
    this.workspace.associationSvg.addEventListener('click', this[clickHandler] as EventListener);
    this.workspace.associationSvg.addEventListener('mouseover', this[mouseOverHandler]);
    this.workspace.associationSvg.addEventListener('mouseout', this[mouseOutHandler]);
  }

  /**
   * Cleans up the listeners
   */
  disconnect(): void {
    if (this[mutationObserver]) {
      this[mutationObserver]!.disconnect();
      this[mutationObserver] = undefined;
    }
    this[connectedValue] = false;
    this.workspace.associationSvg.removeEventListener('click', this[clickHandler] as EventListener);
    this.workspace.associationSvg.removeEventListener('mouseover', this[mouseOverHandler]);
    this.workspace.associationSvg.removeEventListener('mouseout', this[mouseOutHandler]);
  }

  /**
   * Clear all edges from the workspace
   */
  clear(): void {
    this[edgesValue].clear();
    this.workspace.requestUpdate();
  }

  /**
   * Forces to re-calculate all existing edges.
   */
  async recalculate(): Promise<void> {
    const { edges, workspace } = this;
    edges.forEach((edge) => {
      const { id, source, target, shape } = edge;
      const { label } = shape;
      const item = this[updateAssociationById](source, target, id, label!.value);
      if (item) {
        edges.set(id, item);
      }
    });
    workspace.requestUpdate();
  }

  /**
   * Reads an edge definition by the association id.
   */
  get(key: string): IWorkspaceEdge | undefined {
    const { edges } = this;
    return edges.get(key);
  }

  /**
   * Removes an edge and notifies workspace to update. 
   */
  removeEdge(id: string): void {
    if (this[edgesValue].has(id)) {
      this[edgesValue].delete(id);
      this.workspace.requestUpdate();
    }
  }

  /**
   * Updates associations (in and out) for an element identified by the `key` attribute.
   * The element must be one of the visualized elements in the workspace.
   * 
   * This is to be used when position and or size of an element that has associations change.
   * 
   * @param key The domain id of the visualized element that has changed.
   */
  async update(key: string): Promise<void> {
    const { edges, workspace } = this;
    const element = workspace.querySelector(`[data-key="${key}"]`);
    if (!element) {
      return;
    }
    edges.forEach((edge) => {
      const { source, target, id, shape } = edge;
      const { label } = shape;
      let change = false;
      if ([source, target].includes(key)) {
        change = true;
      }
      if (change) {
        const item = this[updateAssociationById](source, target, id, label!.value);
        if (item) {
          edges.set(id, item);
        }
      }
    });
    workspace.requestUpdate();
    await workspace.updateComplete;
  }

  /**
   * Computes workspace edge object for source and target.
   * 
   * @param source The domain id of the source element
   * @param target The domain id of the target element
   * @param id The domain id of the association
   * @param name The label rendered in the association
   */
  [updateAssociationById](source: string, target: string, id: string, name?: string): IWorkspaceEdge | null {
    const { workspace } = this;
    const sourceElement = workspace.querySelector(`[data-key="${source}"]`) as HTMLElement;
    if (!sourceElement) {
      return null;
    }
    const targetElement = workspace.querySelector(`[data-key="${target}"]`) as HTMLElement;
    if (!targetElement) {
      return null;
    }
    const opts: ICalculateEdgeOptions = {
      sourceElement, 
      targetElement, 
      id,
      name,
    };
    const assocElement = workspace.querySelector(`viz-association[data-key="${id}"]`) as VizAssociationElement | null;
    if (!assocElement) {
      return null;
    }
    const slots = this.readAssociationSlots(assocElement);
    if (slots.source) {
      opts.sourceSlot = slots.source;
    }
    if (slots.target) {
      opts.targetSlot = slots.target;
    }
    const others = this.findOtherAssociations(sourceElement, targetElement, assocElement.dataset.key as string);
    if (others.length) {
      opts.others = others;
    }
    return this[calculateEdge](opts) || null;
  }

  /**
   * Creates a internal data model for the edge drawn between an association source and the target.
   * @param assocElement The viz-association element reference
   * @param targetElement The target element reference.
   */
  buildAssociationEdge(assocElement: VizAssociationElement, targetElement: HTMLElement): void {
    const sourceElement = assocElement.parentElement as HTMLElement;
    if (!sourceElement || !sourceElement.dataset.key) {
      return;
    }
    const slots = this.readAssociationSlots(assocElement);
    const { title, dataset } = assocElement;
    const opts: ICalculateEdgeOptions ={
      sourceElement, 
      targetElement, 
      id: dataset.key as string, 
      name: title || '',
    };
    if (slots.source) {
      opts.sourceSlot = slots.source;
    }
    if (slots.target) {
      opts.targetSlot = slots.target;
    }
    const map = this[edgesValue];
    const others = this.findOtherAssociations(sourceElement, targetElement, dataset.key as string);
    if (others.length) {
      opts.others = others;
    }
    const item = this[calculateEdge](opts);
    if (item) {
      map.set(dataset.key as string, item);
    }
    this.workspace.requestUpdate();
  }

  /**
   */
  findOtherAssociations(sourceElement: HTMLElement, targetElement: HTMLElement, assocId: string): IWorkspaceEdge[] {
    const srcId = sourceElement.dataset.key as string;
    const trgId = targetElement.dataset.key as string;
    const sourceAssociations = Array.from(sourceElement.querySelectorAll('viz-association')) as HTMLElement[];
    const targetAssociations = Array.from(sourceElement.querySelectorAll('viz-association')) as HTMLElement[];
    const otherSourceAssociations = sourceAssociations.filter(i => i.dataset.target === trgId && i.dataset.key !== assocId);
    const otherTargetAssociations = targetAssociations.filter(i => i.dataset.target === srcId && i.dataset.key);
    const others: IWorkspaceEdge[] = [];
    const map = this[edgesValue];
    otherSourceAssociations.concat(otherTargetAssociations).forEach((item) => {
      const m = map.get(item.dataset.key as string);
      if (m) {
        others.push(m);
      }
    });
    return others;
  }

  /**
   * Reads the view model for an association and returns slot definitions for the association.
   * 
   * @param assocElement The viz-association element reference
   */
  readAssociationSlots(assocElement: VizAssociationElement): IAssociationSlots {
    const result: IAssociationSlots = {};
    Array.from(assocElement.querySelectorAll('modeling-view')).forEach((item) => {
      // if (item.name === 'sourceSlot') {
      //   result.source = item.value;
      // } else if (item.name === 'targetSlot') {
      //   result.target = item.value;
      // }
    });
    return result;
  }

  /**
   * Calculates the edge between two nodes.
   */
  [calculateNearestPoints](sourceElement: HTMLElement, targetElement: HTMLElement, others?: IWorkspaceEdge[]): Point[] | null {
    const { workspace } = this;
    if ((sourceElement.hasAttribute('associationSlots') || sourceElement.dataset.associationSlots) && (targetElement.hasAttribute('associationSlots') || targetElement.dataset.associationSlots)) {
      return closestAnchors(sourceElement, targetElement, workspace, others);
    }
    const sourceBox = getObjectBoundingClientRect(sourceElement, workspace);
    const targetBox = getObjectBoundingClientRect(targetElement, workspace);
    const anchors = findClosestAnchors(sourceBox, targetBox, anchorPadding);
    return anchors;
  }

  /**
   * Calculates the edge between two nodes.
   */
  [calculateEdge](options: ICalculateEdgeOptions): IWorkspaceEdge|undefined {
    const { sourceElement, targetElement, id, name='' } = options;
    const slotPoints = this.discoverAssociationVertexes(options);
    if (!slotPoints) {
      return undefined;
    }
    const sourceRect = getObjectBoundingClientRect(sourceElement, this.workspace);
    const targetRect = getObjectBoundingClientRect(targetElement, this.workspace);
    const sketch = this.lineProcessor.sketch({
      source: sourceRect,
      target: targetRect,
      startPoint: slotPoints.start!, 
      endPoint: slotPoints.end!,
      type: DefaultLineType,
      others: options.others,
    }) as IVisualizationRectilinearLineShape;
    if (!sketch) {
      return undefined;
    }
    const [sp] = sketch.coordinates!;
    const ep = sketch.coordinates![sketch.coordinates!.length - 1];
    const directions = findDirection(sp, ep, sourceRect, targetRect);

    const labelArtist = new LabelSketch();
    const label = labelArtist.sketch(sketch, name, directions) || undefined;
    const assocElement = this.workspace.querySelector(`viz-association[data-key="${id}"]`) as HTMLElement;
    const style = this.createAssociationStyles(assocElement);
    const tips = this.createAssociationTips(assocElement, sketch, directions);
    const positionChange = (sourceElement.hasAttribute('associationSlots') || !!sourceElement.dataset.associationSlots) && (targetElement.hasAttribute('associationSlots') || !!targetElement.dataset.associationSlots);
    
    const shape: IAssociationShape = {
      selection: {
        primary: false,
        secondary: false,
      },
      line: sketch,
      style,
      label,
      tips,
    };
    const srcId = sourceElement.dataset.key!;
    const trgId = targetElement.dataset.key!;
    const positionItem: IWorkspaceEdge = {
      id,
      source: srcId,
      target: trgId,
      positionChange,
      directions,
      shape,
    };
    if (options.sourceSlot || options.targetSlot) {
      shape.slots = {};
      if (options.sourceSlot) {
        shape.slots.source = options.sourceSlot;
      }
      if (options.targetSlot) {
        shape.slots.target = options.targetSlot;
      }
    }
    return positionItem;
  }

  discoverAssociationVertexes(options: ICalculateEdgeOptions): IAssociationVertexes|undefined {
    const slotPoints = (this.discoverSlotPoints(options) || {}) as IAssociationVertexes;
    if (!slotPoints.end || !slotPoints.start) {
      const closest = this[calculateNearestPoints](options.sourceElement, options.targetElement, options.others!);
      if (!closest) {
        return undefined;
      }
      if (!slotPoints.start) {
        slotPoints.start = closest[0];
      }
      if (!slotPoints.end) {
        slotPoints.end = closest[1];
      }
    }
    return slotPoints;
  }

  /**
   * When defined and correctly configured it returns position of the slots of the source and the target.
   */
  discoverSlotPoints(options: ICalculateEdgeOptions): IAssociationVertexes|undefined {
    const { sourceElement, targetElement, sourceSlot, targetSlot } = options;
    if (!sourceSlot && !targetSlot) {
      return undefined;
    }
    const result: IAssociationVertexes = {};
    if (sourceSlot) {
      const dom = sourceElement.shadowRoot ? sourceElement.shadowRoot : sourceElement;
      const obj = dom.querySelector(`[data-association-slot="${sourceSlot}"]`) as HTMLElement;
      if (obj) {
        result.start = anchorToPoint(obj, this.workspace);
      }
    }
    if (targetElement) {
      const dom = targetElement.shadowRoot ? targetElement.shadowRoot : targetElement;
      const obj = dom.querySelector(`[data-association-slot="${targetSlot}"]`) as HTMLElement;
      if (obj) {
        result.end = anchorToPoint(obj, this.workspace);
      }
    }
    return result;
  }

  /**
   * Creates edge's markers definition from the association element.
   * The association element can have the following attributes set:
   * - data-marker-end
   * - data-marker-start
   * With a value of a marker name defined in the visualization workspace.
   * 
   * @param assocElement The association element to read the values from.
   * @param lineShape The definition of the line that the marker is attached to
   * @param directions Computed line directions
   */
  createAssociationTips(assocElement: HTMLElement, lineShape: IVisualizationAssociationShape, directions: IEdgeDirections): ILineTips {
    const result: ILineTips = {};
    if (!assocElement) {
      return result;
    }
    const { dataset } = assocElement;
    const { markerEnd, markerStart } = dataset;
    const style = this.createAssociationStyles(assocElement);
    if (markerEnd) {
      // result.end = this.buildEdgeTip(markerEnd, lineShape, directions);
      result.end = this.tipProcessor.endMarker(markerEnd, lineShape, directions);
      if (style) {
        result.end.style = style;
      }
    }
    if (markerStart) {
      // result.start = this.buildEdgeTip(markerStart, lineShape, directions);
      result.start = this.tipProcessor.startMarker(markerStart, lineShape, directions);
      if (style) {
        result.start.style = style;
      }
    }
    return result;
  }

  /**
   * Reads element's `data-style` attribute and returns it. 
   * This is used in the edge definition for class name.
   * 
   * @param assocElement The association element to read the values from.
   */
  createAssociationStyles(assocElement: HTMLElement): string {
    let result = '';
    if (assocElement) {
      const { dataset } = assocElement;
      const { style } = dataset;
      if (style) {
        result = style;
      }
    }
    return result;
  }

  /**
   * Updates an existing association data model for position
   * @param assocElement The viz-association element reference
   * @param targetElement The target element reference.
   */
  updateAssociationPosition(assocElement: VizAssociationElement, targetElement: HTMLElement): void {
    const id = assocElement.dataset.key as string;
    const map = this[edgesValue];
    if (!map.has(id)) {
      return;
    }
    const sourceElement = assocElement.parentElement as HTMLElement;
    if (!sourceElement || !sourceElement.dataset.key) {
      return;
    }
    const model = map.get(id);
    if (!model) {
      return;
    }
    const opts: ICalculateEdgeOptions = {
      sourceElement,
      targetElement,
      id,
    };

    const slots = this.readAssociationSlots(assocElement);
    if (slots.source) {
      opts.sourceSlot = slots.source;
    }
    if (slots.target) {
      opts.targetSlot = slots.target;
    }
    const others = this.findOtherAssociations(sourceElement, targetElement, assocElement.dataset.key!);
    if (others.length) {
      opts.others = others;
    }
    const slotPoints = this.discoverAssociationVertexes(opts);
    if (!slotPoints) {
      return;
    }
    const sourceRect = getObjectBoundingClientRect(sourceElement, this.workspace);
    const targetRect = getObjectBoundingClientRect(targetElement, this.workspace);
    const sketch = (this.lineProcessor.sketch({
      source: sourceRect,
      target: targetRect,
      startPoint: slotPoints.start!, 
      endPoint: slotPoints.end!,
      type: model.shape.line.type || DefaultLineType,
    })) as IVisualizationAssociationShape;
    if (!sketch) {
      return;
    }
    const [sp] = sketch.coordinates!;
    const ep = sketch.coordinates![sketch.coordinates!.length - 1];
    const directions = findDirection(sp, ep, sourceRect, targetRect);
    
    const labelArtist = new LabelSketch();
    const label = labelArtist.sketch(sketch, model.shape.label && model.shape.label.value || '', directions);
    const tips = this.createAssociationTips(assocElement, sketch, directions);

    model.shape.line = sketch;
    model.shape.label = label || undefined;
    model.shape.tips = tips;
    model.directions = directions;
    this.workspace.requestUpdate();
  }

  /**
   * Updates the label of the association in the visualization canvas.
   * 
   * @param assocElement The viz-association element reference
   */
  updateAssociationLabel(assocElement: VizAssociationElement): void {
    const map = this[edgesValue];
    const key = assocElement.dataset.key as string;
    if (!map.has(key)) {
      return;
    }
    const { title } = assocElement;
    const model = map.get(key)!;
    model.shape.label!.value = title || '';
    this.workspace.requestUpdate();
  }

  /**
   * Updates the `markers` property from an association element.
   * 
   * @param assocElement The viz-association element reference
   */
  updateEdgeMarker(assocElement: VizAssociationElement): void {
    const map = this[edgesValue];
    const assocId = assocElement.dataset.key;
    if (!assocId) {
      return;
    }
    if (!map.has(assocId)) {
      return;
    }
    const model = map.get(assocId)!;
    const sourceElement = assocElement.parentElement as HTMLElement;
    if (!sourceElement || !sourceElement.dataset.key) {
      return;
    }
    const targetElement = this.findDomainTarget(model.target) as HTMLElement | undefined;
    if (!targetElement || !targetElement.dataset.key) {
      return;
    }
    const closest = this[calculateNearestPoints](sourceElement, targetElement);
    if (!closest) {
      return;
    }
    const sourceRect = getObjectBoundingClientRect(sourceElement, this.workspace);
    const targetRect = getObjectBoundingClientRect(targetElement, this.workspace);
    const shape = this.lineProcessor.sketch({
      source: sourceRect,
      target: targetRect,
      startPoint: closest[0], 
      endPoint: closest[1],
      type: model.shape.line.type || DefaultLineType,
    }) as IVisualizationAssociationShape;
    if (!shape) {
      return;
    }
    const [sp] = shape.coordinates!;
    const ep = shape.coordinates![shape.coordinates!.length - 1];
    const directions = findDirection(sp, ep, sourceRect, targetRect);

    const tips = this.createAssociationTips(assocElement, shape, directions);
    model.shape.tips = tips;
    this.workspace.requestUpdate();
  }

  /**
   * Updates the `styles` property from an association element.
   * 
   * @param assocElement The viz-association element reference
   */
  updateEdgeStyles(assocElement: VizAssociationElement): void {
    const map = this[edgesValue];
    const key = assocElement.dataset.key;
    if (!key) {
      return
    }
    if (!map.has(key)) {
      return;
    }
    const model = map.get(key)!;
    model.shape.style = this.createAssociationStyles(assocElement);
    this.workspace.requestUpdate();
  }

  /**
   * Updates the selection state of the edge
   * 
   * @param assocElement The viz-association element reference
   */
  toggleEdgeHighlight(assocElement: VizAssociationElement): void {
    const map = this[edgesValue];
    const key = assocElement.dataset.key;
    if (!key) {
      return
    }
    if (!map.has(key)) {
      return;
    }
    const model = map.get(key)!;
    if (!model.shape.selection) {
      model.shape.selection = {};
    }
    model.shape.selection.primary = assocElement.hasAttribute('data-selected');
    this.workspace.requestUpdate();
  }

  /**
   * Updates the selection state of the edge
   * 
   * @param assocElement The viz-association element reference
   */
  toggleEdgeSecondaryHighlight(assocElement: VizAssociationElement): void {
    const map = this[edgesValue];
    const key = assocElement.dataset.key;
    if (!key) {
      return
    }
    if (!map.has(key)) {
      return;
    }
    const model = map.get(key)!;
    if (!model.shape.selection) {
      model.shape.selection = {};
    }
    model.shape.selection.secondary = assocElement.hasAttribute('secondary-selected');
    this.workspace.requestUpdate();
  }

  /**
   * Removes an association edge from the edges list.
   * @param associationId The domain id of the association
   */
  delete(associationId: string): void {
    const map = this[edgesValue];
    if (!map.has(associationId)) {
      return;
    }
    map.delete(associationId);
    this.workspace.requestUpdate();
  }

  /**
   * A function that checks whether the associations reported in this class still exist in the workspace.
   */
  syncAssociations(): void {
    const map = this[edgesValue];
    const { workspace } = this;
    let updated = false;
    map.forEach((model) => {
      const { id, target } = model;
      const node = workspace.querySelector(`viz-association[data-key="${id}"]`);
      if (!node) {
        map.delete(id);
        updated = true;
        return;
      }
      const targetNode = this.findDomainTarget(target);
      if (!targetNode) {
        map.delete(id);
        updated = true;
      }
    });
    if (updated) {
      workspace.requestUpdate();
    }
  }

  /**
   * Searches the DOM for the domain element that has set the `data-key`. It takes into the account the `data-delegate-visualization`
   * attribute.
   * 
   * @param target The domain id of the target.
   * @returns The domain element or null if not found.
   */
  findDomainTarget(target: string): HTMLElement | null {
    const targetElement = this.workspace.querySelector(`[data-key="${target}"]`) as HTMLElement | null;
    return targetElement;
  }

  [processQueueDebouncer]?: any;

  runProcessingQueue(): void {
    const timeout = this[processQueueDebouncer];
    if (timeout) {
      clearTimeout(timeout);
    }
    this[processQueueDebouncer] = setTimeout(async () => {
      this[processQueueDebouncer] = undefined;
      await this.workspace.updateComplete;
      this[processQueue].forEach((assoc) => {
        const { target } = assoc.dataset;
        if (!target) {
          return;
        }
        const targetElement = this.findDomainTarget(target);
        if (!targetElement) {
          return;
        }
        this.buildAssociationEdge(assoc, targetElement);
      });
      this[processQueue] = [];
    });
  }

  /**
   * Adds an association element to the rendering queue and runs the queue.
   */
  queueAssociation(assoc: VizAssociationElement): void {
    if (this[processQueue].includes(assoc)) {
      return;
    }
    this[processQueue].push(assoc);
    this.runProcessingQueue();
  }

  // PRIVATE APIS

  /**
   * Observe items change in the element's light DOM
   * @returns The observer handler
   */
  [observeItems](): MutationObserver {
    const config = /** @type MutationObserverInit */ ({ attributes: true, childList: true, subtree: true, attributeOldValue: true, });
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
        this[processRemovedNodes](mutation.removedNodes);
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
      const typed = node as Element;
      const name = typed.localName;
      if (name === 'viz-association') {
        this[processAddedAssociation](typed as VizAssociationElement);
      } else {
        this[processAddedNode](typed as HTMLElement);
      }
      const children = typed.querySelectorAll('*');
      this[processAddedNodes](children);
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
      const name = typed.localName;
      if (name === 'viz-association') {
        this[processRemovedAssociation](typed as VizAssociationElement);
      } else {
        this[processRemovedNode](typed as HTMLElement);
      }
      const children = typed.querySelectorAll('*');
      this[processRemovedNodes](children);
    });
    this.syncAssociations();
  }

  /**
   * Processes changed attribute on any element in the canvas
   * @param mutation The record associated with the change
   */
  [processAttributeChanged](mutation: MutationRecord): void {
    const att = mutation.attributeName;
    // console.log(att);

    const nodeName = mutation.target.nodeName.toLowerCase();
    const isAssociation = nodeName === 'viz-association';

    if (att === 'data-key') {
      if (isAssociation) {
        const typed = mutation.target as VizAssociationElement;
        const old = mutation.oldValue;
        const id = typed.dataset.id;
        if (old && id && this[edgesValue].has(old)) {
          const value = this[edgesValue].get(old)!;
          this[edgesValue].delete(old);
          this[edgesValue].set(id, value);
        } else if (old && this[edgesValue].has(old)) {
          this.removeEdge(old);
        }
      } else {
        const typed = mutation.target as HTMLElement;
        this[processAddedNode](typed);
      }
    } else if (isAssociation) {
      const typed = mutation.target as VizAssociationElement;
      if (att === 'target') {
        this[processAddedAssociation](typed);
      } else if (['name', 'displayName'].includes(att!)) {
        this.updateAssociationLabel(typed);
      } else if (att === 'selected') {
        this.toggleEdgeHighlight(typed);
      } else if (att === 'secondary-selected') {
        this.toggleEdgeSecondaryHighlight(typed);
      } else if (att === 'data-marker-end') {
        this.updateEdgeMarker(typed);
      } else if (att === 'data-style') {
        this.updateEdgeStyles(typed);
      }
    }
  }

  /**
   * If the target exists it creates the model of the association 
   * and adds it to the associations list.
   * If the target is not set the association is ignored.
   * If the parent has no `data-key` it is ignored.
   * If the target does not exists it is ignored (handled in processAddedNode)
   */
  [processAddedAssociation](node: VizAssociationElement): void {
    const { target, key } = node.dataset;
    if (!target) {
      this.removeEdge(key!);
      return;
    }
    const targetElement = this.findDomainTarget(target);
    if (!targetElement) {
      this.removeEdge(key!);
      return;
    }
    this.queueAssociation(node);
  }

  /**
   * If there is an association that corresponds to the `data-key` of the element
   * then it builds the association model.
   */
  [processAddedNode](node: HTMLElement): void {
    const { key } = node.dataset;
    if (!key) {
      return;
    }
    // first add associations that this node has
    const nodesAssociations = node.querySelectorAll('viz-association');
    Array.from(nodesAssociations).forEach((assocNode) => {
      const typed = assocNode as VizAssociationElement;
      if (!typed.dataset.target) {
        return;
      }
      const targetElement = this.findDomainTarget(typed.dataset.target);
      if (!targetElement) {
        return;
      }
      // this.buildAssociationEdge(typed, targetElement);
      this.queueAssociation(typed);
    });

    // then find association to this node.
    const assocElement = this.workspace.querySelector(`viz-association[data-target="${key}"]`) as VizAssociationElement;
    if (!assocElement) {
      return;
    }
    // this.buildAssociationEdge(assocElement, node);
    this.queueAssociation(assocElement);
  }

  /**
   * If the association model exists for this association then it is removed.
   */
  [processRemovedAssociation](node: VizAssociationElement): void {
    const { key } = node.dataset;
    this.delete(key!);
  }

  /**
   * If the element has an association then this association is removed.
   */
  [processRemovedNode](node: HTMLElement): void {
    // first remove associations that this node has
    const nodesAssociations = node.querySelectorAll('viz-association');
    Array.from(nodesAssociations).forEach((assocNode) => {
      const typed = assocNode as VizAssociationElement;
      if (typed.dataset.key) {
        this.delete(typed.dataset.key);
      }
    });
    // them remove association that this node is connected to
    const { key } = node.dataset;
    if (!key) {
      return;
    }
    const assocElement = this.workspace.querySelector(`viz-association[data-target="${key}"]`) as VizAssociationElement;
    if (!assocElement || !assocElement.dataset.key) {
      return;
    }
    this.delete(assocElement.dataset.key);
  }

  /**
   * Handles selection of an association from the SVG element click.
   */
  [clickHandler](e: PointerEvent): void {
    const typeTarget = this[readEventTarget](e);
    if (!typeTarget) {
      this[deselectAllEdges]();
      return;
    }
    const { type, id } = typeTarget.dataset;
    if (type === 'association' && id) {
      this[associationClickHandler](id, e.shiftKey);
    }
  }

  /**
   * Handles mouse over event on the SVG element
   */
  [mouseOverHandler](e: Event): void {
    const typeTarget = this[readEventTarget](e);
    if (!typeTarget) {
      return;
    }
    if (!typeTarget.classList.contains('association-line-area')) {
      return;
    }
    const { id } = typeTarget.dataset;
    const item = this.get(id!);
    if (!item) {
      return;
    }
    item.shape.selection!.hover = true;
    this.workspace.requestUpdate();
  }

  /**
   * Handles mouse out event on the SVG element
   */
  [mouseOutHandler](e: Event): void {
    const typeTarget = this[readEventTarget](e);
    if (!typeTarget) {
      return;
    }
    if (!typeTarget.classList.contains('association-line-area')) {
      return;
    }
    const { id } = typeTarget.dataset;
    const item = this.get(id!);
    if (!item) {
      return;
    }
    item.shape.selection!.hover = false;
    this.workspace.requestUpdate();
  }

  [readEventTarget](e: Event): SVGElement {
    let typeTarget: SVGElement;
    const path = e.composedPath();
    while (path.length) {
      const item = path.shift() as SVGElement;
      if (item.localName === 'svg') {
        break;
      }
      if (item.dataset.type && item.dataset.id) {
        typeTarget = item;
        break;
      }
    }
    return typeTarget!;
  }

  /**
   * Handles the logic when an association visualization was clicked.
   * @param id Association id
   * @param multi Whether multi selection is applied
   */
  [associationClickHandler](id: string, multi: boolean=false): void {
    const selectableTarget = this.findDomainTarget(id);
    if (!selectableTarget) {
      return;
    }
    const manager = this.workspace.selection;
    const isSelected = manager.isSelected(selectableTarget);
    if (isSelected) {
      if (multi) {
        manager.setUnselected(selectableTarget);
      }
      return;
    }
    if (!multi) {
      this[deselectAllEdges]();
      manager.deselectAll();
    }
    manager.setSelected(selectableTarget);
  }

  /**
   * Removes selection from all associations
   */
  [deselectAllEdges](): void {
    const nodes = this.workspace.querySelectorAll(`viz-association[data-selected]`);
    const manager = this.workspace.selection;
    Array.from(nodes).forEach((node) => {
      manager.setUnselected(node);
    });
    const map = this[edgesValue];
    map.forEach((model) => {
      if (!model.shape.selection) {
        model.shape.selection = {};
      }
      model.shape.selection.primary = false;
      model.shape.selection.secondary = false;
      model.shape.selection.hover = false;
    });
    this.workspace.requestUpdate();
  }
}
