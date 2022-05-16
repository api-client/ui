import { css, CSSResult, html, PropertyValueMap, TemplateResult, nothing } from "lit";
import { DataAssociation, DataEntity, DataNamespace, DataProperty, DataEntityKind } from "@api-client/core/build/browser.js";
import { property, state } from "lit/decorators.js";
import { ClassInfo, classMap } from "lit/directives/class-map.js";
import { AnypointRadioGroupElement } from "@anypoint-web-components/awc";
import '@anypoint-web-components/awc/dist/define/anypoint-icon-button.js';
import '@anypoint-web-components/awc/dist/define/anypoint-button.js';
import '@anypoint-web-components/awc/dist/define/anypoint-radio-button.js';
import '@anypoint-web-components/awc/dist/define/anypoint-radio-group.js';
import ApiElement from "../ApiElement.js";
import theme from '../theme.js';
import schemaCommon from './schemaCommon.js';
import EditorCommon from './CommonStyles.js';
import MarkdownStyles from '../highlight/MarkdownStyles.js';

/**
 * We keep the list of expanded attributes in a weak map
 * so the state is kept as long as the namespace is loaded and the DataEntity exists.
 * WeakMap allows to GC the DataEntity when it is removed from the namespace (and also release the values).
 */
const expandedState = new WeakMap<DataEntity, string[]>();

const selectedUnions = new Map<string, string>();

type UnionType = "anyOf" | "allOf" | "oneOf" | "not";

/**
 * An element that renders a documentation view for a data entity.
 * 
 * @fires edit - When a property is selected for editing. This is only possible when the `editable` property is set.
 * @fires change - When the entity has changed. This is only possible when the `editable` property is set.
 */
export default class DataSchemaDocument extends ApiElement {
  static get styles(): CSSResult[] {
    return [
      theme,
      schemaCommon,
      MarkdownStyles,
      EditorCommon,
      css`
      :host {
        display: block;
      }

      .entity-header {
        margin-bottom: 20px;
      }

      .entity-header .label {
        font-size: 1.2rem;
        margin: 1.2rem 0;
      }

      .no-info {
        margin: 12px 20px;
      }

      .add-property-section {
        margin-top: 20px;
      }

      .property-container.selected {
        background: var(--list-active-background);
      }

      /* .tree-view {
        border: 4px transparent dotted;
      } */

      .tree-view.drop-active {
        background: var(--association-drop-background, #e3f2fd);
      }

      .property-container.drag-over {
        background: var(--association-drop-background, #e3f2fd);
      }

      .drop-zone {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        height: unset;
        margin: 0;
        padding: 0;
        background: rgba(255,255,255,0.92);
      }
      `,
    ];
  }

  /**
   * The read data namespace.
   */
  @property({ type: Object }) root?: DataNamespace;

  /**
   * The entity key to render the schema documentation for
   */
  @property({ type: String, reflect: true }) key?: string;

  /**
   * The read data entity when the "selected" change.
   */
  @state() protected _entity?: DataEntity;

  /**
   * The key of the property being highlighted.
   */
  @property({ type: String, reflect: true }) selectedProperty?: string;

  /**
   * When set it activates the drop zone in the properties list to drop an entity as an association.
   * This has no effect when `editable` is not set.
   */
  @property({ type: Boolean, reflect: true }) associationDropZone?: boolean;

  /**
   * Whether to render the view in the edit-ready model.
   * This mode allows to add new property, create an association, or remove those.
   * It does not allow to manipulate properties of association or properties.
   */
  @property({ type: Boolean, reflect: true }) editable?: boolean;

  /**
   * When dragging an entity over an existing association this is the key
   * of the association hovered.
   */
  @state() protected _dropAssociationTarget?: string;

  protected willUpdate(cp: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
    if (cp.has('key')) {
      this._computeEntity();
    }
  }

  /**
   * Computes the view value for the property.
   * This should be called before the update is complete so this won't trigger another update.
   */
  protected _computeEntity(): void {
    const { root, key } = this;
    if (!root || !key) {
      this._entity = undefined;
      return;
    }
    const entity = root.definitions.entities.find(i => i.key === key);
    this._entity = entity;
  }

