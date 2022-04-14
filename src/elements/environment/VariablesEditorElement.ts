/* eslint-disable class-methods-use-this */
import { LitElement, html, TemplateResult, CSSResult, css } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { IProperty, Property } from '@api-client/core/build/browser.js';
import { property, state } from 'lit/decorators.js';
import { ResizableMixin } from '@anypoint-web-components/awc';
import '@anypoint-web-components/awc/dist/define/anypoint-masked-input.js';
import '@anypoint-web-components/awc/dist/define/anypoint-input.js';
import '@anypoint-web-components/awc/dist/define/anypoint-icon-button.js';
import '@anypoint-web-components/awc/dist/define/anypoint-switch.js';
import '@anypoint-web-components/awc/dist/define/anypoint-button.js';
import { variableValueLabel } from '../../lib/environments/Utils.js';
import { IconType } from '../icons/Icons.js';
import '../../define/api-icon.js'

/**
 * An element to render a list of variables with an ability to edit them.
 */
export default class VariablesEditorElement extends ResizableMixin(LitElement) {
  static get styles(): CSSResult {
    return css`
    :host {
      display: block;
    }

    .section-title {
      font-size: 0.867rem;
      font-weight: 400;
      margin: 8px 0;
    }

    .vars-title-line {
      display: flex;
      align-items: center;
      margin-bottom: 20px;
    }

    .vars-title-line .section-title {
      flex: 1;
    }

    .var-list {
      margin: 0;
      padding: 0;
      min-width: 300px;
    }

    .var-item {
      display: flex;
      word-break: normal;
      user-select: text;
      cursor: text;
      align-items: center;
      height: 40px;
    }

    .var-name {
      color: var(--variables-overlay-var-name-color, rgba(81, 81, 81, .74));
      margin-right: 16px;
      min-width: 80px;
    }

    .var-value {
      color: var(--variables-overlay-var-value-color, rgba(81, 81, 81, 1));
      display: inline-block;
      flex: 1;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
    }

    .var-item.disabled {
      text-decoration: line-through;
    }

    .var-editor {
      display: flex;
      align-items: center;
      min-width: 480px;
    }

    .var-list-actions {
      margin-left: auto;
    }

    .variable-value {
      flex: 2;
      margin: 0;
    }

    .variable-name {
      margin-right: 0 8px 0 0;
      flex: 1;
    }
    `;
  }

  /**
   * The list of variables to render or edit.
   * This list is mutated. If you don't want this to mutate changes 
   * make a copy first. 
   */
  @property({ type: Array }) variables?: IProperty[];

  /**
   * By default all values are masked. When this is set
   * it renders all values visible.
   */
  @property({ type: Boolean }) renderValues = false;

  @state() protected _editedVariable?: number;
  
  protected _notifyChanged(): void {
    this.dispatchEvent(new Event('change'));
  }

  protected async _varAddHandler(): Promise<void> {
    if (!this.variables) {
      this.variables = [];
    }
    const item = Property.String();
    const index = this.variables.push(item.toJSON());
    this._editedVariable = index - 1;
    this.requestUpdate();
    await this.updateComplete;
    this.notifyResize();
    const editor = this.shadowRoot!.querySelector('.var-editor');
    if (editor) {
      editor.scrollIntoView();
    }
  }

  /**
   * Toggles visibility of the variable values.
   */
  protected _visibilityToggleHandler(): void {
    this.renderValues = !this.renderValues;
  }

  /**
   * A handler for the click event on the variable edit icon.
   * Sets state to edit this variable
   */
  protected _editVariableHandler(e: Event): void {
    const node = e.currentTarget as HTMLElement;
    const index = Number(node.dataset.index);
    if (Number.isNaN(index)) {
      return;
    }
    this._editedVariable = index;
    this.notifyResize();
  }

  /**
   * Handler for the variable toggle change
   */
  protected _toggleVariableHandler(e: Event): void {
    const { variables } = this;
    const node = e.currentTarget as HTMLInputElement;
    const index = Number(node.dataset.index);
    if (Number.isNaN(index) || !variables) {
      return;
    }
    const { checked } = node;
    const variable = variables[index];
    if (variable.enabled === checked) {
      return;
    }
    variable.enabled = checked;
    this._notifyChanged();
  }

  /**
   * Handler for one of the variable inputs value change
   */
  protected _variableInputHandler(e: Event): void {
    const { variables } = this;
    const node = e.currentTarget as HTMLInputElement;
    const index = Number(node.dataset.index);
    if (Number.isNaN(index) || !variables) {
      return;
    }
    const { value } = node;
    const variable = variables[index];
    // @ts-ignore
    variable[node.name] = value;
    this._notifyChanged();
  }

