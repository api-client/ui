import { html, TemplateResult } from 'lit';
import { DemoPage } from '../../../src/pages/demo/DemoPage.js';
import '../../../src/define/api-icon.js';
import * as icons from '../../../src/elements/icons/Icons.js';
import { IconType } from '../../../src/elements/icons/Icons.js';

const ignored: string[] = ['iconWrapper'];
const keys = Object.keys(icons) as IconType[];

class ComponentDemoPage extends DemoPage {
  componentName = 'Icons';

  contentTemplate(): TemplateResult {
    return html`
    <section class="centered large">
    <h2>With "icon" attribute</h2>

    <div class="set">
      ${keys.map((name) => {
        if (ignored.indexOf(name) !== -1) {
          return '';
        }
        return html`
        <span class="container">
          <api-icon icon="${name}" class="icon"></api-icon>
          <span>${name}</span>
        </span>
        `;
      })}
    </div>

    <h2>With child node</h2>
    <div class="set">
    ${keys.map((name) => {
      if (ignored.indexOf(name) !== -1) {
        return '';
      }
      return html`
      <span class="container">
        <api-icon class="icon">${icons[name]}</api-icon>
        <span>${name}</span>
      </span>
      `;
    })}
    </div>
    </section>
    `;
  }
}

const instance = new ComponentDemoPage();
instance.render();