  /**
   * Adds an entity with the given key as an association to this entity.
   * This does nothing when the view is not in the `editable` model.
   * 
   * Note, we allow to create an association to self. Also note, an entity can have multiple associations to the same target.
   * 
   * @param foreignKey The key of the target entity to add.
   * @param parentAssociation When set, it adds another target to an existing association.
   */
  addAssociation(foreignKey: string, parentAssociation?: string): void {
    const { _entity, editable } = this;
    if (!editable || !foreignKey || !_entity) {
      return;
    }
    if (parentAssociation) {
      const parent = _entity.associations.find(i => i.key === parentAssociation);
      if (!parent) {
        return;
      }
      parent.addTarget(foreignKey);
    } else {
      const created = _entity.addTargetAssociation(foreignKey);
      this.dispatchEvent(new CustomEvent('edit', {
        detail: {
          type: 'association',
          key: created.key,
        }
      }));
    }
    this._notifyChanged();
  }

  /**
   * Removes an association from the entity.
   * This does nothing when the view is not in the `editable` model.
   * 
   * @param key The key of the association to remove.
   */
  removeAssociation(key: string): void {
    const { _entity, editable } = this;
    if (!editable || !key || !_entity) {
      return;
    }
    _entity.removeAssociation(key);
    this._notifyChanged();
    this.requestUpdate();
  }

  addProperty(name?: string): void {
    const { _entity, editable } = this;
    if (!_entity || !editable) {
      return;
    }
    const created = _entity.addNamedProperty(name || 'New property');
    this.selectedProperty = created.key;
    this._notifyChanged();
    this.requestUpdate();
    this.dispatchEvent(new CustomEvent('edit', {
      detail: {
        type: 'property',
        key: created.key,
      }
    }));
  }

  removeProperty(key: string): void {
    const { _entity, editable } = this;
    if (!key || !_entity || !editable) {
      return;
    }
    _entity.removeProperty(key);
    if (this.selectedProperty === key) {
      this.selectedProperty = undefined;
    }
    this._notifyChanged();
    this.requestUpdate();
  }

  protected _notifyChanged(): void {
    this.dispatchEvent(new Event('change'));
  }

  protected _addPropertyHandler(): void {
    this.addProperty();
  }

  protected _findParentKeyedElement(node: HTMLElement): HTMLElement | null {
    let target: HTMLElement | null = node;
    while (target) {
      if (target.nodeType !== Node.ELEMENT_NODE || !target.dataset) {
        target = target.parentElement;
        continue;
      }
      if (target.dataset.key) {
        return target;
      }
      target = target.parentElement;
    }
    return null;
  }

  protected _removeHandler(e: Event): void {
    const button = e.currentTarget as HTMLElement;
    const { type } = button.dataset;
    if (!type) {
      return;
    }
    const node = this._findParentKeyedElement(e.target as HTMLElement);
    if (node) {
      if (type === 'property') {
        this.removeProperty(node.dataset.key as string);
      } else if (type === 'association') {
        this.removeAssociation(node.dataset.key as string);
      }
    }
  }

  protected _editHandler(e: Event): void {
    const button = e.currentTarget as HTMLElement;
    const { type } = button.dataset;
    if (!type) {
      return;
    }
    const node = this._findParentKeyedElement(e.target as HTMLElement);
    if (node) {
      this.dispatchEvent(new CustomEvent('edit', {
        detail: {
          type,
          key: node.dataset.key as string,
        }
      }));
    }
  }

  protected _associationDragOver(e: DragEvent): void {
    const dt = e.dataTransfer!;
    if (!dt.types.includes(DataEntityKind.toLocaleLowerCase())) {
      return;
    }
    const node = e.currentTarget as HTMLElement;
    const { key } = node.dataset;
    if (key) {
      e.preventDefault();
      dt.effectAllowed = 'copy';
      dt.dropEffect = 'copy';
      this._dropAssociationTarget = key;
    }
  }

