import { TemplateResult, html, CSSResult, css, } from 'lit';
import { AnypointDialogElement } from '@anypoint-web-components/awc';
import dialogStyles from '@anypoint-web-components/awc/dist/styles/AnypointDialogInternalStyles.js';
import '@anypoint-web-components/awc/dist/define/anypoint-button.js';
import '../../define/api-icon.js';

/**
 * A dialog that requests the user to confirm a delete action.
 * 
 * Listen to the `closed` on the dialog. The CustomEvent has the `detail`
 * object with the `closingReason` retails:
 * - canceled: whether the dialog was cancelled (ESC, outside click, dismiss button)
 * - confirmed: whether the dialog was confirmed by the user
 * 
 * The application should handle the event and trigger delete flow.
 * 
 * ```javascript
 * const dialog = document.createElement('confirm-delete-dialog');
 * dialog.opened = true;
 * document.body.appendChild(dialog);
 * dialog.addEventListener('closed', (ev: Event) => {
 *   document.body.removeChild(dialog);
 *   const event = ev as CustomEvent;
 *   const { canceled, confirmed } = event.detail;
 *   if (!canceled && confirmed) {
 *     // trigger the flow
 *   }
 * });
 * ```
 */
export default class ConfirmDeleteDialogElement extends AnypointDialogElement {
  static get styles(): CSSResult[] {
    return [
      dialogStyles,
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

  render(): TemplateResult {
    return html`
      <h2>Confirm delete</h2>
      <section>
        <p>Are you sure you want to delete this?</p>
      </section>
      <div class="buttons">
        <anypoint-button ?anypoint="${this.anypoint}" data-dialog-dismiss>Cancel</anypoint-button>
        <anypoint-button ?anypoint="${this.anypoint}" data-dialog-confirm>Delete</anypoint-button>
      </div>
    `;
  }
}
