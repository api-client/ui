import { html, css, TemplateResult } from "lit";
import { ClassInfo, classMap } from "lit/directives/class-map.js";

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
  min-width: 12px;
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
 * @param code The status code
 * @returns The list of CSS classes defined in the `HttpStatus` library to apply to the status line.
 */
export function statusClasses(code: number): ClassInfo {
  const result: ClassInfo = {
    'status-code': true,
    'status-info': code >= 100 && code < 200,
    'status-ok': code >= 200 && code < 300,
    'status-redirect': code >= 300 && code < 400,
    'status-client-error': code >= 400 && code < 500,
    'status-server-error': code === 0 || code >= 500,
  }
  return result;
}

/**
 * The template for the status code UI region.
 * Include `StatusStyles` exported by this library into your styles.
 * 
 * @param code The HTTP status code.
 * @param text Optional reason part of the HTTP status line.
 * @returns The template for the status code.
 */
export function statusTemplate(code: number, text?: string): TemplateResult {
  const classes = statusClasses(code);
  return html`<span class="${classMap(classes)}">${code} ${text || ''}</span>`;
}
