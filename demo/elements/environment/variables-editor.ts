import { html, TemplateResult } from 'lit';
import { IProperty } from '@api-client/core/build/browser.js';
import { DemoPage } from '../../../src/pages/demo/DemoPage.js';
import '../../../src/define/variables-editor.js';
import { reactive } from '../../../src/lib/decorators.js';
import VariablesEditorElement from '../../../src/elements/environment/VariablesEditorElement.js';

const storeKey = 'api-client.demo.elements.environment.variables-editor';

class ComponentDemoPage extends DemoPage {
  componentName = 'Variables editor';

  @reactive() variables?: IProperty[];

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
      const list = JSON.parse(data) as IProperty[];
      if (Array.isArray(list)) {
        this.variables = list;
      }
    } catch (e) {
      // ...
    }
  }

  _changedHandler(): void {
    const editor = document.querySelector('variables-editor') as VariablesEditorElement;
    if (!editor.variables) {
      localStorage.removeItem(storeKey);
    } else {
      localStorage.setItem(storeKey, JSON.stringify(editor.variables));
    }
    console.log('change');
  }

  contentTemplate(): TemplateResult {
    return html`
    <section class="centered">
      <variables-editor .variables="${this.variables}" @change="${this._changedHandler}"></variables-editor>
    </section>
    `;
  }
}

const instance = new ComponentDemoPage();
instance.render();
