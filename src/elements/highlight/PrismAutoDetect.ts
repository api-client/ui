export function getLanguage(mime = ''): Prism.Grammar {
  if (!mime) {
    // @ts-ignore
    return Prism.languages.plain;
  }
  if (mime.includes('json')) {
    // @ts-ignore
    return Prism.languages.json;
  }
  if (mime.includes('xml')) {
    // @ts-ignore
    return Prism.languages.xml;
  }
  if (mime.includes('markdown')) {
    // @ts-ignore
    return Prism.languages.markdown;
  }
  if (mime.includes('yaml') || mime.includes('/raml')) {
    // @ts-ignore
    return Prism.languages.yaml;
  }
  if (mime.includes('/javascript')) {
    // @ts-ignore
    return Prism.languages.javascript;
  }
  if (mime.includes('/css')) {
    // @ts-ignore
    return Prism.languages.css;
  }
  if (mime.includes('svg')) {
    // @ts-ignore
    return Prism.languages.svg;
  }
  if (mime.includes('/html')) {
    // @ts-ignore
    return Prism.languages.svg;
  }
  // @ts-ignore
  return Prism.languages.clike;
}

/* [
    "plain",
    "plaintext",
    "text",
    "txt",
    "DFS",
    "markup",
    "mathml",
    "ssml",
    "atom",
    "rss",
    "clike",
    "webmanifest",
] */
