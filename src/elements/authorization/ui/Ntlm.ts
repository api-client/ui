import { INtlmAuthorization } from '@api-client/core/build/browser.js';
import { html, TemplateResult } from 'lit';
import { inputTemplate, passwordTemplate } from '../CommonTemplates.js';
import AuthUiBase from './AuthUiBase.js';

export default class Ntlm extends AuthUiBase {
  /** 
   * The value of the username filed.
   */
  password = '';

  /** 
   * The value of the password filed.
   */
  username = '';

  /** 
   * The NT domain.
   */
  domain = '';

  defaults(): void {
    this.username = '';
    this.password = '';
    this.domain = '';
  }

  /**
   * Restores previously serialized Basic authentication values.
   * @param state Previously serialized values
   */
  restore(state: INtlmAuthorization): void {
    this.password = state.password || '';
    this.username = state.username || '';
    this.domain = state.domain || '';
    this.notifyChange();
  }

  /**
   * Serialized input values
   * @return An object with user input
   */
  serialize(): INtlmAuthorization {
    return {
      password: this.password || '',
      username: this.username || '',
      domain: this.domain || '',
    };
  }

  reset(): void {
    this.password = '';
    this.username = '';
    this.domain = '';
    this.notifyChange();
  }

  render(): TemplateResult {
    const ctx = this;
    const {
      username,
      password,
      domain,
      readOnly,
      disabled,
    } = this;
    const base = {
      classes: { block: true },
      readOnly,
      disabled,
    };
    const uName = inputTemplate('username', username, 'User name', ctx.changeHandler, {
      ...base,
      required: true,
      autoValidate: true,
      invalidLabel: 'Username is required',
    });
    const passwd = passwordTemplate('password', password, 'Password', ctx.changeHandler, base);
    const dm = inputTemplate('domain', domain, 'NT domain', ctx.changeHandler, base);
    return html` 
    <form autocomplete="on" class="ntlm-auth">
      ${uName}
      ${passwd}
      ${dm}
    </form>`;
  }
}
