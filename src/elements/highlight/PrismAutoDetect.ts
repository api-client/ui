export interface IPrismLangInfo {
  grammar: Prism.Grammar;
  lang: string;
}

export function getLanguage(mime = ''): IPrismLangInfo {
  if (!mime) {
    return {
      lang: 'plain',
      // @ts-ignore
      grammar: Prism.languages.plain
    };
  }
  if (mime.includes('json')) {
    return {
      lang: 'json',
      // @ts-ignore
      grammar: Prism.languages.json,
    };
  }
  if (mime.includes('xml')) {
    return {
      lang: 'xml',
      // @ts-ignore
      grammar: Prism.languages.xml,
    };
  }
  if (mime.includes('markdown')) {
    return {
      lang: 'markdown',
      // @ts-ignore
      grammar: Prism.languages.markdown,
    };
  }
  if (mime.includes('yaml') || mime.includes('/raml')) {
    return {
      lang: 'yaml',
      // @ts-ignore
      grammar: Prism.languages.yaml,
    };
  }
  if (mime.includes('/javascript')) {
    return {
      lang: 'javascript',
      // @ts-ignore
      grammar: Prism.languages.javascript,
    };
  }
  if (mime.includes('/css')) {
    return {
      lang: 'css',
      // @ts-ignore
      grammar: Prism.languages.css,
    };
  }
  if (mime.includes('svg')) {
    return {
      lang: 'svg',
      // @ts-ignore
      grammar: Prism.languages.svg,
    };
  }
  if (mime.includes('/html')) {
    return {
      lang: 'html',
      // @ts-ignore
      grammar: Prism.languages.html,
    };
  }
  if (mime.includes('/form-data')) {
    return {
      lang: 'http',
      // @ts-ignore
      grammar: Prism.languages.http,
    };
  }
  return {
    lang: 'clike',
    // @ts-ignore
    grammar: Prism.languages.clike,
  };
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
