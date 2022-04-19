/* eslint-disable class-methods-use-this */
import { TemplateResult } from 'lit';
import { AuthUiInit } from '../types.js';
import AuthorizationMethodElement from '../AuthorizationMethodElement.js';

export const changeCallback = Symbol('changeCallback');
export const renderCallback = Symbol('renderCallback');

export default abstract class AuthUiBase {
  [renderCallback]: () => Promise<void>;
  
  [changeCallback]: () => void;

  target: AuthorizationMethodElement;

  readOnly?: boolean;
  
  disabled?: boolean;

  authorizing?: boolean;

  constructor(init: AuthUiInit) {
    this[renderCallback] = init.renderCallback;
    this[changeCallback] = init.changeCallback;
    this.target = init.target;
    this.readOnly = init.readOnly;
    this.disabled = init.disabled;
    this.authorizing = init.authorizing;

    this.changeHandler = this.changeHandler.bind(this);
    this.selectHandler = this.selectHandler.bind(this);
    this.authorize = this.authorize.bind(this);
  }

  /**
   * A function to be implemented when the UI is about to be initialized.
   * Note, when this method is called the UI is not yet generated
   * and the shadow root may not be created.
   */
  startup(): void {
    // ...
  }

  /**
   * A function to be implemented when the UI is about to be disposed.
   * The UI should cleanup resources.
   */
  cleanup(): void {
    // ...
  }

  /**
   * to be implemented by the child class.
   * You should NOT call `notifyChange()` here.
   * @param state The serialized state of the UI.
   */
  abstract restore(state: unknown): void;

  /**
   * @returns {any} The serialized state of the UI.
   */
  abstract serialize(): unknown;

  /**
   * Resets the current state of the UI.
   * 
   * To be implemented by the child class.
   * You should call `notifyChange()` when ready.
   */
  abstract reset(): void;

  /**
   * The main function used to generate a template for the UI.
   */
  abstract render(): TemplateResult;

  /**
   * Sets default values for the authorization method.
   * This is called by the authorization-method element after 
   * the type is initialized.
   * 
   * To be implemented by the child class.
   * You should call `notifyChange()` when ready.
   */
  abstract defaults(): void;

  /**
   * A handler for the `input` event on an input element
   * @param e Original event dispatched by the input.
   */
  changeHandler(e: Event): void {
    const { name, value } = e.target as HTMLInputElement;
    // @ts-ignore
    this[name] = value;
    this.notifyChange();
  }

  /**
   * A handler for the `select` event on a dropdown element
   * @param e Original event dispatched by the input.
   */
  selectHandler(e: Event): void {
    const {
      parentElement,
      selected,
    } = e.target as HTMLOptionElement;
    const { name } = (parentElement as HTMLInputElement);
    // @ts-ignore
    this[name] = selected;
    this.notifyChange();
  }

  /**
   * Notifies the application that the UI state has change
   */
  notifyChange(): void {
    this[changeCallback]();
  }

  /**
   * Notifies the application that the UI should be rendered.
   */
  async requestUpdate(): Promise<void> {
    await this[renderCallback]();
  }

  /**
   * Performs the authorization.
   * This only applies to methods that have any authorization to perform
   * like Oauth 2.
   */
  async authorize(): Promise<unknown> {
    return null;
  }
}
