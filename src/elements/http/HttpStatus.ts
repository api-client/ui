import { html, css, TemplateResult } from "lit";

export const StatusStyles = css`
.status-code {
  align-items: center;
  display: inline-flex;
}

.status-info::before,
.status-ok::before, 
.status-redirect::before, 
.status-client-error::before,
.status-server-error::before {
  content: " ";
  width: 12px;
  height: 12px;
  border-radius: 20px;
  background-color: gray;
  display: inline-block;
  vertical-align: middle;
  margin-right: 8px;
}

.status-ok::before {
  background-color: var(--status-code-color-200, rgb(36, 107, 39));
}

.status-redirect::before {
  background-color: var(--status-code-color-300, rgb(48, 63, 159));
}

.status-client-error::before {
  background-color: var(--status-code-color-400, rgb(171, 86, 0));
}

.status-server-error::before {
  background-color: var(--status-code-color-500, rgb(211, 47, 47));
}
`;

/**
 * The template for the status code UI region.
 * Include `StatusStyles` exported by this library into your styles.
 * 
 * @param code The HTTP status code.
 * @param text Optional reason part of the HTTP status line.
 * @returns The template for the status code.
 */
export function statusTemplate(code: number, text?: string): TemplateResult {
  let codeClass = '';
  if (code >= 100 && code < 200) {
    codeClass = 'status-info';
  } else if (code >= 200 && code < 300) {
    codeClass = 'status-ok';
  } else if (code >= 300 && code < 400) {
    codeClass = 'status-redirect';
  } else if (code >= 400 && code < 500) {
    codeClass = 'status-client-error';
  } else {
    codeClass = 'status-server-error';
  }
  return html`<span class="status-code ${codeClass}">${code} ${text || ''}</span>`;
}
