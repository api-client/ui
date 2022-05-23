/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-template-curly-in-string */
import { fixture, html, assert, nextFrame, aTimeout } from '@open-wc/testing';
import sinon from 'sinon';
import { ProjectMock, EventTypes as CoreEventTypes, IUrl, ContextDeleteEvent } from '@api-client/core/build/browser.js';
import { AnypointButtonElement, AnypointDropdownElement, AnypointInputElement, AnypointListboxElement } from '@anypoint-web-components/awc';
import '../../../src/define/url-input-editor.js';
import {
  dispatchAnalyticsEvent,
  readAutocomplete,
  suggestionsValue,
  previousValue,
  renderedSuggestions,
  filterSuggestions,
  autocompleteOpened,
} from '../../../src/elements/http/internals.js';
import { sortUrls } from '../../../src/lib/http/Url.js';
import UrlInputEditorElement from '../../../src/elements/http/UrlInputEditorElement.js';
import { EventTypes } from '../../../src/events/EventTypes.js';
import { Events } from '../../../src/events/Events.js';


describe('UrlInputEditorElement', () => {
  const generator = new ProjectMock();
  
  async function basicFixture(): Promise<UrlInputEditorElement> {
    return fixture(html`<url-input-editor></url-input-editor>`);
  }
  
  async function readonlyFixture(): Promise<UrlInputEditorElement> {
    return fixture(html`<url-input-editor readOnly></url-input-editor>`);
  }
  
  async function detailsFixture(): Promise<UrlInputEditorElement> {
    return fixture(html`<url-input-editor detailsOpened></url-input-editor>`);
  }
  
  describe('basic tests', () => {
    let element: UrlInputEditorElement;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('has the default value', async () => {
      const input = element.shadowRoot!.querySelector('.main-input') as AnypointInputElement;
      assert.equal(input.value, 'http://');
    });

    it(`dispatches url change event on main input change`, async () => {
      const value = 'https://mulesoft.com/';
      const input = element.shadowRoot!.querySelector('.main-input') as AnypointInputElement;
      input.value = value;
      const spy = sinon.spy();
      element.addEventListener(EventTypes.Http.Request.State.urlChange, spy);
      input.dispatchEvent(new Event('input'));
      assert.isTrue(spy.called, 'The event is dispatched')
      assert.equal(spy.args[0][0].detail.value, value);
    });

    it('opens the detailed editor', async () => {
      const button = element.shadowRoot!.querySelector('.toggle-icon') as AnypointButtonElement;
      button.click();
      assert.isTrue(element.detailsOpened);
    });
  });

  describe('Read only mode', () => {
    let element: UrlInputEditorElement;
    beforeEach(async () => {
      element = await readonlyFixture();
    });

    it(`skips the main input change event`, () => {
      const spy = sinon.spy();
      element.addEventListener(EventTypes.Http.Request.State.urlChange, spy);
      const input = element.shadowRoot!.querySelector('.main-input') as AnypointInputElement;
      input.value = 'https://mulesoft.com/';
      input.dispatchEvent(new Event('input'));
      assert.isFalse(spy.called);
    });

    it(`skips URL change event`, () => {
      Events.Http.Request.State.urlChange('https://other.com')
      assert.notEqual(element.value, 'https://other.com');
    });
  });

  describe('Validation', () => {
    let element: UrlInputEditorElement;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('does not pass the validation with an empty value', async () => {
      element.value = '';
      await nextFrame();
      const result = element.checkValidity();
      assert.isFalse(result);
    });

    it('passes the validation with value', () => {
      element.value = 'test';
      const result = element.checkValidity();
      assert.isTrue(result);
    });
  });

  describe('[extValueChangeHandler]()', () => {
    const newValue = 'https://test-value';

    it('ignores events dispatched by self', async () => {
      const element = await basicFixture();
      Events.Http.Request.State.urlChange(newValue, element);
      assert.notEqual(element.value, newValue);
    });

    it('sets the new value', async () => {
      const element = await basicFixture();
      Events.Http.Request.State.urlChange(newValue);
      assert.equal(element.value, newValue);
    });

    it('does nothing when value is already set', async () => {
      const element = await basicFixture();
      element.value = newValue;
      Events.Http.Request.State.urlChange(newValue);
      assert.equal(element.value, newValue);
    });

    it('does not dispatch the change event', async () => {
      const element = await basicFixture();
      const spy = sinon.spy();
      element.addEventListener(EventTypes.Http.Request.State.urlChange, spy);
      Events.Http.Request.State.urlChange(newValue);
      assert.isFalse(spy.called);
    });
  });

  describe('toggle()', () => {
    let element: UrlInputEditorElement;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('toggles detailsOpened', () => {
      element.toggle();
      assert.isTrue(element.detailsOpened);
    });

    it('toggles back detailsOpened', () => {
      element.detailsOpened = true;
      element.toggle();
      assert.isFalse(element.detailsOpened);
    });

    it('parameters overlay is opened', async () => {
      element.toggle();
      await nextFrame();
      const node = element.shadowRoot!.querySelector('url-params-editor');
      assert.isTrue(node.opened);
    });

    it('parameters overlay is closed by default', () => {
      const node = element.shadowRoot!.querySelector('url-params-editor');
      assert.isUndefined(node.opened);
    });

    it('dispatches detailsopened event', () => {
      const spy = sinon.spy();
      element.addEventListener('detailsopened', spy);
      element.toggle();
      assert.isTrue(spy.called, 'event is dispatched');
    });
  });

  describe('[dispatchAnalyticsEvent]()', () => {
    let element: UrlInputEditorElement;
    const label = 'test-label';
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('dispatches the event', () => {
      const spy = sinon.spy();
      element.addEventListener(CoreEventTypes.Telemetry.event, spy);
      element[dispatchAnalyticsEvent](label);
      assert.isTrue(spy.called);
    });

    it('sets the category', () => {
      const spy = sinon.spy();
      element.addEventListener(CoreEventTypes.Telemetry.event, spy);
      element[dispatchAnalyticsEvent](label);
      assert.equal(spy.args[0][0].detail.category, 'Request view');
    });

    it('sets the action', () => {
      const spy = sinon.spy();
      element.addEventListener(CoreEventTypes.Telemetry.event, spy);
      element[dispatchAnalyticsEvent](label);
      assert.equal(spy.args[0][0].detail.action, 'URL editor');
    });

    it('sets the label', () => {
      const spy = sinon.spy();
      element.addEventListener(CoreEventTypes.Telemetry.event, spy);
      element[dispatchAnalyticsEvent](label);
      assert.equal(spy.args[0][0].detail.label, label);
    });
  });

  describe('[readAutocomplete]()', () => {
    let element: UrlInputEditorElement;
    const query = 'http://';

    beforeEach(async () => {
      element = await basicFixture();
    });

    it('dispatches the query event', () => {
      const spy = sinon.spy();
      element.addEventListener(EventTypes.AppData.Http.UrlHistory.query, spy);
      element[readAutocomplete](query);
      assert.isTrue(spy.called);
    });

    it('sets suggestions when available', async () => {
      element.addEventListener(EventTypes.AppData.Http.UrlHistory.query, (e) => {
        const urls = generator.url.urls(5);
        const event = e as CustomEvent;
        event.detail.result = Promise.resolve(urls);
      });
      await element[readAutocomplete](query);
      assert.lengthOf(element[suggestionsValue], 5);
    });

    it('sets empty when no results', async () => {
      element.addEventListener(EventTypes.AppData.Http.UrlHistory.query, (e) => {
        (e as CustomEvent).detail.result = Promise.resolve();
      });
      await element[readAutocomplete](query);
      assert.isUndefined(element[suggestionsValue]);
    });

    it('sets empty when error', async () => {
      element.addEventListener(EventTypes.AppData.Http.UrlHistory.query, (e) => {
        (e as CustomEvent).detail.result = Promise.reject(new Error('test'));
      });
      await element[readAutocomplete](query);
      assert.isUndefined(element[suggestionsValue]);
    });
  });

  describe('[keyDownHandler]()', () => {
    let element: UrlInputEditorElement;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('does nothing when target is not an input', () => {
      const spy = sinon.spy();
      element.addEventListener(EventTypes.Http.Request.send, spy);
      const div = element.shadowRoot!.querySelector('.content-shadow');
      const e = new KeyboardEvent('keydown', {
        code: 'Enter',
        bubbles: true,
        cancelable: true,
        composed: true,
        key: 'Enter',
      });
      div.dispatchEvent(e);
      assert.isFalse(spy.called);
    });

    it('dispatches the send event for the Enter key', () => {
      const spy = sinon.spy();
      element.addEventListener(EventTypes.Http.Request.send, spy);
      const input = element.shadowRoot!.querySelector('.main-input');
      const e = new KeyboardEvent('keydown', {
        code: 'Enter',
        bubbles: true,
        cancelable: true,
        composed: true,
        key: 'Enter',
      });
      input.dispatchEvent(e);
      assert.isTrue(spy.called);
    });

    it('dispatches the send event for the NumpadEnter key', () => {
      const spy = sinon.spy();
      element.addEventListener(EventTypes.Http.Request.send, spy);
      const input = element.shadowRoot!.querySelector('.main-input');
      const e = new KeyboardEvent('keydown', {
        code: 'NumpadEnter',
        bubbles: true,
        cancelable: true,
        composed: true,
        key: 'NumpadEnter',
      });
      input.dispatchEvent(e);
      assert.isTrue(spy.called);
    });
  });

  describe('_getValidity()', () => {
    it('calls checkValidity on detailed editor', async () => {
      const element = await detailsFixture();
      const node = element.shadowRoot!.querySelector('url-params-editor');
      const spy = sinon.spy(node, 'checkValidity');
      element._getValidity();
      assert.isTrue(spy.called);
    });

    it('validates the main input', async () => {
      const element = await basicFixture();
      element.value = '';
      await nextFrame();
      const result = element._getValidity();
      assert.isFalse(result);
    });

    it('validates the input when valid', async () => {
      const element = await basicFixture();
      element.value = 'https://api.com';
      await nextFrame();
      const result = element._getValidity();
      assert.isTrue(result);
    });
  });

  describe('a11y', () => {
    it('is accessible', async () => {
      const element = await basicFixture();
      await assert.isAccessible(element, {
        ignoredRules: ['color-contrast']
      });
    });

    it('is accessible with details', async () => {
      const element = await detailsFixture();
      await assert.isAccessible(element, {
        ignoredRules: ['color-contrast']
      });
    });
  });

  describe('URL suggestions', () => {
    function mockSingleQuery(target: EventTarget): IUrl[] {
      const items = generator.url.urls(5);
      target.addEventListener(EventTypes.AppData.Http.UrlHistory.query, function f(e) {
        e.preventDefault();
        e.stopPropagation();
        target.removeEventListener(EventTypes.AppData.Http.UrlHistory.query, f);
        (e as CustomEvent).detail.result = Promise.resolve(items);
      });
      return items;
    }

    describe('focusing main input', () => {
      let element: UrlInputEditorElement;
      beforeEach(async () => {
        element = await basicFixture();
      });

      it('sets suggestions when after main input focus', async () => {
        const items = mockSingleQuery(element);
        const input = element.shadowRoot!.querySelector('.main-input') as AnypointInputElement;
        input.focus();
        await aTimeout(1);
        assert.deepEqual(element[suggestionsValue], items);
      });

      it('renders the list of suggestions when not detailsOpened', async () => {
        element.detailsOpened = true;
        mockSingleQuery(element);
        const input = element.shadowRoot!.querySelector('.main-input') as AnypointInputElement;
        input.focus();
        await aTimeout(1);
        assert.isUndefined(element[suggestionsValue]);
      });
    });

    describe('suggestions rendering', () => {
      let element: UrlInputEditorElement;
      let items: IUrl[];
      beforeEach(async () => {
        element = await basicFixture();
        element.value = 'http';
        items = mockSingleQuery(element);
        const input = element.shadowRoot!.querySelector('.main-input') as AnypointInputElement;
        input.focus();
        await aTimeout(1);
        element.requestUpdate();
        await element.updateComplete;
      });

      it('renders the list of suggestions', async () => {
        const dropdown = element.shadowRoot!.querySelector('.url-autocomplete') as AnypointDropdownElement;
        assert.isTrue(dropdown.opened, 'the dropdown is rendered');
        const listItems = dropdown.querySelectorAll('anypoint-item');
        assert.lengthOf(listItems, items.length, 'has all items rendered');
        const label = listItems[0].querySelector('div');
        const sorted = [...items];
        sortUrls(sorted, 'http');
        assert.equal(label.textContent.trim(), sorted[0].key, 'item has rendered label');
      });

      it('renders the remove button', async () => {
        const button = element.shadowRoot!.querySelector('.url-autocomplete anypoint-item .remove-suggestion') as HTMLElement;
        assert.ok(button, 'an item has the button');
        const sorted = [...items];
        sortUrls(sorted, 'http');
        assert.equal(button.dataset.id, sorted[0].key, 'the button has the data-id');
      });

      it('renders the remove all button', async () => {
        const button = element.shadowRoot!.querySelector('.clear-all-history') as HTMLElement;
        assert.ok(button, 'an item has the button');
      });

      it('the list has the same width as the main input', async () => {
        const rect = element.getBoundingClientRect();
        const node = element.shadowRoot!.querySelector('.url-autocomplete anypoint-listbox') as AnypointListboxElement;
        assert.equal(node.style.width, `${rect.width}px`);
      });
    });

    describe('suggestions filtering', () => {
      let element: UrlInputEditorElement;
      let items: IUrl[];
      beforeEach(async () => {
        element = await basicFixture();
        element.value = 'http';
        items = mockSingleQuery(element);
        await element.renderSuggestions();
      });

      it('queries for suggestions, filters by the url, case insensitive', async () => {
        items[0].key = 'https://abcdef'
        element[previousValue] = undefined;
        element.value = 'https://AbCd';
        await element[filterSuggestions]();
        assert.lengthOf(element[renderedSuggestions], 1);
      });

      it('ignores rendering when filtered is a one item with the same value as input', async () => {
        element[previousValue] = undefined;
        element.value = items[0].key.toUpperCase();
        await element[filterSuggestions]();
        assert.isFalse(element[autocompleteOpened], 'autocomplete is not rendered');
      });

      it('ignores rendering when filtered is empty', async () => {
        element[previousValue] = undefined;
        element.value = 'impossible value to generate';
        await element[filterSuggestions]();
        assert.isFalse(element[autocompleteOpened], 'autocomplete is not rendered');
      });

      it('reuses existing cached values when rendering suggestions', async () => {
        const input = element.shadowRoot!.querySelector('.main-input') as AnypointInputElement;
        input.value = 'http';
        input.dispatchEvent(new Event('input'));
        input.value = 'http:';
        const spy = sinon.spy();
        element.addEventListener(EventTypes.AppData.Http.UrlHistory.query, spy);
        input.dispatchEvent(new Event('input'));
        assert.equal(element[previousValue], 'http', 'has the previous value set');
        await aTimeout(2);
        assert.isFalse(spy.called, 'the event is not called');
        // assert.isAbove(element[renderedSuggestions].length, 0, 'has rendered suggestions');
        // assert.isTrue(element[autocompleteOpened], 'autocomplete is rendered');
      });
    });

    describe('suggestion handlers', () => {
      let element: UrlInputEditorElement;
      let items: IUrl[];
      beforeEach(async () => {
        element = await basicFixture();
        element.value = 'http';
        items = mockSingleQuery(element);
        await element.renderSuggestions();
        await nextFrame();
        await aTimeout(5);
      });

      it('selects a suggestion value', async () => {
        const item = element.shadowRoot!.querySelector('anypoint-item');
        item.click();
        await nextFrame();
        const sorted = [...items];
        sortUrls(sorted, 'http');
        assert.equal(element.value, sorted[0].key);
      });

      it('closes the list after selection', async () => {
        const item = element.shadowRoot!.querySelector('anypoint-item');
        item.click();
        await nextFrame();
        assert.isFalse(element[autocompleteOpened]);
      });

      it('dispatches the change event', async () => {
        const spy = sinon.spy();
        element.addEventListener(EventTypes.Http.Request.State.urlChange, spy);
        const item = element.shadowRoot!.querySelector('anypoint-item');
        item.click();
        await nextFrame();
        assert.isTrue(spy.calledOnce);
      });

      it('highlights the next list item on ArrowDown', async () => {
        const input = element.shadowRoot!.querySelector('.main-input') as AnypointInputElement;
        const e = new KeyboardEvent('keydown', {
          composed: true,
          bubbles: true,
          cancelable: true,
          code: 'ArrowDown',
        });
        input.dispatchEvent(e);
        assert.isTrue(e.defaultPrevented, 'the event is cancelled');
        const list = element.shadowRoot!.querySelector('.url-autocomplete anypoint-listbox') as AnypointListboxElement;
        assert.ok(list.highlightedItem, 'has a highlighted item');
        const index = list.indexOf(list.highlightedItem);
        assert.equal(index, 0, 'is the first item');
      });

      it('highlights the previous list item on ArrowUp', async () => {
        const input = element.shadowRoot!.querySelector('.main-input') as AnypointInputElement;
        const e = new KeyboardEvent('keydown', {
          composed: true,
          bubbles: true,
          cancelable: true,
          code: 'ArrowUp',
        });
        input.dispatchEvent(e);
        assert.isTrue(e.defaultPrevented, 'the event is cancelled');
        const list = element.shadowRoot!.querySelector('.url-autocomplete anypoint-listbox') as AnypointListboxElement;
        assert.ok(list.highlightedItem, 'has a highlighted item');
        const index = list.indexOf(list.highlightedItem);
        assert.equal(index, items.length - 1, 'is the last item');
      });

      it('accepts selection on Enter', async () => {
        const input = element.shadowRoot!.querySelector('.main-input') as AnypointInputElement;
        // highlight first item
        input.dispatchEvent( new KeyboardEvent('keydown', {
          composed: true,
          bubbles: true,
          cancelable: true,
          code: 'ArrowDown',
        }));
        // send enter
        const e = new KeyboardEvent('keydown', {
          composed: true,
          bubbles: true,
          cancelable: true,
          code: 'Enter',
        });
        input.dispatchEvent(e);
        assert.isTrue(e.defaultPrevented, 'the event is cancelled');
        await nextFrame();
        const rendered = element[renderedSuggestions];
        assert.equal(element.value, rendered[0].key, 'updates the url');
      });

      it('does not send the send request event when accepting selection', async () => {
        const input = element.shadowRoot!.querySelector('.main-input') as AnypointInputElement;
        // highlight first item
        input.dispatchEvent( new KeyboardEvent('keydown', {
          composed: true,
          bubbles: true,
          cancelable: true,
          code: 'ArrowDown',
        }));
        const spy = sinon.spy();
        element.addEventListener(EventTypes.Http.Request.send, spy);
        // send enter
        const e = new KeyboardEvent('keydown', {
          composed: true,
          bubbles: true,
          cancelable: true,
          code: 'Enter',
        });
        input.dispatchEvent(e);
        await nextFrame();
        assert.isFalse(spy.called);
      });

      it('sends the request when has no highlighted item', async () => {
        const input = element.shadowRoot!.querySelector('.main-input') as AnypointInputElement;
        const spy = sinon.spy();
        element.addEventListener(EventTypes.Http.Request.send, spy);
        // send enter
        const e = new KeyboardEvent('keydown', {
          composed: true,
          bubbles: true,
          cancelable: true,
          code: 'Enter',
        });
        input.dispatchEvent(e);
        assert.isTrue(spy.called);
      });
    });

    describe('deleting suggestions', () => {
      let element: UrlInputEditorElement;
      beforeEach(async () => {
        element = await basicFixture();
        element.value = 'http';
        mockSingleQuery(element);
        await element.renderSuggestions();
        await nextFrame();
        await aTimeout(5);
      });

      it('sends the delete event when removing a single suggestion', async () => {
        const spy = sinon.spy();
        element.addEventListener(EventTypes.AppData.Http.UrlHistory.delete, spy);
        const button = element.shadowRoot!.querySelector('anypoint-item .remove-suggestion') as HTMLElement;
        button.click();
        await nextFrame();
        assert.isTrue(spy.called, 'the event is dispatched');
        const e = spy.args[0][0] as ContextDeleteEvent;
        assert.equal(e.detail.key, button.dataset.id, 'has the id of the item');
      });

      it('removes an item from the list when deleted from the store', async () => {
        const button = element.shadowRoot!.querySelector('anypoint-item .remove-suggestion') as HTMLElement;
        const { id } = button.dataset;
        const renderedBefore = element[renderedSuggestions].length;
        Events.AppData.Http.UrlHistory.State.delete(id, document.body);
        await nextFrame();
        const renderedAfter = element[renderedSuggestions].length;
        assert.equal(renderedAfter, renderedBefore - 1, 'has one item less');
        const node = element.shadowRoot!.querySelector(`.remove-suggestion[data-id="${id}"]`);
        assert.notOk(node, 'the item is not rendered');
      });

      it('sends the delete datastore destroy event when removing all suggestions', async () => {
        const spy = sinon.spy();
        element.addEventListener(EventTypes.AppData.Http.UrlHistory.clear, spy);
        const button = element.shadowRoot!.querySelector('.clear-all-history-label') as HTMLElement;
        button.click();
        await nextFrame();
        assert.isTrue(spy.calledOnce, 'the event is dispatched');
      });

      it('clears suggestions state when the data store is destroyed', () => {
        Events.AppData.Http.UrlHistory.State.clear();
        assert.isFalse(element[autocompleteOpened], 'autocomplete is closed');
        assert.isUndefined(element[suggestionsValue], 'has no suggestions');
        assert.isUndefined(element[renderedSuggestions], 'has no rendered suggestions');
      });
    });
  });
});
