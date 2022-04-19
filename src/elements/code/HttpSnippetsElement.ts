/* eslint-disable class-methods-use-this */
import { IHttpRequest } from "@api-client/core/build/browser.js";
import { LitElement, css, CSSResult, TemplateResult, html, PropertyValueMap } from "lit";
import { property, state } from "lit/decorators.js";
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { AnypointTabsElement } from "@anypoint-web-components/awc";
import CodeSnippet from "../../code-snippets/CodeSnippet.js";
import CurlSnippet from '../../code-snippets/Bash/CurlSnippet.js';
import CcurlSnippet from '../../code-snippets/C/CcurlSnippet.js';
import RawSnippet from '../../code-snippets/HTTP/RawSnippet.js';
import FetchSnippet from '../../code-snippets/JavaScript/FetchSnippet.js';
import AsyncFetchSnippet from '../../code-snippets/JavaScript/AsyncFetchSnippet.js';
import NodeSnippet from '../../code-snippets/JavaScript/NodeSnippet.js';
import XhrSnippet from '../../code-snippets/JavaScript/XhrSnippet.js';
import Python27Snippet from '../../code-snippets/Python/Python27Snippet.js';
import Python31Snippet from '../../code-snippets/Python/Python31Snippet.js';
import RequestsSnippet from '../../code-snippets/Python/RequestsSnippet.js';
import PlatformSnippet from '../../code-snippets/Java/PlatformSnippet.js';
import SpringSnippet from '../../code-snippets/Java/SpringSnippet.js';
import prismStyles from '../highlight/PrismStyles.js';

interface CodeGroup {
  label: string;
  parent?: string;
  snippet?: CodeSnippet;
  id: string;
}

const commands: CodeGroup[] = [
  {
    id: 'bash-curl',
    label: 'cURL',
    snippet: new CurlSnippet,
  },
  {
    id: 'http-raw',
    label: 'HTTP',
    snippet: new RawSnippet,
  },
  {
    id: 'javascript',
    label: 'JavaScript',
  },
  {
    label: 'Async',
    id: 'javascript-async',
    parent: 'javascript',
    snippet: new AsyncFetchSnippet,
  },
  {
    label: 'Fetch',
    id: 'javascript-fetch',
    parent: 'javascript',
    snippet: new FetchSnippet,
  },
  {
    label: 'Node',
    id: 'javascript-node',
    parent: 'javascript',
    snippet: new NodeSnippet,
  },
  {
    label: 'XHR',
    id: 'javascript-xhr',
    parent: 'javascript',
    snippet: new XhrSnippet,
  },
  {
    label: 'Python',
    id: 'python',
  },
  {
    label: 'Requests',
    id: 'python-requests',
    parent: 'python',
    snippet: new RequestsSnippet,
  },
  {
    label: 'Python 2.7',
    id: 'python-2.7',
    parent: 'python',
    snippet: new Python27Snippet,
  },
  {
    label: 'Python 3.1',
    id: 'python-3.1',
    parent: 'python',
    snippet: new Python31Snippet,
  },
  {
    label: 'C',
    id: 'c-curl',
    snippet: new CcurlSnippet,
  },
  {
    label: 'Java',
    id: 'java',
  },
  {
    label: 'Spring',
    id: 'java-spring',
    parent: 'java',
    snippet: new SpringSnippet,
  },
  {
    label: 'Spring',
    id: 'java-platform',
    parent: 'java',
    snippet: new PlatformSnippet,
  },
];

const topTabs = commands.filter(i => !i.parent);

export default class HttpSnippetsElement extends LitElement {
  static get styles(): CSSResult[] {
    return [
      prismStyles,
      css`
      :host {
        display: block;
      }
      
      .code {
        user-select: text;
      }`
    ];
  }

  /**
   * The currently selected snippet.
   */
  @property({ type: String }) selected = 'bash-curl';

  protected _parent = 'bash-curl';

  @property({ type: Object }) request?: IHttpRequest;

  @state() protected _code?: string;

  /**
   * The list of tab names to render in the view.
   */
  get _groupTabs(): CodeGroup[] {
    const result: CodeGroup[] = [];
    commands.forEach(i => {
      if (i.parent === this._parent) {
        result.push(i);
      }
    });
    return result;
  }

  protected updated(cp: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
    super.updated(cp);
    if (cp.has('request') || cp.has('selected')) {
      this._triggerCommand();
    }
  }

  protected _triggerCommand(): void {
    const { selected = 'bash-curl', request } = this;
    if (!request) {
      return;
    }
    const instance = commands.find(i => i.id === selected);
    if (!instance || !instance.snippet) {
      return;
    }
    this._code = instance.snippet.tokenize(request);
  }

  protected _groupHandler(e: Event): void {
    const tabs = e.target as AnypointTabsElement;
    const selected = tabs.selected as string;
    if (this._parent === selected) {
      return;
    }
    const item = commands.find(i => i.id === selected);
    if (!item) {
      return;
    }
    if (!item.snippet) {
      const firstChild = commands.find(i => i.parent === selected);
      this.selected = firstChild!.id;
      this._parent = selected;
    } else {
      this.selected = selected;
      this._parent = selected;
    }
  }

  protected _subHandler(e: Event): void {
    const tabs = e.target as AnypointTabsElement;
    const selected = tabs.selected as string;
    this.selected = selected;
  }

  protected render(): TemplateResult {
    return html`
    ${this._tabsTemplate()}
    ${this._groupTabsTemplate()}
    ${this._tabsContentTemplate()}
    `;
  }

  protected _tabsTemplate(): TemplateResult {
    return html`
    <anypoint-tabs
      fitcontainer
      attrForSelected="data-id"
      .selected="${this._parent}"
      @select="${this._groupHandler}"
    >
      ${topTabs.map(tab => html`<anypoint-tab data-id="${tab.id}">${tab.label}</anypoint-tab>`)}
    </anypoint-tabs>
    `;
  }

  protected _groupTabsTemplate(): TemplateResult | string {
    const { _groupTabs, selected } = this;
    if (!_groupTabs.length) {
      return '';
    }
    return html`
    <anypoint-tabs
      fitcontainer
      attrForSelected="data-id"
      .selected="${selected}"
      @select="${this._subHandler}"
    >
      ${_groupTabs.map(tab => html`<anypoint-tab data-id="${tab.id}">${tab.label}</anypoint-tab>`)}
    </anypoint-tabs>
    `;
  }

  protected _tabsContentTemplate(): TemplateResult | string {
    if (!this._code) {
      return '';
    }
    return html`
    <code class="code language-snippet"><pre>${unsafeHTML(this._code)}</pre></code>
    `;
  }
}
