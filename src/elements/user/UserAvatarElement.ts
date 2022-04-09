/* eslint-disable class-methods-use-this */
/*
Copyright 2022 Pawel Psztyc
Licensed under the CC-BY 2.0
*/
import { html, TemplateResult, LitElement, css, CSSResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { IUser } from '@api-client/core/build/browser.js';
import { AnypointListboxElement } from '@anypoint-web-components/awc'
import '@anypoint-web-components/awc/dist/define/anypoint-dropdown.js';
import '@anypoint-web-components/awc/dist/define/anypoint-listbox.js';
import '@anypoint-web-components/awc/dist/define/anypoint-item.js';
import '../../define/api-icon.js';
import { Events } from '../../events/Events.js';

export default class UserAvatarElement extends LitElement {
  static get styles(): CSSResult {
    return css`
    :host {
      display: inline-block;
      --anypoint-item-padding: 0px 24px;
    }

    .avatar-initials {
      background-color: var(--user-avatar-initials-background-color, #0540F2);
      color: var(--user-avatar-initials-color, #fff);
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

    .settings,
    .user-picture {
      border-radius: 50%;
      border: 1px #0d47a1 solid;
    }

    .settings {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .user-icon {
      width: 40px;
      height: 40px;
    }

    .profile-dropdown-content {
      background-color: var( --anypoint-listbox-background-color, var(--primary-background-color) );
      color: var(--anypoint-listbox-color, var(--primary-text-color));
      box-sizing: border-box;
      box-shadow: var(--anypoint-dropdown-shadow, var(--anypoint-dropdown-shadow));
      border-radius: var(--anypoint-dropdown-border-radius, 4px);
    }

    .profile-card {
      display: flex;
      align-items: center;
      padding: 20px 40px;
      min-width: 320px;
      border-bottom: 1px #e5e5e5 solid;
    }

    .user-avatar.card-avatar .user-icon {
      width: 80px;
      height: 80px;
    }

    .card-id {
      margin-left: 20px;
    }
    `;
  }

  private _user?: IUser;

  /**
   * Whether has user information
   */
  @state() protected hasUser = false;

  /**
   * Set with the user. The computed user initials.
   */
  @state() protected userInitials?: string;

  /**
   * Whether the main dropdown is opened
   */
  @property({ type: Boolean }) opened = false;

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
    this.hasUser = !!user;
    if (user) {
      this.userInitials = this._readUserInitials(user);
    } else {
      this.userInitials = undefined;
    }
  }

  protected _readUserInitials(user: IUser): string | undefined {
    const { name } = user;
    if (!name) {
      return undefined;
    }
    const parts = name.split(/[\s-]/).slice(0, 3).filter(i => !!i).map(i => i[0]);
    return parts.join('');
  }

  protected _profileClickHandler(): void {
    this.opened = true;
  }

  protected _profileKeydownHandler(e: KeyboardEvent): void {
    if (e.key === 'Enter') {
      this.opened = true;
    }
  }

  protected _dropdownClosedHandler(): void {
    this.opened = false;
  }

  protected _dropdownSelectHandler(e: Event): void {
    this.opened = false;
    const list = e.target as AnypointListboxElement;
    const selected = list.selected as string;
    list.selected = undefined;
    switch (selected) {
      default: Events.Navigation.Store.config(); break;
    }
  }

  /**
   * @return Template result for an icon
   */
  render(): TemplateResult {
    const { user } = this;
    if (!user || user.key === 'default') {
      return html``;
    }
    return html`
    <div class="user-avatar" tabindex="0" @click="${this._profileClickHandler}" @keydown="${this._profileKeydownHandler}" title="Account">
      ${this.userAvatarTemplate()}
    </div>
    ${this.profileDropdownTemplate()}
    `;
  }

  protected userAvatarTemplate(): TemplateResult {
    if (!this.hasUser) {
      return this.settingsTemplate();
    }
    const { picture } = this.user!;
    if (picture && picture.url) {
      return this.pictureTemplate(picture.url);
    }
    if (this.userInitials) {
      return this.nameTemplate(this.userInitials!)
    }
    return this.settingsTemplate();
  }

  protected settingsTemplate(): TemplateResult {
    return html`
    <div class="settings user-icon">
      <api-icon icon="settings"></api-icon>
    </div>
    `;
  }

  protected pictureTemplate(url: string): TemplateResult {
    const styles = {
      background: `center / contain no-repeat url(${url})`,
    }
    return html`
    <div class="user-picture user-icon" style="${styleMap(styles)}"></div>
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

  protected profileDropdownTemplate(): TemplateResult {
    const { opened, user } = this;
    return html`
    <anypoint-dropdown 
      .opened="${opened}"
      dynamicAlign
      @closed="${this._dropdownClosedHandler}"
      @select="${this._dropdownSelectHandler}"
    >
      <div class="profile-dropdown-content" slot="dropdown-content">
        ${this.userCardTemplate(user)}
        <anypoint-listbox class="dropdown-content" attrForSelected="data-action">
          <anypoint-item data-action="store-config">Store configuration</anypoint-item>
          <slot name="option"></slot>
        </anypoint-listbox>
      </div>
    </anypoint-dropdown>
    `;
  }

  protected userCardTemplate(user?: IUser): TemplateResult | string {
    if (!user) {
      return '';
    }
    const { name, email } = user;
    return html`
    <div class="profile-card">
      <div class="user-avatar card-avatar">
        ${this.userAvatarTemplate()}
      </div>
      <div class="card-id">
        ${name || (email && email[0] && email[0].email)}
      </div>
    </div>
    `;
  }
}
