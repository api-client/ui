import { assert, fixture, nextFrame, html } from '@open-wc/testing';
import sinon from 'sinon';
import { loadMonaco } from '../MonacoSetup.js';
import '../../../src/define/body-multipart-editor.js'
import {
  addText,
  addFile,
  internalModel,
  valueChanged,
  modelChanged,
  valueValue,
  filePartValueHandler,
  textPartValueHandler,
} from '../../../src/elements/http/internals.js';
import BodyMultipartEditorElement, { hasFormDataSupport } from '../../../src/elements/http/BodyMultipartEditorElement.js';

(hasFormDataSupport ? describe : describe.skip)('BodyMultipartEditorElement', () => {
  async function basicFixture(): Promise<BodyMultipartEditorElement> {
    return fixture(html`<body-multipart-editor></body-multipart-editor>`);
  }

  before(async () => loadMonaco());

  async function valueFixture(): Promise<BodyMultipartEditorElement> {
    const element = await basicFixture();
    const form = new FormData();
    form.append('text', 'text-value');
    form.append('blob', new Blob(['blob-value'], {type: 'text/plain'}), 'blob');
    const file = new Blob(['blob-value'], {type: 'text/plain'});
    // @ts-ignore
    file.name = 'file.txt';
    form.append('file', file, 'file.txt');
    element[valueValue] = form;
    await element[valueChanged](form);
    await nextFrame();
    return element;
  }

  describe('Empty state', () => {
    let element: BodyMultipartEditorElement;
    beforeEach(async () => { element = await basicFixture(); })

    it('renders empty message', () => {
      const node = element.shadowRoot.querySelector('.empty-list');
      assert.ok(node);
    });

    it('renders the add file part button', () => {
      const node = element.shadowRoot.querySelector('.add-param.file-part');
      assert.ok(node);
    });

    it('renders the add text part button', () => {
      const node = element.shadowRoot.querySelector('.add-param.text-part');
      assert.ok(node);
    });

    it('renders content type information', () => {
      const node = element.shadowRoot.querySelector('.mime-info');
      assert.ok(node);
    });

    it('has empty model', () => {
      assert.deepEqual(element.model, []);
    });
  });

  describe('adding a text part', () => {
    let element: BodyMultipartEditorElement;
    beforeEach(async () => { element = await basicFixture(); })

    it('adds a model item on add button click', () => {
      const node = /** @type  */ (element.shadowRoot.querySelector('.add-param.text-part') as HTMLElement);
      node.click();
      assert.lengthOf(element.model, 1);
    });

    it('does not add a model when readonly', () => {
      element.readOnly = true;
      const node = (element.shadowRoot.querySelector('.add-param.text-part') as HTMLElement);
      node.click();
      assert.lengthOf(element.model, 0);
    });

    it('does not add a model when disabled', () => {
      element.disabled = true;
      const node = (element.shadowRoot.querySelector('.add-param.text-part') as HTMLElement);
      node.click();
      assert.lengthOf(element.model, 0);
    });

    it('model item has basic schema', () => {
      const node = (element.shadowRoot.querySelector('.add-param.text-part') as HTMLElement);
      node.click();
      assert.deepEqual(element.model[0], {
        name: '',
        value: '',
        enabled: true,
        isFile: false,
      });
    });

    it('has the [internalModel] property', () => {
      const node = (element.shadowRoot.querySelector('.add-param.text-part') as HTMLElement);
      node.click();
      assert.deepEqual(element[internalModel][0], {
        name: '',
        value: '',
        enabled: true,
        isFile: false,
      });
    });

    it('adds an item with undefined model', () => {
      element.model = undefined;
      const node = (element.shadowRoot.querySelector('.add-param.text-part') as HTMLElement);
      node.click();
      assert.lengthOf(element.model, 1);
    });

    it('does not notify model change', async () => {
      // there's no point of storing the model without empty values. They are not generating 
      // any editor value
      const spy = sinon.spy();
      element.addEventListener('change', spy);
      await element[addText]();
      assert.isFalse(spy.called);
    });
  });

  describe('adding a file part', () => {
    let element: BodyMultipartEditorElement;
    beforeEach(async () => { element = await basicFixture(); })

    it('adds a model item on add button click', () => {
      const node = (element.shadowRoot.querySelector('.add-param.file-part') as HTMLElement);
      node.click();
      assert.lengthOf(element.model, 1);
    });

    it('does not add a model when readonly', () => {
      element.readOnly = true;
      const node = (element.shadowRoot.querySelector('.add-param.file-part') as HTMLElement);
      node.click();
      assert.lengthOf(element.model, 0);
    });

    it('does not add a model when disabled', () => {
      element.disabled = true;
      const node = (element.shadowRoot.querySelector('.add-param.file-part') as HTMLElement);
      node.click();
      assert.lengthOf(element.model, 0);
    });

    it('model item has basic schema', () => {
      const node = (element.shadowRoot.querySelector('.add-param.file-part') as HTMLElement);
      node.click();
      assert.deepEqual(element.model[0], {
        name: '',
        value: '',
        enabled: true,
        isFile: true,
      });
    });
    
    it('has the [internalModel] property', () => {
      const node = (element.shadowRoot.querySelector('.add-param.file-part') as HTMLElement);
      node.click();
      assert.deepEqual(element[internalModel][0], {
        name: '',
        value: '',
        enabled: true,
        isFile: true,
      });
    });

    it('adds an item with undefined model', () => {
      element.model = undefined;
      const node = (element.shadowRoot.querySelector('.add-param.file-part') as HTMLElement);
      node.click();
      assert.lengthOf(element.model, 1);
    });

    it('does not notify model change', async () => {
      // there's no point of storing the model without empty values. They are not generating 
      // any editor value
      const spy = sinon.spy();
      element.addEventListener('change', spy);
      await element[addFile]();
      assert.isFalse(spy.called);
    });
  });

  describe('#value', () => {
    let element: BodyMultipartEditorElement;
    let form = /** @type FormData */ (null);
    beforeEach(async () => { 
      element = await basicFixture(); 
      form = new FormData();
      form.append('text', 'text-value');
      form.append('blob', new Blob(['blob-value'], {type: 'text/plain'}), 'blob');
      const file = new Blob(['blob-value'], {type: 'text/plain'});
      // @ts-ignore
      file.name = 'file.txt';
      form.append('file', file, 'file.txt');
    })

    it('reads set value', () => {
      element.value = form;
      assert.isTrue(element.value === form);
    });

    it('calls the [valueChanged] function', () => {
      const spy = sinon.spy(element, valueChanged);
      element.value = form;
      assert.isTrue(spy.calledOnce);
    });

    it('it does not set invalid value', () => {
      const spy = sinon.spy(element, valueChanged);
      // @ts-ignore
      element.value = 'form';
      assert.isFalse(spy.calledOnce);
    });

    // from here all tests are related to the value processing which is 
    // an async operation so the tests focus on the function call.

    it('clears the current model when value is not set', async () => {
      element.model = [{ name: 'a', value: 'b', isFile: false }];
      await element[valueChanged](undefined);
      assert.deepEqual(element.model, []);
    });

    it('generates a view model', async () => {
      await element[valueChanged](form);
      assert.lengthOf(element.model, 3);
    });

    it('generated model has restored text part property', async () => {
      await element[valueChanged](form);
      const [item] = element.model;
      // the PayloadProcessor does not set this property but this will probably change
      // In any case it is not as important as `enabled = true` is the default value
      delete item.enabled;
      assert.deepEqual(item, {
        name: 'text',
        value: 'text-value',
        isFile: false,
      });
    });

    it('generated model has restored text blob part property', async () => {
      await element[valueChanged](form);
      const item = element.model[1];
      delete item.enabled;
      assert.deepEqual(item, {
        isFile: false, 
        name: 'blob', 
        value: 'data:text/plain;base64,YmxvYi12YWx1ZQ==', 
        type: 'text/plain',
      });
    });

    it('generated model has restored file part property', async () => {
      await element[valueChanged](form);
      const item = element.model[2];
      delete item.enabled;
      assert.deepEqual(item, {
        isFile: true, 
        name: 'file', 
        fileName: 'file.txt',
        value: 'data:text/plain;base64,YmxvYi12YWx1ZQ==', 
      });
    });

    it('generated [internalModel] has restored text part property', async () => {
      await element[valueChanged](form);
      const [item] = element[internalModel];
      // the PayloadProcessor does not set this property but this will probably change
      // In any case it is not as important as `enabled = true` is the default value
      delete item.enabled;
      assert.deepEqual(item, {
        name: 'text',
        value: 'text-value',
        isFile: false,
      });
    });

    it('generated [internalModel] has restored text blob part property', async () => {
      await element[valueChanged](form);
      const item = element[internalModel][1];
      delete item.enabled;
      assert.deepEqual(item, {
        isFile: false, 
        name: 'blob', 
        value: 'blob-value', 
        type: 'text/plain',
      });
    });

    it('generated [internalModel] has restored file part property', async () => {
      await element[valueChanged](form);
      const item = element[internalModel][2];
      delete item.enabled;
      assert.typeOf(item.value, 'blob', 'has the file object');
      assert.equal(item.name, 'file');
      assert.equal(item.fileName, 'file.txt');
      assert.isTrue(item.isFile);
      // assert.deepEqual(item, {
      //   isFile: true, 
      //   name: 'file', 
      //   fileName: 'file.txt',
      // });
    });

    it('updates an existing model', async () => {
      element.model = [{ name: 'test', value: 'true', enabled: true, isFile: false, }];
      await element[valueChanged](form);
      assert.equal(element.model[0].name, 'text');
    });

    it('does not notify model change', async () => {
      // value/model setters should not dispatch change events
      const spy = sinon.spy();
      element.addEventListener('change', spy);
      await element[valueChanged](form);
      assert.isFalse(spy.called);
    });
  });

  describe('#model', () => {
    let element: BodyMultipartEditorElement;
    beforeEach(async () => { element = await basicFixture(); })

    it('reads set value', () => {
      const value = [{ name: 'test', value: 'true', enabled: true, isFile: false }];
      element.model = value;
      assert.deepEqual(element.model, value);
    });

    // from here all tests are related to the model processing which is 
    // an async operation so the tests focus on the function call.

    it('generates a value', async () => {
      const value = [{ name: 'test', value: 'true', enabled: true, isFile: false }];
      await element[modelChanged](value);
      assert.typeOf(element.value, 'FormData');
    });

    it('clears the previously set value', async () => {
      const form = new FormData();
      form.append('a', 'b');
      await element[valueChanged](form);
      await element[modelChanged](undefined);
      // @ts-ignore
      const it = element.value.entries().next();
      assert.isTrue(it.done);
    });

    it('updates existing value', async () => {
      element.value = new FormData();
      const value = [{ name: 'test', value: 'true', enabled: true, isFile: false }];
      await element[modelChanged](value);
      // @ts-ignore
      const it = element.value.entries().next();
      assert.isFalse(it.done);
    });

    it('does not notify model change', async () => {
      // value/model setters should not dispatch change events
      const spy = sinon.spy();
      element.addEventListener('change', spy);
      const value = [{ name: 'test', value: 'true', enabled: true, isFile: false }];
      await element[modelChanged](value);
      assert.isFalse(spy.called);
    });
  });

  describe('values rendering', () => {
    let element: BodyMultipartEditorElement;
    beforeEach(async () => { 
      element = await valueFixture(); 
    });

    it('renders form rows for each model entry', () => {
      const items = element.shadowRoot.querySelectorAll('.form-row');
      assert.lengthOf(items, 3);
    });

    it('renders the enable switch', () => {
      const item = element.shadowRoot.querySelector('.form-row anypoint-switch');
      assert.ok(item);
    });

    it('renders the remove button', () => {
      const item = element.shadowRoot.querySelector('.form-row [data-action="remove"]');
      assert.ok(item);
    });

    it('renders name input for all types', () => {
      const items = element.shadowRoot.querySelectorAll('.form-row .param-name');
      assert.lengthOf(items, 3);
    });

    it('renders the value input for the text part', () => {
      const item = element.shadowRoot.querySelector('.form-row:nth-child(1) .param-value');
      assert.ok(item);
    });

    it('renders the type input for the text part', () => {
      const item = element.shadowRoot.querySelector('.form-row:nth-child(1) .param-type');
      assert.ok(item);
    });

    it('renders the value input for the text with blob part', () => {
      const item = element.shadowRoot.querySelector('.form-row:nth-child(2) .param-value');
      assert.ok(item);
    });

    it('renders the type input for the text with blob part', () => {
      const item = element.shadowRoot.querySelector('.form-row:nth-child(2) .param-type');
      assert.ok(item);
    });

    it('renders the choose file button for the file part', () => {
      const item = element.shadowRoot.querySelector('.form-row:nth-child(3) .param-value anypoint-button');
      assert.ok(item);
    });

    it('renders the native input for the file part', () => {
      const item = element.shadowRoot.querySelector('.form-row:nth-child(3) .param-value input') as HTMLInputElement;
      assert.ok(item, 'has the input');
      assert.equal(item.type, 'file', 'the input is of file type');
      assert.isTrue(item.hasAttribute('hidden'), 'the input is hidden');
    });

    it('renders the native input for the selected file information', () => {
      const item = element.shadowRoot.querySelector('.form-row:nth-child(3) .param-value .file-info');
      assert.ok(item);
    });
  });

  describe('enable/disable action', () => {
    let element: BodyMultipartEditorElement;
    beforeEach(async () => {
      element = await valueFixture();
    });

    it('disables the form item in the model', () => {
      const item = (element.shadowRoot.querySelector('.form-row:nth-child(1) anypoint-switch'));
      (item as HTMLElement).click();
      assert.isFalse(element.model[0].enabled);
    });

    it('disables the form item in the [internalModel]', () => {
      const item = (element.shadowRoot.querySelector('.form-row:nth-child(1) anypoint-switch'));
      (item as HTMLElement).click();
      assert.isFalse(element[internalModel][0].enabled);
    });

    it('updates the value', () => {
      const item = (element.shadowRoot.querySelector('.form-row:nth-child(1) anypoint-switch'));
      (item as HTMLElement).click();
      const { name } = element.model[0];
      const { value } = element;
      assert.isFalse(value.has(name));
    });

    it('dispatches the change event', () => {
      const spy = sinon.spy();
      element.addEventListener('change', spy);
      const item = (element.shadowRoot.querySelector('.form-row:nth-child(1) anypoint-switch'));
      (item as HTMLElement).click();
      assert.isTrue(spy.called);
    });

    it('re-enabled the text part', async () => {
      const item = (element.shadowRoot.querySelector('.form-row:nth-child(1) anypoint-switch'));
      (item as HTMLElement).click();
      await nextFrame();
      (item as HTMLElement).click();
      const { name, enabled } = element.model[0];
      assert.isTrue(enabled, 'the item is enabled');
      const { value } = element;
      assert.isTrue(value.has(name), 'the part has the value');
      assert.typeOf(value.get(name), 'string', 'the part has the correct type');
    });

    it('re-enabled the file part', async () => {
      const item = (element.shadowRoot.querySelector('.form-row:nth-child(3) anypoint-switch'));
      (item as HTMLElement).click();
      await nextFrame();
      (item as HTMLElement).click();
      const { name, enabled } = element.model[2];
      assert.isTrue(enabled, 'the item is enabled');
      const { value } = element;
      assert.isTrue(value.has(name), 'the part has the value');
      assert.typeOf(value.get(name), 'file', 'the part has the correct type');
    });

    it('dispatches the change event when re-enabling', async () => {
      const item = (element.shadowRoot.querySelector('.form-row:nth-child(3) anypoint-switch'));
      const spy = sinon.spy();
      element.addEventListener('change', spy);
      (item as HTMLElement).click();
      await nextFrame();
      (item as HTMLElement).click();
      assert.equal(spy.callCount, 2);
    });
  });

  describe('removing an item', () => {
    let element: BodyMultipartEditorElement;
    beforeEach(async () => {
      element = await valueFixture();
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
      assert.isFalse(element.value.has(item.name));
    });

    it('dispatches the change event', () => {
      const spy = sinon.spy();
      element.addEventListener('change', spy);
      const button = (element.shadowRoot.querySelector('.form-row [data-action="remove"]'));
      (button as HTMLElement).click();
      assert.isTrue(spy.calledOnce);
    });
  });

  describe('part name change', () => {
    let element: BodyMultipartEditorElement;
    beforeEach(async () => {
      element = await valueFixture();
    });

    it('changes the file part name in the model', () => {
      const item = { ...element.model[2] };
      const input = (element.shadowRoot.querySelector('.form-row:nth-child(3) .param-name'));
      (input as HTMLInputElement).value = 'new-value-test';
      input.dispatchEvent(new CustomEvent('change'))
      assert.notEqual(element.model[2].name, item.name);
      assert.equal(element.model[2].name, 'new-value-test');
    });

    it('changes the file part name in the [internalModel]', () => {
      const item = { ...element[internalModel][2] };
      const input = (element.shadowRoot.querySelector('.form-row:nth-child(3) .param-name'));
      (input as HTMLInputElement).value = 'new-value-test';
      input.dispatchEvent(new CustomEvent('change'))
      assert.notEqual(element[internalModel][2].name, item.name);
      assert.equal(element[internalModel][2].name, 'new-value-test');
    });

    it('updates the value for file part', () => {
      const old = element.model[2].name;
      const input = (element.shadowRoot.querySelector('.form-row:nth-child(3) .param-name'));
      (input as HTMLInputElement).value = 'new-value-test';
      input.dispatchEvent(new CustomEvent('change'))
      assert.isFalse(element.value.has(old), 'old part is removed');
      assert.isTrue(element.value.has(element.model[2].name), 'new part is added');
    });

    it('changes the text part name in the model', () => {
      const item = { ...element.model[0] };
      const input = (element.shadowRoot.querySelector('.form-row:nth-child(1) .param-name'));
      (input as HTMLInputElement).value = 'new-value-test';
      input.dispatchEvent(new CustomEvent('change'))
      assert.notEqual(element.model[0].name, item.name);
      assert.equal(element.model[0].name, 'new-value-test');
    });

    it('changes the text part name in the [internalModel]', () => {
      const item = { ...element[internalModel][0] };
      const input = (element.shadowRoot.querySelector('.form-row:nth-child(1) .param-name'));
      (input as HTMLInputElement).value = 'new-value-test';
      input.dispatchEvent(new CustomEvent('change'))
      assert.notEqual(element[internalModel][0].name, item.name);
      assert.equal(element[internalModel][0].name, 'new-value-test');
    });

    it('updates the value for text part', () => {
      const old = element.model[0].name;
      const input = (element.shadowRoot.querySelector('.form-row:nth-child(1) .param-name'));
      (input as HTMLInputElement).value = 'new-value-test';
      input.dispatchEvent(new CustomEvent('change'))
      assert.isFalse(element.value.has(old), 'old part is removed');
      assert.isTrue(element.value.has(element.model[0].name), 'new part is added');
    });

    it('dispatches the change event', () => {
      const spy = sinon.spy();
      element.addEventListener('change', spy);
      const input = (element.shadowRoot.querySelector('.form-row:nth-child(3) .param-name'));
      (input as HTMLInputElement).value = 'new-value-test';
      input.dispatchEvent(new CustomEvent('change'))
      assert.isTrue(spy.calledOnce);
    });
  });

  describe('file part value change', () => {
    let element: BodyMultipartEditorElement;
    beforeEach(async () => {
      element = await valueFixture();
    });

    
    function generateChangeEvent(): Event {
      const file = new Blob(['other-value'], {type: 'text/plain'});
      // @ts-ignore
      file.name = 'other.txt';
      const e = {
        type: 'change',
        target: {
          files: [file],
          dataset: {
            index: 2,
          },
        },
        stopPropagation: (): void => {},
      };
      // @ts-ignore
      return e;
    }

    it('changes the value in the model', async () => {
      const e = generateChangeEvent();
      await element[filePartValueHandler](e);
      assert.equal(element.model[2].value, 'data:text/plain;base64,b3RoZXItdmFsdWU=', 'the value is updated');
      assert.equal(element.model[2].fileName, 'other.txt', 'the fileName is updated');
    });

    it('changes the value in the [internalModel]', async () => {
      const e = generateChangeEvent();
      await element[filePartValueHandler](e);
      // @ts-ignore
      assert.equal(element[internalModel][2].value.name, 'other.txt', 'the value is updated');
    });

    it('updated the value', async () => {
      const e = generateChangeEvent();
      await element[filePartValueHandler](e);
      const value = element.value.get(element.model[2].name);
      assert.ok(value);
    });

    it('dispatches the change event', async () => {
      const spy = sinon.spy();
      element.addEventListener('change', spy);
      const e = generateChangeEvent();
      await element[filePartValueHandler](e);
      assert.isTrue(spy.calledOnce);
    });
  });

  describe('text part value change', () => {
    let element: BodyMultipartEditorElement;
    beforeEach(async () => {
      element = await valueFixture();
    });

    function generateChangeEvent(): Event {
      const e = {
        type: 'change',
        target: {
          value: 'other-value',
          dataset: {
            index: 0,
            property: 'value',
          },
        },
        stopPropagation: (): void => {},
      };
      // @ts-ignore
      return e;
    }

    it('changes the value in the model', async () => {
      const e = generateChangeEvent();
      await element[textPartValueHandler](e);
      assert.equal(element.model[0].value, 'other-value', 'the value is updated');
      assert.isUndefined(element.model[0].fileName, 'the fileName is not set');
    });

    it('changes the value in the [internalModel]', async () => {
      const e = generateChangeEvent();
      await element[textPartValueHandler](e);
      assert.equal(element[internalModel][0].value, 'other-value', 'the value is updated');
    });

    it('updated the value', async () => {
      const e = generateChangeEvent();
      await element[textPartValueHandler](e);
      const value = element.value.get(element.model[0].name) as string;
      assert.equal(value, 'other-value');
    });

    it('dispatches the change event', async () => {
      const spy = sinon.spy();
      element.addEventListener('change', spy);
      const e = generateChangeEvent();
      await element[textPartValueHandler](e);
      assert.isTrue(spy.calledOnce);
    });
  });

  describe('blob part value change', () => {
    let element: BodyMultipartEditorElement;
    beforeEach(async () => {
      element = await valueFixture();
    });

    function generateChangeEvent(): Event {
      const e = {
        type: 'change',
        target: {
          value: 'other-value',
          dataset: {
            index: 1,
            property: 'value',
          },
        },
        stopPropagation: (): void => {},
      };
      // @ts-ignore
      return e;
    }

    it('changes the value in the model', async () => {
      const e = generateChangeEvent();
      await element[textPartValueHandler](e);
      assert.equal(element.model[1].value, 'data:text/plain;base64,b3RoZXItdmFsdWU=', 'the value is updated');
      assert.isUndefined(element.model[1].fileName, 'the fileName is not set');
      assert.equal(element.model[1].type, 'text/plain' , 'the type is set');
    });

    it('changes the value in the [internalModel]', async () => {
      const e = generateChangeEvent();
      await element[textPartValueHandler](e);
      assert.equal(element[internalModel][1].value, 'other-value', 'the value is updated');
    });

    it('updated the value', async () => {
      const e = generateChangeEvent();
      await element[textPartValueHandler](e);
      const value = /** @type File */ (element.value.get(element.model[1].name));
      assert.typeOf(value, 'File');
    });

    it('dispatches the change event', async () => {
      const spy = sinon.spy();
      element.addEventListener('change', spy);
      const e = generateChangeEvent();
      await element[textPartValueHandler](e);
      assert.isTrue(spy.calledOnce);
    });
  });

  describe('text part type change', () => {
    let element: BodyMultipartEditorElement;
    beforeEach(async () => {
      element = await valueFixture();
    });

    function generateChangeEvent(index=1): Event {
      const e = {
        type: 'change',
        target: {
          value: 'text/other',
          dataset: {
            index,
            property: 'type',
          },
        },
        stopPropagation: (): void => {},
      };
      // @ts-ignore
      return e;
    }

    it('changes the value in the model', async () => {
      const e = generateChangeEvent();
      await element[textPartValueHandler](e);
      assert.equal(element.model[1].value, 'data:text/other;base64,YmxvYi12YWx1ZQ==', 'the value is updated');
      assert.isUndefined(element.model[1].fileName, 'the fileName is not set');
      assert.equal(element.model[1].type, 'text/other' , 'the type is set');
    });

    it('changes the value in the [internalModel]', async () => {
      const e = generateChangeEvent();
      await element[textPartValueHandler](e);
      assert.equal(element[internalModel][1].type, 'text/other', 'the type is updated');
    });

    it('updated the value', async () => {
      const e = generateChangeEvent();
      await element[textPartValueHandler](e);
      const value = element.value.get(element.model[1].name) as File;
      assert.equal(value.type, 'text/other');
    });

    it('updates value from text to blob', async () => {
      const e = generateChangeEvent(0);
      await element[textPartValueHandler](e);
      assert.equal(element.model[0].value, 'data:text/other;base64,dGV4dC12YWx1ZQ==', 'the value is updated');
      assert.isUndefined(element.model[0].fileName, 'the fileName is not set');
      assert.equal(element.model[0].type, 'text/other' , 'the type is set');
    });

    it('dispatches the change event', async () => {
      const spy = sinon.spy();
      element.addEventListener('change', spy);
      const e = generateChangeEvent();
      await element[textPartValueHandler](e);
      assert.isTrue(spy.calledOnce);
    });
  });
});
