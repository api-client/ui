import { html, TemplateResult } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';

interface InputConfiguration {
  /**
   * Type of the control
   */
  type?: any;
  /**
   * Whether `autocomplete` is on. Default to `true`.
   */
  autocomplete?: any;
  readOnly?: boolean;
  disabled?: boolean;
  required?: boolean;
  autoValidate?: boolean;
  invalidLabel?: string;
  infoLabel?: string;
  /**
   * CSS class names to pass to the `classMap()`
   */
  classes?: any;
}

/**
 * Renders an input element for for the view.
 *
 * @param name Input name
 * @param value Current input value
 * @param label The label to render
 * @param changeHandler Handler for the input event.
 * @param opts Optional configuration options
 */
export function inputTemplate(name: string, value: string | number, label: string, changeHandler: Function, opts: InputConfiguration = {}): TemplateResult {
  const config = { ...opts };
  config.type = opts.type || 'text';
  if (opts.autocomplete === undefined) {
    config.autocomplete = 'on';
  }
  return html`
    <anypoint-input
      .value="${value}"
      @change="${changeHandler}"
      name="${name}"
      type="${config.type}"
      ?required="${config.required}"
      ?autoValidate="${config.autoValidate}"
      autocomplete="${ifDefined(config.autocomplete)}"
      ?readOnly="${config.readOnly}"
      ?disabled="${config.disabled}"
      invalidMessage="${ifDefined(config.invalidLabel)}"
      infoMessage="${ifDefined(config.infoLabel)}"
      class="${classMap(config.classes || {})}"
    >
      <label slot="label">${label}</label>
    </anypoint-input>
  `;
};

/**
 * Renders a password input element for the view.
 *
 * @param name Input name
 * @param value Current input value
 * @param label The label to render
 * @param inputHandler Handler for the input event.
 * @param opts Optional configuration options
 */
export function passwordTemplate(name: string, value: string, label: string, inputHandler: Function, opts: InputConfiguration = {}): TemplateResult {
  const config = { ...opts };
  config.type = opts.type || 'text';
  if (opts.autocomplete === undefined) {
    config.autocomplete = 'on';
  }
  return html`
    <anypoint-masked-input
      .value="${value}"
      @change="${inputHandler}"
      name="${name}"
      type="${config.type}"
      ?required="${config.required}"
      ?autoValidate="${config.autoValidate}"
      autocomplete="${ifDefined(config.autocomplete)}"
      ?readOnly="${config.readOnly}"
      ?disabled="${config.disabled}"
      invalidMessage="${ifDefined(config.invalidLabel)}"
      infoMessage="${ifDefined(config.infoLabel)}"
      class="${classMap(config.classes || {})}"
    >
      <label slot="label">${label}</label>
    </anypoint-masked-input>
  `;
};
