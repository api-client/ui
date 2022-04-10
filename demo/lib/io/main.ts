import { ApiStore } from './ApiStore.js';

/**
 * Mocks some of the IO process' functionality.
 * 
 * Call to this class are only async.
 * 
 * In an electron application the is the background process
 * that runs the application logic.
 * 
 * This mimics some of the behavior of the IO process.
 */
export class IoProcess {
  store: ApiStore;

  constructor() {
    this.store = new ApiStore;
  }

  async initialize(): Promise<void> {
    await this.store.initialize();
  }
}
