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
import { ensureBodyString, imageBody, isBinaryBody, isPdfBody, isTextBody } from '../../lib/http/Payload.js';

enum BodyType {
  // null, undefined, empty
  nil,
  // a string value
  String,
  // File or Blob
  Blob,
  // Multipart FormData object
  FormData,
  // Buffer, ArrayBuffer, UInt8Array, generally binary.
  Buffer,
}

enum ViewType {
  Parsed,
  ImageSvg,
  ImageBinary,
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
      :host {
        display: block;
      }

      .raw-panel > code {
        overflow: auto;
        user-select: text;
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

  @state() protected _type: BodyType = BodyType.nil;

  @state() protected _viewType: ViewType = ViewType.Parsed;

  /**
   * @description The tokens rendered in the view.
   * @protected
   * @type {string}
   */
  @state() protected _tokens?: string;

  updated(cp: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
    super.updated(cp);
    if (cp.has('payload') || cp.has('contentType')) {
      this._prepare();
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
    this._type = BodyType.nil;

    if (!payload) {
      this._type = BodyType.nil;
      return;
    }
    const body = await this._deserialize(payload);
    if (body === undefined || body === null || !body) {
      this._type = BodyType.nil;
      return;
    }

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
      } else {
        this._viewType = ViewType.Parsed;
        this._body = ensureBodyString(body);
      }
    } else {
      this._body = body;
      this._viewType = ViewType.Parsed;
    }
    this._type = this._typeFromType(this._body);
    this._tokenize();
  }

  protected _typeFromType(type: any): BodyType {
    if (type === undefined || type === null || !type) {
      return BodyType.nil;
    } 
    if (typeof type === 'string') {
      return BodyType.String;
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
    const { contentType, _type: type, _body: body, raw } = this;
    if (raw) {
      this._tokens = body as string;
      return;
    }
    switch  (type) {
      case BodyType.String: this._tokens = this._tokenizeStringContent(body as string, contentType); break;
      case BodyType.FormData: this._tokens = this._tokenizeFormDataContent(body as FormData); break;
      case BodyType.Buffer: this._tokens = this._tokenizeBuffer(body as ArrayBuffer | Buffer, contentType); break;
      default:
        this._tokens = undefined; 
        break;
    }
  }

  protected _tokenizeStringContent(body: string, contentType: string = ''): string {
    const { raw } = this;
    let finalBody = body;
    if (!raw) {
      finalBody = this._formatBody(finalBody, contentType);
    }
    const grammar = getLanguage(contentType);
    const env = {
      code: finalBody,
      grammar,
      language: contentType,
    };
    // @ts-ignore
    Prism.hooks.run('before-highlight', env);
    // @ts-ignore
    return Prism.highlight(finalBody, grammar, contentType);
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
    templates.push(`--${boundary}${lineBreak}`);
    const code = templates.join('');
    const highlight = new PrismHighlighter();
    return highlight.tokenize(code, 'http');
  }

  protected _tokenizeBuffer(body: ArrayBuffer | Buffer, contentType?: string): string | undefined {
    if (typeof body === 'string') {
      return undefined;
    }
    try {
      const arr = new Uint8Array(body);
      const str = arr.reduce((data, byte) => data + String.fromCharCode(byte), '');
      const enc = btoa(str);
      return `data:${contentType};base64, ${enc}`;
    } catch (_) {
      return undefined;
    }
  }

  protected render(): TemplateResult {
    const { _body: body, _type: type, _viewType: view } = this;
    if (type === BodyType.nil) {
      return html`<p class="no-info">No data available.</p>`;
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
    if (type === BodyType.Blob) {
      return this._blobBodyView(body as Blob)
    }
    // only buffers left at this point
    return this._bufferBodyView(body as ArrayBuffer | Buffer);
  }

  protected _stringBodyView(): TemplateResult {
    const { raw, _tokens } = this;
    const content = raw ? _tokens : unsafeHTML(this._tokens);
    return html`
    <div class="raw-panel string">
      <code class="code language-snippet"><pre>${content}</pre></code>
    </div>
    `;
  }

  protected _blobBodyView(body: Blob): TemplateResult {
    return html`
    <div class="raw-panel">
      File data of ${body.size} bytes.
    </div>
    `;
  }

  protected _bufferBodyView(body: ArrayBuffer | Buffer): TemplateResult {
    return html`
    <div class="raw-panel">
      Buffer data of ${body.byteLength} bytes.
    </div>
    `;
  }

  protected _pdfBodyView(): TemplateResult {
    return html`
    <div class="content-info pdf">
      <p>The response is a <b>PDF</b> data.</p>
      <p>Save the file to preview its contents.</p>
    </div>
    `;
  }

  protected _imageSvgBodyView(): TemplateResult {
    const { _body } = this;
    const div = window.document.createElement('div');
    div.innerHTML = String(_body);
    const svgEl = div.firstElementChild;
    if (!svgEl) {
      return html`<p class="error">Invalid SVG response.</p>`;
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
      return html`<p class="no-info">No image data</p>`;
    }
    return html`
      <div class="image-container">
        <img class="img-preview" src="${_tokens}" alt="">
      </div>`;
  }
}