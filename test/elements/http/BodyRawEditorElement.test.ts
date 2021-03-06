import { assert, aTimeout, fixture, oneEvent } from '@open-wc/testing';
import sinon from 'sinon';
import { loadMonaco } from '../MonacoSetup.js';
import '../../../src/define/body-raw-editor.js'
import {
  languageValue,
  valueChanged,
} from '../../../src/elements/http/internals.js';
import BodyRawEditorElement from '../../../src/elements/http/BodyRawEditorElement.js';

/* global monaco */

describe('BodyRawEditorElement()', () => {
  async function basicFixture(): Promise<BodyRawEditorElement> {
    return fixture(`<body-raw-editor></body-raw-editor>`);
  }

  before(async () => loadMonaco());

  describe('constructor()', () => {
    let element: BodyRawEditorElement;
    beforeEach(async () => { element = await basicFixture(); });

    it('sets the default readOnly', () => {
      assert.isFalse(element.readOnly);
    });

    it('sets the default value', () => {
      assert.equal(element.value, '');
    });
  });

  describe('#editor', () => {
    let element: BodyRawEditorElement;
    beforeEach(async () => { element = await basicFixture(); });

    it('has the editor instance set', () => {
      assert.typeOf(element.editor, 'object');
    });
  });

  describe('#readOnly', () => {
    let element: BodyRawEditorElement;
    beforeEach(async () => { element = await basicFixture(); });

    it('sets the editor readOnly', () => {
      element.readOnly = true;
      // @ts-ignore
      const value = element.editor.getOption(monaco.editor.EditorOptions.readOnly.id);
      assert.isTrue(value);
    });
  });

  describe('#contentType', () => {
    let element: BodyRawEditorElement;
    beforeEach(async () => { element = await basicFixture(); });

    it('sets the [languageValue]', () => {
      element.contentType = 'application/json';
      assert.equal(element[languageValue], 'json');
    });

    it('sets the editor model', () => {
      element.contentType = 'application/json';
      const model = element.editor.getModel();
      assert.equal(model.getLanguageId(), 'json');
    });

    [
      ['application/json', 'json'],
      ['application/x-json', 'json'],
      ['application/svg+xml', 'xml'],
      ['application/xml', 'xml'],
      ['text/html', 'html'],
      ['text/css', 'css'],
    ].forEach(([mime, lang]) => {
      it(`sets the editor language for ${mime}`, () => {
        element.contentType = mime;
        const model = element.editor.getModel();
        assert.equal(model.getLanguageId(), lang);
      });
    });
  });

  describe('[valueChanged]()', () => {
    let element: BodyRawEditorElement;
    beforeEach(async () => { element = await basicFixture(); });

    it('eventually dispatches the change event', async () => {
      element[valueChanged]();
      oneEvent(element, 'change');
    });

    it('dispatches the event only once per animation frame', async () => {
      const spy = sinon.spy();
      element.addEventListener('change', spy);
      element[valueChanged]();
      element[valueChanged]();
      element[valueChanged]();
      await aTimeout(0);
      assert.isTrue(spy.calledOnce);
    });
  });
});