  protected _associationDragLeave(e: DragEvent): void {
    const dt = e.dataTransfer!;
    if (!dt.types.includes(DataEntityKind.toLocaleLowerCase())) {
      return;
    }
    this._dropAssociationTarget = undefined;
  }

  protected _associationDrop(e: DragEvent): void {
    const dt = e.dataTransfer!;
    if (!dt.types.includes(DataEntityKind.toLocaleLowerCase())) {
      return;
    }
    const { _dropAssociationTarget } = this;
    if (!_dropAssociationTarget) {
      return;
    }
    e.preventDefault();
    this._dropAssociationTarget = undefined; 
    const key = e.dataTransfer!.getData('text/key');
    this.addAssociation(key, _dropAssociationTarget);
  }

  protected _dragoverHandler(e: DragEvent): void {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    e.dataTransfer!.dropEffect = "copy";
    e.dataTransfer!.effectAllowed = "copy";
  }

  protected _dropHandler(e: DragEvent): void {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    const key = e.dataTransfer!.getData('text/key');
    this.addAssociation(key);
  }

  /**
   * @returns the list of keys of properties that are expanded (children are rendered).
   */
  protected _getExpandedKeys(): string[] {
    const { _entity } = this;
    if (!_entity) {
      return [];
    }
    if (!expandedState.has(_entity)) {
      expandedState.set(_entity, []);
    }
    return expandedState.get(_entity)!;
  }

  protected _expandHandler(e: Event): void {
    const button = e.currentTarget as HTMLElement;
    const { id } = button.dataset;
    this._toggleExpandedProperty(id as string);
  }

  protected _expandKeydownHandler(e: KeyboardEvent): void {
    if (e.code !== 'Space') {
      return;
    }
    e.preventDefault();
    const button = e.currentTarget as HTMLElement;
    const { id } = button.dataset;
    this._toggleExpandedProperty(id as string);
  }

  /**
   * Toggles an "expanded" state for a property children.
   * 
   * @param id Parent property id that has children to toggle visibility of.
   */
  protected _toggleExpandedProperty(id: string): void {
    const list = this._getExpandedKeys();
    const index = list.indexOf(id);
    if (index === -1) {
      list.push(id);
    } else {
      list.splice(index, 1);
    }
    this.requestUpdate();
  }

  protected _isRecursive(association: DataAssociation, target: string): boolean {
    const entity = association.getParent();
    return entity.hasClosedCycle(this.key!, target);
  }

  protected _unionSelectedHandler(e: Event): void {
    const list = e.target as AnypointRadioGroupElement;
    const { selected, dataset } = list;
    const { association } = dataset;
    if (!selected || !association || Number.isNaN(selected)) {
      return;
    }
    selectedUnions.set(association, selected as string);
    this.requestUpdate();
  }

  protected render(): TemplateResult | typeof nothing {
    const { _entity } = this;
    if (!_entity) {
      return nothing;
    }
    const treeClasses = {
      'drop-active': !!this.associationDropZone && !this._dropAssociationTarget,
      'tree-view': true,
    }
    return html`
    ${this._headerTemplate(_entity)}
    <div class="${classMap(treeClasses)}" @dragover="${this._dragoverHandler}" @drop="${this._dropHandler}">
      ${this._propertiesTemplate(_entity.properties, _entity.associations)}
      ${this._parentsProperties(_entity.getComputedParents())}
    </div>
    ${this._addButtonTemplate()}
    `;
  }

  protected _headerTemplate(entity: DataEntity): TemplateResult {
    const label = entity.info.name || 'Unnamed data entity';
    return html`
    <div class="entity-header">
      <div class="label">${label}</div>
      ${this._descriptionTemplate(entity)}
    </div>
    `;
  }

  protected _descriptionTemplate(entity: DataEntity): TemplateResult {
    const { description } = entity.info;
    if (description) {
      return html`
      <div class="description">
        <marked-highlight sanitize .markdown="${description}">
          <div slot="markdown-html" class="markdown-body text-selectable"></div>
        </marked-highlight>
      </div>`;
    }
    return html`
    <div class="description">
      <span class="no-description">No schema description provided.</span>
    </div>
    `;
  }

