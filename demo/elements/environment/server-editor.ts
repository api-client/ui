import { html, TemplateResult } from 'lit';
import { IServer } from '@api-client/core/build/browser.js';
import { DemoPage } from '../../../src/pages/demo/DemoPage.js';
import '../../../src/define/server-editor.js';
import { reactive } from '../../../src/lib/decorators.js';
import ServerEditorElement from '../../../src/elements/environment/ServerEditorElement.js';

const storeKey = 'api-client.demo.elements.environment.server-editor';

class ComponentDemoPage extends DemoPage {
  componentName = 'Server editor';

  @reactive() server?: IServer;

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
      this.server = JSON.parse(data) as IServer;
    } catch (e) {
      // ...
    }
  }

  _changedHandler(): void {
    const editor = document.querySelector('server-editor') as ServerEditorElement;
    const value = editor.getSchema();
    localStorage.setItem(storeKey, JSON.stringify(value));
    console.log('change');
  }

  contentTemplate(): TemplateResult {
    const { server } = this;
    const { uri, basePath, description, protocol } = server || {};
    return html`
    <section class="centered">
      <server-editor .uri="${uri}" .basePath="${basePath}" .description="${description}" .protocol="${protocol}" @change="${this._changedHandler}"></server-editor>
    </section>
    `;
  }
}

const instance = new ComponentDemoPage();
instance.render();
