import { LitElement } from "lit";
import { property } from "lit/decorators.js";

/**
 * A base element for all elements in the UI library.
 * This allows to introduce global logic or properties for all elements.
 */
export default class ApiElement extends LitElement {
  /**
   * Compatibility layer with the anypoint platform.
   */
  @property({ type: Boolean, reflect: true }) anypoint?: boolean;
}
