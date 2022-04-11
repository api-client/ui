/* eslint-disable class-methods-use-this */
/*
Copyright 2022 Pawel Psztyc
Licensed under the CC-BY 2.0
*/
import { html, TemplateResult, LitElement, css, CSSResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { IUser } from '@api-client/core/build/browser.js';

export default class UserAvatarElement extends LitElement {
  static get styles(): CSSResult {
    return css`
    :host {
      display: inline-block;
      width: 40px;
      height: 40px;
    }

    .user-icon,
    .avatar-initials {
      background-color: var(--user-avatar-initials-background-color, #0540F2);
      color: var(--user-avatar-initials-color, #fff);
    }

    .avatar-initials {
      border-radius: 50%;
      text-transform: uppercase;
      font-size: large;
      border: 1px #0d47a1 solid;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .user-picture {
      border-radius: 50%;
      border: 1px #0d47a1 solid;
    }

    .user-icon {
      width: inherit;
      height: inherit;
    }
    `;
  }

  private _user?: IUser;

  /**
   * Set with the user. The computed user initials.
   */
  @state() protected userInitials?: string;

  /**
   * The URL to the user picture.
   */
  @state() protected userPicture?: string;

  /**
   * @attribute
   */
  @property({ type: Object })
  get user(): IUser | undefined {
    return this._user;
  }

  set user(value: IUser | undefined) {
    const old = this._user;
    if (old === value) {
      return;
    }
    if (old && value && old.key === value.key) {
      return;
    }
    this._user = value;
    this.requestUpdate('user', old);
    this._processUser(value);
  }

  protected _processUser(user?: IUser): void {
    if (user) {
      this.userInitials = this._readUserInitials(user);
      this.userPicture = user.picture && user.picture.url;
    } else {
      this.userInitials = undefined;
      this.userPicture = undefined;
    }
  }

  protected _readUserInitials(user: IUser): string | undefined {
    const { name } = user;
    if (!name) {
      return undefined;
    }
    const max = 2;
    const parts = name.split(/[\s-]/).slice(0, max).filter(i => !!i).map(i => i[0]);
    return parts.join('');
  }

  protected _pictureError(): void {
    this.userPicture = undefined;
  }

  /**
   * @return Template result for an icon
   */
  render(): TemplateResult {
    const { user, userPicture } = this;
    if (!user || user.key === 'default') {
      return html``;
    }
    if (userPicture) {
      return this.pictureTemplate(userPicture);
    }
    if (this.userInitials) {
      return this.nameTemplate(this.userInitials)
    }
    return this.nameTemplate('')
  }

  protected pictureTemplate(url: string): TemplateResult {
    return html`
    <img src="${url}" alt="${this.userInitials || 'Thumb'}" class="user-picture user-icon" @error="${this._pictureError}"/>
    `;
  }

  /**
   * Renders a bubble with user initials
   * @param initials The user initials
   */
  protected nameTemplate(initials: string): TemplateResult {
    return html`
    <span class="avatar-initials user-icon">${initials}</span>
    `;
  }
}
