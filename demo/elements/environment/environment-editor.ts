import { html, TemplateResult } from 'lit';
import { IEnvironment, Environment } from '@api-client/core/build/browser.js';
import { DemoPage } from '../../../src/pages/demo/DemoPage.js';
import '../../../src/define/environment-editor.js';
import { reactive } from '../../../src/lib/decorators.js';

const storeKey = 'api-client.demo.elements.environment.environment-editor';

class ComponentDemoPage extends DemoPage {
  componentName = 'Environment editor';

  @reactive() environment: IEnvironment = new Environment().toJSON();

  constructor() {
    super();
    this.restoreValues();
  }

  restoreValues(): void {
    const data = localStorage.getItem(storeKey);
    if (!data) {
      return;
    }
    try {
      this.environment = JSON.parse(data) as IEnvironment;
    } catch (e) {
      // ...
    }
  }

  _changedHandler(): void {
    const editor = document.querySelector('environment-editor')!;
    localStorage.setItem(storeKey, JSON.stringify(editor.environment));
    console.log('change');
  }

  contentTemplate(): TemplateResult {
    return html`
    <section class="centered">
      <environment-editor .environment="${this.environment}" @change="${this._changedHandler}"></environment-editor>
    </section>
    `;
  }
}

const instance = new ComponentDemoPage();
instance.render();
