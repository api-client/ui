/* eslint-disable no-param-reassign */
import { nextFrame, fixture, expect, assert, html, oneEvent } from '@open-wc/testing';
import sinon from 'sinon';
import { MarkedHighlightElement } from '../../../src/index.js';
import '../../../src/define/marked-highlight.js';

describe('MarkedHighlightElement', () => {
  async function basicFixture(): Promise<MarkedHighlightElement> {
    return fixture(html`<marked-highlight>
        <div id="output" slot="markdown-html"></div>
        <script type="text/markdown">
        # Test
        </script>
      </marked-highlight>`);
  }

  async function propertyMarkdownFixture(): Promise<MarkedHighlightElement> {
    return fixture(html`<marked-highlight markdown="# Test">
        <div id="output" slot="markdown-html"></div>
      </marked-highlight>`);
  }

  async function noContentFixture(): Promise<MarkedHighlightElement> {
    return fixture(html`<marked-highlight>
        <div id="output" slot="markdown-html"></div>
        <script type="text/markdown">

        </script>
      </marked-highlight>`);
  }

  async function camelCaseHTMLFixture(): Promise<MarkedHighlightElement> {
    return fixture(html`<marked-highlight>
        <div id="output" slot="markdown-html"></div>
        <script type="text/markdown">
\`\`\`html
<div camelCase></div>
\`\`\`
        </script>
      </marked-highlight>`);
  }

  async function badHTMLFixture(): Promise<MarkedHighlightElement> {
    return fixture(html`<marked-highlight>
        <div id="output" slot="markdown-html"></div>
        <script type="text/markdown">
\`\`\`html
<p><div></p></div>
\`\`\`
        </script>
      </marked-highlight>`);
  }

  async function camelCaseHTMLWithoutChildFixture(): Promise<MarkedHighlightElement> {
    return fixture(html`<marked-highlight>
        <script type="text/markdown">
\`\`\`html
<div camelCase></div>
\`\`\`
        </script>
      </marked-highlight>`);
  }

  async function badHTMLWithoutChildFixture(): Promise<MarkedHighlightElement> {
    return fixture(html`<marked-highlight>
        <script type="text/markdown">
\`\`\`html
<p><div></p></div>
\`\`\`
        </script>
      </marked-highlight>`);
  }

  async function rendererFixture(): Promise<MarkedHighlightElement> {
    return fixture(html`<marked-highlight>
        <div id="output" slot="markdown-html"></div>
        <script type="text/markdown">
          [Link](http://url.com)
        </script>
      </marked-highlight>`);
  }

  async function sanitizerFixture(): Promise<MarkedHighlightElement> {
    return fixture(html`<marked-highlight sanitize>
        <div id="output" slot="markdown-html"></div>
        <script type="text/markdown">
[Link](http://url.com" onclick="alert(1)")
<a href="http://url.com" onclick="alert(1)">Link</a>
\`\`\`html
<a href="http://url.com" onclick="alert(1)">Link</a>
\`\`\`
        </script>
      </marked-highlight>`);
  }
  
  async function remoteContentFixture(): Promise<MarkedHighlightElement> {
    return fixture(html`<marked-highlight>
        <div id="output" slot="markdown-html"></div>
        <script type="text/markdown" src="test/elements/highlight/test.md">
          # Loading
          Please wait...
        </script>
      </marked-highlight>`);
  }

  async function badRemoteContentFixture(): Promise<MarkedHighlightElement> {
    return fixture(html`<marked-highlight>
        <div id="output" slot="markdown-html"></div>
        <script type="text/markdown" src="test/elements/highlight/test3.md"></script>
      </marked-highlight>`);
  }

  async function sanitizedRemoteContentFixture(): Promise<MarkedHighlightElement> {
    return fixture(html`<marked-highlight>
        <div id="output" slot="markdown-html"></div>
        <script type="text/markdown" src="test/elements/highlight/remoteSanitization.md"></script>
      </marked-highlight>`);
  }

  async function unsanitizedRemoteContentFixture(): Promise<MarkedHighlightElement> {
    return fixture(html`<marked-highlight disableRemoteSanitization>
        <div id="output" slot="markdown-html"></div>
        <script type="text/markdown" src="test/elements/highlight/remoteSanitization.md"></script>
      </marked-highlight>`);
  }

  async function markedOptionsFixture(): Promise<MarkedHighlightElement> {
    return fixture(html`<marked-highlight sanitize pedantic breaks smartypants>
        <div id="output" slot="markdown-html"></div>
        <script type="text/markdown" src="test/elements/highlight/remoteSanitization.md"></script>
      </marked-highlight>`);
  }

  // Thanks IE10.
  function isHidden(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();
    return rect.width === 0 && rect.height === 0;
  }

  // // Replace reserved HTML characters with their character entity equivalents to
  // // match the transform done by Markdown.
  // //
  // // The Marked library itself is not used because it wraps code blocks in
  // // `<code><pre>`, which is superfluous for testing purposes.
  // function escapeHTML(string) {
  //   const span = document.createElement('span');
  //   span.textContent = string;
  //   return span.innerHTML;
  // }

  describe('Property setters', () => {
    let element = /** @type MarkedHighlightElement */ (null);
    beforeEach(async () => {
      element = await basicFixture();
    });

    [
      ['markdown', 'test'],
      ['breaks', true],
      ['pedantic', true],
      ['renderer', (): any => {}],
      ['sanitize', true],
      ['sanitizer', (): any => {}],
      ['smartypants', true]
    ].forEach((item) => {
      const prop = String(item[0]);
      const value = item[1] as any;

      it(`triggers the renderMarkdown() when setting the ${prop} property`, async () => {
        const spy = sinon.spy(element, 'renderMarkdown');
        element[prop] = value;
        await nextFrame();
        assert.isTrue(spy.called);
      });

      it(`ignores renderMarkdown() when setting the same value for the ${prop} property`, async () => {
        element[prop] = value;
        await nextFrame();
        const spy = sinon.spy(element, 'renderMarkdown');
        element[prop] = value;
        await nextFrame();
        assert.isFalse(spy.called);
      });
    });
  });

  describe('<marked-highlight> renders markdown from property setter', () => {
    let outputElement: HTMLDivElement;
    beforeEach(async () => {
      await propertyMarkdownFixture();
      outputElement = document.getElementById('output') as HTMLDivElement;
    });

    it('renders the code', () => {
      assert.equal(outputElement.innerHTML, '<h1 id="test">Test</h1>\n');
    });
  });

  describe('<marked-highlight> has options of marked library', () => {
    let markedElement: MarkedHighlightElement;
    beforeEach(async () => {
      markedElement = await markedOptionsFixture();
    });

    it('has sanitize', () => {
      expect(markedElement.sanitize).to.equal(true);
    });

    it('has sanitizer', () => {
      expect(markedElement.sanitizer).to.equal(undefined);
    });

    it('has pedantic', () => {
      expect(markedElement.pedantic).to.equal(true);
    });

    it('has breaks', () => {
      expect(markedElement.breaks).to.equal(true);
    });

    it('has smartypants', () => {
      expect(markedElement.smartypants).to.equal(true);
    });
  });

  describe('<marked-highlight> with .markdown-html child', () => {
    describe('ignores no content', () => {
      let markedElement: MarkedHighlightElement;
      let outputElement: HTMLDivElement;
      let proofElement: HTMLDivElement;
      beforeEach(async () => {
        markedElement = await noContentFixture();
        proofElement = document.createElement('div');
        outputElement = document.getElementById('output') as HTMLDivElement;
      });

      it('in code blocks', () => {
        proofElement.innerHTML = '';
        assert.equal(outputElement, markedElement.outputElement);
        assert.isTrue(isHidden(markedElement.shadowRoot.querySelector('#content')));
        assert.equal(markedElement.markdown, undefined);
        assert.equal(outputElement.innerHTML, proofElement.innerHTML);
      });
    });

    describe('respects camelCased HTML', () => {
      let markedElement: MarkedHighlightElement;
      let outputElement: HTMLDivElement;
      let proofElement: HTMLDivElement;

      beforeEach(async () => {
        markedElement = await camelCaseHTMLFixture();
        proofElement = document.createElement('div');
        outputElement = document.getElementById('output') as HTMLDivElement;
      });

      it('in code blocks', () => {
        proofElement.innerHTML = '<div camelCase></div>';
        expect(outputElement).to.equal(markedElement.outputElement);
        assert.isTrue(isHidden(markedElement.shadowRoot.querySelector('#content')));
        // If Markdown content were put into a `<template>` or directly into the
        // DOM, it would be rendered as DOM and be converted from camelCase to
        // lowercase per HTML parsing rules. By using `<script>` descendants,
        // content is interpreted as plain text.
        expect(proofElement.innerHTML).to.eql('<div camelcase=""></div>');
      });
    });

    describe('respects bad HTML', () => {
      let markedElement: MarkedHighlightElement;
      let outputElement: HTMLDivElement;
      let proofElement: HTMLDivElement;

      beforeEach(async () => {
        markedElement = await badHTMLFixture();
        proofElement = document.createElement('div');
        outputElement = document.getElementById('output') as HTMLDivElement;
      });

      it('in code blocks', () => {
        proofElement.innerHTML = '<p><div></p></div>';
        expect(outputElement).to.equal(markedElement.outputElement);
        assert.isTrue(isHidden(markedElement.shadowRoot.querySelector('#content')));
        // If Markdown content were put into a `<template>` or directly into the
        // DOM, it would be rendered as DOM and close unbalanced tags. Because
        // they are in code blocks they should remain as typed. Turns out, however
        // IE and everybody else have slightly different opinions about how the
        // incorrect HTML should be fixed. It seems that: IE says:
        // <p><div></p></div> -> <p><div><p></p></div> Chrome/FF say:
        // <p><div></p></div> -> <p></p><div><p></p></div>. So that's cool.
        const isEqualToOneOfThem =
          proofElement.innerHTML === '<p><div><p></p></div>' || proofElement.innerHTML === '<p></p><div><p></p></div>';
        assert.isTrue(isEqualToOneOfThem);
        expect(outputElement.innerHTML).to.include('<span class="token punctuation">&lt;</span>p</span>');
      });
    });
  });

  describe('<marked-highlight> without .markdown-html child', () => {
    describe('respects camelCased HTML', () => {
      let markedElement: MarkedHighlightElement;
      let proofElement: HTMLElement;
      beforeEach(async () => {
        markedElement = await camelCaseHTMLWithoutChildFixture();
        proofElement = document.createElement('div');
      });

      it('in code blocks', async () => {
        proofElement.innerHTML = '<div camelCase></div>';
        expect(markedElement.shadowRoot.querySelector('#content')).to.equal(markedElement.outputElement);
        await nextFrame();
        assert.isFalse(isHidden(markedElement.shadowRoot.querySelector('#content')));
        // If Markdown content were put into a `<template>` or directly into the
        // DOM, it would be rendered as DOM and be converted from camelCase to
        // lowercase per HTML parsing rules. By using `<script>` descendants,
        // content is interpreted as plain text.
        expect(proofElement.innerHTML).to.eql('<div camelcase=""></div>');
        // expect(markedElement.shadowRoot.querySelector('#content').innerHTML).to.include(escapeHTML('<div camelCase>'));
      });
    });

    describe('respects bad HTML', () => {
      let markedElement: MarkedHighlightElement;
      let proofElement: HTMLElement;

      beforeEach(async () => {
        markedElement = await badHTMLWithoutChildFixture();
        proofElement = document.createElement('div');
      });

      it('in code blocks', async () => {
        proofElement.innerHTML = '<p><div></p></div>';
        expect(markedElement.shadowRoot.querySelector('#content')).to.equal(markedElement.outputElement);
        await nextFrame();
        assert.isFalse(isHidden(markedElement.shadowRoot.querySelector('#content')));
        // If Markdown content were put into a `<template>` or directly into the
        // DOM, it would be rendered as DOM and close unbalanced tags. Because
        // they are in code blocks they should remain as typed. Turns out, however
        // IE and everybody else have slightly different opinions about how the
        // incorrect HTML should be fixed. It seems that: IE says:
        // <p><div></p></div> -> <p><div><p></p></div> Chrome/FF say:
        // <p><div></p></div> -> <p></p><div><p></p></div>. So that's cool.
        const isEqualToOneOfThem =
          proofElement.innerHTML === '<p><div><p></p></div>' || proofElement.innerHTML === '<p></p><div><p></p></div>';
        assert.isTrue(isEqualToOneOfThem);
        // expect(markedElement.shadowRoot.querySelector('#content').innerHTML).to.include(
        //   escapeHTML('<p><div></p></div>')
        // );
      });
    });
  });

  describe('<marked-highlight> with custom sanitizer', () => {
    let markedElement: MarkedHighlightElement;
    let outputElement: HTMLDivElement;
    let proofElement: HTMLDivElement;

    beforeEach(async () => {
      markedElement = await sanitizerFixture();
      outputElement = document.getElementById('output') as HTMLDivElement;
      proofElement = document.createElement('div');
    });

    it('takes custom sanitizer', async () => {
      markedElement.sanitizer = (input: string): string => input.replace(/ onclick="[^"]+"/gim, '');
      await nextFrame();
      proofElement.innerHTML =
        '<p>[Link](<a href="http://url.com&quot;">http://url.com"</a> onclick="alert(1)")\n' +
        '<a href="http://url.com">Link</a></p>\n<pre><code class="language-html">&lt;a ' +
        'href="http://url.com" onclick="alert(1)"&gt;Link&lt;/a&gt;\n</code></pre>\n';
      const cp = '<p>[Link](<a href="http://url.com&quot;">http://url.com"</a> onclick="alert(1)")\n<a href="http://url.com">Link</a></p>\n<pre><code class="language-html"><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>a</span> <span class="token attr-name">href</span><span class="token attr-value"><span class="token punctuation attr-equals">=</span><span class="token punctuation">"</span><a class="token url-link" href="http://url.com">http://url.com</a><span class="token punctuation">"</span></span> <span class="token attr-name">onclick</span><span class="token attr-value"><span class="token punctuation attr-equals">=</span><span class="token punctuation">"</span>alert(1)<span class="token punctuation">"</span></span><span class="token punctuation">&gt;</span></span>Link<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>a</span><span class="token punctuation">&gt;</span></span>\n</code></pre>\n';
      expect(outputElement.innerHTML).to.include(cp);
    });
  });

  describe('<marked-highlight> with custom renderer', () => {
    let markedElement: MarkedHighlightElement;
    let outputElement: HTMLDivElement;
    let proofElement: HTMLDivElement;

    beforeEach(async () => {
      markedElement = await rendererFixture();
      outputElement = document.getElementById('output') as HTMLDivElement;
      proofElement = document.createElement('div');
    });

    it('takes custom link renderer', async () => {
      markedElement.renderer = (renderer: any): void => {
        renderer.link = (href: string, title: string, text: string): string => `<a href="${href}" target="_blank">${text}</a>`;
      };
      await nextFrame();
      proofElement.innerHTML = '<a href="http://url.com" target="_blank">Link</a>';
      expect(outputElement.innerHTML).to.include(proofElement.innerHTML);
    });
  });

  describe('<marked-highlight> with remote content', () => {
    let markedElement: MarkedHighlightElement;
    let outputElement: HTMLDivElement;
    let proofElement: HTMLDivElement;

    describe('successful fetch', () => {
      beforeEach(async () => {
        markedElement = await remoteContentFixture();
        outputElement = document.getElementById('output') as HTMLDivElement;
        proofElement = document.createElement('div');
      });

      it('renders remote content', async () => {
        proofElement.innerHTML = '<h1 id="test">Test</h1>\n<p><a href="http://url.com/">Link</a></p>\n';
        await oneEvent(markedElement, 'markedloaded');
        await nextFrame();
        expect(outputElement.innerHTML).to.equal(proofElement.innerHTML);
      });

      it('renders content while remote content is loading', () => {
        proofElement.innerHTML = '<h1 id="loading">Loading</h1>\n<p>Please wait...</p>\n';
        expect(outputElement.innerHTML).to.equal(proofElement.innerHTML);
      });

      it('renders new remote content when src changes', async () => {
        await oneEvent(markedElement, 'markedloaded');
        await nextFrame();
        proofElement.innerHTML = '<h1 id="test-2">Test 2</h1>\n';
        // @ts-ignore
        markedElement.querySelector('[type="text/markdown"]').src = 'test/elements/highlight/test2.md';
        await oneEvent(markedElement, 'markedloaded');
        await nextFrame();
        expect(outputElement.innerHTML).to.equal(proofElement.innerHTML);
      });
    });

    describe('fails to load', () => {
      beforeEach(async () => {
        markedElement = await badRemoteContentFixture();
        outputElement = document.getElementById('output') as HTMLDivElement;
        proofElement = document.createElement('div');
      });

      it('renders error message', async () => {
        proofElement.innerHTML = '<p>Failed loading markdown source</p>\n';
        await oneEvent(markedElement, 'markedloaderror');
        await nextFrame();
        expect(outputElement.innerHTML).to.equal(proofElement.innerHTML);
      });

      it("doesn't render error message when default is prevented", async () => {
        proofElement.innerHTML = '';
        markedElement.addEventListener('markedloaderror', (e) => {
          e.preventDefault();
        });
        await oneEvent(markedElement, 'markedloaderror');
        await nextFrame();
        expect(outputElement.innerHTML).to.equal(proofElement.innerHTML);
      });
    });

    describe('sanitizing remote content', () => {
      describe('sanitized', () => {
        beforeEach(async () => {
          markedElement = await sanitizedRemoteContentFixture();
        });

        it('sanitizes remote content', async () => {
          outputElement = markedElement.querySelector('#output');
          proofElement = document.createElement('div');
          proofElement.innerHTML = '<div></div>\n';
          await oneEvent(markedElement, 'markedloaded');
          await nextFrame();
          assert.isTrue(markedElement.sanitize);
          assert.isNotTrue(markedElement.disableRemoteSanitization);
          expect(outputElement.innerHTML).to.equal(proofElement.innerHTML);
        });
      });

      describe('unsanitized', () => {
        beforeEach(async () => {
          markedElement = await unsanitizedRemoteContentFixture();
        });

        it('Does not sanitize remote content', async () => {
          outputElement = markedElement.querySelector('#output');
          proofElement = document.createElement('div');
          proofElement.innerHTML = '<div></div>\n';
          await oneEvent(markedElement, 'markedloaded');
          await nextFrame();

          assert.isNotTrue(markedElement.sanitize);
          assert.isTrue(markedElement.disableRemoteSanitization);
          expect(outputElement.innerHTML).to.equal(proofElement.innerHTML);
        });
      });
    });
  });

  describe('events', () => {
    let markedElement: MarkedHighlightElement;
    let outputElement: HTMLDivElement;
    beforeEach(async () => {
      markedElement = await camelCaseHTMLFixture();
      outputElement = document.getElementById('output') as HTMLDivElement;
    });

    it('render() fires markedrendercomplete', async () => {
      setTimeout(() => {
        markedElement.renderMarkdown();
      });
      await oneEvent(markedElement, 'markedrendercomplete');
      await nextFrame();
      expect(outputElement.innerHTML).to.not.equal('');
    });
  });
});
