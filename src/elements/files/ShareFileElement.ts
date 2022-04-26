/* eslint-disable class-methods-use-this */
import { TemplateResult, html, CSSResult, css, PropertyValueMap, } from 'lit';
import { property, state } from 'lit/decorators.js';
import { AnypointDialogElement, AnypointListboxElement, AnypointDropdownElement } from '@anypoint-web-components/awc';
import { 
  IFile, Events as CoreEvents, IUser, AccessOperation, IAccessAddOperation, PermissionRole, IPermission,
  IBackendEvent, ProjectKind, WorkspaceKind, IApplication,
} from '@api-client/core/build/browser.js';
import { Patch } from '@api-client/json';
import dialogStyles from '@anypoint-web-components/awc/dist/styles/AnypointDialogInternalStyles.js';
import { Events } from '../../events/Events.js';
import { EventTypes } from '../../events/EventTypes.js';
import { randomString } from '../../lib/Random.js';
import '@anypoint-web-components/awc/dist/define/anypoint-button.js';
import '@anypoint-web-components/awc/dist/define/anypoint-dropdown.js';
import '@anypoint-web-components/awc/dist/define/anypoint-item.js';
import '@anypoint-web-components/awc/dist/define/anypoint-item-body.js';
import '@anypoint-web-components/awc/dist/define/anypoint-icon-item.js';
import '@anypoint-web-components/awc/dist/define/anypoint-listbox.js';
import '@anypoint-web-components/awc/dist/define/anypoint-chip.js';
import '@anypoint-web-components/awc/dist/define/anypoint-dropdown-menu.js';
import '@anypoint-web-components/awc/dist/define/material-ripple.js';

function cancel(e: Event): void {
  e.preventDefault();
  e.stopPropagation();
}

/**
 * A dialog that shows users that the file is shared with and allows to share a file.
 * 
 * Listen to the `closed` on the dialog. The CustomEvent has the `detail`
 * object with the `closingReason` retails:
 * - canceled: whether the dialog was cancelled (ESC, outside click, dismiss button)
 * - confirmed: whether the dialog was confirmed by the user
 * 
 * ```javascript
 * const dialog = document.createElement('share-file');
 * dialog.key = 'file key';
 * // or
 * dialog.file = file;
 * dialog.appInfo="${AppInfo}"
 * dialog.opened = true;
 * document.body.appendChild(dialog);
 * dialog.addEventListener('closed', (ev: Event) => {
 *   document.body.removeChild(dialog);
 * });
 * ```
 */
