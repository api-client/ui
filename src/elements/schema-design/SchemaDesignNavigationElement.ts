import { html, TemplateResult, css, CSSResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { 
  DataEntity,
  DataEntityKind,
  DataModel,
  DataModelKind,
  DataNamespace,
  DataNamespaceKind,
} from '@api-client/core/build/browser.js';
import '@anypoint-web-components/awc/dist/define/anypoint-icon-button.js';
// import { Events } from '../../events/Events.js';
import '../../define/api-icon.js';
import AppNavigation from '../navigation/AppNavigationElement.js';
import theme from '../theme.js';
import { Events } from '../../events/Events.js';

export default class SchemaDesignNavigationElement extends AppNavigation {
  static get styles(): CSSResult[] {
    return [
      ...AppNavigation.styles,
      theme,
      css`
      :host {
        display: block;
      }

      li {
        padding-left: 0 !important;
      }
      `,
    ];
  }

  /**
   * The instance of the root DataNamespace.
   */
  @property({ type: Object }) root?: DataNamespace;

  /**
   * The key of the selected namespace.
   */
  @property({ type: String }) parentNamespace?: string;

  @state() protected _nsSelectorOpened?: boolean;

  connectedCallback(): void {
    super.connectedCallback();
    this.setAttribute('aria-label', 'Schema model');
  }

  protected _toggleNsSelector(): void {
    this._nsSelectorOpened = !this._nsSelectorOpened;
  }

  protected _commitName(key: string, kind: string, name: string): void {
    const { root } = this;
    if (!root) {
      return;
    }
    if (!name) {
      return;
    }
    if (kind === DataNamespaceKind) {
      const object = key === root.key ? root : root.findNamespace(key);
      if (!object) {
        throw new Error(`Invalid state. Namespace not found.`);
      }
      object.info.name = name;
    } else if (kind === DataModelKind) {
      const object = root.findDataModel(key);
      if (!object) {
        throw new Error(`Invalid state. Data model not found.`);
      }
      object.info.name = name;
    } else if (kind === DataEntityKind) {
      const object = root.definitions.entities.find(e => e.key === key);
      if (!object) {
        throw new Error(`Invalid state. Entity not found.`);
      }
      object.info.name = name;
    } else {
      throw new Error(`Invalid state. Unknown kind.`);
    }
    this.edited = undefined;
    Events.SchemaDesign.changed(this);
    Events.SchemaDesign.State.nameChanged(key, kind, this);
  }

  render(): TemplateResult | string {
    const { root } = this;
    if (!root) {
      return html``;
    }
    return html`
      <div class="section-title">Namespace</div>
      ${this._namespaceTreeTemplate(root)}
    `;
  }

  protected _namespaceTreeTemplate(root: DataNamespace): TemplateResult {
    const contents = this._nsItemTemplate(root, -1);
    return this._outerListTemplate(contents);
  }

  protected _nsChildrenTemplate(current: DataNamespace, indent: number): TemplateResult {
    const namespaces = current.listNamespaces();
    const dataModels = current.listDataModels();
    const contents: TemplateResult[] = [];
    namespaces.forEach(ns => {
      contents.push(this._nsItemTemplate(ns, indent));
    });
    dataModels.forEach(ns => {
      contents.push(this._dmItemTemplate(ns, indent));
    });
    return this._parentListItemTemplate(current.key, current.kind, current.info.name || 'Unnamed namespace', contents, {
      indent,
      parentIcon: 'schemaNamespace',
    });
  }

  protected _nsItemTemplate(item: DataNamespace, indent: number): TemplateResult {
    const hasChildren = item.items.some(i => [DataNamespaceKind, DataModelKind].includes(i.kind));
    if (hasChildren) {
      return this._nsChildrenTemplate(item, indent + 1);
    }
    const label = item.info.name || 'Unnamed namespace';
    const content = this._itemContentTemplate('schemaNamespace', label);
    return this._listItemTemplate(item.key, item.kind, label, content, {
      indent: indent + 1,
    });
  }

  protected _dmItemTemplate(current: DataModel, indent: number): TemplateResult {
    const hasChildren = !!current.entities.length;
    const label = current.info.name || 'Unnamed data model';
    if (!hasChildren) {
      const content = this._itemContentTemplate('schemaModel', label);
      return this._listItemTemplate(current.key, current.kind, label, content, {
        indent: indent + 1,
      });
    }
    const entities = current.entities.map(i => this._entityItemTemplate(i, indent + 1));
    return this._parentListItemTemplate(current.key, current.kind, label, entities, {
      indent,
      parentIcon: 'schemaModel',
    });
  }

  protected _entityItemTemplate(item: DataEntity, indent: number): TemplateResult {
    const label = item.info.name || 'Unnamed entity';
    const content = this._itemContentTemplate('schemaEntity', label);
    return this._listItemTemplate(item.key, item.kind, label, content, {
      indent: indent + 1,
      draggable: true,
    });
  }
}