  protected _propertiesTemplate(properties: DataProperty[], associations: DataAssociation[], readonly?: boolean): TemplateResult {
    if (!properties.length && !associations.length) {
      // don't change the "div" to anything else. It's for the CSS to compute borders correctly.
      return html`<div class="no-properties">This entity has no properties or associations.</div>`;
    }
    return html`
    ${properties.map(p => this._propertyTemplate(p, readonly))}
    ${associations.map(a => this._associationTemplate(a, readonly))}
    `;
  }

  protected _propertyTemplate(item: DataProperty, readonly=false): TemplateResult {
    const { info, type, key, required, multiple, index, primary } = item;
    const containerClasses = {
      'property-container': true,
      selected: this.selectedProperty === item.key,
    };
    return html`
    <div class="${classMap(containerClasses)}" data-key="${key}">
      <div class="property-border"></div>
      <div class="property-value">
        <div class="property-headline">
          <div class="property-decorator scalar"><hr></div>
          ${this._paramNameTemplate(item)}
          <span class="headline-separator"></span>
          <div class="param-type text-selectable">${type || 'Any type'}</div>
          ${this._pillTemplate('Required', 'This property is required.', required)}
          ${this._pillTemplate('Multiple', 'Multiple instances of the value are possible.', multiple)}
          ${this._pillTemplate('Index', 'This property is a key which can be indexed.', index)}
          ${this._pillTemplate('Primary', 'This property is the primary key for this entity.', primary, 'primary')}
        </div>
        <div class="description-column">  
          ${this._propertyDescriptionTemplate(info.description)}
        </div>
        <div class="details-column"></div>
      </div>
      ${this._propertyListActions('property', readonly)}
    </div>
    `;
  }

  /**
   * A template for the data association list item view.
   * Depending on the number of targets of the association it renders the "empty target", single association, or a union association view.
   * 
   * @param item The association item to render.
   * @param parent The parent entity of the association.
   * @param readonly Whether to render the view as "read only" (no edit controls). We do not show controls for properties inherited from parents.
   */
  protected _associationTemplate(item: DataAssociation, readonly=false): TemplateResult {
    const { targets=[] } = item;
    if (!targets.length) {
      return this._noTargetAssociationTemplate(item, readonly);
    }
    if (targets.length === 1) {
      return this._singleAssociationTemplate(item, readonly);
    }
    return this._unionAssociationTemplate(item, readonly);
  }

  /**
   * Renders the template for the an association that has one target. This is a classic association where a property 
   * is associated with an object.
   */
  protected _singleAssociationTemplate(item: DataAssociation, readonly=false): TemplateResult {
    const { info, key, required, multiple } = item;
    const containerClasses = {
      'property-container': true,
      selected: this.selectedProperty === key,
      'drag-over': this._dropAssociationTarget === key,
    };
    const entity = item.getTargets()[0];
    const recursive = this._isRecursive(item, entity.key) // entity === this._entity || entity === parent;
    let targetLabel: string;
    if (entity) {
      targetLabel = entity.info.renderLabel;
    } else {
      targetLabel = 'Invalid target';
    }
    const list = this._getExpandedKeys();
    const expanded = !recursive && list.includes(key);
    return html`
    <div class="${classMap(containerClasses)}" data-key="${key}" @dragover="${this._associationDragOver}" @dragleave="${this._associationDragLeave}" @drop="${this._associationDrop}">
      <div class="property-border"></div>
      <div class="property-value">
        <div class="property-headline">
          <div class="property-decorator object" tabindex="${recursive ? '-1' : '0'}" data-id="${key}" @click="${this._expandHandler}" @keydown="${this._expandKeydownHandler}">
            <hr>
            ${recursive ? '' : html`<api-icon icon="chevronRight" class="object-toggle-icon ${expanded ? 'opened' : ''}"></api-icon>`}
          </div>
          ${this._assocNameTemplate(item)}
          <span class="headline-separator"></span>
          <div class="param-type text-selectable">${multiple ? `Array of ${targetLabel}` : targetLabel}</div>
          ${this._pillTemplate('Recursive shape', 'This association is recursive.', recursive)}
          ${this._pillTemplate('Required', 'This property is required.', required)}
          ${this._pillTemplate('Multiple', 'Multiple instances of the value are possible.', multiple)}
        </div>
        <div class="description-column">  
          ${this._propertyDescriptionTemplate(info.description)}
        </div>
        <div class="details-column"></div>
      </div>
      ${this._propertyListActions('association', readonly)}
    </div>
    ${expanded ? html`
    <div class="shape-children">
      <div class="property-border"></div>
      ${this._associationPropertiesTemplate(item)}
    </div>
    ` : ''}
    `;
  }

