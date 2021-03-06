import { html, TemplateResult } from "lit";
import { IDigestAuthorization, AuthorizationUtils } from "@api-client/core/build/browser.js";
import { inputTemplate, passwordTemplate } from "../CommonTemplates.js";
import md5 from "../../../lib/3rd-party/md5.js";
import AuthUiBase from "./AuthUiBase.js";

export default class Digest extends AuthUiBase {
  /** 
   * The value of the username filed.
   */
  password = '';

  /** 
   * The value of the password filed.
   */
  username = '';

  /**
   * Server issued realm for Digest authorization.
   *
   * @type string
   */
  realm?: string;

  /**
   * Server issued nonce for Digest authorization.
   *
   * @type string
   */
  nonce?: string;

  /**
   * The algorithm used to hash the response for Digest authorization.
   *
   * It can be either `MD5` or `MD5-sess`.
   *
   * @type string
   */
  algorithm?: string;

  /**
   * The quality of protection value for the digest response.
   * Either '', 'auth' or 'auth-int'
   *
   * @type string
   */
  qop?: string;

  /**
   * Nonce count - increments with each request used with the same nonce
   *
   * @type number
   */
  nc?: number;

  /**
   * Client nonce
   *
   * @type string
   */
  cnonce?: string;

  /**
   * A string of data specified by the server
   *
   * @type string
   */
  opaque?: string;

  /**
   * Hashed response to server challenge
   *
   * @type string
   */
  response?: string;

  /**
   * Request HTTP method
   *
   * @type string
   */
  httpMethod?: string;

  /**
   * Current request body.
   *
   * @type string
   */
  requestBody?: any;

  _requestUrl?: string;

  /**
   * Current request URL.
   *
   * @type string
   */
  get requestUrl(): string | undefined {
    return this._requestUrl;
  }

  set requestUrl(value) {
    const old = this._requestUrl;
    /* istanbul ignore if */
    if (old === value) {
      return;
    }
    this._requestUrl = value;
    this._processRequestUrl(value);
  }

  _processRequestUrl(value?: string): void {
    if (!value || typeof value !== 'string') {
      this._requestUrl = undefined;
      this.notifyChange();
      return;
    }
    let result;
    try {
      const url = new URL(value);
      result = url.pathname;
    } catch (_) {
      result = value.trim();
    }
    this._requestUrl = result;
  }

  /**
   * Restores previously serialized values.
   * @param state Previously serialized values
   */
  restore(state: IDigestAuthorization): void {
    this.username = state.username || '';
    this.password = state.password || '';
    this.realm = state.realm;
    this.nonce = state.nonce;
    this.opaque = state.opaque;
    this.qop = state.qop;
    this.cnonce = state.cnonce;
    this.algorithm = state.algorithm;
    if (state.uri) {
      this._requestUrl = state.uri;
    }
    if (state.nc) {
      this.nc = Number(String(state.nc).replace(/0+/, ''));
    }
  }

  /**
   * Serialized input values
   * @return An object with user input
   */
  serialize(): IDigestAuthorization {
    this.response = this._generateDigestResponse();
    const settings: IDigestAuthorization = {
      username: this.username || '',
      password: this.password || '',
      realm: this.realm || '',
      nonce: this.nonce || '',
      uri: this._requestUrl || '',
      response: this.response || '',
      opaque: this.opaque || '',
      qop: this.qop || '',
      nc: `00000000${this.nc}`.slice(-8),
      cnonce: this.cnonce || '',
      algorithm: this.algorithm || '',
    };
    return settings;
  }

  /**
   * Generates the response header based on the parameters provided in the
   * form.
   *
   * See https://en.wikipedia.org/wiki/Digest_access_authentication#Overview
   *
   * @returns A response part of the authenticated digest request.
   */
  _generateDigestResponse(): string {
    const HA1 = this._getHA1();
    const HA2 = this._getHA2();
    const ncString = `00000000${this.nc}`.slice(-8);
    let responseStr = `${HA1}:${this.nonce}`;
    if (!this.qop) {
      responseStr += `:${HA2}`;
    } else {
      responseStr += `:${ncString}:${this.cnonce}:${this.qop}:${HA2}`;
    }
    return md5(responseStr).toString();
  }

  // Generates HA1 as defined in Digest spec.
  _getHA1(): string {
    const { username, realm, password } = this;
    let HA1param = `${username}:${realm}:${password}`;
    let HA1 = md5(HA1param).toString();
    if (this.algorithm === 'MD5-sess') {
      const { nonce, cnonce } = this;
      HA1param = `${HA1}:${nonce}:${cnonce}`;
      HA1 = md5(HA1param).toString();
    }
    return HA1;
  }