export default class ShareFileElement extends AnypointDialogElement {
  static get styles(): CSSResult[] {
    return [
      dialogStyles,
      css`
      :host {
        max-width: 640px;
        width: 100%;
        border-radius: 8px;
        --anypoint-item-padding: 0 20px;
      }

      :host > h2 {
        display: flex;
        align-items: center;
      }

      :host > .buttons {
        margin-top: 20px;
        align-items: center;
      }

      .share-icon {
        margin-right: 12px;
      }

      .user-name {
        margin: 0;
        width: 100%;
      }

      .list-shadow {
        box-shadow: 0 3px 6px rgb(0 0 0 / 16%), 0 3px 6px rgb(0 0 0 / 23%);
      }

      .suggestions-list {
        border-bottom-left-radius: 4px;
        border-bottom-right-radius: 4px;
      }

      .highlight {
        background-color: #e3f2fd;
      }

      .input-line {
        display: flex;
        align-items: center;
      }

      .name-input {
        flex: 1;
      }

      .input-wrapper {
        display: flex;
        flex-wrap: wrap;
        flex-direction: row;
        background: #f1f3f4;
        border-bottom: 1px solid;
        border-radius: 6px 6px 0 0;
        padding: 0 12px;
      }

      .input-wrapper:focus-within {
        border-bottom-color: var(--accent-color);
      }

      .input-wrapper input {
        height: 41px;
        border: none;
        outline: none;
        background: transparent;
        flex: 1;
      }

      .chip {
        outline: none;
        margin: 4px;
        box-sizing: border-box;
        border-radius: 16px;
        background-color: var(--anypoint-chip-background-color, rgba(35, 47, 52, 0.12));
        border: var(--anypoint-chip-border, none);
        height: inherit;
        min-height: 32px;
        display: flex;
        align-items: center;
      }

      .chip .label {
        padding: 0px 12px;
        font-weight: normal;
      }

      .chip .close {
        width: 16px;
        height: 16px;
        margin-right: 8px;
      }

      .current-users {
        margin-top: 20px;
      }

      .permission-item {
        display: flex;
        align-items: center;
        height: 52px;
      }

      .user-icon {
        margin-right: 12px;
      }

      .permission-user {
        display: flex;
        flex-direction: column;
        flex: 1;
      }

      .user-name {
        color: var(--primary-text-color, #000);
        font-size: medium;
      }
      
      .user-email {
        color: var(--secondary-text-color, #000);
        font-size: small;
        margin-top: 2px;
      }

      .user-role {
        height: 100%;
      }

      .role-selector {
        width: 110px;
        margin: 0px 0px 0px 12px;
      }

      .user-role-selector {
        position: relative;
        height: 100%;
        display: flex;
        align-items: center;
        text-transform: capitalize;
      }

      .role-selector .role-label {
        padding: 0 12px;
        flex: 1;
      }

      .role-selector .drop-icon {
        margin-right: 12px;
      }

      .roles-list {
        min-width: 320px;
        padding: 8px 0;
        border-radius: 8px;
      }

      .role-item {
        text-transform: capitalize;
      }

      .list-separator {
        height: 1px;
        background-color: rgba(35, 47, 52, 0.12);
        margin: 4px 0;
      }

      .pending-info {
        margin-right: 12px;
        font-style: italic;
      }
      `,
    ];
  }

  private _key?: string;

  @property({ type: String }) 
  get key(): string | undefined {
    return this._key;
  }

  set key(value: string | undefined) {
    const old = this._key;
    if (old === value) {
      return;
    }
    this._key = value;
    this._processFileKey(value);
  }

  protected _file?: IFile;

  /**
   * When known, set this instead of the `key` to skip requesting the file info.
   * Also. when file is set and then the `key` is set the HTTP request won't be made.
   */
  @property({ type: Object }) 
  get file(): IFile | undefined {
    return this._file;
  }

  set file(value: IFile | undefined) {
    const old = this._file;
    if (old === value) {
      return;
    }
    if (old && value && old.key === value.key) {
      return;
    }
    this._file = value;
    if (value) {
      this._requestFileUsers(value.key);
    }
  }

  /**
   * The current user to filter out the user from the suggestions and the shared list.
   */
  @property({ type: Object }) user?: IUser;

  /**
   * This property is required for the API access to work.
   * Set it to the current application information.
   * 
   * It will throw an error when trying to patch access without setting this property.
   */
  @property({ type: Object }) appInfo?: IApplication;

  /**
   * A flag set when requesting the the file meta
   */
  @state() loadingFile = false;

  /**
   * A flag set when requesting the current list of users for the file.
   */
  @state() loadingFileUsers = false;

  /**
   * Computed value of whether currently loading file or file users.
   */
  get loading(): boolean {
    return this.loadingFile || this.loadingFileUsers;
  }

  /**
   * A reference to the input element set after the component was first rendered.
   */
  @state() protected input?: HTMLInputElement;

  /**
   * A reference to the suggestions listbox set after the component was first rendered.
   */
  @state() protected suggestionsList?: AnypointListboxElement;

  /**
   * The list of users to render in the suggestion box.
   */
  @state() protected userSuggestions?: IUser[];

  /**
   * Whether the suggestion box is opened.
   */
  @state() protected suggestionsOpened = false;

  /**
   * The list of users that were selected by the users to share the file with.
   */
  @state() protected selectedUsers?: IUser[];

