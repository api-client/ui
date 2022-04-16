import { css } from 'lit';

export default css`
:host {
  display: block;
  position: relative;
}

.container {
  position: relative;
  border-radius: 20px;
  transition: border-radius 0.18s ease-in-out, border-color 0.18s ease-in-out;
  box-sizing: content-box;
  z-index: 2;
  background: inherit;
  color: inherit;
  display: flex;
  align-items: center;
}

.container-prefix,
.container-suffix {
  border: 1px var(--url-input-editor-border-color, #e5e5e5) solid;
  width: 20px;
  align-self: stretch;
  transition: border-radius 0.18s ease-in-out, border-color 0.18s ease-in-out;
}

.container-prefix {
  border-right: none;
  border-radius: 20px 0 0 20px;
}

.container-suffix {
  border-left: none;
  border-radius: 0 20px 20px 0;
}

.environment .container-prefix {
  background: var(--url-input-editor-environment-background, #eceff1);
}

.overlay .container-prefix {
  border-radius: 8px 0 0 0px;
}

.overlay .container-suffix {
  border-radius: 0 8px 0 0;
}

.content-shadow {
  position: absolute;
  z-index: 1;
  left: 0px;
  right: 0px;
  bottom: 0;
  top: 0;
  transition: border-radius 0.18s ease-in-out, border-color 0.18s ease-in-out, box-shadow 0.18s ease-in-out;
}

.content-shadow.opened {
  box-shadow: 0px 12px 25px -4px rgba(0,0,0,0.58);
  border-radius: 8px;
}

.container.focused:not(.overlay) {
  border-color: var(--primary-color-light, var(--primary-color));
}

.container.overlay {
  border-radius: 8px 8px 0px 0px;
  border-color: transparent;
}

.url-autocomplete,
.url-autocomplete .suggestions-container {
  box-sizing: border-box;
}

.suggestions-container {
  border-radius: 0 0 8px 8px;
  border: 1px var(--url-input-editor-border-color, #e5e5e5) solid;
  border-top: none;
}

.container.overlay.autocomplete {
  border-radius: 8px 8px 0 0;
  border: 1px var(--url-input-editor-border-color, #e5e5e5) solid;
  border-bottom: none;
}

.input-wrapper {
  display: flex;
  align-items: center;
  color: inherit;
  flex: 1;
  border-top: 1px var(--url-input-editor-border-color, #e5e5e5) solid;
  border-bottom: 1px var(--url-input-editor-border-color, #e5e5e5) solid;
}

.overlay.autocomplete .input-wrapper {
  border-bottom: 2px solid var(--url-input-editor-border-color, #e5e5e5);
}

.main-input {
  flex: 1;
  height: 40px;
  border: none;
  outline: none;
  margin-right: 8px;
  font-size: 1rem;
  background: var(--url-input-editor-background, inherit);
  color: inherit;
}

.toggle-icon {
  cursor: pointer;
  transition: color 0.21s ease-in-out;
}

.toggle-icon:hover {
  color: var(--accent-color);
}

.toggle-icon.disabled {
  pointer-events: none;
  color: rgb(0 0 0 / 24%);
}

url-detailed-editor {
  background-color: inherit;
}

.params-editor {
  padding: 0 20px 20px 20px;
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
  overflow: auto;
  box-sizing: content-box;
  background-color: inherit;
  color: inherit;
}

.url-autocomplete anypoint-item {
  padding: 0 24px;
  cursor: default;
  --anypoint-item-min-height: 36px;
}

.url-autocomplete anypoint-item > div {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.url-autocomplete .highlight {
  background-color: var(--url-input-editor-highlight-background-color, #e5e5e5);
}

.clear-all-history-label,
.remove-suggestion {
  font-size: 0.9rem;
  cursor: pointer;
}

.clear-all-history-label:hover,
.remove-suggestion:hover {
  color: var(--link-color, #1a73e8);
  text-decoration: underline;
}

.remove-suggestion {
  margin-left: 4px;
}

.suggestions-container {
  overflow-x: hidden;
  background-color: var( --anypoint-listbox-background-color, var(--primary-background-color) );
  color: var(--anypoint-listbox-color, var(--primary-text-color));
}

.clear-all-history {
  padding: 0 20px;
  display: flex;
  flex-direction: row-reverse;
}

.environment-selector {
  align-self: stretch;
  display: flex;
  align-items: center;
  background: var(--url-input-editor-environment-background, #eceff1);
  padding: 0 12px 0 8px;
  margin-right: 8px;
}

.env-trigger {
  margin-left: 8px;
}

.env-options {
  box-shadow: var(--anypoint-dropdown-shadow);
  padding: 4px 0;
}

.env-options anypoint-item {
  padding: 0 20px;
}
`;
