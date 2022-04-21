/* eslint-disable no-plusplus */
/* eslint-disable no-bitwise */
/* eslint-disable class-methods-use-this */
/**
@license
Copyright 2018 The Advanced REST client authors <arc@mulesoft.com>
Licensed under the Apache License, Version 2.0 (the "License"); you may not
use this file except in compliance with the License. You may obtain a copy of
the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
License for the specific language governing permissions and limitations under
the License.
*/
import { LitElement, html, CSSResult, TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
// import * as monaco from 'monaco-editor'; // /esm/vs/editor/editor.main.js
import { ResizableMixin } from '@anypoint-web-components/awc';
import { editor } from 'monaco-editor';
import { assignTheme } from '../../monaco/theme.js';
import MonacoStyles from '../../monaco/Monaco.styles.js';
import elementStyles from './BodyEditor.styles.js';

/* global monaco */

import {
  valueValue,
  monacoInstance,
  contentTypeValue,
  languageValue,
  setLanguage,
  setupActions,
  valueChanged,
  changeTimeout,
  notifyChange,
  generateEditorConfig,
  readOnlyValue,
  setEditorConfigProperty,
  resizeHandler,
  refreshEditor,
  refreshDebouncer,
  modelUri,
  validationSchemas,
  getCurrentSchemas,
  updateEditorSchemas,
  createDefaultSchema,
} from './internals.js';
import { detectLanguage } from '../../monaco/helper.js';
import { MonacoSchema } from '../../monaco/types.js';

let modelId = 0;

export default class BodyRawEditorElement extends ResizableMixin(LitElement) {
  static get styles(): CSSResult[] {
    return [elementStyles, MonacoStyles];
  }
  
  // monaco.Uri
  [modelUri]?: any;

  [valueValue] = '';

  /**
   * A HTTP body.
   */
  @property({ type: String })
  get value(): string {
    return this[valueValue];
  }

  set value(value) {
    const old = this[valueValue];
    if (old === value) {
      return;
    }
    this[valueValue] = value;
    const { editor: e } = this;
    if (e) {
      e.setValue(value || '');
    }
  }

  [contentTypeValue]?: string;

  [languageValue]?: string;

  /** 
   * Uses the current content type to detect language support.
   */
  @property({ type: String, reflect: true })
  get contentType(): string | undefined {
    return this[contentTypeValue];
  }

  set contentType(value: string | undefined) {
    const old = this[contentTypeValue];
    if (old === value) {
      return;
    }
    this[contentTypeValue] = value;
    const oldLang = this[languageValue];
    const lang = detectLanguage(value);
    if (oldLang === lang) {
      return;
    }
    this[languageValue] = lang;
    this[setLanguage](lang);
  }

  [readOnlyValue]: boolean = false;

  /**
   * When set the editor is in read only mode.
   */
  @property({ type: Boolean, reflect: true })
  get readOnly(): boolean {
    return this[readOnlyValue];
  }

  set readOnly(value: boolean) {
    const old = this[readOnlyValue];
    if (old === value) {
      return;
    }
    this[readOnlyValue] = value;
    this[setEditorConfigProperty]('readOnly', value);
  }

  [monacoInstance]?: editor.IStandaloneCodeEditor;

  get editor(): editor.IStandaloneCodeEditor | undefined {
    return this[monacoInstance];
  }

  [validationSchemas]?: MonacoSchema[];

  get schemas(): MonacoSchema[] | undefined {
    return this[validationSchemas];
  }

  set schemas(value: MonacoSchema[] | undefined) {
    const old = this[validationSchemas];
    if (old === value) {
      return;
    }
    this[validationSchemas] = value;
    this[updateEditorSchemas](value);
  }

  constructor() {
    super();
    this[valueChanged] = this[valueChanged].bind(this);
    this[resizeHandler] = this[resizeHandler].bind(this);
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('resize', this[resizeHandler]);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('resize', this[resizeHandler]);
  }

  firstUpdated(): void {
    const config = this[generateEditorConfig]();
    // @ts-ignore
    const instance = monaco.editor.create(this.shadowRoot!.querySelector('#container')!, config);
    instance.onDidChangeModelContent(this[valueChanged]);
    this[monacoInstance] = instance;
    this[setupActions](instance);
  }


  [refreshDebouncer]?: any;

  /**
   * Handler for the `resize` event provided by the resizable mixin.
   */
  [resizeHandler](): void {
    if (this[refreshDebouncer]) {
      clearTimeout(this[refreshDebouncer]);
    }
    this[refreshDebouncer] = setTimeout(this[refreshEditor].bind(this));
  }
  
  /**
   * A function that is called from the `[resizeHandler]` in a timeout to reduce the number
   * of computations during the application initialization, where it can receive hundreds of
   * the `resize` events.
   */
  [refreshEditor](): void {
    this[refreshDebouncer] = undefined;
    if (!this[monacoInstance]) {
      return;
    }
    this[monacoInstance]!.layout();
  }

  /**
   * @param lang New language to set
   */
  [setLanguage](lang?: string): void {
    const { editor: e } = this;
    if (!e || !lang) {
      return;
    }
    const model = e.getModel();
    if (model) {
      // @ts-ignore
      monaco.editor.setModelLanguage(model, lang);
    }
  }

  /**
   * Sets up editor actions
   */
  [setupActions](inst: editor.IStandaloneCodeEditor): void {
    inst.addAction({
      id: 'send-http-request',
      label: 'Send request',
      keybindings: [
        // @ts-ignore
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
      ],
      precondition: undefined,
      keybindingContext: undefined,
      contextMenuGroupId: 'navigation',
      contextMenuOrder: 1.5,
      run: (): void => {
        // RequestEvents.send(this);
      }
    });
  }

  [changeTimeout]?: any;

  [valueChanged](): void {
    this[valueValue] = this.editor!.getValue();
    if (this[changeTimeout]) {
      // window.clearTimeout(this[changeTimeout]);
      window.cancelAnimationFrame(this[changeTimeout]);
    }
    this[changeTimeout] = window.requestAnimationFrame(() => {
      this[notifyChange]();
    });
  }

  [notifyChange](): void {
    this.dispatchEvent(new Event('change'));
  }

  /**
   * Generates Monaco configuration
   */
  [generateEditorConfig](): editor.IStandaloneEditorConstructionOptions {
    const { value='', readOnly } = this;
    const language = this[languageValue];
    // @ts-ignore
    this[modelUri] = monaco.Uri.parse(`http://raw-editor/model${++modelId}.json`);
    // @ts-ignore
    const model = monaco.editor.createModel(value, language || 'json', this[modelUri]);

    const schemas = this[getCurrentSchemas]();
    this[updateEditorSchemas](schemas);
    
    let config: editor.IStandaloneEditorConstructionOptions = {
      minimap: {
        enabled: false,
      },
      readOnly,
      formatOnType: true,
      folding: true,
      tabSize: 2,
      detectIndentation: true,
      // value,
      automaticLayout: true,
      model,
    };
    // @ts-ignore
    config = assignTheme(monaco, config);
    if (language) {
      config.language = language;
    }
    return config;
  }

  [getCurrentSchemas](): MonacoSchema[] {
    const { schemas } = this;
    if (Array.isArray(schemas) && schemas.length) {
      schemas[0].fileMatch = [this[modelUri]!.toString()];
      return schemas;
    }
    return [this[createDefaultSchema]()];
  }

  [createDefaultSchema](): MonacoSchema {
    const schema: MonacoSchema = {
      uri: "http://raw-editor/default-schema.json",
      fileMatch: [this[modelUri]!.toString()],
      schema: {},
    };
    return schema;
  }

  [updateEditorSchemas](schemas?: MonacoSchema[]): void {
    if (!this[modelUri] || !schemas) {
      // the editor is not yet ready. This will be called again when it is ready.
      return;
    }
    let value = schemas;
    if (!Array.isArray(value) || !value.length) {
      value = [this[createDefaultSchema]()];
    } else {
      value[0] = { ...value[0], fileMatch: [this[modelUri]!.toString()] };
    }
    // @ts-ignore
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      schemas: value,
    });
  }

  /**
   * @param {keyof IEditorOptions} prop The property to set
   * @param {any} value
   */
  [setEditorConfigProperty](prop: keyof editor.IEditorOptions, value: any): void {
    const { editor: e } = this;
    if (!e) {
      return;
    }
    const opts = {
      [prop]: value,
    };
    e.updateOptions(opts);
  }
  
  render(): TemplateResult {
    return html`<div id="container"></div>`;
  }
}