  /**
   * The list of users that have permission to the file read from the store
   * when the component was initializing.
   */
  @state() protected permissionUsers: IUser[] = [];

  /**
   * A list of permissions to set on the users after the user confirms the change.
   * These are pending changes and only populated when the user changes any of the roles of 
   * an existing user.
   */
  @state() protected pendingPermissions?: AccessOperation[];

  /**
   * The last user query sent to the server. Used by the suggestions logic.
   */
  protected lastUserQuery?: string;

  /**
   * Computed value telling whether the main input should be disabled for the current conditions.
   */
  protected get inputDisabled(): boolean {
    const { file } = this;
    if (!file) {
      return true;
    }
    const { capabilities } = file;
    if (!capabilities) {
      return true;
    }
    return !capabilities.canShare;
  }

  /**
   * Computed value whether there are selected users
   */
  get hasSelectedUsers(): boolean {
    const { selectedUsers } = this;
    if (!Array.isArray(selectedUsers) || !selectedUsers.length)  {
      return false;
    }
    return true;
  }

  /**
   * Whether there are pending permissions to be set.
   */
  get hasPending(): boolean {
    const { pendingPermissions } = this;
    return !!pendingPermissions && !!pendingPermissions.length;
  }

  protected get fileId(): string {
    const { key, file } = this;
    if (!key && !file) {
      throw new Error(`Invalid state, file is not set.`);
    }
    return key || file!.key;
  }

  constructor() {
    super();
    this._fileMetaHandler = this._fileMetaHandler.bind(this);
  }

  protected firstUpdated(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
    this.input = this.shadowRoot!.querySelector('#userInput') as HTMLInputElement;
    this.suggestionsList = this.shadowRoot!.querySelector('.suggestions-list') as AnypointListboxElement;
    super.firstUpdated(_changedProperties);
  }

  connectedCallback(): void {
    super.connectedCallback();
    window.addEventListener(EventTypes.Store.File.State.change, this._fileMetaHandler);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener(EventTypes.Store.File.State.change, this._fileMetaHandler);
  }

  protected _fileMetaHandler(input: Event): void {
    const e = input as CustomEvent;
    const event = e.detail as IBackendEvent;
    if (event.operation === 'patch') {
      this._handleMetaPatch(event);
    }
  }

  protected _handleMetaPatch(event: IBackendEvent): void {
    const { kind, data, id } = event;
    if (![ProjectKind, WorkspaceKind].includes(kind)) {
      return;
    }
    if (this.fileId !== id) {
      return;
    }
    const file = this.file as IFile;
    const patch = data as Patch.JsonPatch;
    const result = Patch.apply(file, patch);
    this.file = result.doc as IFile;
    const hasPermission = patch.some(i => i.path.startsWith('/permissions'));
    if (hasPermission) {
      this._requestFileUsers(file.key);
    }
    this.requestUpdate();
  }

  protected _processFileKey(value?: string): void {
    if (!value) {
      this.file = undefined;
      this.selectedUsers = undefined;
      this.lastUserQuery = undefined;
      this.pendingPermissions = undefined;
      this.selectedUsers = undefined;
      this.userSuggestions = undefined;
      this.loadingFile = false;
      this.loadingFileUsers = false;
      this.permissionUsers = [];
      return;
    }
    this._requestFileInfo(value);
    this._requestFileUsers(value);
  }

  protected async _requestFileInfo(key: string): Promise<void> {
    if (this.file && this.file.key === key) {
      return;
    }
    this.loadingFile = true;
    try {
      this.file = await Events.Store.File.read(key, false);
    } catch (e) {
      CoreEvents.Telemetry.exception(this, (e as Error).message, true);
    } finally {
      this.loadingFile = false;
    }
  }

  protected async _requestFileUsers(key: string): Promise<void> {
    this.loadingFileUsers = true;
    try {
      const list = await Events.Store.File.listUsers(key);
      this.permissionUsers = list.data;
    } catch (e) {
      CoreEvents.Telemetry.exception(this, (e as Error).message, true);
    } finally {
      this.loadingFileUsers = false;
    }
    await this.updateComplete;
    this.refit();
  }

