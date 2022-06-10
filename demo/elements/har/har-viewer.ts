/* eslint-disable @typescript-eslint/no-explicit-any */
import { html, TemplateResult } from 'lit';
import { IEnvironment, Environment } from '@api-client/core/build/browser.js';
import { DemoPage } from '../../../src/pages/demo/DemoPage.js';
import '../../../src/define/har-viewer.js';
import { reactive } from '../../../src/lib/decorators.js';

class ComponentDemoPage extends DemoPage {
  componentName = 'HAR viewer';

  @reactive() environment: IEnvironment = new Environment().toJSON();

  startupHar = new URL('har1.har', window.location.href).toString();

  @reactive() har?: any;

  constructor() {
    super();
    
    this.fetchHarFile(this.startupHar);

    this.fileChanged = this.fileChanged.bind(this);
  }

  async fetchHarFile(url: string): Promise<void> {
    const response = await fetch(url);
    this.har = await response.json();
  }

  fileChanged(e: Event): void {
    const node = e.target as HTMLInputElement;
    this.processFile((node.files as FileList)[0]);
  }

  async processFile(file: File): Promise<void> {
    this.har = undefined;
    if (!file) {
      return;
    }
    const text = await this.readFile(file);
    const har = JSON.parse(text);
    this.har = har;
  }

  readFile(file: File): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = (): void => {
        resolve(reader.result as string);
      };
      reader.readAsText(file);
    });
  }

  contentTemplate(): TemplateResult {
    return html`
    <section class="centered">
      <har-viewer
        slot="content"
        .har="${this.har}"
      ></har-viewer>
    </section>

    ${this.fileTemplate()}
    `;
  }

  fileTemplate(): TemplateResult {
    return html`
    <section class="documentation-section">
      <h3>HAR data</h3>
      <input 
        type="file" 
        aria-label="Select the file"
        @change="${this.fileChanged}"
      />
    </section>
    `;
  }
}

const instance = new ComponentDemoPage();
instance.render();
