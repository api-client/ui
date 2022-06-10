/* eslint-disable @typescript-eslint/ban-ts-comment */
import '../../../src/define/prism-highlight.js';

async function init(): Promise<void> {
  try {
    const response = await fetch(window.location.href);
    const data = await response.text();
    // @ts-ignore
    document.querySelector('#c3').code = `${data}\n`;
  } catch (e) {
    // @ts-ignore
    document.querySelector('#c3').code = e.message;
  }
}

// setTimeout(() => init(), 1000);
init();
