/* eslint-disable class-methods-use-this */
import { html, css, LitElement, CSSResult, PropertyValueMap, TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import sanitizer from 'dompurify';
import { marked } from 'marked';
import { PrismHighlighter } from './PrismHighlighter.js';

export const markdownElement = Symbol('markdownElement');
export const requestMarkdown = Symbol('requestMarkdown');
export const unindent = Symbol('unindent');
export const scriptAttributeHandler = Symbol('scriptAttributeHandler');
export const attachedValue = Symbol('attachedValue');
export const highlightMarkdown = Symbol('highlightMarkdown');
export const handleError = Symbol('handleError');

/**
Element wrapper for the [marked](https://github.com/chjj/marked) library.

`<marked-highlight>` accepts Markdown source and renders it to a child
element with the class `markdown-html`. This child element can be styled
as you would a normal DOM element. If you do not provide a child element
with the `markdown-html` class, the Markdown source will still be rendered,
but to a shadow DOM child that cannot be styled.

### Markdown Content

The Markdown source can be specified several ways:

#### Use the `markdown` attribute to bind markdown

```html
<marked-highlight markdown="`Markdown` is _awesome_!">
  <div slot="markdown-html"></div>
</marked-highlight>
```
#### Use `<script type="text/markdown">` element child to inline markdown

```html
<marked-highlight>
  <div slot="markdown-html"></div>
  <script type="text/markdown">
    Check out my markdown!
    We can even embed elements without fear of the HTML parser mucking up their
    textual representation:
  </script>
</marked-highlight>
```
#### Use `<script type="text/markdown" src="URL">` element child to specify remote markdown

```html
<marked-highlight>
  <div slot="markdown-html"></div>
  <script type="text/markdown" src="../guidelines.md"></script>
</marked-highlight>
```

Note that the `<script type="text/markdown">` approach is *static*. Changes to
the script content will *not* update the rendered markdown!

Though, you can data bind to the `src` attribute to change the markdown.

```html
<marked-highlight>
  <div slot="markdown-html"></div>
  <script type="text/markdown" src$="[[source]]"></script>
</marked-highlight>
<script>
  ...
  this.source = '../guidelines.md';
</script>
```

### Styling

If you are using a child with the `markdown-html` class, you can style it
as you would a regular DOM element:

```css
[slot="markdown-html"] p {
  color: red;
}
[slot="markdown-html"] td:first-child {
  padding-left: 24px;
}
```

@fires markedrendercomplete - Event dispatched when the element renders the output.
@fires markedloaded - Event dispatched when the element loads the script from the URL.
@fires markedloaderror - An event dispatched when an error ocurred when downloading the script content. The detail has the original error.
 */
export default class MarkedHighlightElement extends LitElement {
  static get styles(): CSSResult {
    return css`
      :host {
        display: block;
        padding: var(--marked-highlight-padding, 0px);
      }
    `;
  }
  
  /**
   * The markdown source to be rendered by this element.
   */
  @property({ type: String }) markdown?: string;

  /**
   * Enable GFM line breaks (regular newlines instead of two spaces for
   * breaks)
   */
  @property({ type: Boolean, reflect: true }) breaks?: boolean;

  /**
   * Conform to obscure parts of markdown.pl as much as possible. Don't fix
   * any of the original markdown bugs or poor behavior.
   */
  @property({ type: Boolean, reflect: true }) pedantic?: boolean;

  /**
   * Function used to customize a renderer based on the [API specified in the
   * Marked
   * library](https://github.com/chjj/marked#overriding-renderer-methods).
   * It takes one argument: a marked renderer object, which is mutated by the
   * function.
   */
  @property({ type: Object }) renderer?: Function;
  
  /**
   * Sanitize the output. Ignore any HTML that has been input.
   */
  @property({ type: Boolean, reflect: true }) sanitize?: boolean;

  /**
   * Function used to customize a sanitize behavior.
   * It takes one argument: element String without text Contents.
   *
   * e.g. `<div>` `<a href="/">` `</p>'.
   * Note: To enable this function, must set `sanitize` to true.
   * WARNING: If you are using this option to un-trusted text, you must to
   * prevent XSS Attacks.
   */
  @property({ type: Object }) sanitizer?: Function;
  
  /**
   * If true, disables the default sanitization of any markdown received by
   * a request and allows fetched un-sanitized markdown
   *
   * e.g. fetching markdown via `src` that has HTML.
   * Note: this value overrides `sanitize` if a request is made.
   */
  @property({ type: Boolean, reflect: true }) disableRemoteSanitization?: boolean;

  /**
   * Use "smart" typographic punctuation for things like quotes and dashes.
   */
  @property({ type: Boolean, reflect: true }) smartypants?: boolean;

  /**
   * @returns A reference to the output element.
   */
  get outputElement(): HTMLElement | null {
    const slot = this.shadowRoot?.querySelector('slot[name="markdown-html"]') as HTMLSlotElement | null;
    if (!slot) {
      return null;
    }
    const nodes = slot.assignedNodes();
    const child = nodes.find((node) => node.nodeType === 1 && (node as HTMLElement).getAttribute('slot') === 'markdown-html') as HTMLElement | undefined;
    return child || this.shadowRoot?.querySelector('#content') as HTMLElement | null;
  }

  protected updated(cp: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
    super.updated(cp);
    if (cp.has('markdown') || cp.has('smartypants') || cp.has('sanitizer') || cp.has('sanitize') || cp.has('renderer') || cp.has('pedantic') || cp.has('breaks')) {
      this.renderMarkdown();
    }
  }

  [markdownElement]?: HTMLScriptElement | null;

  [attachedValue]: boolean = false;

  firstUpdated(): void {
    if (this.markdown) {
      this.renderMarkdown();
      return;
    }

    // Use the Markdown from the first `<script>` descendant whose MIME type
    // starts with "text/markdown". Script elements beyond the first are
    // ignored.
    const script = this.querySelector('[type="text/markdown"]') as HTMLScriptElement | null;
    if (!script) {
      return;
    }
    this[markdownElement] = script;
    
    if (script.src) {
      this[requestMarkdown](script.src);
    }
    const content = script.textContent;
    if (content && content.trim() !== '') {
      this.markdown = this[unindent](content);
    }

    const observer = new MutationObserver(this[scriptAttributeHandler].bind(this));
    observer.observe(script, { attributes: true });
  }

  connectedCallback(): void {
    super.connectedCallback();
    this[attachedValue] = true;
    this.renderMarkdown();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this[attachedValue] = false;
  }

  /**
   * Un-indents the markdown source that will be rendered.
   */
  unindent(text: string): string {
    return this[unindent](text);
  }

  /**
   * Renders `markdown` into this element's DOM.
   *
   * This is automatically called whenever the `markdown` property is changed.
   *
   * The only case where you should be calling this is if you are providing
   * markdown via `<script type="text/markdown">` after this element has been
   * constructed (or updating that markdown).
   * @event markedrendercomplete
   */
  renderMarkdown(): void {
    if (!this[attachedValue]) {
      return;
    }
    const node = this.outputElement;
    if (!node) {
      return;
    }

    if (!this.markdown) {
      node.innerHTML = '';
      return;
    }
    const renderer = new marked.Renderer();
    if (this.renderer) {
      this.renderer(renderer);
    }
    const data = this.markdown;
    const opts: marked.MarkedOptions = {
      renderer,
      highlight: this[highlightMarkdown].bind(this),
      breaks: this.breaks,
      pedantic: this.pedantic,
      smartypants: this.smartypants,
    };
    let out = marked(data, opts);
    if (this.sanitize) {
      if (this.sanitizer) {
        out = this.sanitizer(out);
      } else {
        const result = sanitizer.sanitize(out);
        if (typeof result === 'string') {
          out = result;
        } else {
          // @ts-ignore
          out = result.toString();
        }
      }
    }
    node.innerHTML = out;
    this.dispatchEvent(new Event('markedrendercomplete'));
  }

  /**
   * Fired when the content is being processed and before it is rendered.
   * Provides an opportunity to highlight code blocks based on the programming
   * language used. This is also known as syntax highlighting. One example would
   * be to use a prebuilt syntax highlighting library, e.g with
   * [highlightjs](https://highlightjs.org/).
   */
  [highlightMarkdown](code: string, lang: string): string {
    const factory = new PrismHighlighter();
    const result = factory.tokenize(code, lang);
    return result;
  }

  [unindent](text?: string): string {
    if (!text) {
      return '';
    }
    const lines = text.replace(/\t/g, '  ').split('\n');
    const indent = lines.reduce((prev: number|null, line: string): number | null => {
      if (/^\s*$/.test(line)) {
        return prev; // Completely ignore blank lines.
      }
      const match = line.match(/^(\s*)/);
      if (!match) {
        return prev;
      }

      const lineIndent = match[0].length;
      if (prev === null) {
        return lineIndent;
      }
      
      return lineIndent < prev ? lineIndent : prev;
    }, null);
    if (indent === null) {
      return text;
    }

    return lines.map((l) => l.substring(indent)).join('\n');
  }

  /**
   * Fired when the XHR finishes loading
   */
  async [requestMarkdown](url: string): Promise<void> {
    try {
      const response = await fetch(url, {
        headers: { accept: 'text/markdown' },
      });
      const { status } = response;
      if (status === 0 || (status >= 200 && status < 300)) {
        this.sanitize = !this.disableRemoteSanitization;
        this.markdown = await response.text();
        this.dispatchEvent(new Event('markedloaded'));
      } else {
        throw new Error('Unable to download the data');
      }
    } catch (e) {
      this[handleError](e as Error);
    }
  }

  /**
   * Fired when an error is received while fetching remote markdown content.
   */
  [handleError](e: Error): void {
    const evt = new CustomEvent('markedloaderror', {
      composed: true,
      bubbles: true,
      cancelable: true,
      detail: e
    });
    this.dispatchEvent(evt);
    if (!evt.defaultPrevented) {
      this.markdown = 'Failed loading markdown source';
    }
  }

  /**
   * @param {MutationRecord[]} mutation
   */
  [scriptAttributeHandler](mutation: MutationRecord[]): void {
    if (mutation[0].attributeName !== 'src') {
      return;
    }
    const elm = this[markdownElement];
    if (elm) {
      this[requestMarkdown](elm.src);
    }
  }

  render(): TemplateResult {
    return html`<slot name="markdown-html"><div id="content"></div></slot>`;
  }
}
