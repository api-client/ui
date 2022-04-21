/* eslint-disable no-template-curly-in-string */
import { fixture, html, assert, nextFrame, aTimeout } from '@open-wc/testing';
import sinon from 'sinon';
import { AnypointInputElement } from '@anypoint-web-components/awc';
import '../../../src/define/url-params-editor.js';
import {
  valueChanged,
  addParamHandler,
} from '../../../src/elements/http/internals.js';
import UrlParamsEditorElement from '../../../src/elements/http/UrlParamsEditorElement.js';

describe('UrlParamsEditorElement', () => {
  async function basicFixture(): Promise<UrlParamsEditorElement> {
    const value = 'https://arc.com:1234/path/o ther/?a=b&c=d#123';
    return fixture(html`<url-params-editor
      .value="${value}"></url-params-editor>`);
  }
  
  async function emptyFixture(): Promise<UrlParamsEditorElement> {
    return fixture(html`<url-params-editor></url-params-editor>`);
  }
  
  async function valueFixture(value: string): Promise<UrlParamsEditorElement> {
    return fixture(html`<url-params-editor .value="${value}"></url-params-editor>`);
  }

  describe('Basics', () => {
    let element: UrlParamsEditorElement;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('the model is computed', () => {
      const m = element.model;
      assert.typeOf(m, 'object', 'Model is an object');
    });

    it('notifies change to a param name', () => {
      const input = element.shadowRoot.querySelector('.param-name') as AnypointInputElement;
      const spy = sinon.spy();
      element.addEventListener('change', spy);
      input.value = 'a-changed';
      input.dispatchEvent(new Event('change'));
      assert.isTrue(spy.called, 'event is dispatched');
    });

    it('notifies change for a param value', () => {
      const input = element.shadowRoot.querySelector('.param-value') as AnypointInputElement;
      const spy = sinon.spy();
      element.addEventListener('change', spy);
      input.value = 'a-value';
      input.dispatchEvent(new Event('change'));
      assert.isTrue(spy.called, 'event is dispatched');
    });

    it('notifies change for a param value with variable', () => {
      const input = element.shadowRoot.querySelector('.param-value') as AnypointInputElement;
      const spy = sinon.spy();
      element.addEventListener('change', spy);
      input.value = 'a-value${test}';
      input.dispatchEvent(new Event('change'));
      assert.isTrue(spy.called, 'event is dispatched');
    });

    it('notifies change for removing search param', () => {
      const spy = sinon.spy();
      element.addEventListener('change', spy);
      const button = element.shadowRoot.querySelector('.form-row > anypoint-icon-button') as HTMLElement;
      button.click();
      assert.isTrue(spy.called, 'event is dispatched');
    });

    it('changes model when value change', () => {
      element.value = 'http://arc.com/o%20ther?test=value';
      const m = element.model;
      const params = m.search.list();
      assert.lengthOf(params, 1, 'has a single query param');
      assert.equal(params[0].name, 'test', 'has the query param name');
      assert.equal(params[0].value, 'value', 'has the query param value');
    });
  });

  describe('[valueChanged]()', () => {
    let element: UrlParamsEditorElement;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('sets the parser for the value', () => {
      element[valueChanged]('http://abc.com');
      const { model } = element;
      assert.lengthOf(model.parts, 1, 'has a single part');
      assert.equal(model.parts[0].expression, 'http://abc.com');
    });

    it('sets the default model whe no value', () => {
      element[valueChanged]();
      const { model } = element;
      assert.lengthOf(model.parts, 1, 'has a single part');
      assert.equal(model.parts[0].expression, '/');
    });
  });

  describe('[addParamHandler]()', () => {
    let element: UrlParamsEditorElement;
    beforeEach(async () => {
      element = await emptyFixture();
    });

    it('does nothing in the readonly mode', () => {
      element.readOnly = true;
      element[addParamHandler]();
      assert.deepEqual(element.model.search.list(), []);
    });

    it('adds a query parameters', () => {
      element[addParamHandler]();
      assert.lengthOf(element.model.search.list(), 1);
    });

    it('added property is empty', () => {
      element[addParamHandler]();
      const param = element.model.search.list()[0];
      assert.equal(param.name, '');
      assert.equal(param.value, '');
      assert.isTrue(param.enabled);
    });

    it('adds property to an existing list', () => {
      element[addParamHandler]();
      element[addParamHandler]();
      assert.lengthOf(element.model.search.list(), 2);
    });

    it('notifies resize', async () => {
      const spy = sinon.spy();
      element.addEventListener('resize', spy);
      element[addParamHandler]();
      await element.updateComplete;
      await aTimeout(0);
      assert.isTrue(spy.called);
    });

    it('focuses on the last element', async () => {
      const spy = sinon.spy(element, 'focusLastName');
      element[addParamHandler]();
      await element.updateComplete;
      await aTimeout(0);
      assert.isTrue(spy.called);
    });
  });

  describe('_getValidity()', () => {
    let element: UrlParamsEditorElement;
    beforeEach(async () => {
      element = await emptyFixture();
      element.value = 'http://domain.com/path';
      await nextFrame();
    });

    it('Returns true when valid', () => {
      const result = element._getValidity();
      assert.isTrue(result);
    });
  });

  describe('disabling parameters', () => {
    const value = 'https://arc.com/?a=b&c=d&e=f';
    let element: UrlParamsEditorElement;
    beforeEach(async () => {
      element = await valueFixture(value);
    });

    it('removes a query parameter from the value', () => {
      const button = element.shadowRoot.querySelector('anypoint-icon-button');
      button.click();
      assert.equal(element.value, 'https://arc.com/?c=d&e=f');
    });
  });

  describe('removing parameters', () => {
    const value = 'https://arc.com/?a=b&c=d&e=f';
    let element: UrlParamsEditorElement;
    beforeEach(async () => {
      element = await valueFixture(value);
    });

    it('removes the query parameter', () => {
      const button = element.shadowRoot.querySelector('anypoint-switch');
      button.click();
      assert.equal(element.value, 'https://arc.com/?c=d&e=f');
    });

    it('re-enables query parameter', async () => {
      const button = element.shadowRoot.querySelector('anypoint-switch');
      button.click();
      await nextFrame();
      button.click();
      assert.equal(element.value, value);
    });
  });

  describe('a11y', () => {
    it('is accessible when empty', async () => {
      const element = await emptyFixture();
      await assert.isAccessible(element, {
        ignoredRules: ['color-contrast']
      });
    });

    it('is accessible with all values', async () => {
      const element = await basicFixture();
      await assert.isAccessible(element, {
        ignoredRules: ['color-contrast']
      });
    });
  });
});
