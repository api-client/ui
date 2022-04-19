import { html, TemplateResult } from 'lit';
import { IBasicAuthorization } from '@api-client/core/build/browser.js';
import { inputTemplate, passwordTemplate } from '../CommonTemplates.js';
import AuthUiBase from './AuthUiBase.js';

export default class HttpBasic extends AuthUiBase {
  /** 
   * The value of the username filed.
   */
  password = '';

  /** 
   * The value of the password filed.
   */
  username = '';

  defaults(): void {
    this.password = '';
    this.username = '';
  }
  
  /**
   * Restores previously serialized Basic authentication values.
   * @param state Previously serialized values
   */
  restore(state: IBasicAuthorization): void {
    this.password = state.password || '';
    this.username = state.username || '';
  }

  /**
   * Serialized input values
   * @returns An object with user input
   */
  serialize(): IBasicAuthorization {
    return {
      password: this.password || '',
      username: this.username || '',
    };
  }

  reset(): void {
    this.password = '';
    this.username = '';
    this.notifyChange();
  }

  render(): TemplateResult {
    const ctx = this;
    const {
      username,
      password,
      readOnly,
      disabled,
    } = this;
    const uConfig = {
      required: true,
      autoValidate: true,
      invalidLabel: 'Username is required',
      classes: { block: true },
      readOnly,
      disabled,
    };
    return html`
    <form autocomplete="on" class="basic-auth">
      ${inputTemplate(
        'username',
        username,
        'User name',
        ctx.changeHandler,
        uConfig
      )}
      ${passwordTemplate(
        'password',
        password,
        'Password',
        ctx.changeHandler,
        {
          classes: { block: true },
          readOnly,
          disabled,
        }
      )}
    </form>`;
  }
}