  // Generates HA2 as defined in Digest spec.
  _getHA2(): string {
    const { httpMethod, _requestUrl } = this;
    let HA2param = `${httpMethod}:${_requestUrl}`;
    if (this.qop === 'auth-int') {
      const v = md5(this.requestBody || '').toString();
      HA2param += `:${v}`;
    }
    return md5(HA2param).toString();
  }

  reset(): void {
    this.password = '';
    this.username = '';
    this.realm = '';
    this.nonce = '';
    this.opaque = '';
    this.qop = '';
    this.cnonce = '';
    this.algorithm = '';
    this.nc = undefined;
    this.response = '';
    this.defaults();
    // url, method, and body should not be controlled by this
    // component.
  }

  defaults(): void {
    let changed = false;
    if (!this.nc) {
      this.nc = 1;
      changed = true;
    }
    if (!this.algorithm) {
      this.algorithm = 'MD5';
      changed = true;
    }
    if (!this.cnonce) {
      this.cnonce = AuthorizationUtils.generateCnonce();
      changed = true;
    }
    if (changed) {
      this.notifyChange();
    }
  }

  render(): TemplateResult {
    const ctx = this;
    const {
      username,
      password,
      realm,
      nonce,
      nc,
      opaque,
      cnonce,
      readOnly,
      disabled,
    } = this;
    return html`
    <form autocomplete="on" class="digest-auth">
      ${inputTemplate('username', username, 'User name', ctx.changeHandler, {
        required: true,
        autoValidate: true,
        invalidLabel: 'Username is required',
        classes: { block: true },
        readOnly,
        disabled,
      })}
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
      ${inputTemplate(
        'realm',
        realm || '',
        'Server issued realm',
        ctx.changeHandler,
        {
          required: true,
          autoValidate: true,
          invalidLabel: 'Realm is required',
          classes: { block: true },
          readOnly,
          disabled,
        }
      )}
      ${inputTemplate(
        'nonce',
        nonce || '',
        'Server issued nonce',
        ctx.changeHandler,
        {
          required: true,
          autoValidate: true,
          invalidLabel: 'Nonce is required',
          classes: { block: true },
          readOnly,
          disabled,
        }
      )}
      ${this._qopTemplate()}
      ${inputTemplate('nc', nc || 0, 'Nonce count', ctx.changeHandler, {
        required: true,
        autoValidate: true,
        invalidLabel: 'Nonce count is required',
        classes: { block: true },
        type: 'number',
        readOnly,
        disabled,
      })}
      ${this._hashAlgorithmTemplate()}
      ${inputTemplate(
        'opaque',
        opaque || '',
        'Server issued opaque string',
        ctx.changeHandler,
        {
          required: true,
          autoValidate: true,
          invalidLabel: 'Server issued opaque is required',
          classes: { block: true },
          readOnly,
          disabled,
        }
      )}
      ${inputTemplate('cnonce', cnonce || '', 'Client nonce', ctx.changeHandler, {
        required: true,
        autoValidate: true,
        invalidLabel: 'Client nonce is required',
        classes: { block: true },
        readOnly,
        disabled,
      })}
    </form>`;
  }

  _qopTemplate(): TemplateResult {
    const ctx = this;
    const { readOnly, disabled, qop } = this;
    return html`
    <anypoint-dropdown-menu
      ?disabled="${disabled||readOnly}"
      name="qop"
    >
      <label slot="label">Quality of protection</label>
      <anypoint-listbox
        slot="dropdown-content"
        .selected="${qop}"
        @selected="${ctx.selectHandler}"
        ?disabled="${disabled||readOnly}"
        attrforselected="data-qop"
      >
        <anypoint-item data-qop="auth">auth</anypoint-item>
        <anypoint-item data-qop="auth-int">auth-int</anypoint-item>
      </anypoint-listbox>
    </anypoint-dropdown-menu>`;
  }

  _hashAlgorithmTemplate(): TemplateResult {
    const ctx = this;
    const { readOnly, disabled, algorithm } = this;
    return html`
    <anypoint-dropdown-menu
      ?disabled="${disabled||readOnly}"
      name="algorithm"
    >
      <label slot="label">Hash algorithm</label>
      <anypoint-listbox
        slot="dropdown-content"
        .selected="${algorithm}"
        @selected="${ctx.selectHandler}"
        ?disabled="${disabled||readOnly}"
        attrforselected="data-algorithm"
      >
        <anypoint-item data-algorithm="MD5">MD5</anypoint-item>
        <anypoint-item data-algorithm="MD5-sess">MD5-sess</anypoint-item>
      </anypoint-listbox>
    </anypoint-dropdown-menu>`;
  }
}
