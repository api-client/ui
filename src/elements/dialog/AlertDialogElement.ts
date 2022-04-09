import { html, css, CSSResult, TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { AnypointDialogElement, AnypointDialogStylesInternal } from '@anypoint-web-components/awc';
import '@anypoint-web-components/awc/dist/define/anypoint-button.js';

export const closedHandler = Symbol('closedHandler');

export default class AlertDialogElement extends AnypointDialogElement {
  static get styles(): CSSResult[] {
    return [
      AnypointDialogStylesInternal,
      css`
      :host {
        background-color: #F44336;
      }

      :host > h2,
      :host > * {
        color: #fff !important;
      }

      .message {
        font-family: monospace;
      }

      anypoint-button {
        color: #fff;
      }
      `,
    ];
  }

  @property({ type: String }) message?: string;
  

  constructor() {
    super();
    this[closedHandler] = this[closedHandler].bind(this);
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('closed', this[closedHandler]);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('closed', this[closedHandler]);
  }

  [closedHandler](): void {
    const { parentNode } = this;
    if (parentNode) {
      parentNode.removeChild(this);
    }
  }

  render(): TemplateResult {
    return html`
    <h2>An error ocurred</h2>
    <p class="message">${this.message}</p>
    <div class="buttons">
      <anypoint-button data-dialog-confirm ?anypoint="${this.anypoint}">Dismiss</anypoint-button>
    </div>
    `;
  }
}
