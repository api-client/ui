/* eslint-disable no-param-reassign */
import '../../../src/define/marked-highlight.js';
import { MarkdownStyles } from '../../../src/index.js';

function configChangedHandler(e: Event): void {
  const input = e.target as HTMLInputElement;
  const prop = input.id;
  const value = input.checked;
  const nodes = document.querySelectorAll('marked-highlight');
  Array.from(nodes).forEach((node) => {
    node[prop] = value;
  });
}

const nodes = document.querySelectorAll('#config input[type="checkbox"]');
Array.from(nodes).forEach((node) => {
  node.addEventListener('change', configChangedHandler);
});


try {
  // @ts-ignore
  document.adoptedStyleSheets = document.adoptedStyleSheets.concat(MarkdownStyles.styleSheet);
} catch (_) {
  const s = document.createElement('style');
  s.innerHTML = MarkdownStyles.cssText;
  document.getElementsByTagName('head')[0].appendChild(s);
}
