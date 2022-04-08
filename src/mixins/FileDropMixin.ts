/* eslint-disable max-classes-per-file */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable class-methods-use-this */
import { html, TemplateResult, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { dedupeMixin } from '@open-wc/dedupe-mixin';
import '../define/api-icon.js';

export const dragEnterHandler = Symbol('dragEnterHandler');
export const dragLeaveHandler = Symbol('dragLeaveHandler');
export const dragOverHandler = Symbol('dragOverHandler');
export const dropHandler = Symbol('dropHandler');

type Constructor<T = {}> = new (...args: any[]) => T;

export declare class FileDropMixinInterface {
  dropTargetActive: boolean;

  /**
   * Processes dropped to the page files
   * @param files The list of dropped files
   * @abstract This is to be implemented by the platform bindings
   */
  processDroppedFiles(files: FileList): Promise<void>;
}

/**
 * Adds methods to accept files via drag and drop.
 * The mixin register the dnd events on the body element. When an object is dragged over the window it adds
 * this `drop-target` class to the `body` element. Additionally it sets the `dropTargetActive` property.
 * 
 * The mixin also assumes that when the `drop-target` is set then the `drop-info` overlay is rendered.
 * However, it does not change the logic if the element is not in the DOM.
 * Use the provided `dropTargetTemplate()` function to generate template for the drag info.
 * 
 * The class implementing this mixin should override the `processDroppedFiles(files)`  method
 * to process the incoming files.
 *
 * @mixin
 */
export const FileDropMixin = dedupeMixin(<T extends Constructor<LitElement>>(superClass: T): Constructor<FileDropMixinInterface> & T => {
  class MyMixinClass extends superClass {
    @property() dropTargetActive: boolean;

    constructor(...args: any[]) {
      super(...args);
      this[dragEnterHandler] = this[dragEnterHandler].bind(this);
      this[dragLeaveHandler] = this[dragLeaveHandler].bind(this);
      this[dragOverHandler] = this[dragOverHandler].bind(this);
      this[dropHandler] = this[dropHandler].bind(this);

      this.dropTargetActive = false;

      document.body.addEventListener('dragenter', this[dragEnterHandler]);
      document.body.addEventListener('dragleave', this[dragLeaveHandler]);
      document.body.addEventListener('dragover', this[dragOverHandler]);
      document.body.addEventListener('drop', this[dropHandler]);
    }

    /**
     * Processes dropped to the page files
     * @param files The list of dropped files
     * @abstract This is to be implemented by the platform bindings
     */
    async processDroppedFiles(files: FileList): Promise<void> {
      // ...
    }

    /**
     * @returns The template for the drop file message
     */
    dropTargetTemplate(): TemplateResult {
      return html`
      <div class="drop-info">
        <api-icon icon="fileDownload" class="drop-icon"></api-icon>
        <p class="drop-message">Drop the file here</p>
      </div>
      `;
    }

    [dragEnterHandler](e: DragEvent): void {
      if (!e.dataTransfer) {
        return;
      }
      if (![...e.dataTransfer.types].includes('Files')) {
        return;
      }
      e.preventDefault();
      document.body.classList.add('drop-target');
      this.dropTargetActive = true;
      e.dataTransfer.effectAllowed = 'copy';
    }

    [dragLeaveHandler](e: DragEvent): void {
      if (!e.dataTransfer) {
        return;
      }
      if (![...e.dataTransfer.types].includes('Files')) {
        return;
      }
      const node = e.target as HTMLElement;
      if (node.nodeType !== Node.ELEMENT_NODE) {
        return;
      }
      if (node !== document.body && !node.classList.contains('drop-info')) {
        return;
      }
      e.preventDefault();
      document.body.classList.remove('drop-target');
      this.dropTargetActive = false;
    }

    [dragOverHandler](e: DragEvent): void {
      if (!e.dataTransfer) {
        return;
      }
      if (![...e.dataTransfer.types].includes('Files')) {
        return;
      }
      const node = e.target as HTMLElement;
      if (node.nodeType !== Node.ELEMENT_NODE) {
        return;
      }
      if (node !== document.body && !node.classList.contains('drop-info')) {
        return;
      }
      e.preventDefault();
      document.body.classList.add('drop-target');
      this.dropTargetActive = true;
    }

    [dropHandler](e: DragEvent): void {
      if (!e.dataTransfer) {
        return;
      }
      if (![...e.dataTransfer.types].includes('Files')) {
        return;
      }
      e.preventDefault();
      document.body.classList.remove('drop-target');
      this.dropTargetActive = false;
      this.processDroppedFiles(e.dataTransfer.files);
    }
  };
  return MyMixinClass as Constructor<FileDropMixinInterface> & T;
});
