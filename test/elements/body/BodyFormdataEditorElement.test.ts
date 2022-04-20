import { assert, aTimeout, fixture, html, nextFrame } from '@open-wc/testing';
import sinon from 'sinon';
import { ProjectMock, Property } from '@api-client/core';
import { loadMonaco } from '../MonacoSetup.js';
import '../../../src/define/body-formdata-editor.js';
import { addParamHandler } from '../../../src/elements/http/internals.js';
import BodyFormdataEditorElement from '../../../src/elements/http/BodyFormdataEditorElement.js';

describe('BodyFormdataEditorElement', () => {
  async function basicFixture(): Promise<BodyFormdataEditorElement> {
    return fixture(`<body-formdata-editor></body-formdata-editor>`);
  }

  async function valueFixture(value: string): Promise<BodyFormdataEditorElement> {
    return fixture(html`<body-formdata-editor .value="${value}"></body-formdata-editor>`);
  }

  async function autoEncodeFixture(): Promise<BodyFormdataEditorElement> {
    return fixture(html`<body-formdata-editor autoEncode></body-formdata-editor>`);
  }

  const generator = new ProjectMock();
  
  before(async () => loadMonaco());

  describe('Empty state', () => {
    let element: BodyFormdataEditorElement;
    beforeEach(async () => { element = await basicFixture(); })

    it('renders empty message', () => {
      const node = element.shadowRoot.querySelector('.empty-list');
      assert.ok(node);
    });

    it('renders the add button', () => {
      const node = element.shadowRoot.querySelector('.add-param');
      assert.ok(node);
    });

    it('renders the encode value button', () => {
      const node = element.shadowRoot.querySelector('#encode');
      assert.ok(node);
    });

    it('renders the decode value button', () => {
      const node = element.shadowRoot.querySelector('#decode');
      assert.ok(node);
    });

    it('has empty model', () => {
      assert.deepEqual(element.model, []);
    });
  });

  describe('adding a property', () => {
    let element: BodyFormdataEditorElement;
    beforeEach(async () => { element = await basicFixture(); })

    it('adds a model item on add button click', () => {
      const node = (element.shadowRoot.querySelector('.add-param'));
      (node as HTMLElement).click();
      assert.lengthOf(element.model, 1);
    });

    it('does not add a model when readonly', () => {
      element.readOnly = true;
      const node = (element.shadowRoot.querySelector('.add-param'));
      (node as HTMLElement).click();
      assert.lengthOf(element.model, 0);
    });

    it('does not add a model when disabled', () => {
      element.disabled = true;
      const node = (element.shadowRoot.querySelector('.add-param'));
      (node as HTMLElement).click();
      assert.lengthOf(element.model, 0);
    });

    it('model item has basic schema', () => {
      const node = (element.shadowRoot.querySelector('.add-param'));
      (node as HTMLElement).click();
      const p = Property.String();
      assert.deepEqual(element.model[0], p.toJSON());
    });

    it('adds an item with undefined model', () => {
      element.model = undefined;
      const node = (element.shadowRoot.querySelector('.add-param'));
      (node as HTMLElement).click();
      assert.lengthOf(element.model, 1);
    });

    it('focuses on the added item', async () => {
      const spy = sinon.spy(element, 'focusLastName');
      await element[addParamHandler]();
      await aTimeout(0);
      assert.isTrue(spy.called);
    });

    it('does not notify model change', async () => {
      // there's no point of storing the model without empty values. They are not generating 
      // any editor value
      const spy = sinon.spy();
      element.addEventListener('change', spy);
      await element[addParamHandler]();
      assert.isFalse(spy.called);
    });
  });

  describe('#value', () => {
    let element: BodyFormdataEditorElement;
    beforeEach(async () => { element = await basicFixture(); })

    it('reads set value', () => {
      element.value = 'a=b';
      assert.equal(element.value, 'a=b');
    });

    it('generates a view model', () => {
      element.value = 'a=b&c=d';
      assert.lengthOf(element.model, 2);
    });

    it('generated model has basic properties', () => {
      element.value = 'a=b&c=d';
      const [item] = element.model;
      const p = Property.String('a', 'b');
      assert.deepEqual(item, p.toJSON());
    });

    it('clears the model when no value', () => {
      element.value = 'a=b&c=d';
      assert.lengthOf(element.model, 2);
      element.value = '';
      assert.lengthOf(element.model, 0);
    });

    it('updates existing model', () => {
      const p = Property.String('test', 'true');
      element.model = [p.toJSON()];
      element.value = 'a=b&c=d';
      assert.equal(element.model[0].name, 'a');
    });

    it('does not notify model change', async () => {
      // value/model setters should not dispatch change events
      const spy = sinon.spy();
      element.addEventListener('change', spy);
      element.value = 'a=b&c=d';
      assert.isFalse(spy.called);
    });
  });

  describe('#model', () => {
    let element: BodyFormdataEditorElement;
    beforeEach(async () => { element = await basicFixture(); })

    it('reads set value', () => {
      const p = Property.String('test', 'true');
      element.model = [p.toJSON()];
      assert.deepEqual(element.model, [p.toJSON()]);
    });

    it('generates a value', () => {
      const p = Property.String('test', 'true');
      element.model = [p.toJSON()];
      assert.equal(element.value, 'test=true');
    });

    it('clears the previously set value', () => {
      element.value = 'a=b&c=d';
      element.model = undefined;
      assert.equal(element.value, '');
    });

    it('updates existing value', () => {
      element.value = 'a=b&c=d';
      const p = Property.String('test', 'true');
      element.model = [p.toJSON()];
      assert.equal(element.value, 'test=true');
    });

    it('does not notify model change', () => {
      // value/model setters should not dispatch change events
      const spy = sinon.spy();
      element.addEventListener('change', spy);
      const p = Property.String('test', 'true');
      element.model = [p.toJSON()];
      assert.isFalse(spy.called);
    });
  });

  describe('values rendering', () => {
    let element: BodyFormdataEditorElement;
    beforeEach(async () => {
      const value = generator.http.payload.urlEncoded();
      element = await valueFixture(value);
    });

    it('renders form rows for each model entry', () => {
      const items = element.shadowRoot.querySelectorAll('.form-row');
      assert.lengthOf(items, element.model.length);
    });

    it('renders the enable switch', () => {
      const item = element.shadowRoot.querySelector('.form-row anypoint-switch');
      assert.ok(item);
    });

    it('renders the remove button', () => {
      const item = element.shadowRoot.querySelector('.form-row [data-action="remove"]');
      assert.ok(item);
    });

    it('renders the name input', () => {
      const item = element.shadowRoot.querySelector('.form-row .param-name');
      assert.ok(item);
    });

    it('renders the value input', () => {
      const item = element.shadowRoot.querySelector('.form-row .param-value');
      assert.ok(item);
    });
  });

  describe('enable/disable action', () => {
    let element: BodyFormdataEditorElement;
    beforeEach(async () => {
      const value = generator.http.payload.urlEncoded();
      element = await valueFixture(value);
    });

    it('disables the form item', () => {
      const item = (element.shadowRoot.querySelector('.form-row anypoint-switch'));
      (item as HTMLElement).click();
      assert.isFalse(element.model[0].enabled);
    });

    it('updates the value', () => {
      const item = (element.shadowRoot.querySelector('.form-row anypoint-switch'));
      (item as HTMLElement).click();
      const { name, value: modelValue } = element.model[0];
      const { value } = element;
      assert.notInclude(value, `${name}=${modelValue}`);
    });

    it('dispatches the change event', () => {
      const spy = sinon.spy();
      element.addEventListener('change', spy);
      const item = (element.shadowRoot.querySelector('.form-row anypoint-switch'));
      (item as HTMLElement).click();
      assert.isTrue(spy.called);
    });

    it('re-enables the form item', async () => {
      const item = (element.shadowRoot.querySelector('.form-row anypoint-switch'));
      (item as HTMLElement).click();
      await aTimeout(0);
      (item as HTMLElement).click();
      assert.isTrue(element.model[0].enabled);
    });

    it('changes the value when enabling', async () => {
      const item = (element.shadowRoot.querySelector('.form-row anypoint-switch'));
      (item as HTMLElement).click();
      await aTimeout(0);
      (item as HTMLElement).click();
      const { name, value: modelValue } = element.model[0];
      const { value } = element;
      assert.include(value, `${name}=${modelValue}`);
    });

    it('dispatches the change event when enabling', async () => {
      const spy = sinon.spy();
      element.addEventListener('change', spy);
      const item = (element.shadowRoot.querySelector('.form-row anypoint-switch'));
      (item as HTMLElement).click();
      await aTimeout(0);
      (item as HTMLElement).click();
      assert.equal(spy.callCount, 2);
    });
  });

  describe('removing an item', () => {
    let element: BodyFormdataEditorElement;
    beforeEach(async () => {
      const value = generator.http.payload.urlEncoded();
      element = await valueFixture(value);
    });

    it('removes an item from the model', () => {
      const item = { ...element.model[0] };
      const button = (element.shadowRoot.querySelector('.form-row [data-action="remove"]'));
      (button as HTMLElement).click();
      assert.notDeepEqual(element.model[0], item);
    });

    it('updates the value', () => {
      const item = { ...element.model[0] };
      const button = (element.shadowRoot.querySelector('.form-row [data-action="remove"]'));
      (button as HTMLElement).click();
      assert.notInclude(element.value, `${item.name}=${item.value}`);
    });

    it('dispatches the change event', () => {
      const spy = sinon.spy();
      element.addEventListener('change', spy);
      const button = (element.shadowRoot.querySelector('.form-row [data-action="remove"]'));
      (button as HTMLElement).click();
      assert.isTrue(spy.calledOnce);
    });
  });

  describe('name change', () => {
    let element: BodyFormdataEditorElement;
    beforeEach(async () => {
      const value = generator.http.payload.urlEncoded();
      element = await valueFixture(value);
    });

    it('changes the name', () => {
      const item = { ...element.model[0] };
      const input = /** @type HTMLInputElement */ (element.shadowRoot.querySelector('.form-row .param-name'));
      (input as HTMLInputElement).value = 'new-value-test';
      input.dispatchEvent(new CustomEvent('change'))
      assert.notEqual(element.model[0].name, item.name);
      assert.equal(element.model[0].name, 'new-value-test');
    });

    it('updates the value', () => {
      const input = /** @type HTMLInputElement */ (element.shadowRoot.querySelector('.form-row .param-name'));
      (input as HTMLInputElement).value = 'new-value-test';
      input.dispatchEvent(new CustomEvent('change'))
      assert.include(element.value, `new-value-test=${element.model[0].value}`);
    });

    it('dispatches the change event', () => {
      const spy = sinon.spy();
      element.addEventListener('change', spy);
      const input = /** @type HTMLInputElement */ (element.shadowRoot.querySelector('.form-row .param-name'));
      (input as HTMLInputElement).value = 'new-value-test';
      input.dispatchEvent(new CustomEvent('change'))
      assert.isTrue(spy.calledOnce);
    });
  });

  describe('value change', () => {
    let element: BodyFormdataEditorElement;
    beforeEach(async () => {
      const value = generator.http.payload.urlEncoded();
      element = await valueFixture(value);
    });

    it('changes the value', () => {
      const item = { ...element.model[0] };
      const input = /** @type HTMLInputElement */ (element.shadowRoot.querySelector('.form-row .param-value'));
      (input as HTMLInputElement).value = 'new-value-test';
      input.dispatchEvent(new CustomEvent('change'))
      assert.notEqual(element.model[0].value, item.value);
      assert.equal(element.model[0].value, 'new-value-test');
    });

    it('updates the value', () => {
      const input = /** @type HTMLInputElement */ (element.shadowRoot.querySelector('.form-row .param-value'));
      (input as HTMLInputElement).value = 'new-value-test';
      input.dispatchEvent(new CustomEvent('change'))
      assert.include(element.value, `${element.model[0].name}=new-value-test`);
    });

    it('dispatches the change event', () => {
      const spy = sinon.spy();
      element.addEventListener('change', spy);
      const input = /** @type HTMLInputElement */ (element.shadowRoot.querySelector('.form-row .param-value'));
      (input as HTMLInputElement).value = 'new-value-test';
      input.dispatchEvent(new CustomEvent('change'))
      assert.isTrue(spy.calledOnce);
    });
  });

  describe('value encoding', () => {
    let element: BodyFormdataEditorElement;
    beforeEach(async () => {
      const value = 'a b=c d'
      element = await valueFixture(value);
    });

    it('has unchanged values in the model', () => {
      const [item] = element.model;
      assert.equal(item.name, 'a b');
      assert.equal(item.value, 'c d');
    });

    it('encodes the model values', () => {
      const button = (element.shadowRoot.querySelector('#encode'));
      (button as HTMLElement).click();
      const [item] = element.model;
      assert.equal(item.name, 'a+b');
      assert.equal(item.value, 'c+d');
    });

    it('encodes the value', () => {
      const button = (element.shadowRoot.querySelector('#encode'));
      (button as HTMLElement).click();
      assert.equal(element.value, 'a+b=c+d');
    });

    it('dispatches the change event', () => {
      const spy = sinon.spy();
      element.addEventListener('change', spy);
      const button = (element.shadowRoot.querySelector('#encode'));
      (button as HTMLElement).click();
      assert.isTrue(spy.calledOnce);
    });
  });

  describe('value decoding', () => {
    let element: BodyFormdataEditorElement;
    beforeEach(async () => {
      const value = 'a+b=c+d'
      element = await valueFixture(value);
    });

    it('has unchanged values in the model', () => {
      const [item] = element.model;
      assert.equal(item.name, 'a+b');
      assert.equal(item.value, 'c+d');
    });

    it('decodes the model values', () => {
      const button = (element.shadowRoot.querySelector('#decode'));
      (button as HTMLElement).click();
      const [item] = element.model;
      assert.equal(item.name, 'a b');
      assert.equal(item.value, 'c d');
    });

    it('decodes the value', () => {
      const button = (element.shadowRoot.querySelector('#decode'));
      (button as HTMLElement).click();
      assert.equal(element.value, 'a b=c d');
    });

    it('dispatches the change event', () => {
      const spy = sinon.spy();
      element.addEventListener('change', spy);
      const button = (element.shadowRoot.querySelector('#decode'));
      (button as HTMLElement).click();
      assert.isTrue(spy.calledOnce);
    });
  });

  describe('#autoEncode', () => {
    let element: BodyFormdataEditorElement;
    beforeEach(async () => { element = await autoEncodeFixture(); });

    it('automatically decodes the set value', () => {
      element.value = 'a+b=c+d';
      const [item] = element.model;
      assert.equal(item.name, 'a b');
      assert.equal(item.value, 'c d');
    });

    it('encodes values on input change', async () => {
      element.value = 'a+b=c+d';
      await nextFrame();
      const input = /** @type HTMLInputElement */ (element.shadowRoot.querySelector('.form-row .param-name'));
      (input as HTMLInputElement).value = 'new value test';
      input.dispatchEvent(new CustomEvent('change'))
      assert.equal(element.value, 'new+value+test=c+d');
    });

    it('does not double encodes values', async () => {
      element.value = 'a+b=c+d';
      await nextFrame();
      const input = /** @type HTMLInputElement */ (element.shadowRoot.querySelector('.form-row .param-name'));
      (input as HTMLInputElement).value = 'new value test';
      input.dispatchEvent(new CustomEvent('change'))
      await nextFrame();
      (input as HTMLInputElement).value = 'new value tests';
      input.dispatchEvent(new CustomEvent('change'))
      assert.equal(element.value, 'new+value+tests=c+d');
    });
  });
});
