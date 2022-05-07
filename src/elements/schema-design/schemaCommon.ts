import { css } from "lit";

export default css`
:host {
  --column-padding-left: 84px;
  --property-border-width: 3px;
  --property-border-color: var(--primary-color, #2196f3);
  --property-container-padding: 12px;
}

.property-container {
  display: flex;
  align-items: flex-start;
  flex: 1;
}

.property-container.simple {
  flex-direction: column;
}

.property-border {
  width: var(--property-border-width);
  min-width: var(--property-border-width);
  align-self: stretch;
  background-color: var(--property-border-color);
}

.property-value {
  padding: var(--property-container-padding) 0px;
  flex: 1;
}

.property-container:last-of-type .property-border {
  align-self: flex-start;
  /* padding of the content container + title container / 2 + border size  / 2 */
  height: calc(var(--property-container-padding) + 52px / 2 + var(--property-border-width) / 2);
  border-bottom-left-radius: var(--property-border-width);
}

.and-union-member:not(:last-of-type) .property-container:last-of-type .property-border {
  align-self: stretch;
  height: auto;
  border-bottom-left-radius: 0;
}

.inheritance-label,
.no-properties {
  border-left: var(--property-border-width) var(--property-border-color) dashed;
  padding: 24px 12px;
  margin: 0;
}

.no-properties {
  border-left-style: solid;
}

.shape-children .property-container:first-of-type .property-border {
  border-top-right-radius: var(--property-border-width);
}

.shape-children {
  display: flex;
  position: relative;
}

.shape-children > .property-border {
  background-color: var(--property-children-border-color, #bdbdbd);
  margin-right: 21px;
}

.shape-children::before {
  content: '';
  width: calc(18px + var(--property-border-width) * 2);
  height: var(--property-border-width);
  background-color: var(--property-border-color);
  position: absolute;
  left: 0px;
  top: 0px;
  border-bottom-left-radius: var(--property-border-width);
}

.shape-children:last-of-type > .property-border {
  background-color: transparent;
}

.union-options {
  padding: 12px 0px 12px 20px;
  border-left: var(--property-border-width) var(--property-border-color) dashed;
  box-sizing: border-box;
}

.shape-children:last-of-type > .property-border {
  margin-bottom: 60px;
}

.property-decorator {
  width: var(--column-padding-left);
  align-self: stretch;
  display: flex;
  align-items: center;
  padding-right: 20px;
  color: var(--property-border-color);
  box-sizing: border-box;
}

.property-decorator hr {
  width: 100%;
  border-color: currentColor;
  border-width: var(--property-border-width);
  border-style: solid;
  border-top: none;
}

.property-decorator.scalar::after {
  content: "";
  display: inline-block;
  width: 16px;
  height: 16px;
  min-width: 16px;
  border-radius: 50%;
  background-color: transparent;
  border: 3px solid currentColor;
}

.property-decorator.object::after {
  content: "";
  display: inline-block;
  width: 16px;
  height: 16px;
  min-width: 16px;
  background-color: transparent;
  border: 3px solid currentColor;
}

.property-decorator.object .object-toggle-icon {
  cursor: pointer;
}

.object-toggle-icon {
  width: 24px;
  height: 24px;
  min-width: 24px;
  fill: currentColor;
  transition: transform 0.23s linear;
}

.object-toggle-icon.opened {
  transform: rotate(90deg);
}

.property-headline,
.property-container.simple .name-column {
  display: flex;
  align-items: center;
  flex-direction: row;
  height: 52px;
}

.property-container:not(.simple) .name-column {
  width: 140px;
  margin-right: 20px;
}

.property-container:not(.simple) .description-column {
  padding-left: var(--column-padding-left);
}

.property-container:not(.simple) .details-column {
  padding-left: var(--column-padding-left);
}

.details-column {
  align-self: stretch;
}

.param-name {
  word-break: break-all;
}

.param-name .param-label {
  font-weight: var(--property-name-font-weight, var(--api-type-document-property-name-font-weight, 500));
  color: var(--property-name-color, var(--api-type-document-property-color, inherit));
  font-size: var(--property-name-font-size, var(--api-type-document-property-name-font-size, 1.2rem));
}

.param-name.required::after {
  content: '*';
  margin-left: -4px;
}

.param-name.deprecated {
  text-decoration: line-through;
}

.param-name-secondary {
  margin-left: 8px;
}

.headline-separator {
  display: inline-block;
  width: 1px;
  background-color: gray;
  align-self: stretch;
  margin: 12px 20px;
}

.param-type {
  margin: 12px 12px 12px 0;
}

.schema-property-item {
  display: flex;
  align-items: flex-start;
  margin: 8px 0;
}

.schema-property-label {
  font-weight: var(--property-schema-property-label-font-weight, var(--api-type-document-property-range-attribute-label-font-weight, 500));
  margin-right: 8px;
}

.schema-property-label.example {
  margin-top: 8px;
}

.schema-property-value {
  word-break: break-all;
}

.enum-items {
  display: flex;
  flex-wrap: wrap;
  margin: 0;
  padding: 0;
}

.enum-items li {
  list-style: none;
}

.schema-example {
  margin-bottom: 12px;
}

.schema-example pre {
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
  padding: 8px 4px;
}

.schema-example summary {
  font-size: 1.1rem;
  padding: 8px 12px;
  background-color: var(--api-example-title-background-color, #ff9800);
  color: var(--api-example-title-color, #000);
  border-radius: 4px;
  cursor: default;
  transition: border-radius ease-in-out 0.2s;
}

.schema-example[open] summary {
  border-bottom-right-radius: 0px;
  border-bottom-left-radius: 0px;
}

.code-value {
  margin: 0px 4px;
  padding: 2px 4px;
  background-color: var(--code-background-color);
  word-break: break-all;
  white-space: pre-wrap;
}

.code-value.inline {
  padding: 0 4px;
}

.code-value,
.code-value code {
  font-family: var(--code-font-family);
  user-select: text;
}

.property-details {
  margin: 20px 0;
}

.property-details summary {
  margin: 20px 0;
  cursor: default;
}
.property-details summary .label {
  margin-left: 8px;
}

.example-items {
  margin: 0;
  padding: 0;
  flex: 1;
}

.example-items li {
  display: block;
  margin: 4px 0;
  padding: 4px;
  width: 100%;
  white-space: pre-wrap;
  background-color: var(
    --operation-params-example-background-color,
    var(--code-background-color)
  );
  color: var(--operation-params-example-color, var(--code-color, inherit));
}

.pill {
  background-color: var(--pill-background-color, var(--api-type-document-trait-background-color, #e5e5e5));
  color: var(--pill-color, var(--api-type-document-trait-color, var(--primary-text-color, #000)));
  border-radius: var(--pill-border-radius, var(--api-type-document-trait-border-radius, 12px));
  font-size: var(--pill-font-size, var(--api-type-document-trait-font-size, inherit));
  padding: var(--pill-padding, var(--api-type-document-trait-padding, 2px 12px));
  margin: 4px;
}

.pill.warning {
  background-color: var(--pill-warning-background-color, #ffc107);
  color: var(--pill-warning-color, var(--primary-text-color, #000));
}

.pill.primary {
  background-color: var(--pill-primary-background-color, #1565c0);
  color: var(--pill-primary-color, #fff);
}

.pill:first-child {
  margin-left: 0;
}

.pill:last-child {
  margin-right: 0;
}

.param-pills {
  display: flex;
  align-items: center;
}

.property-actions {
  margin-right: 12px;
}
`;
