import { assert, fixture, nextFrame, html, aTimeout } from '@open-wc/testing';
import sinon from 'sinon';
import { loadMonaco } from '../MonacoSetup.js';
import '../../../src/define/body-multipart-editor.js'
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
    form.append('blob', new Blob(['blob-value'], { type: 'text/plain' }), 'blob');
    const file = new File(['blob-value'], 'file.txt', { type: 'text/plain' });
    form.append('file', file, 'file.txt');
    element.value = form;
    await aTimeout(20);
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
      const node = element.shadowRoot.querySelector('.add-param.text-part') as HTMLElement;
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
        enabled: true,
        value: {
          data: '',
          type: 'string',
        }
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
      element.addEmptyText();
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
        enabled: true,
        value: {
          data: [],
          type: 'file',
        },
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
      await element.addEmptyFile();
      assert.isFalse(spy.called);
    });
  });

  describe('#value', () => {
    let element: BodyMultipartEditorElement;
    let form: FormData;
    beforeEach(async () => {
      element = await basicFixture();
      form = new FormData();
      form.append('text', 'text-value');
      form.append('blob', new Blob(['*****'], { type: 'text/plain' }), 'blob');
      const file = new File(['***'], 'file.txt', { type: 'text/plain' });
      form.append('file', file, 'file.txt');
    })

    // maybe it should return the same value when the model never changed?
    // it('reads set value', () => {
    //   element.value = form;
    //   assert.isTrue(element.value === form);
    // });

    it('clears the current model when value is not set', async () => {
      element.model = [{ name: 'a', value: 'b', enabled: true, }];
      element.value = undefined;
      await aTimeout(20);
      assert.deepEqual(element.model, []);
    });

    it('generates the view model', async () => {
      element.value = form;
      await aTimeout(20);
      assert.lengthOf(element.model, 3);
    });

    it('generated model has restored text part property', async () => {
      element.value = form;
      await aTimeout(20);
      const [item] = element.model;

      assert.deepEqual(item, {
        enabled: true,
        name: 'text',
        value: {
          data: 'text-value',
          type: 'string',
        },
      });
    });

    it('generated model has restored text blob part property', async () => {
      element.value = form;
      await aTimeout(20);
      const item = element.model[1];
      assert.deepEqual(item, {
        enabled: true,
        name: 'blob',
        value: {
          data: [42, 42, 42, 42, 42],
          type: 'blob',
          meta: { mime: 'text/plain' },
        },
      });
    });

    it('generated model has restored file part property', async () => {
      element.value = form;
      await aTimeout(20);
      const item = element.model[2];
      assert.deepEqual(item, {
        enabled: true,
        name: 'file',
        value: {
          data: [42, 42, 42],
          type: 'file',
          meta: { mime: 'text/plain', name: 'file.txt' },
        },
      });
    });

    it('updates an existing model', async () => {
      element.model = [{ name: 'test', value: 'true', enabled: true }];
      element.value = form;
      await aTimeout(20);
      assert.equal(element.model[0].name, 'text');
    });

    it('does not notify model change', async () => {
      // value/model setters should not dispatch change events
      const spy = sinon.spy();
      element.addEventListener('change', spy);
      element.value = form;
      await aTimeout(20);
      assert.isFalse(spy.called);
    });
  });

  describe('#model', () => {
    let element: BodyMultipartEditorElement;
    beforeEach(async () => { element = await basicFixture(); })

    it('reads set value', () => {
      const value = [{ name: 'test', value: 'true', enabled: true }];
      element.model = value;
      assert.deepEqual(element.model, value);
    });

    it('sets an empty array when no value', () => {
      element.model = [{ name: 'test', value: 'true', enabled: true }];
      // @ts-ignore
      element.model = undefined;
      assert.deepEqual(element.model, []);
    });

    // from here all tests are related to the model processing which is 
    // an async operation so the tests focus on the function call.

    it('generates a value', async () => {
      const value = [{ name: 'test', value: 'true', enabled: true }];
      element.model = value;
      assert.typeOf(element.value, 'FormData');
      const result = element.value.get('test');
      assert.equal(result, 'true');
    });

    it('clears the previously set value', async () => {
      const form = new FormData();
      form.append('a', 'b');
      element.value = form;
      await aTimeout(20);
      // @ts-ignore
      element.model = undefined;
      const it = element.value.entries().next();
      assert.isTrue(it.done);
    });

    it('updates existing value', async () => {
      element.value = new FormData();
      element.model = [{ name: 'test', value: 'true', enabled: true }];
      const it = element.value.entries().next();
      assert.isFalse(it.done);
    });

    it('does not notify model change', async () => {
      // value/model setters should not dispatch change events
      const spy = sinon.spy();
      element.addEventListener('change', spy);
      element.model = [{ name: 'test', value: 'true', enabled: true }];
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

    it('re-enabled a file part', async () => {
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

    it('changes the value in the model', async () => {
      const file = new File(['***'], 'other.txt', { type: 'text/plain' });
      await element._updateFilePartValue(2, file);
      assert.deepEqual(element.model[2], {
        enabled: true,
        name: 'file',
        value: {
          type: 'file',
          data: [42, 42, 42],
          meta: { mime: 'text/plain', name: 'other.txt' }
        }
      });
    });

    it('dispatches the change event', async () => {
      const spy = sinon.spy();
      element.addEventListener('change', spy);
      const file = new File(['***'], 'other.txt', { type: 'text/plain' });
      await element._updateFilePartValue(2, file);
      assert.isTrue(spy.calledOnce);
    });
  });

  describe('text part value change', () => {
    let element: BodyMultipartEditorElement;
    beforeEach(async () => {
      element = await valueFixture();
    });

    it('changes the value in the model', async () => {
      const input = element.shadowRoot!.querySelector('.param-value[data-index="0"]') as HTMLInputElement;
      input.value = 'other-value';
      input.dispatchEvent(new Event('change'));
      assert.deepEqual(element.model[0].value, { type: 'string', data: 'other-value' }, 'the value is updated');
    });

    it('dispatches the change event', async () => {
      const spy = sinon.spy();
      element.addEventListener('change', spy);
      const input = element.shadowRoot!.querySelector('.param-value[data-index="0"]') as HTMLInputElement;
      input.value = 'other-value';
      input.dispatchEvent(new Event('change'));
      assert.isTrue(spy.calledOnce);
    });
  });

  describe('blob part value change', () => {
    let element: BodyMultipartEditorElement;
    beforeEach(async () => {
      element = await valueFixture();
    });

    it('changes the value in the model', async () => {
      const input = element.shadowRoot!.querySelector('.param-value[data-index="1"]') as HTMLInputElement;
      input.value = '* *';
      input.dispatchEvent(new Event('change'));
      await aTimeout(20);
      
      const item = element.model[1];

      assert.deepEqual(item, {
        name: 'blob',
        value: { type: 'blob', data: [ 42, 32, 42 ], meta: { mime: 'text/plain' } },
        enabled: true,
        blobText: '* *'
      });
    });

    it('dispatches the change event', async () => {
      const spy = sinon.spy();
      element.addEventListener('change', spy);
      const input = element.shadowRoot!.querySelector('.param-value[data-index="1"]') as HTMLInputElement;
      input.value = '* *';
      input.dispatchEvent(new Event('change'));
      await aTimeout(10);
      assert.isTrue(spy.calledOnce);
    });
  });

  describe('text part type change', () => {
    let element: BodyMultipartEditorElement;
    beforeEach(async () => {
      element = await valueFixture();
    });

    it('changes the existing blob value', async () => {
      const input = element.shadowRoot!.querySelector('.param-type[data-index="1"]') as HTMLInputElement;
      input.value = 'text/other';
      input.dispatchEvent(new Event('change'));

      await aTimeout(20);
      const item = element.model[1];

      assert.deepEqual(item, {
        blobText: 'blob-value',
        name: 'blob',
        value: { type: 'blob', data: [ 98, 108, 111,  98, 45, 118,  97, 108, 117, 101], meta: { mime: 'text/other' } },
        enabled: true,
      });
    });

    it('changes the existing text value to a blob', async () => {
      const input = element.shadowRoot!.querySelector('.param-type[data-index="0"]') as HTMLInputElement;
      input.value = 'text/x';
      input.dispatchEvent(new Event('change'));

      await aTimeout(20);
      const item = element.model[0];
      
      assert.deepEqual(item, {
        blobText: 'text-value',
        name: 'text',
        value: { type: 'blob', data: [ 116, 101, 120, 116, 45, 118,  97, 108, 117, 101], meta: { mime: 'text/x' } },
        enabled: true,
      });
    });

    it('dispatches the change event', async () => {
      const spy = sinon.spy();
      element.addEventListener('change', spy);

      const input = element.shadowRoot!.querySelector('.param-type[data-index="0"]') as HTMLInputElement;
      input.value = 'text/x';
      input.dispatchEvent(new Event('change'));

      await aTimeout(20);
      assert.isTrue(spy.called);
    });
  });
});
