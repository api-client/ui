/* eslint-disable class-methods-use-this */
import { LitElement, html, TemplateResult, CSSResult, css, PropertyValueMap } from 'lit';
import { DeserializedPayload, Payload, PayloadSerializer, ISafePayload } from "@api-client/core/build/browser.js";
import { property, state } from "lit/decorators.js";
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import { PrismHighlighter } from '../highlight/PrismHighlighter.js';
import prismStyles from '../highlight/PrismStyles.js';
import { getLanguage } from '../highlight/PrismAutoDetect.js';
import 'prismjs/prism.js';
import 'prismjs/components/prism-json.js';
import 'prismjs/components/prism-javascript.js';
import 'prismjs/components/prism-markdown.js';
import 'prismjs/components/prism-markup.js';
import 'prismjs/components/prism-yaml.js';
import 'prismjs/components/prism-xml-doc.js';
import 'prismjs/components/prism-http.js';
import 'prismjs/plugins/line-numbers/prism-line-numbers.min.js';
import { ensureBodyString, imageBody, isBinaryBody, isPdfBody, isTextBody } from '../../lib/http/Payload.js';

enum BodyType {
  // null, undefined, empty
  nil,
  // a string value
  String,
  Blob,
  File,
  // Multipart FormData object
  FormData,
  // Buffer, ArrayBuffer, UInt8Array, generally binary.
  Buffer,
}

enum ViewType {
  Parsed,
  ImageSvg,
  ImageBinary,
  ImageError,
  Pdf,
  Binary,
}

/**
 * Renders the view of the payload message.
 */
export default class LogBodyElement extends LitElement {
  static get styles(): CSSResult[] {
    return [
      prismStyles,
      css`
      pre[class*="language-"].line-numbers {
        position: relative;
        padding-left: 3.8em;
        counter-reset: linenumber;
      }

      pre[class*="language-"].line-numbers > code {
        position: relative;
        white-space: inherit;
      }

      .line-numbers .line-numbers-rows {
        position: absolute;
        pointer-events: none;
        top: 0;
        font-size: 100%;
        left: -3.8em;
        width: 3em; /* works for line-numbers below 1000 lines */
        letter-spacing: -1px;
        border-right: 1px solid #999;

        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
      }

      .line-numbers-rows > span {
        display: block;
        counter-increment: linenumber;
      }

      .line-numbers-rows > span:before {
        content: counter(linenumber);
        color: #999;
        display: block;
        padding-right: 0.8em;
        text-align: right;
      }
      `,
      css`
      :host {
        display: block;
      }

      .raw-panel,
      .error-container,
      .no-info {
        user-select: text;
      }

      .raw-panel > code {
        overflow: auto;
      }

      pre[class*="language-"].raw-panel {
        white-space: pre;
      }

      .padded-panel {
        padding: 0 20px;
      }

      .error,
      .no-info {
        text-align: left;
        margin: 20px;
      }
      `,
    ];
  }

  /**
   * @description The payload to render. When the payload requires de-serialization it will be performed. 
   * @type {(DeserializedPayload | Payload)}
   */
  @property() payload: DeserializedPayload | Payload | undefined;

  /**
   * @description The content type of the payload.
   * @type {string}
   */
  @property({ type: String, reflect: true }) contentType?: string;

  /**
   * @description When set it does not apply formatting for the code. However, it keeps the highlighting.
   */
  @property({ type: Boolean }) raw: boolean = false;

  @state() protected _body?: DeserializedPayload;

  @state() protected _bodyType: BodyType = BodyType.nil;

  @state() protected _viewType: ViewType = ViewType.Parsed;

  /**
   * @description The tokens rendered in the view.
   * @protected
   * @type {string}
   */
  @state() protected _tokens?: string;

  willUpdate(cp: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
    if (cp.has('payload') || cp.has('contentType')) {
      this._prepare();
    }
  }

  updated(cp: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
    super.updated(cp);
    if (cp.has('_bodyType') || cp.has('_viewType')) {
      this._prismComplete();
    }
  }

