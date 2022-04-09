import { NavigationBindings } from '../base/NavigationBindings.js';

export class WebNavigationBindings extends NavigationBindings {
  async openStoreConfiguration(): Promise<void> {
    const win = window.open('StoreConfig.html');
    if (!win) {
      throw new Error(`Unable to open a new tab.`);
    }
  }
}
