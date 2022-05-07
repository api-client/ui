import { TemplateResult, html, CSSResult, css, } from 'lit';
import { property, state } from 'lit/decorators.js';
import { AnypointDialogElement, AnypointDialogStylesInternal } from '@anypoint-web-components/awc';
import '@anypoint-web-components/awc/dist/define/anypoint-input.js';
import '@anypoint-web-components/awc/dist/define/anypoint-button.js';
import { IconsMap, DefaultNamesMap, AddLabelsMap } from '../files/FileMaps.js';
import '../../define/api-icon.js';

/**
 * A dialog that requests the user for the file name.
 * It is intended to create a new file in the API store.
 * 
 * Listen to the `closed` on the dialog. The CustomEvent has the `detail`
 * object with the `closingReason` retails:
 * - canceled: whether the dialog was cancelled (ESC, outside click, dismiss button)
 * - confirmed: whether the dialog was confirmed by the user
 * - value: The entered name value
 * 
 * The application should handle the event and trigger file create flow.
 * 
 * ```javascript
 * const dialog = document.createElement('add-file-dialog');
 * dialog.kind = 'Core#Project';
 * dialog.opened = true;
 * document.body.appendChild(dialog);
 * dialog.addEventListener('closed', (ev: Event) => {
 *   document.body.removeChild(dialog);
 *   const event = ev as CustomEvent;
 *   const { canceled, confirmed, value } = event.detail;
 *   if (!canceled && confirmed && value) {
 *     // trigger the flow
 *   }
 * });
 * ```
 */
export default class AddFileDialogElement extends AnypointDialogElement {
  static get styles(): CSSResult[] {
    return [
      AnypointDialogStylesInternal,
      css`
      :host {
        max-width: 480px;
        width: 100%;
        border-radius: 8px;
      }

      :host > h2 {
        display: flex;
        align-items: center;
      }

      .file-icon {
        margin-right: 12px;
      }

      .file-name {
        margin: 0;
        width: 100%;
      }

      :host > .buttons {
        padding: 36px 12px 20px 12px;
      }
      `,
    ];
  }

  /**
   * The file kind to add
   * @attribute
   */
  @property({ type: String }) kind?: string;

  @state() name?: string;

  private get hasValue(): boolean {
    const { name } = this;
    if (!name) {
      return false;
    }
    return name.trim().length > 0;
  }

  /**
   * The name entered by the user.
   */
  get nameValue(): string | undefined {
    return this.name;
  }

  protected _inputHandler(e: Event): void {
    const input = e.target as HTMLInputElement;
    this.name = input.value;
    
  }

  protected _inputKeydownHandler(e: KeyboardEvent): void {
    const confirm = (e.ctrlKey || e.metaKey) && e.key === 'Enter';
    if (!confirm || !this.hasValue) {
      return;
    }
    this.closingReason = {
      confirmed: true,
      canceled: false,
      value: this.name,
    };
    this.close();
  }

  _finishRenderClosed(): void {
    const { closingReason } = this;
    if (closingReason) {
      if (closingReason.confirmed && !closingReason.canceled) {
        closingReason.value = this.name;
      }
    }
    super._finishRenderClosed();
  }

  render(): TemplateResult {
    const { kind } = this;
    if (!kind || !AddLabelsMap[kind]) {
      return html``;
    }
    const label = AddLabelsMap[kind];
    const icon = IconsMap[kind];
    const placeholder = DefaultNamesMap[kind];
    
    return html`
      <h2>
        <api-icon class="file-icon" icon="${icon}"></api-icon>
        Add a new ${label}
      </h2>
      <section>
        <anypoint-input 
          class="file-name" 
          type="text" 
          name="name" 
          infoMessage="The name for the ${label}"
          invalidMessage="The name is required. Please, enter ${label} name." 
          required 
          autoValidate
          placeholder="${placeholder}"
          @input="${this._inputHandler}"
          @keydown="${this._inputKeydownHandler}"
          label="${label} name"
        >
        </anypoint-input>
      </section>
      <div class="buttons">
        <anypoint-button ?anypoint="${this.anypoint}" data-dialog-dismiss>Cancel</anypoint-button>
        <anypoint-button ?anypoint="${this.anypoint}" ?disabled="${!this.hasValue}" data-dialog-confirm>Confirm</anypoint-button>
      </div>
    `;
  }
}
