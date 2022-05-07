import { TemplateResult, html, CSSResult, css, } from 'lit';
import { property, state } from 'lit/decorators.js';
import { AnypointDialogElement, AnypointDialogStylesInternal } from '@anypoint-web-components/awc';
import '@anypoint-web-components/awc/dist/define/anypoint-input.js';
import '@anypoint-web-components/awc/dist/define/anypoint-button.js';
import '../../define/api-icon.js';

/**
 * A dialog that requests the user for the new name.
 * 
 * Listen to the `closed` on the dialog. The CustomEvent has the `detail`
 * object with the `closingReason` retails:
 * - canceled: whether the dialog was cancelled (ESC, outside click, dismiss button)
 * - confirmed: whether the dialog was confirmed by the user
 * - value: The entered name value
 * 
 * The application should handle the event and trigger name change flow.
 * 
 * ```javascript
 * const dialog = document.createElement('rename-file-dialog');
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
export default class RenameDialogElement extends AnypointDialogElement {
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
   * The previous name
   * @attribute
   */
  @property({ type: String }) name?: string;

  @state() newValue?: string;

  private get hasValue(): boolean {
    const { newValue } = this;
    if (!newValue) {
      return false;
    }
    return newValue.trim().length > 0;
  }

  protected _inputHandler(e: Event): void {
    const input = e.target as HTMLInputElement;
    this.newValue = input.value;
  }

  protected _inputKeydownHandler(e: KeyboardEvent): void {
    const confirm = (e.ctrlKey || e.metaKey) && e.key === 'Enter';
    if (!confirm || !this.hasValue) {
      return;
    }
    this.closingReason = {
      confirmed: true,
      canceled: false,
      value: this.newValue,
    };
    this.close();
  }

  _finishRenderClosed(): void {
    const { closingReason } = this;
    if (closingReason) {
      if (closingReason.confirmed && !closingReason.canceled) {
        closingReason.value = this.newValue;
      }
    }
    super._finishRenderClosed();
  }

  render(): TemplateResult {
    const value = this.newValue || this.name;
    return html`
      <h2>Rename</h2>
      <section>
        <anypoint-input 
          class="file-name" 
          type="text" 
          name="name"
          invalidMessage="The name is required. Please, enter the name." 
          required 
          autoValidate
          @input="${this._inputHandler}"
          @keydown="${this._inputKeydownHandler}"
          .value="${value}"
          label="Enter new name"
        >
        </anypoint-input>
      </section>
      <div class="buttons">
        <anypoint-button ?anypoint="${this.anypoint}" data-dialog-dismiss>Cancel</anypoint-button>
        <anypoint-button ?anypoint="${this.anypoint}" ?disabled="${!this.hasValue}" data-dialog-confirm>OK</anypoint-button>
      </div>
    `;
  }
}
