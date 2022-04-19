/* eslint-disable lit-a11y/click-events-have-key-events */
/* eslint-disable no-plusplus */
/* eslint-disable class-methods-use-this */
import { html, LitElement, CSSResult, TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { MultiSelectableMixin, AnypointDropdownMenuElement, AnypointSwitchElement, AnypointListboxElement } from '@anypoint-web-components/awc';
import '@anypoint-web-components/awc/dist/define/anypoint-dropdown-menu.js';
import '@anypoint-web-components/awc/dist/define/anypoint-listbox.js';
import '@anypoint-web-components/awc/dist/define/anypoint-item.js';
import '@anypoint-web-components/awc/dist/define/anypoint-icon-item.js';
import '@anypoint-web-components/awc/dist/define/anypoint-switch.js';
import styles from './SelectorStyles.js';
import AuthorizationMethodElement from './AuthorizationMethodElement.js';

const selectable = '[type]';

export const dropdownSelected = Symbol('dropdownSelected');
export const updateSelectionState = Symbol('updateSelectionState');
export const activateDropdownHandler = Symbol('activateDropdownHandler');
export const selectedDropdownHandler = Symbol('selectedDropdownHandler');
export const dropdownItemTemplate = Symbol('dropdownItemTemplate');
export const methodSelectorTemplate = Symbol('methodSelectorTemplate');
export const notifyChange = Symbol('notifyChange');
export const methodChange = Symbol('methodChange');
export const dropdownValue = Symbol('dropdownValue');
export const testRemovedSelected = Symbol('testRemovedSelected');
export const removeItemsListeners = Symbol('removeItemsListeners');
export const addItemsListeners = Symbol('addItemsListeners');
export const ensureSingleSelection = Symbol('ensureSingleSelection');
export const selectionHandler = Symbol('selectionHandler');
export const itemsHandler = Symbol('itemsHandler');
export const processDocs = Symbol('processDocs');
export const multiEnabledHandler = Symbol('multiEnabledHandler');
export const multiEnabledClickHandler = Symbol('multiEnabledClickHandler');
export const readAuthType = Symbol('readAuthType');

/**
 * A function that maps a value of the `type` attribute of an authorization method
 * to a label to be presented in the dropdown.
 *
 * The `attrForLabel` has higher priority of defining a custom name for the method.
 *
 * @param node A node to read type from.
 * @param attrForLabel In case when the type is not recognized it uses
 * this attribute to look for the label.
 * @return Label for the type.
 */
export const nodeToLabel = (node: AuthorizationMethodElement, attrForLabel?: string): string => {
  if (!node) {
    return '';
  }
  if (attrForLabel && node.hasAttribute(attrForLabel)) {
    return node.getAttribute(attrForLabel)!;
  }
  let { type } = node;
  if (!type && node.hasAttribute('type')) {
    type = node.getAttribute('type')!;
  }
  type = String(type).toLowerCase();
  switch (type) {
    case 'none': return 'None';
    case 'basic': return 'Basic';
    case 'ntlm': return 'NTLM';
    case 'digest': return 'Digest';
    case 'oauth 1': return 'OAuth 1';
    case 'oauth 2': return 'OAuth 2';
    case 'bearer': return 'Bearer';
    case 'client certificate': return 'Client certificate';
    default:
  }
  return type;
};

function stopPropagation(e: Event): void {
  e.stopPropagation();
}

export default class AuthorizationSelectorElement extends MultiSelectableMixin(LitElement) {
  static get styles(): CSSResult[] {
    return [
      styles,
    ];
  }

  get [dropdownValue](): AnypointDropdownMenuElement | null {
    return this.shadowRoot!.querySelector('anypoint-dropdown-menu');
  }

  protected _onChange: ((this: GlobalEventHandlers, ev: Event) => any) | null = null;

  /**
   * @return Previously registered function or undefined.
   */
  get onchange(): ((this: GlobalEventHandlers, ev: Event) => any) | null {
    return this._onChange;
  }

  /**
   * Registers listener for the `change` event
   * @param value A function to be called when `change` event is
   * dispatched
   */
  set onchange(value: ((this: GlobalEventHandlers, ev: Event) => any) | null) {
    if (this._onChange) {
      this.removeEventListener('change', this._onChange);
    }
    if (typeof value !== 'function') {
      this._onChange = null;
      return;
    }
    this._onChange = value;
    this.addEventListener('change', value);
  }

  /**
   * @return A type attribute value of selected authorization method.
   */
  get type(): string | string[] | null {
    if (this.multi) {
      const items = this.selectedItems as AuthorizationMethodElement[];
      return items.map((item) => this[readAuthType](item)).filter((item) => !!item) as string[] | null;
    }
    const selected = this.selectedItem as AuthorizationMethodElement;
    return this[readAuthType](selected);
  }

  get selectable(): string {
    return selectable;
  }

  set selectable(value) {
    // simply ignore it.
  }

  _selected?: number;

  get selected(): number | undefined {
    return this._selected;
  }

  set selected(value: number | undefined) {
    const old = this._selected;
    /* istanbul ignore if */
    if (old === value) {
      return;
    }
    this._selected = value;
    if (!this.multi) {
      this._updateSelected();
    }
    this.requestUpdate();
    this[selectionHandler]();
  }

  /**
   * An attribute to use to read value for the label to be rendered in the
   * drop down when `type` property cannot be translated to a common name.
   *
   * This attribute should be set on the child element.
   */
  @property({ type: String }) attrForLabel?: string;

  /** 
   * When set it renders the authorization form next to the drop down.
   * Use this when there's enough screen to render the form.
   */
  @property({ type: Boolean, reflect: true }) horizontal?: boolean;

  /**
   * A value to set on a dropdown select attribute.
   *
   * Note, do not use it as a getter. It may not have the actual value.
   * This is used to force the dropdown to change a selection. However,
   * change in the UI is not handled here so the value may be different.
   */
  [dropdownSelected]?: number;


  constructor() {
    super();
    this[itemsHandler] = this[itemsHandler].bind(this);
    this[methodChange] = this[methodChange].bind(this);
    this.multi = false;
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('itemschange', this[itemsHandler]);
    this[updateSelectionState]();
    if (this.attrForSelected) {
      this[selectionHandler]();
    }
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('itemschange', this[itemsHandler]);
  }

  firstUpdated(): void {
    const { items } = this;
    if (items && items.length) {
      this[addItemsListeners](items);
      this[itemsHandler]();
    }
    // @ts-ignore
    this[dropdownSelected] = this._valueToIndex(this.selected);
    this[processDocs]();
    this.requestUpdate();
  }

  /**
   * Calls `validate()` function on currently selected authorization method.
   * @return {Boolean|null} Result of calling `validate()` function on selected
   * method or `null` if no selection or selected method does not implement this
   * function.
   */
  validate(): boolean {
    let items: AuthorizationMethodElement[] = [];
    if (this.multi) {
      items = this.selectedItems as AuthorizationMethodElement[];
    } else {
      items.push(this.selectedItem as AuthorizationMethodElement);
    }
    return !items.some((auth) => auth && auth.validate ? !auth.validate() : false);
  }

  /**
   * A handler for `itemschange` event dispatched by the selectable mixin.
   * It manages selection state when items changed.
   */
  [itemsHandler](): void {
    this[ensureSingleSelection]();
    this[updateSelectionState]();
    this.requestUpdate();
  }

  /**
   * Handler for `selectedchange` event dispatched by the selectable mixin.
   *
   * Updates selection state and sets/removed `hidden` attribute on the children.
   */
  [selectionHandler](): void {
    this[updateSelectionState]();
    this[processDocs]();
    // @ts-ignore
    this[dropdownSelected] = this._valueToIndex(this.selected);
  }

  /**
   * A handler for the `selectedchange` event dispatched on the dropdown
   * element.
   * It maps selected index on the dropdown to currently `selected` value.
   * Note, when `attrForSelected` is used then it won't be the index of selected
   * item.
   */
  [selectedDropdownHandler](e: Event): void {
    const node = e.target as AnypointListboxElement;
    this.selected = this._indexToValue(node.selected as number) as number;
    this[notifyChange]();
    this.requestUpdate();
  }

  /**
   * Handler for the `activate` event dispatched by the dropdown.
   * It ensures that the dropdown is closed when clicked on already selected item.
   * @param {CustomEvent} e
   */
  [activateDropdownHandler](e: Event): void {
    const node = e.target as HTMLElement;
    const parent = node.parentElement as AnypointDropdownMenuElement;
    parent.close();
  }

  /**
   * Updates children to add or remove the `hidden` attribute depending on current selection.
   */
  [updateSelectionState](): void {
    const { items, selected } = this;
    if (!items) {
      return;
    }
    for (let i = 0, len = items.length; i < len; i++) {
      const node = items[i];
      if (this._valueForItem(node) === selected) {
        if (node.hasAttribute('hidden')) {
          node.removeAttribute('hidden');
        }
      } else if (!node.hasAttribute('hidden')) {
        node.setAttribute('hidden', '');
      }
    }
  }

  /**
   * Ensures that authorization method is selected if only one item is
   * recognized.
   */
  [ensureSingleSelection](): void {
    const { items } = this;
    if (!items) {
      return;
    }
    if (items.length === 0 || items.length > 1) {
      return;
    }
    const selected = this._indexToValue(0);
    this.select(selected as string);
    this.selected = selected as number;
    this[dropdownSelected] = 0;
    this[selectionHandler]();
  }

  /**
   * Overrides `_mutationHandler()` from the selectable mixin to add/remove
   * `change` event on authorization methods being added / removed.
   * @param mutationsList
   */
  _mutationHandler(mutationsList: MutationRecord[]): void {
    super._mutationHandler(mutationsList);
    for (const mutation of mutationsList) {
      if (mutation.type === 'childList') {
        if (mutation.removedNodes.length) {
          this[testRemovedSelected](mutation.removedNodes);
          this[removeItemsListeners](mutation.removedNodes);
          this.requestUpdate();
        } else if (mutation.addedNodes.length) {
          this[addItemsListeners](mutation.addedNodes);
        }
      }
    }
  }

  /**
   * Tests whether a node in a list of removed nodes represents currently selected
   * authorization method. If so then it removes current selection.
   * This is to ensure the label in the dropdown is updated when the current selection change.
   *
   * @param nodesList A list of removed nodes.
   */
  [testRemovedSelected](nodesList: NodeList): void {
    const dropdown = this[dropdownValue];
    if (!dropdown) {
      return;
    }
    const { value } = dropdown;
    const { attrForLabel } = this;
    for (let i = 0, len = nodesList.length; i < len; i++) {
      const candidate = nodesList[i] as AuthorizationMethodElement;
      const { type } = candidate;
      if (type && nodeToLabel(candidate, attrForLabel) === value) {
        // @ts-ignore
        this.select(undefined);
        this.selected = undefined;
        dropdown._selectedItem = undefined;
        this[dropdownSelected] = undefined;
        return;
      }
    }
  }

  /**
   * Removes `change` observer from passed nodes.
   *
   * @param nodes List of nodes to remove event listener from.
   */
  [removeItemsListeners](nodes: Node[] | NodeList): void {
    for (let i = 0; i < nodes.length; i++) {
      nodes[i].removeEventListener('change', this[methodChange]);
    }
  }

  /**
   * Adds `change` observer to passed nodes.
   * It is safe to call it more than once on the same nodes list as it removes
   * the event listener if it previously was registered.
   *
   * @param nodes List of nodes to add event listener to.
   */
  [addItemsListeners](nodes: Node[] | NodeList): void {
    Array.from(nodes).forEach((node) => {
      node.removeEventListener('change', this[methodChange]);
      node.addEventListener('change', this[methodChange]);
    });
  }

  /**
   * Handler for authorization method `change` event that re-targets
   * the event to be dispatched from this element.
   */
  [methodChange](): void {
    this[notifyChange]();
  }

  /**
   * Dispatches non-bubbling `change` event.
   */
  [notifyChange](): void {
    this.dispatchEvent(new Event('change'));
  }

  /**
   * It checks whether the current selection has an element that describes it via 
   * the ARIA attribute, and if so then it renders it in the slot.
   */
  [processDocs](): void {
    const slot = this.shadowRoot!.querySelector('slot[name="aria"]') as HTMLSlotElement;
    if (!slot) {
      return;
    }
    const slotted = slot.assignedElements();
    if (slotted.length === 0) {
      return;
    }
    const { selected } = this;
    const selectedItem = this.items[selected!] as AuthorizationMethodElement;
    if (!selectedItem) {
      slotted.forEach((node) => node.setAttribute('hidden', ''));
      return;
    }
    const id = selectedItem.getAttribute('aria-describedby');
    slotted.forEach((node) => {
      const ariaId = node.getAttribute('id');
      node.toggleAttribute('hidden', ariaId !== id);
    });
  }

  [multiEnabledClickHandler](e: Event): void {
    e.preventDefault();
    e.stopPropagation();
  }

  [multiEnabledHandler](e: Event): void {
    e.preventDefault();
    e.stopPropagation();
    const node = e.target as AnypointSwitchElement;
    const selected = Number(this._indexToValue(Number(node.dataset.index)));
    if (Number.isNaN(selected)) {
      return;
    }
    const { selectedValues } = this;
    const isSelected = selectedValues.includes(selected);
    if (isSelected && !node.checked) {
      const index = selectedValues.indexOf(selected);
      selectedValues.splice(index, 1);
    } else if (!isSelected && node.checked) {
      selectedValues.push(selected);
    } else {
      return;
    }
    this.selectedValues = [...selectedValues];
    this[notifyChange]();
  }

  /**
   * @param item The element to read the value from
   */
  [readAuthType](item: AuthorizationMethodElement): string | null {
    if (!item) {
      return null;
    }
    if (item.type) {
      return item.type;
    }
    // because [type] is the only selectable children this has to have
    // `type` attribute
    return item.getAttribute('type');
  }

  render(): TemplateResult {
    return html`
    <div class="container">
      <div class="selector">
        ${this[methodSelectorTemplate]()}
        <slot name="aria"></slot>
      </div>
      <div class="auth" @click="${stopPropagation}">
        <slot></slot>
      </div>
    </div>
    `;
  }

  /**
   * @returns The template for the drop down selector.
   */
  [methodSelectorTemplate](): TemplateResult | string {
    const children = this.items as AuthorizationMethodElement[];
    if (!children || !children.length) {
      return '';
    }
    const selected = this[dropdownSelected];
    return html`
    <anypoint-dropdown-menu
      aria-label="Activate to select authorization method"
      role="listbox"
      fitPositionTarget
    >
      <label slot="label">Select authorization</label>
      <anypoint-listbox
        slot="dropdown-content"
        tabindex="-1"
        .selected="${selected}"
        @selected="${this[selectedDropdownHandler]}"
        @activate="${this[activateDropdownHandler]}"
        class="auth-listbox"
        role="group"
      >
        ${children.map((item, index) => this[dropdownItemTemplate](item, index))}
      </anypoint-listbox>
    </anypoint-dropdown-menu>
    `;
  }

  /**
   * @param {AuthorizationMethod} item The child element
   * @param {number} index The index of the item in the `items` array.
   * @returns {TemplateResult} The template for the drop down item.
   */
  [dropdownItemTemplate](item: AuthorizationMethodElement, index: number): TemplateResult {
    const { attrForLabel, multi, selectedValues } = this;
    const label = nodeToLabel(item, attrForLabel)
    if (multi) {
      const checked = selectedValues.includes(index);
      return html`
      <anypoint-icon-item role="option" aria-selected="${checked ? 'true' : 'false'}">
        <anypoint-switch 
          slot="item-icon" 
          .checked="${checked}"
          @click="${this[multiEnabledClickHandler]}" 
          @change="${this[multiEnabledHandler]}" 
          data-index="${index}"
        ></anypoint-switch> 
        ${label}
      </anypoint-icon-item>`;
    }
    return html`
    <anypoint-item data-label="${label}">${label}</anypoint-item>`;
  }
}
