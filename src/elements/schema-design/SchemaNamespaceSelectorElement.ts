import { DataNamespace, DataNamespaceKind } from "@api-client/core/build/browser.js";
import { css, CSSResult, html, TemplateResult } from "lit";
import { property } from "lit/decorators.js";
import AppNavigation from "../navigation/AppNavigationElement.js";
import theme from '../theme.js';
import '../../define/api-icon.js';

/**
 * An element that specializes in rendering a navigation dropdown for the schema / data namespace.
 * 
 * @fires open - When the element is "open" property change internally through user interaction.
 */
export default class SchemaNamespaceSelectorElement extends AppNavigation {
  static get styles(): CSSResult[] {
    return [
      ...AppNavigation.styles,
      theme,
      css`
      :host(.opened) .toggle-icon {
        transform: rotate(180deg);
      }

      .selector-label {
        display: flex;
        align-items: center;
        width: 100%;
        height: 52px;
        background: transparent;
        border: none;
        padding: 0 20px;
      }

      .selector-label .label {
        flex: 1;
        text-align: left;
      }
      `,
    ];
  }

  /**
   * The instance of the root DataNamespace.
   */
  @property({ type: Object }) root?: DataNamespace;

  /**
   * When opened the selector render the selection tree, not only the label.
   * @attr
   */
  @property({ type: Boolean, reflect: true }) opened?: boolean;

  connectedCallback(): void {
    super.connectedCallback();
    this.setAttribute('aria-label', 'Namespace selection');
  }

  protected _toggleNsSelector(): void {
    this.opened = !this.opened;
    this.dispatchEvent(new Event('open'));
  }

  render(): TemplateResult | string {
    const { root, selected, opened } = this;
    if (!root) {
      return html``;
    }
    const parent = selected ? root.findNamespace(selected) : root;
    if (!parent) {
      // TODO: This should still render but with the invalid selection state so the user
      // can change the selection.
      return html``;
    }
    return html`
      <div class="section-title">Namespace</div>
      <button class="selector-label" @click="${this._toggleNsSelector}">
        <span class="label">${parent.info.name}</span>
        <api-icon icon="arrowDropDown" class="toggle-icon"></api-icon>
      </button>

      ${opened ? this._namespaceTreeTemplate(root) : ''}
    `;
  }

  protected _namespaceTreeTemplate(root: DataNamespace, indent: number = 0): TemplateResult {
    const children = root.listNamespaces();
    const contents = children.map(item => this._nsItemTemplate(item, indent));
    return this._outerListTemplate(contents);
  }

  protected _nsChildrenTemplate(item: DataNamespace, indent: number): TemplateResult {
    const children = item.listNamespaces();
    const contents = children.map(current => this._nsItemTemplate(current, indent));
    return this._parentListItemTemplate(item.key, item.kind, item.info.name || 'Unnamed namespace', contents, {
      indent,
    });
  }

  protected _nsItemTemplate(item: DataNamespace, indent: number): TemplateResult {
    const hasChildren = item.items.some(i => i.kind === DataNamespaceKind);
    if (hasChildren) {
      return this._nsChildrenTemplate(item, indent + 1);
    }
    const label = item.info.name || 'Unnamed namespace';
    const content = this._itemContentTemplate('schemaNamespace', label);
    return this._listItemTemplate(item.key, item.kind, label, content, {
      indent,
    });
  }
}
