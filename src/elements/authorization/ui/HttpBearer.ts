import { IBearerAuthorization } from '@api-client/core/build/browser.js';
import { html, TemplateResult } from 'lit';
import { passwordTemplate } from '../CommonTemplates.js';
import AuthUiBase from './AuthUiBase.js';

export default class HttpBearer extends AuthUiBase {
  /** 
   * The token to use with the authorization process.
   */
  token = '';

  defaults(): void {
    this.token = '';
  }

  /**
   * Restores previously serialized Basic authentication values.
   * @param state Previously serialized values
   */
  restore(state: IBearerAuthorization): void {
    this.token = state.token;
    this.notifyChange();
  }

  /**
   * Serialized input values
   * @return An object with user input
   */
  serialize(): IBearerAuthorization {
    return {
      token: this.token || '',
    };
  }

  reset(): void {
    this.token = '';
    this.notifyChange();
  }

  render(): TemplateResult {
    const ctx = this;
    const { token, readOnly, disabled } = this;
    const tokenConfig = {
      required: true,
      autoValidate: true,
      invalidLabel: 'Token is required',
      classes: { block: true },
      readOnly,
      disabled,
    };
    return html` <form autocomplete="on" class="bearer-auth">
      ${passwordTemplate(
        'token',
        token,
        'Token',
        ctx.changeHandler,
        tokenConfig
      )}
    </form>`;
  }
}