  protected _inputHandler(e: Event): void {
    const input = e.target as HTMLInputElement;
    const { value } = input;
    this.queryUsers(value);
  }

  protected _inputKeydown(e: KeyboardEvent): void {
    const { suggestionsOpened } = this;
    const list = this.suggestionsList!;
    const input = e.target as HTMLInputElement;
    if (suggestionsOpened && e.key === 'ArrowDown') {
      list.highlightNext();
      e.preventDefault();
    } else if (suggestionsOpened && e.key === 'ArrowUp') {
      list.highlightPrevious();
      e.preventDefault();
    } else if (suggestionsOpened && e.key === 'Enter') {
      const { highlightedItem } = list;
      if (highlightedItem) {
        const index = Number(list.indexOf(list.highlightedItem!));
        list.selected = index;
        e.preventDefault();
      }
    } else if (e.key === 'Backspace') {
      if (!input.value) {
        e.preventDefault();
        this.removeLastSelectedUser();
      }
    } else if (!suggestionsOpened && e.key === 'ArrowDown') {
      this.queryUsers('');
    }
  }

  protected _suggestionsClosed(e: Event): void {
    this.suggestionsOpened = false;
    cancel(e);
  }

  protected _suggestionSelectHandler(e: CustomEvent): void {
    const list = e.target as AnypointListboxElement;
    const selected = Number(list.selected);
    if (Number.isNaN(selected)) {
      return;
    }
    this.suggestionsOpened = false;
    list.selected = undefined;
    this.input!.value = '';
    const user = this.userSuggestions![selected];
    if (!user) {
      return;
    }
    if (!this.selectedUsers) {
      this.selectedUsers = [user];
    } else {
      this.selectedUsers.push(user);
      this.render();
    }
  }

  protected _removeUserChip(e: Event): void {
    const node = e.target as HTMLElement;
    const { key } = node.dataset;
    if (!key) {
      return;
    }
    const users = this.selectedUsers!
    const index = users.findIndex(u => u.key === key);
    if (index >= 0) {
      users.splice(index, 1);
      if (!users.length) {
        this.selectedUsers = undefined;
      }
      this.requestUpdate();
    }
  }

  protected removeLastSelectedUser(): void {
    const { selectedUsers } = this;
    if (!selectedUsers || !selectedUsers.length) {
      return;
    }
    const index = selectedUsers.length - 1;
    selectedUsers.splice(index, 1);
    if (!selectedUsers.length) {
      this.selectedUsers = undefined;
    }
    this.requestUpdate();
  }

  protected async queryUsers(query: string): Promise<void> {
    const { lastUserQuery, selectedUsers, userSuggestions, user } = this;
    let users: IUser[] = [];
    this.lastUserQuery = query;
    if (lastUserQuery && userSuggestions && query.includes(lastUserQuery)) {
      const lower = query.toLowerCase();
      // filter the current list for the continues query.
      // Not necessary to query the server as we have all results.
      users = userSuggestions.filter((i) => {
        const { name, email } = i;
        if (name && name.toLowerCase().includes(lower)) {
          return true;
        }
        if (email) {
          for (const item of email) {
            if (item.email && item.email.toLowerCase().includes(lower)) {
              return true;
            }
          }
        }
        return false;
      });
    } else {
      const result = await Events.Store.User.list({
        query,
      });
      users = result.data;
    }
    if (selectedUsers) {
      users = users.filter(candidate => !selectedUsers.some(i => i.key === candidate.key));
    }
    if (user) {
      users = users.filter(candidate => candidate.key !== user.key);
    }
    if (users.length) {
      this.userSuggestions = users;
      this.suggestionsOpened = true;
    } else {
      this.userSuggestions = undefined;
      this.suggestionsOpened = false;
    }
  }

