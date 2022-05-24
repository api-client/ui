/**
 * Creates a base definition of the Monaco theme for the API Client.
 * This is to be used on the monaco instance:
 * 
 * ```
 * monaco.editor.defineTheme('HttpTheme', generateMonacoTheme());
 * ```
 */
export function generateMonacoTheme(): any {
  let bgColor = getComputedStyle(document.body).getPropertyValue('--code-editor-color').trim();
  if (!bgColor) {
    bgColor = '#F5F5F5';
  }
  const theme = {
    base: 'vs', 
    inherit: true,
    rules: [{ background: bgColor }],
    colors: {
      "editor.background": bgColor,
    },
  };
  return theme;
}

/**
 * @param monaco The monaco global object
 * @param config The configuration being passed to the monaco editor instance.
 * @returns The copy of the configuration with `theme` property.
 */
export function assignTheme(monaco: any, config: any): any {
  const cnf = { ...config };
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    cnf.theme = "vs-dark";
  } else {
    monaco.editor.defineTheme('ApicTheme', generateMonacoTheme());
    cnf.theme = 'ApicTheme';
  }
  return cnf;
}
