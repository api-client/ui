import { TemplateResult, html, CSSResult, css, } from 'lit';
import { AnypointDialogElement, AnypointDialogStylesInternal } from '@anypoint-web-components/awc';
import { property } from 'lit/decorators.js';
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
   * The type of the delete dialog. Renders a specialized view for the deleting type.
   */
  @property({ type: String, reflect: true }) type?: 'files';

  /**
   * General purpose name of the objects to list as to delete.
   */
  @property({ type: Array }) names?: string[];

  render(): TemplateResult {
    return html`
      <h2>Confirm delete</h2>
      <section>
        ${this._contentTemplate()}
      </section>
      <div class="buttons">
        <anypoint-button ?anypoint="${this.anypoint}" data-dialog-dismiss>Cancel</anypoint-button>
        <anypoint-button ?anypoint="${this.anypoint}" data-dialog-confirm>Delete</anypoint-button>
      </div>
    `;
  }

  protected _contentTemplate(): TemplateResult {
    switch (this.type) {
      case 'files': return this._filesTemplate();
      default: return this._fallbackTemplate();
    }
  }

  protected _filesTemplate(): TemplateResult {
    const { names=[] } = this;
    if (!names.length) {
      return html`<slot><p>Are you sure you want to delete these files?</p></slot>`;
    }
    if (names.length === 1) {
      return html`
      <p>Confirm moving <b>${names[0]}</b> to trash.</p>
      `;
    }
    return html`
    <p>Files to be moved to thrash:</p>
    <ul>
      ${names.map(n => html`<li>${n}</li>`)}
    </ul>
    `;
  }

  protected _fallbackTemplate(): TemplateResult {
    return html`<slot><p>Are you sure you want to delete this?</p></slot>`;
  }
}