  protected getUserEmail(user: IUser): string | undefined {
    const { email } = user;
    if (!Array.isArray(email) || !email.length)  {
      return undefined;
    }
    const emails: string[] = [];
    // we first find a verified email and then we pick any email
    for (const item of email) {
      if (item.verified && item.email) {
        return item.email;
      }
      if (item.email) {
        emails.push(item.email);
      }
    }
    return emails[0];
  }

  protected _cancelShareUser(): void {
    this.selectedUsers = undefined;
    this.lastUserQuery = undefined;
    this.userSuggestions = undefined;
    this.suggestionsOpened = false;
  }

  protected _shareHandler(): void {
    const roleList = this.shadowRoot!.querySelector('.role-selector anypoint-listbox') as AnypointListboxElement;
    const role = roleList.selected as PermissionRole;
    this.share(role);
  }

  protected async share(role: PermissionRole): Promise<void> {
    if (!role) {
      throw new Error(`Invalid state. Role is not selected.`);
    }
    const { key, file, selectedUsers } = this;
    if (!selectedUsers || !selectedUsers.length) {
      this._cancelShareUser();
      return;
    }
    const { appInfo } = this;
    if (!appInfo) {
      throw new Error(`The appInfo is not set on the <share-file> element.`);
    }
    const id = key || file!.key;
    const ops: AccessOperation[] = selectedUsers.map(user => {
      const op: AccessOperation = {
        op: 'add',
        type: 'user',
        value: role,
        id: user.key,
      };
      return op;
    });
    try {
      await Events.Store.File.patchUsers(id, randomString(), ops, appInfo);
      this._cancelShareUser();
    } catch (e) {
      const cause = e as Error;
      CoreEvents.Telemetry.exception(this, cause.message, false);
      throw cause;
    }
  }

  protected _roleChangeButtonHandler(e: Event): void {
    const button = e.currentTarget as HTMLElement;
    const dropdown = button.nextElementSibling as AnypointDropdownElement;
    dropdown.positionTarget = button;
    dropdown.open();
  }

  protected _roleSelectHandler(e: Event): void {
    const list = e.target as AnypointListboxElement;
    if (!list.selected) {
      return;
    }
    const selected = String(list.selected) as PermissionRole;
    const userId = list.dataset.user as string;
    const currentRole = list.dataset.value as PermissionRole;
    if (!userId || !currentRole) {
      return;
    }
    const dropdown = (list.parentElement as AnypointDropdownElement);
    if (!this.pendingPermissions) {
      this.pendingPermissions = [];
    }
    const pending = this.pendingPermissions!;
    const index = pending.findIndex(i => i.id === userId);
    // removes prior selection
    if (index >= 0) {
      pending.splice(index, 1);
    }
    if (selected === currentRole) {
      // the user selected the role that was originally assigned to the user.
      // we don't change anything.
      if (!pending.length) {
        this.pendingPermissions = undefined;
      }
      this.requestUpdate();
      dropdown.close();
      return;
    }
    let op: AccessOperation;
    if ((selected as string) === 'remove') {
      op = {
        op: 'remove',
        type: 'user',
        id: userId,
      };
    } else {
      op = {
        op: 'add',
        type: 'user',
        value: selected,
        id: userId,
      };
    }
    pending.push(op);
    this.requestUpdate();
    dropdown.close();
  }

  protected async _commitHandler(): Promise<void> {
    const { key, file, pendingPermissions } = this;
    if (!pendingPermissions) {
      return;
    }
    const { appInfo } = this;
    if (!appInfo) {
      throw new Error(`The appInfo is not set on the <share-file> element.`);
    }
    const id = key || file!.key;
    try {
      await Events.Store.File.patchUsers(id, randomString(), pendingPermissions, appInfo);
      this.pendingPermissions = undefined;
    } catch (e) {
      const cause = e as Error;
      CoreEvents.Telemetry.exception(this, cause.message, false);
      throw cause;
    }
  }

