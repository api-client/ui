/**
 * Creates `window.MonacoEnvironment` that returns a web worker that is a ES module
 * 
 * @param monacoBase Monaco base folder location, e.g. `../node_modules/monaco-editor/`
 */
export function createEnvironment(monacoBase: string): void {
  let base = monacoBase;
  if (!base.endsWith('/')) {
    base += '/';
  }
  // @ts-ignore
  window.MonacoEnvironment = {
    getWorker: (_moduleId: any, label: string): Worker => {
      let url;
      const prefix = `${base}esm/vs/`;
      const langPrefix = `${prefix}language/`;
      switch (label) {
        case 'json': url = `${langPrefix}json/json.worker.js`; break;
        case 'css': url = `${langPrefix}css/css.worker.js`; break;
        case 'html': url = `${langPrefix}html/html.worker.js`; break;
        case 'javascript':
        case 'typescript': url = `${langPrefix}typescript/ts.worker.js`; break;
        default: url = `${prefix}editor/editor.worker.js`; break;
      }
      return new Worker(url, {
        type: 'module'
      });
    }
  }
}

/**
* @param url The script URL
* @param isModule Whether the script is ES module
*/
export function loadScript(url: string, isModule=false): Promise<void> {
 return new Promise((resolve, reject) => {
   const script = document.createElement('script');
   script.src = url;
   if (isModule) {
     script.type = 'module';
   }
   // script.defer = false;
   script.async = false;
   script.onload = ():void => resolve();
   script.onerror = ():void => reject(new Error(`Unable to load ${url}`));
   const s = document.getElementsByTagName('script')[0];
   s.parentNode!.insertBefore(script, s);
 });
}

/**
 * Loads monaco to the global scope.
 * 
 * @param monacoBase Monaco base folder location, e.g. `../node_modules/monaco-editor/`
 * @returns Resolved when all scripts are reported to be loaded
 */
export async function loadMonaco(monacoBase: string): Promise<void> {
  let base = monacoBase;
  if (!base.endsWith('/')) {
    base += '/';
  }
  const prefix = `${base}min/vs/`
  // @ts-ignore
  window.require = { paths: { vs: prefix } };
  const scripts = [
    `${prefix}loader.js`,
    `${prefix}editor/editor.main.nls.js`,
    `${prefix}editor/editor.main.js`,
  ];
  const ps = scripts.map((url) => loadScript(url));
  await Promise.all(ps);
}

/**
 * Awaits until monaco is fully loaded into the document.
 */
export async function monacoReady(): Promise<void> {
  let monacoInterval: any;
  return new Promise((resolve) => {
    monacoInterval = setInterval(() => {
      // @ts-ignore
      if (window.monaco) {
        clearInterval(monacoInterval);
        resolve();
      }
    }, 20);
  });
}
