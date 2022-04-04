/*
Copyright 2022 Pawel Psztyc
Licensed under the CC-BY 2.0
*/
import { html, TemplateResult, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { IUser } from '@api-client/core/build/browser.js';

export default class UserAvatarElement extends LitElement {
  /**
   * @attribute
   */
  @property({ type: Object })
  user?: IUser;

  /**
   * @return Template result for an icon
   */
  render(): TemplateResult {
    const { user } = this;
    if (!user || user.key === 'default') {
      return html``;
    }
    // eslint-disable-next-line no-console
    console.warn(`Implement me!`);
    return html`TODO`;
  }
}