  /**
   * Renders the template for the an association that has multiple targets. This association represents
   * an union of shapes. This means the property can be any, one of, or either of the union shapes.
   */
  protected _unionAssociationTemplate(item: DataAssociation, readonly=false): TemplateResult {
    const { info, key, required, multiple } = item;
    const containerClasses = {
      'property-container': true,
      selected: this.selectedProperty === key,
      'drag-over': this._dropAssociationTarget === key,
    };
    const entities = item.getTargets();
    const adapted = item.readAdapted();
    // The `anyOf` and `oneOf` renders the same as this is a selection of one of the schemas
    // The `allOf` renders properties for all shapes in the union.
    // The not can potentially be a scalar shape and we don't have a concept of that in this tool so probably we gonna skip that.
    let type: UnionType = 'anyOf';
    if (adapted) {
      if (adapted.schema && adapted.schema.unionType) {
        type = adapted.schema.unionType;
      }
    }
    let unionLabel = '';
    if (!entities.length) {
      // this will happen when all targets were removed from the namespace.
      unionLabel = 'invalid targets';
    } else if (type === 'anyOf') {
      const names = entities.map(i => i.info.renderLabel).join(' or ');
      unionLabel = `any of ${names}`;
    } else if (type === 'oneOf') {
      const names = entities.map(i => i.info.renderLabel).join(' or ');
      unionLabel = `one of ${names}`;
    } else {
      const names = entities.map(i => i.info.renderLabel).join(' and ');
      unionLabel = `all of ${names}`;
    }
    if (multiple) {
      unionLabel = `list of ${unionLabel}`;
    }
    const list = this._getExpandedKeys();
    const expanded = list.includes(key);
    return html`
    <div class="${classMap(containerClasses)}" data-key="${key}">
      <div class="property-border"></div>
      <div class="property-value">
        <div class="property-headline">
          <div class="property-decorator object" tabindex="0" data-id="${key}" @click="${this._expandHandler}" @keydown="${this._expandKeydownHandler}">
            <hr>
            <api-icon icon="chevronRight" class="object-toggle-icon ${expanded ? 'opened' : ''}"></api-icon>
          </div>
          ${this._assocNameTemplate(item)}
          <span class="headline-separator"></span>
          <div class="param-type text-selectable">${unionLabel}</div>
          ${this._pillTemplate('Required', 'This association is required.', required)}
          ${this._pillTemplate('Multiple', 'Multiple instances of the value are possible.', multiple)}
          ${this._pillTemplate('Union', 'This association is an union.', true)}
        </div>
        <div class="description-column">
          ${this._propertyDescriptionTemplate(info.description)}
        </div>
        <div class="details-column"></div>
      </div>
      ${this._propertyListActions('association', readonly)}
    </div>
    ${expanded ? html`
    <div class="shape-children">
      <div class="property-border"></div>
      ${this._unionPropertiesTemplate(item, type)}
    </div>
    ` : ''}
    `;
  }

