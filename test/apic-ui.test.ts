import { html } from 'lit';
import { fixture, expect } from '@open-wc/testing';
import { ApicUi } from '../src/ApicUi.js';
import '../src/apic-ui.js';

describe('ApicUi', () => {
  it('has a default title "Hey there" and counter 5', async () => {
    const el = await fixture<ApicUi>(html`<apic-ui></apic-ui>`);

    expect(el.title).to.equal('Hey there');
    expect(el.counter).to.equal(5);
  });

  it('increases the counter on button click', async () => {
    const el = await fixture<ApicUi>(html`<apic-ui></apic-ui>`);
    el.shadowRoot!.querySelector('button')!.click();

    expect(el.counter).to.equal(6);
  });

  it('can override the title via attribute', async () => {
    const el = await fixture<ApicUi>(html`<apic-ui title="attribute title"></apic-ui>`);

    expect(el.title).to.equal('attribute title');
  });

  it('passes the a11y audit', async () => {
    const el = await fixture<ApicUi>(html`<apic-ui></apic-ui>`);

    await expect(el).shadowDom.to.be.accessible();
  });
});