  render(): TemplateResult {
    return html`
    <h2>
      <api-icon class="share-icon" icon="personAdd"></api-icon>
      Share with people
    </h2>
    <section>
      ${this.userInputTemplate()}
      ${this.currentList()}
    </section>
    ${this.actionsTemplate()}
    `;
  }

  protected actionsTemplate(): TemplateResult {
    if (this.hasPending) {
      return this.pendingActionsTemplate();
    }
    if (this.hasSelectedUsers) {
      return this.selectedUsersActionsTemplate();
    }
    return this.overviewActionsTemplate();
  }

  protected overviewActionsTemplate(): TemplateResult {
    return html`
    <div class="buttons">
      <anypoint-button ?anypoint="${this.anypoint}" emphasis="high" data-dialog-confirm>Done</anypoint-button>
    </div>
    `;
  }

  protected selectedUsersActionsTemplate(): TemplateResult {
    return html`
    <div class="buttons">
      <anypoint-button ?anypoint="${this.anypoint}" @click="${this._cancelShareUser}">Cancel</anypoint-button>
      <anypoint-button ?anypoint="${this.anypoint}" emphasis="high" @click="${this._shareHandler}">Share</anypoint-button>
    </div>
    `;
  }

  protected pendingActionsTemplate(): TemplateResult {
    return html`
    <div class="buttons">
      <span class="pending-info">Pending changes</span>
      <anypoint-button ?anypoint="${this.anypoint}" emphasis="high" @click="${this._commitHandler}">Save</anypoint-button>
    </div>
    `;
  }

  protected userInputTemplate(): TemplateResult {
    return html`
    <div class="input-line">
      <div class="name-input">
        <div class="input-wrapper">
          ${this.selectedUserChipsTemplate()}
          <input 
            type="text"
            id="userInput"
            name="name"
            ?disabled="${this.inputDisabled}"
            @input="${this._inputHandler}"
            @keydown="${this._inputKeydown}"
            placeholder="Name or email"
            aria-label="Name or email"
            autocomplete="off"
          />
        </div>
        ${this.inputSuggestionsTemplate()}
      </div>
      ${this.roleSelectorTemplate()}
    </div>
    `
  }

  protected inputSuggestionsTemplate(): TemplateResult | string {
    const { userSuggestions } = this;
    return html`
    <anypoint-dropdown 
      .positionTarget="${this.input && this.input.parentElement}" 
      ?opened="${this.suggestionsOpened}" 
      noOverlap 
      noAutoFocus 
      noCancelOnOutsideClick 
      fitPositionTarget 
      @closed="${this._suggestionsClosed}" 
      verticalOffset="2"
    >
      <anypoint-listbox 
        slot="dropdown-content" 
        useariaselected 
        highlightAriaSelected 
        class="suggestions-list list-shadow" 
        @select="${this._suggestionSelectHandler}"
      >
        ${userSuggestions ? userSuggestions.map(s => this.suggestionTemplate(s)) : ''}
      </anypoint-listbox>
    </anypoint-dropdown>
    `;
  }

  protected suggestionTemplate(user: IUser): TemplateResult {
    const { name, key } = user;
    const email = this.getUserEmail(user);
    return html`
    <anypoint-item ?anypoint="${this.anypoint}">
      <anypoint-item-body ?twoline="${!!email}" ?anypoint="${this.anypoint}">
        <div>${name || key}</div>
        ${email ? html`<div data-secondary>${email}</div>` : ''}
      </anypoint-item-body>
    </anypoint-item>
    `;
  }

  protected selectedUserChipsTemplate(): TemplateResult | string {
    if (!this.hasSelectedUsers) {
      return '';
    }
    return html`
    ${this.selectedUsers!.map((user) => this.chipTemplate(user))}
    `;
  }

  protected chipTemplate(user: IUser): TemplateResult {
    return html`
    <div class="chip">
      <span class="label">${user.name || this.getUserEmail(user) || user.key}</span>
      <api-icon class="close" icon="cancelFilled" data-key="${user.key}" @click="${this._removeUserChip}" title="Remove user"></api-icon>
    </div>
    `;
  }