  /**
   * Renders the template for an association that has no target set.
   */
  protected _noTargetAssociationTemplate(item: DataAssociation, readonly=false): TemplateResult {
    const { info, key, required, multiple } = item;
    const containerClasses = {
      'property-container': true,
      selected: this.selectedProperty === key,
      'drag-over': this._dropAssociationTarget === key,
    };
    return html`
    <div class="${classMap(containerClasses)}" data-key="${key}">
      <div class="property-border"></div>
      <div class="property-value">
        <div class="property-headline">
          <div class="property-decorator object">
            <hr>
          </div>
          ${this._assocNameTemplate(item)}
          <span class="headline-separator"></span>
          ${this._pillTemplate('No target', 'This association has no target.', true)}
          ${this._pillTemplate('Required', 'This property is required.', required)}
          ${this._pillTemplate('Multiple', 'Multiple instances of the value are possible.', multiple)}
        </div>
        <div class="description-column">
          ${this._propertyDescriptionTemplate(info.description)}
        </div>
        <div class="details-column"></div>
      </div>
      ${this._propertyListActions('association', readonly)}
    </div>
    `;
  }

  protected _associationPropertiesTemplate(item: DataAssociation): TemplateResult {
    const entities = item.getTargets();
    if (!entities.length) {
      // don't change the "div" to anything else. It's for the CSS to compute borders correctly.
      return html`<div class="no-properties">Invalid entry. The target entity does not exist.</div>`;
    }
    const [entity] = entities;
    return html`
    <div class="tree-view">
      ${this._propertiesTemplate(entity.properties, entity.associations, true)}
    </div>
    `;
  }

  protected _unionPropertiesTemplate(item: DataAssociation, type: UnionType): TemplateResult {
    const entities = item.getTargets();
    if (!entities.length) {
      // don't change the "div" to anything else. It's for the CSS to compute borders correctly.
      return html`<div class="no-properties">Invalid entry. The target entity does not exist.</div>`;
    }
    if (type === 'allOf') {
      let allProperties: DataProperty[] = [];
      let allAssociations: DataAssociation[] = [];
      entities.forEach((entity) => {
        const { associations, properties } = entity;
        allProperties = allProperties.concat(properties);
        allAssociations = allAssociations.concat(associations);
      });
      return html`
      <div class="tree-view">
        ${this._unionSelector(item, type, entities)}
        ${this._propertiesTemplate(allProperties, allAssociations, true)}
      </div>`;
    }

    let selected = selectedUnions.get(item.key);
    if (!selected) {
      selected = entities[0].key;
    }
    const entity = entities.find(i => i.key === selected);
    if (!entity) {
      return html`
      <div class="tree-view">
        ${this._unionSelector(item, type, entities, selected)}
        <p class="no-info">Invalid selection. Entity not found.</p>
      </div>
      `;
    }
    return html`
    <div class="tree-view">
      ${this._unionSelector(item, type, entities, selected)}
      ${this._propertiesTemplate(entity.properties, entity.associations, true)}
    </div>
    `;
  }

  /**
   * Depending on the union type, it renders the union type label and a selector of the union member.
   * 
   * This template is intended to use when multiple targets in association were detected.
   * 
   * @param item The association item
   * @param type The read from the adapted entity association type.
   * @param entities The list of association targets.
   * @param selected The key of the currently selected association target
   * @returns The template for the union selection in the list of properties.
   */
  protected _unionSelector(item: DataAssociation, type: UnionType, entities: DataEntity[], selected?: string): TemplateResult {
    let label: string;
    if (type === 'anyOf') {
      label = 'Any (one or more) of the following schemas';
    } else if (type === 'oneOf') {
      label = 'One of the following schemas';
    } else if (type === 'allOf') {
      label = 'All properties of union schemas';
    } else {
      label = 'Not matching the schema';
    }
    const renderSelection = ['anyOf', 'oneOf'].includes(type);
    return html`
    <div class="union-options">
      <label>${label}</label>
      ${renderSelection ? html`
      <anypoint-radio-group 
        attrForSelected="data-value"
        data-association="${item.key}"
        .selected="${selected}"
        @selected="${this._unionSelectedHandler}"
      >
        ${entities.map((entity) => 
          html`<anypoint-radio-button class="union-toggle" name="unionValue" data-value="${entity.key}">${entity.info.renderLabel}</anypoint-radio-button>`)}
      </anypoint-radio-group>
      ` : nothing}
    </div>
    `;
  }