  /**
   * Removes the variable from the environment
   */
  protected _deleteVariableHandler(e: Event): void {
    const { variables } = this;
    const node = e.currentTarget as HTMLElement;
    const index = Number(node.dataset.index);
    if (Number.isNaN(index) || !variables) {
      return;
    }
    variables.splice(index, 1);
    this.notifyResize();
    this._notifyChanged();
    this.requestUpdate();
  }

  /**
   * A handler for the variable editor close button click.
   */
  protected async _variableEditorCloseHandler(): Promise<void> {
    this._editedVariable = undefined;
    this.requestUpdate();
    await this.updateComplete;
    this.notifyResize();
  }

  protected render(): TemplateResult {
    return html`
    ${this._titleTemplate()}
    ${this._listTemplate()}
    `;
  }

  protected _titleTemplate(): TemplateResult {
    const icon = (this.renderValues ? 'visibilityOff' : 'visibility') as IconType;
    return html`
    <div class="vars-title-line">
      <div class="section-title">Variables</div>
      <anypoint-icon-button 
        title="Add a variable" 
        aria-label="Activate to add a new variable"
        @click="${this._varAddHandler}"
        data-action="add-variables"
      >
        <api-icon icon="add"></api-icon>
      </anypoint-icon-button>
      <anypoint-icon-button 
        title="Toggle values visibility" 
        aria-label="Activate to toggle variables visibility"
        @click="${this._visibilityToggleHandler}"
        data-action="toggle-visibility"
      >
        <api-icon icon="${icon}"></api-icon>
      </anypoint-icon-button>
    </div>
    `;
  }

  protected _listTemplate(): TemplateResult {
    const { variables } = this;
    if (!Array.isArray(variables) || !variables.length) {
      return html`
      <p class="empty-info">
        This environment has no variables.
      </p>
      `;
    }

    return html`
    <ul class="var-list">
    ${variables.map((item, index) => this._variablesItemTemplate(item, index))}
    </ul>
    `;
  }

  /**
   * @param item The variable to render.
   * @returns The template for the variable line or variable editor
   */
  protected _variablesItemTemplate(item: IProperty | Property, index: number): TemplateResult {
    if (this._editedVariable === index) {
      return this._variableEditorTemplate(item, index);
    }
    const classes = {
      disabled: !item.enabled,
      'var-item': true,
    };
    return html`
    <li class=${classMap(classes)}>
      <span class="var-name">${item.name}</span>
      <span class="var-value">${variableValueLabel(item.value as string || '', !this.renderValues)}</span>
      ${this._listActionsTemplate(index)}
    </li>`;
  }

  /**
   * @param index The index of the property on the list
   * @returns The template for list item actions
   */
  protected _listActionsTemplate(index: number): TemplateResult {
    return html`
    <div class="var-list-actions">
      <anypoint-icon-button 
        class="edit-icon" 
        title="Edit the variable" 
        aria-label="Activate to edit the variable"
        data-index="${index}"
        data-action="edit"
        @click="${this._editVariableHandler}"
      >
        <api-icon icon="edit"></api-icon>
      </anypoint-icon-button>
      <anypoint-icon-button 
        class="delete-icon" 
        title="Delete the variable" 
        aria-label="Activate to remove the variable"
        data-index="${index}"
        data-action="remove"
        @click="${this._deleteVariableHandler}"
      >
        <api-icon icon="remove"></api-icon>
      </anypoint-icon-button>
    </div>`;
  }

  /**
   * @param item The variable to render.
   * @returns The template for the variables editor
   */
  _variableEditorTemplate(item: IProperty | Property, index: number): TemplateResult {
    return html`
    <li class="var-editor">
      <anypoint-switch
        .checked="${item.enabled}"
        @change="${this._toggleVariableHandler}"
        title="Toggle variable enabled"
        aria-label="Toggle variable enabled state"
        name="enabled"
        data-index="${index}"
      ></anypoint-switch>
      <anypoint-input
        class="variable-name"
        .value="${item.name}"
        name="name"
        @change="${this._variableInputHandler}"
        noLabelFloat
        autoValidate
        required
        allowedPattern="[a-zA-Z0-9_]"
        preventInvalidInput
        invalidMessage="Variable name is not valid"
        data-index="${index}"
      >
        <label slot="label">Variable name</label>
      </anypoint-input>
      <anypoint-masked-input
        class="variable-value"
        .value="${item.value}"
        name="value"
        @change="${this._variableInputHandler}"
        noLabelFloat
        autoValidate
        required
        data-index="${index}"
        .visible="${this.renderValues}"
      >
        <label slot="label">Variable value</label>
      </anypoint-masked-input>
      <anypoint-button 
        @click="${this._variableEditorCloseHandler}"
        data-action="close-editor"
      >Close</anypoint-button>
    </li>
    `;
  }
}