  /**
   * When processing a payload from the request editor then the value can be any of the `DeserializedPayload` types.
   * However, when processing a response that came from the `CoreEngine` it is always a Buffer / ArrayBuffer 
   * and the contents is determined by the content type.
   */
  protected async _prepare(): Promise<void> {
    const { contentType = '', payload } = this;
    this._body = undefined;
    this._tokens = undefined;
    this._viewType = ViewType.Parsed;
    this._bodyType = BodyType.nil;

    if (!payload) {
      this._bodyType = BodyType.nil;
      return;
    }
    const body = await this._deserialize(payload);
    if (body === undefined || body === null || !body) {
      this._bodyType = BodyType.nil;
      return;
    }

    const typedSerialized = payload as ISafePayload;

    if (contentType) {
      // TODO: add specialized view for application/x-www-form-urlencoded
      const image = imageBody(contentType);
      if (isTextBody(contentType)) {
        this._body = ensureBodyString(body);
        if (image === 'svg') {
          this._viewType = ViewType.ImageSvg;
        }
      } else if (image === 'binary') {
        this._viewType = ViewType.ImageBinary;
        this._body = body;
      } else if (isPdfBody(contentType)) {
        this._viewType = ViewType.Pdf;
        this._body = body;
      } else if (isBinaryBody(contentType)) {
        this._viewType = ViewType.Binary;
        this._body = body;
      } else if (body instanceof FormData) {
        this._viewType = ViewType.Parsed;
        this._body = body;
      } else if (typedSerialized.type === 'file' || typedSerialized.type === 'blob') {
        this._viewType = ViewType.Binary;
        this._body = body;
      } else {
        this._viewType = ViewType.Parsed;
        this._body = ensureBodyString(body);
      }
    } else {
      this._body = body;
      this._viewType = ViewType.Parsed;
    }
    this._bodyType = this._typeFromType(this._body);
    this._tokenize();
  }

  protected _typeFromType(type: any): BodyType {
    if (type === undefined || type === null || !type) {
      return BodyType.nil;
    } 
    if (typeof type === 'string') {
      return BodyType.String;
    } 
    if (type instanceof File) {
      return BodyType.File;
    }
    if (type instanceof Blob) {
      return BodyType.Blob;
    }
    if(type instanceof FormData) {
      return BodyType.FormData;
    }
    return BodyType.Buffer;
  }

  protected async _deserialize(value: Payload | DeserializedPayload): Promise<DeserializedPayload> {
    if (value === undefined || value === null) {
        // both values should be stored correctly
        return undefined;
    }
    if (typeof value === 'string') {
        return value;
    }
    if ((value as ISafePayload).data) {
      return PayloadSerializer.deserialize(value as ISafePayload);
    }
    return value as DeserializedPayload;
  }

  /**
   * Depending on the body type and the contentType, it prepares the tokens to be rendered in the view.
   */
  protected _tokenize(): void {
    const { contentType, _bodyType: type, _body: body } = this;
    // if (raw && type !== BodyType.FormData) {
    //   this._tokens = body as string;
    //   return;
    // }
    switch  (type) {
      case BodyType.String: this._tokens = this._tokenizeStringContent(body as string, contentType); break;
      case BodyType.FormData: this._tokens = this._tokenizeFormDataContent(body as FormData); break;
      case BodyType.Buffer: this._tokens = this._tokenizeBuffer(body as ArrayBuffer | Buffer); break;
      case BodyType.File: 
      case BodyType.Blob: 
        this._tokens = this._tokenizeFile(); break;
      default:
        this._tokens = undefined; 
        break;
    }
  }

  protected _tokenizeStringContent(body: string, contentType: string = ''): string {
    const { raw } = this;
    if (raw) {
      return body;
    }
    const finalBody = this._formatBody(body, contentType);
    const info = getLanguage(contentType);
    const env = {
      code: finalBody,
      grammar: info.grammar,
      language: info.lang,
    };
    // @ts-ignore
    Prism.hooks.run('before-highlight', env);
    // @ts-ignore
    return Prism.highlight(finalBody, info.grammar, info.lang);
  }