  protected _propertyDescriptionTemplate(description?: string): TemplateResult {
    return html`
    <div class="description">
      <marked-highlight sanitize .markdown="${description || 'No description'}">
        <div slot="markdown-html" class="markdown-body text-selectable"></div>
      </marked-highlight>
    </div>
    `;
  }

  /**
   * Adds the delete and edit buttons to the tree item.
   * This renders nothing when the property is readonly or the element is not `editable`.
   * 
   * @param readonly Indicates the property is a readonly mode (e.g. belongs to an external entity.)
   */
  protected _propertyListActions(type: 'property' | 'association', readonly?: boolean): TemplateResult | typeof nothing {
    if (readonly || !this.editable) {
      return nothing;
    }
    const removeTitle = type === 'property' ? 'Remove this property' : 'Remove this association';
    const removeLabel = type === 'property' ? 'Remove property' : 'Remove association';
    const editTitle = type === 'property' ? 'Edit this property' : 'Edit this association';
    const editLabel = type === 'property' ? 'Edit property' : 'Edit association';
    return html`
    <div class="property-actions">
      <anypoint-icon-button data-type="${type}" aria-label="${removeLabel}" title="${removeTitle}" @click="${this._removeHandler}">
        <api-icon icon="remove" aria-hidden="true"></api-icon>
      </anypoint-icon-button>
      <anypoint-icon-button data-type="${type}" aria-label="${editLabel}" title="${editTitle}" @click="${this._editHandler}">
        <api-icon icon="edit" aria-hidden="true"></api-icon>
      </anypoint-icon-button>
    </div>
    `;
  }

  /**
   * A template for the display name of a property.
   * @param item The property to render the name filed for
   * @returns The template for the property name. 
   */
  protected _paramNameTemplate(item: DataProperty): TemplateResult {
    const { info, required=false, deprecated=false } = item;
    const paramName = !info.displayName ? '' : info.name;
    const classes = {
      'param-name': true,
      required,
      deprecated,
    };
    return html`
    <div class="${classMap(classes)}">
      <span class="param-label text-selectable">${info.renderLabel}</span>
    </div>
    ${paramName ? html`<span class="param-name-secondary text-selectable" title="Schema property name">${paramName}</span>` : ''}
    `;
  }

  /**
   * A template for the display name of an association.
   * @param item The property to render the name filed for
   * @returns The template for the property name. 
   */
  protected _assocNameTemplate(item: DataAssociation): TemplateResult {
    const { info, required=false } = item;
    const paramName = !info.displayName ? '' : info.name;
    const classes = {
      'param-name': true,
      required,
    };
    return html`
    <div class="${classMap(classes)}">
      <span class="param-label text-selectable">${info.renderLabel}</span>
    </div>
    ${paramName ? html`<span class="param-name-secondary text-selectable" title="Schema property name">${paramName}</span>` : ''}
    `;
  }

  protected _pillTemplate(label: string, title: string, test: unknown, className?: string): TemplateResult | string {
    if (!test) {
      return '';
    }
    const classes: ClassInfo = {
      pill: true,
      'param-pill': true,
      [className || '']: !!className,
    };
    return html`<span class="${classMap(classes)}" title="${title}">${label}</span>`;
  }

  /**
   * Renders the template for the parents of the entity.
   * 
   * @param parents The parents of the entity. This is an unordered list.
   */
  protected _parentsProperties(parents: DataEntity[]): TemplateResult[] | typeof nothing {
    if (!parents.length) {
      return nothing;
    }
    // don't change the "div" to anything else. It's for the CSS to compute borders correctly.
    return parents.map(p => html`
    <div class="inheritance-label text-selectable">Properties inherited from <b>${p.info.name}</b>.</div>
    ${this._propertiesTemplate(p.properties, p.associations, true)}
    `);
  }

  protected _addButtonTemplate(): TemplateResult | typeof nothing {
    if (!this.editable) {
      return nothing;
    }
    return html`
    <div class="add-property-section">
      <anypoint-button emphasis="medium" @click="${this._addPropertyHandler}">Add property</anypoint-button>
    </div>
    `;
  }
}
