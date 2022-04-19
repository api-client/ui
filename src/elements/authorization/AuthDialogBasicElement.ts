/* eslint-disable class-methods-use-this */
import { html, TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { IBasicAuthorization } from '@api-client/core/build/browser.js';
import '@anypoint-web-components/awc/dist/define/anypoint-input.js';
import '@anypoint-web-components/awc/dist/define/anypoint-masked-input.js';
import { AuthDialogElement, inputHandler } from './AuthDialogElement.js';

export default class AuthDialogBasicElement extends AuthDialogElement {
  /** 
   * User login
   */
  @property({ type: String }) username = '';

  /** 
   * User password
   */
  @property({ type: String }) password = '';

  serialize(): IBasicAuthorization {
    return {
      username: this.username,
      password: this.password,
    };
  }

  authFormTemplate(): TemplateResult {
    const { password, username, anypoint, outlined } = this;
    return html`
    <anypoint-input
      type="text"
      name="username"
      .value="${username}"
      ?anypoint="${anypoint}"
      ?outlined="${outlined}"
      @change="${this[inputHandler]}"
    >
      <label slot="label">User Name</label>
    </anypoint-input>
    <anypoint-masked-input
      .value="${password}"
      name="password"
      ?anypoint="${anypoint}"
      ?outlined="${outlined}"
      @change="${this[inputHandler]}"
    >
      <label slot="label">Password</label>
    </anypoint-masked-input>
    `;
  }
}