  protected _formatBody(body: string, contentType: string = ''): string {
    let result = body;
    if (contentType.includes('json')) {
      try {
        const parsed = JSON.parse(result);
        result = JSON.stringify(parsed, null, 2);
      } catch (e) {
        // ...
      }
    }
    return result;
  }

  protected _tokenizeFormDataContent(body: FormData): string {
    const { raw } = this;
    const boundary = '7MA4YWxkTrZu0gW';
    const lineBreak = "\r\n"
    const templates: string[] = [];
    body.forEach((value: FormDataEntryValue, key: string) => {
      if (typeof value === 'string') {
        templates.push(`--${boundary}${lineBreak}`);
        templates.push(`Content-Disposition: form-data; name="${key}"${lineBreak}${lineBreak}`);
        templates.push(`${value}${lineBreak}`);
      } else {
        templates.push(`--${boundary}${lineBreak}`);
        templates.push(`Content-Disposition: form-data; name="${key}"; filename="${value.name}"${lineBreak}`);
        templates.push(`Content-Type: ${value.type || 'application/octet-stream'}${lineBreak}${lineBreak}`);
        templates.push(`{…file content…}${lineBreak}`);
      }
    });
    templates.push(`--${boundary}--${lineBreak}`);
    const code = templates.join('');
    if (raw) {
      return code;
    }
    const highlight = new PrismHighlighter();
    return highlight.tokenize(code, 'http');
  }

  // protected _tokenizeBuffer(body: ArrayBuffer | Buffer, contentType?: string): string | undefined {
  //   if (typeof body === 'string') {
  //     return undefined;
  //   }
  //   try {
  //     const arr = new Uint8Array(body);
  //     const str = arr.reduce((data, byte) => data + String.fromCharCode(byte), '');
  //     const enc = btoa(str);
  //     return `data:${contentType};base64, ${enc}`;
  //   } catch (_) {
  //     return undefined;
  //   }
  // }

  protected _tokenizeBuffer(body: ArrayBuffer | Buffer): string | undefined {
    if (typeof body === 'string') {
      return undefined;
    }
    try {
      const array = new Uint8Array(body).join(', ');
      return `[${array}]`;
    } catch (_) {
      return undefined;
    }
  }

  protected _tokenizeFile(): string | undefined {
    const { payload } = this;
    if (!payload) {
      return undefined;
    }
    const typed = payload as ISafePayload;
    if (typed.type !== 'file' && typed.type !== 'blob') {
      return undefined;
    }
    if (!Array.isArray(typed.data)) {
      return undefined;
    }
    const array = (typed.data as number[]).join(', ');
    return `[${array}]`;
  }

  protected _prismComplete(): void {
    const { _body, _tokens } = this;
    const element = this.shadowRoot?.querySelector('#rawCode');
    if (!element) {
      return;
    }
    let body = '';
    if (typeof _body === 'string') {
      body = _body;
    } else if (typeof _tokens === 'string') {
      body = _tokens;
    }
    const env = {
      code: body,
      element,
    };
    try {
      // @ts-ignore
      Prism.hooks.run('complete', env);
      
      // @ts-ignore
      Prism.plugins.lineNumbers.resize(element.parentElement!);
    } catch (e) {
      // ...
    }
  }

  /**
   * A handler for the image error event.
   * This occurs when rendering an image via the img tag but the image URL is invalid.
   */
  protected _imageErrorHandler(): void {
    this._viewType = ViewType.ImageError;
  }

