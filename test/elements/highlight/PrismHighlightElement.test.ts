import { fixture, assert, html, oneEvent, nextFrame } from '@open-wc/testing';
import '../../../src/define/prism-highlight.js';
import PrismHighlightElement, { outputElement } from '../../../src/elements/highlight/PrismHighlightElement.js';

describe('PrismHighlightElement', () => {
  async function markdownFixture(): Promise<PrismHighlightElement> {
    return fixture(html`<prism-highlight lang="markdown"></prism-highlight>`);
  }

  async function rawFixture(): Promise<PrismHighlightElement> {
    return fixture(html`<prism-highlight raw lang="json" code='{"test": true}'></prism-highlight>`);
  }

  describe('anchors handling', () => {
    let element: PrismHighlightElement;
    let code = '# Test highlight\nHello world!\n';
    code += '[link](https://domain.com/)';

    beforeEach(async () => {
      element = await markdownFixture();
      element.code = code;
      // one for the setter
      await nextFrame();
      // and one for the highlight debouncer (do we still need it?)
      await nextFrame();
    });

    it('dispatches the link event', async () => {
      const anchor = element[outputElement].querySelector('a');
      setTimeout(() => {
        anchor.click();
      });
      const e = await oneEvent(element, 'link');
      assert.equal(e.detail.url, 'https://domain.com/', 'has the URL value');
      assert.equal(e.detail.asNew, false, 'has the asNew property');
    });

    it('dispatches the event when ctrl is set', async () => {
      const anchor = element[outputElement].querySelector('a');
      setTimeout(() => {
        anchor.dispatchEvent(new PointerEvent('click', {
          bubbles: true,
          cancelable: true,
          composed: true,
          ctrlKey: true,
        }));
      });
      const e = await oneEvent(element, 'link');
      assert.equal(e.detail.url, 'https://domain.com/', 'has the URL value');
      assert.equal(e.detail.asNew, true, 'has the asNew property');
    });
  });

  describe('#raw', () => {
    let element: PrismHighlightElement;
    beforeEach(async () => {
      element = await rawFixture();
    });

    it('renders the code without highlighting', () => {
      const pre = element.shadowRoot.querySelector('.raw-content');
      assert.ok(pre)
    });

    it('renders back the highlighted document', async () => {
      element.raw = false;
      await nextFrame();
      const pre = element.shadowRoot.querySelector('.parsed-content');
      assert.ok(pre)
    });
  });
});
