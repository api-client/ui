import { css } from 'lit';

export default css`
:host {
  display: block;
  overflow: hidden;
  --method-label-default-color: rgb(128, 128, 128);
}

:host([hidden]) {
  display: none;
}

[hidden] {
  display: none !important;
}

.panel {
  flex: 1;
  overflow: hidden auto;
  box-sizing: border-box;
  background: var(--request-editor-panel, var(--primary-background-color, inherit));
  padding: 0px 8px;
}

body-editor {
  height: 100%;
}

.url-meta {
  display: flex;
  align-items: center;
  padding: 12px 24px;
  background-color: var(--request-editor-url-area-background-color, #f6f6f6);
}

url-input-editor {
  flex: 1;
  margin: 0 8px;
  background-color: var(--request-editor-url-input-background-color, rgb(255, 255, 255));
  border-radius: 20px;
  /* --url-input-editor-border-color: transparent; */
}

authorization-method {
  max-width: 900px;
}

.http-label {
  display: block;
  width: 24px;
  height: 24px;
  background-color: var(--http-method-label-color, var(--method-label-default-color));
  border-radius: 50%;
}

.http-label[data-method="get"] {
  background-color: var(--http-get-color, rgb(0, 128, 0));
}

.http-label[data-method='post'] {
  background-color: var(--http-post-color, rgb(33, 150, 243));
}

.http-label[data-method='put'] {
  background-color: var(--http-put-color, rgb(255, 165, 0));
}

.http-label[data-method='delete'] {
  background-color: var(--http-delete-color, rgb(244, 67, 54));
}

.http-label[data-method='patch'] {
  background-color: var(--http-patch-color, rgb(156, 39, 176));
}

.http-label[data-method='options'] {
  background-color: var(--http-options-color, var(--method-label-default-color));
}

.http-label[data-method='head'] {
  background-color: var(--http-head-color, var(--method-label-default-color));
}

.http-label[data-method='trace'] {
  background-color: var(--http-trace-color, var(--method-label-default-color));
}

.http-label[data-method='connect'] {
  background-color: var(--http-connect-color, var(--method-label-default-color));
}

.method-list {
  padding: 4px 0;
  border-radius: 8px;
  box-shadow: var(--anypoint-dropdown-shadow);
  --anypoint-item-padding: 0 28px; 
}

.method-selector {
  display: flex;
  align-items: center;
  min-height: 36px;
  cursor: pointer;
}

.method-selector api-icon {
  margin-left: 12px;
}

.method-selector .label {
  display: block;
  font-size: var(--method-selector-label-size, 1.4rem);
  font-weight: 300;
  flex: 1;
}

.editor-tabs {
  border-bottom: 1px #e5e5e5 solid;
  min-height: 48px;
}
`;