  protected render(): TemplateResult {
    const { _body: body, _bodyType: type, _viewType: view } = this;
    if (type === BodyType.nil) {
      return html`<p class="no-info">No data to render in this view.</p>`;
    }
    if (view === ViewType.ImageError) {
      return this._imageErrorView();
    }
    if (view === ViewType.Parsed) {
      return this._stringBodyView()
    }
    if (view === ViewType.ImageSvg) {
      return this._imageSvgBodyView()
    }
    if (view === ViewType.ImageBinary) {
      return this._imageBinaryBodyView()
    }
    if (view === ViewType.Pdf) {
      return this._pdfBodyView()
    }
    if (type === BodyType.Blob || type === BodyType.File) {
      return this._blobBodyView(body as Blob)
    }
    // only buffers left at this point
    return this._bufferBodyView(body as ArrayBuffer | Buffer);
  }

  protected _emptyBodyTemplate(): TemplateResult {
    return html`
    <div class="content-info empty padded-panel">
      <p>The response has no body object or the response is an empty string.</p>
    </div>
    `;
  }

  protected _stringBodyView(): TemplateResult {
    const { raw, _tokens } = this;
    const content = raw ? _tokens : unsafeHTML(this._tokens);
    return html`
    <pre class="raw-panel string language-snippet line-numbers"><code id="rawCode" class="code">${content}</code></pre>
    `;
  }

  protected _blobBodyView(body: Blob): TemplateResult {
    const { _tokens, raw } = this;
    if (_tokens && raw) {
      return html`
      <div class="raw-panel padded-panel">${_tokens}</div>
      `;
    }
    return html`
    <div class="raw-panel padded-panel">
      File data of ${body.size} bytes.
    </div>
    `;
  }

  protected _bufferBodyView(body: ArrayBuffer | Buffer): TemplateResult {
    const { _tokens, raw } = this;
    if (_tokens && raw) {
      return html`
      <div class="raw-panel padded-panel">${_tokens}</div>
      `;
    }
    return html`
    <div class="raw-panel padded-panel">
      Binary data of ${body.byteLength} bytes.
    </div>
    `;
  }

  protected _pdfBodyView(): TemplateResult {
    return html`
    <div class="content-info pdf padded-panel">
      <p>The response is a <b>PDF</b> data.</p>
      <p>Save the file to preview its contents.</p>
    </div>
    `;
  }

  protected _imageSvgBodyView(): TemplateResult {
    const { _body, raw } = this;
    if (raw) {
      return this._stringBodyView();
    }
    const div = window.document.createElement('div');
    div.innerHTML = String(_body);
    const svgEl = div.firstElementChild;
    if (!svgEl) {
      return this._errorTemplate('Invalid SVG response.');
    }
    const all = Array.from(svgEl.querySelectorAll('*'));
    all.forEach((node) => {
      if (!node.attributes) {
        return;
      }
      const remove = Array.from(node.attributes).filter((attr) =>  attr.name.startsWith('on') || ['xlink:href'].includes(attr.name));
      remove.forEach(({ name }) => node.removeAttribute(name));
    });
    const scripts = Array.from(svgEl.getElementsByTagName('script'));
    scripts.forEach((node) => node.parentNode!.removeChild(node));
    return html`
    <div class="image-container">
      ${unsafeSVG(svgEl.outerHTML)}
    </div>
    `;
  }

  protected _imageBinaryBodyView(): TemplateResult {
    const { _tokens } = this;
    if (!_tokens) {
      return this._noDataTemplate('No image data');
    }
    return html`
    <div class="image-container">
      <img class="img-preview" src="${_tokens}" alt="" @error="${this._imageErrorHandler}">
    </div>`;
  }

  protected _imageErrorView(): TemplateResult {
    const { _tokens } = this;
    if (!_tokens) {
      return this._noDataTemplate('No image data');
    }
    return html`
    <div class="error-container padded-panel">
      <b>The image URL is invalid</b>: "${_tokens}"
    </div>`;
  }

  protected _noDataTemplate(label: string = 'Unsupported view.'): TemplateResult {
    return html`<p class="no-info">${label}</p>`;
  }

  protected _errorTemplate(message: string): TemplateResult {
    return html`<p class="error">${message}</p>`;
  }
}
