/* eslint-disable class-methods-use-this */
 
/**
@license
Copyright 2020 The Advanced REST client authors <arc@mulesoft.com>
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
import { html, css, CSSResult, TemplateResult } from 'lit';
import { AnypointDialogElement, AnypointDialogStylesInternal } from '@anypoint-web-components/awc';
import '@anypoint-web-components/awc/dist/define/anypoint-button.js';

export const inputHandler = Symbol('inputHandler');

export class AuthDialogElement extends AnypointDialogElement {
  static get styles(): CSSResult[] {
    return [
      AnypointDialogStylesInternal,
      css`
      anypoint-input,
      anypoint-masked-input {
        width: auto;
      }
      `
    ];
  }

  /**
   * Handler for value change of an input.
   */
  [inputHandler](e: Event): void {
    const input = e.target as HTMLInputElement;
    const { name, value } = input;
    // @ts-ignore
    this[name] = value;
  }

  /**
   * To be overridden by the child classes to create a single configuration object for the current method. 
   */
  serialize(): unknown {
    return {};
  }

  render(): TemplateResult {
    return html`
      <h2 class="title">Authentication required</h2>
      <p>The endpoint requires user credentials.</p>
      ${this.authFormTemplate()}
      <div class="buttons">
        <anypoint-button data-dialog-dismiss>Cancel</anypoint-button>
        <anypoint-button data-dialog-confirm>OK</anypoint-button>
      </div>
    `;
  }

  /**
   * To be overridden by the child classes to provide authorization method specific form.
   */
  authFormTemplate(): TemplateResult {
    return html``;
  }
}
