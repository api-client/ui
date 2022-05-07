import { AnypointCheckboxElement, AnypointInputElement } from "@anypoint-web-components/awc";
import { DataAssociation, DataNamespace, EventUtils } from "@api-client/core/build/browser.js";
import { css, CSSResult, html, PropertyValueMap, TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import '@anypoint-web-components/awc/dist/define/anypoint-input.js';
import '@anypoint-web-components/awc/dist/define/anypoint-dropdown-menu.js';
import '@anypoint-web-components/awc/dist/define/anypoint-listbox.js';
import '@anypoint-web-components/awc/dist/define/anypoint-item.js';
import '@anypoint-web-components/awc/dist/define/anypoint-checkbox.js';
import '@anypoint-web-components/awc/dist/define/anypoint-chip-input.js';
import ApiElement from "../ApiElement.js";
import EditorCommon from './CommonStyles.js';
import theme from '../theme.js';

export default class AssociationFormElement extends ApiElement {
  static get styles(): CSSResult[] {
    return [
      theme,
      EditorCommon,
      css`
      :host {
        display: block;
      }
      `
    ]
  }
  
  /**
   * The key of the association to edit.
   */
  @property({ type: String, reflect: true }) key?: string;

  /**
   * The read data namespace.
   */
  @property({ type: Object }) root?: DataNamespace;

  /**
   * The computed entity when the key or root change.
   */
  @state() protected _association?: DataAssociation;

  willUpdate(cp: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
    if (cp.has('key')) {
      this._computeAssociation();
    }
  }

  protected _notifyChanged(): void {
    this.dispatchEvent(new Event('change'));
  }

  /**
   * Computes the view value for the association.
   * This should be called before the update is complete so this won't trigger another update.
   */
  protected _computeAssociation(): void {
    const { root, key } = this;
    if (!root || !key) {
      this._association = undefined;
      return;
    }
    this._association = root.definitions.associations.find(i => i.key === key);
  }

  protected _infoChangeHandler(e: Event): void {
    const { _association } = this;
    if (!_association) {
      return;
    }
    const node = e.target as AnypointInputElement;
    const { name, value } = node;
    if (!['name', 'description', 'displayName'].includes(name as string)) {
      return;
    }
    if (name === 'name' && !value) {
      return;
    }
    _association.info[name as 'name' | 'description' | 'displayName'] = value;
    this._notifyChanged();
    this.requestUpdate();
  }

  protected _checkedHandler(e: Event): void {
    const { _association } = this;
    if (!_association) {
      return;
    }
    const input = e.target as AnypointCheckboxElement;
    const name = input.name as 'multiple' | 'required';
    const { checked } = input;
    if (_association[name] === checked) {
      return;
    }
    _association[name] = checked;
    this._notifyChanged();
    this.requestUpdate();
  }

  protected render(): TemplateResult {
    const { _association: item } = this;
    if (!item) {
      return html``;
    }
    const { info, multiple = false, required = false } = item;
    return html`
    <form name="data-association" @submit="${EventUtils.cancelEvent}" data-key="${item.key}">
      <anypoint-input class="input" name="name" .value="${info.name}" label="Association name" required autoValidate @change="${this._infoChangeHandler}"></anypoint-input>
      <anypoint-input class="input" name="displayName" .value="${info.displayName}" label="Display name (optional)" @change="${this._infoChangeHandler}"></anypoint-input>
      <anypoint-input class="input" name="description" .value="${info.description}" label="Association description (optional)" @change="${this._infoChangeHandler}"></anypoint-input>

      <div class="checkbox-group">
        <anypoint-checkbox name="required" .checked="${required}" title="Whether the association is required in the schema" @change="${this._checkedHandler}">Required</anypoint-checkbox>
        <anypoint-checkbox name="multiple" .checked="${multiple}" title="When set it declares this association as an array. Multiple instances of the value are permitted." @change="${this._checkedHandler}">Multiple</anypoint-checkbox>
      </div>
    </form>
    `;
  }
}