  protected roleSelectorTemplate(): TemplateResult | string {
    if (!this.hasSelectedUsers) {
      return '';
    }
    return html`
    <anypoint-dropdown-menu
      aria-label="Select the role for the selected users"
      noLabelFloat
      @closed="${cancel}"
      class="role-selector"
      fitPositionTarget
    >
      <label slot="label">Role</label>
      <anypoint-listbox slot="dropdown-content" attrForSelected="data-role" selected="reader">
        <anypoint-item data-role="reader">Reader</anypoint-item>
        <anypoint-item data-role="commenter">Commenter</anypoint-item>
        <anypoint-item data-role="writer">Writer</anypoint-item>
        <anypoint-item data-role="owner">Owner</anypoint-item>
      </anypoint-listbox>
    </anypoint-dropdown-menu>
    `;
  }

  protected currentList(): TemplateResult | string {
    if (this.hasSelectedUsers) {
      return '';
    }
    const { file, loading, permissionUsers } = this;
    if (!file || !permissionUsers || loading) {
      return '';
    }
    const { permissions=[] } = file;
    return html`
    <div class="current-users">
      ${permissions.map(p => this.permissionTemplate(p))}
    </div>
    `;
  }

  protected permissionTemplate(permission: IPermission): TemplateResult | string {
    const { type, role } = permission;
    if (type === 'group') {
      return '';
    }
    if (type === 'anyone') {
      return html`<p>TODO</p>`;
    }
    const userId = permission.owner as string;
    const user = this.permissionUsers!.find(u => u.key === userId);
    if (!user) {
      // @TODO: should render something...
      return '';
    }
    return html`
    <div class="permission-item">
      <user-avatar class="user-icon" .user="${user}"></user-avatar>
      <div class="permission-user">
        <span class="user-name">${user.name || user.key}</span>
        <span class="user-email">${this.getUserEmail(user)}</span>
      </div>
      <div class="user-role">
        ${this.permissionRoleTemplate(role, userId)}
      </div>
    </div>
    `;
  }

  protected permissionRoleTemplate(role: PermissionRole, userId: string): TemplateResult {
    const { pendingPermissions } = this;
    const pending = pendingPermissions && pendingPermissions.find(i => i.type === 'user' && i.id === userId) as IAccessAddOperation | undefined;
    const pendingRole = pending && pending.value;
    const selectionRole = pendingRole || role;
    return html`
    <anypoint-button class="user-role-selector" @click="${this._roleChangeButtonHandler}">
      <span class="role-label">${selectionRole}</span>
      <api-icon icon="arrowDropDown" class="drop-icon"></api-icon>
    </anypoint-button>
    <anypoint-dropdown 
      noOverlap
      @closed="${cancel}" verticalOffset="2"
    >
      <anypoint-listbox 
        slot="dropdown-content"
        useariaselected
        class="roles-list list-shadow"
        @select="${this._roleSelectHandler}"
        data-user="${userId}"
        data-value="${role}"
        attrForSelected="data-role"
        selected="${selectionRole}"
        selectable="anypoint-icon-item"
        aria-label="Select user role"
      >
        ${this.roleItemTemplate('reader', selectionRole)}
        ${this.roleItemTemplate('commenter', selectionRole)}
        ${this.roleItemTemplate('writer', selectionRole)}
        ${this.roleItemTemplate('owner', selectionRole)}
        <div class="list-separator"></div>
        <anypoint-icon-item data-role="remove">
          Remove
        </anypoint-icon-item>
      </anypoint-listbox>
    </anypoint-dropdown>
    `;
  }

  protected roleItemTemplate(role: PermissionRole, userRole: PermissionRole): TemplateResult {
    return html`
    <anypoint-icon-item data-role="${role}" class="role-item">
      ${role === userRole ? html`<api-icon icon="check" slot="item-icon"></api-icon>` : ''}
      ${role}
    </anypoint-icon-item>
    `;
  }
}
