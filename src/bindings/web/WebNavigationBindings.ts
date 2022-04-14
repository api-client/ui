import { NavigationBindings } from '../base/NavigationBindings.js';

export class WebNavigationBindings extends NavigationBindings {
  async openStoreConfiguration(): Promise<void> {
    const win = window.open('StoreConfig.html');
    if (!win) {
      throw new Error(`Unable to open a new tab.`);
    }
  }

  /**
   * Opens a new window with the HTTP Project
   * @param id the project id.
   */
  async openHttpProject(id: string): Promise<void> {
    const win = window.open(`HttpProject.html?key=${id}`);
    if (!win) {
      throw new Error(`Unable to open a new tab.`);
    }
  }
}
