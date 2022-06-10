import { INavDetail, INavRunHttpProjectDetail, INavRunProjectRunnerDetail, INavRunSchemaDesignerDetail } from '../../events/NavigationEvents.js';
import { NavigationBindings } from '../base/NavigationBindings.js';

export class WebNavigationBindings extends NavigationBindings {
  handles = new Map<string, Window>();

  protected open(id: string, url: string, sameWindow = false): void {
    if (sameWindow) {
      window.location.href = url;
      return;
    }
    if (this.handles.has(id)) {
      const handle = this.handles.get(id) as Window;
      if (!handle.closed) {
        // handle.blur();
        // setTimeout(handle.focus, 0);
        // handle.location.href = url;
        return;
      }
    }
    const win = window.open(url);
    if (!win) {
      throw new Error(`Window blocked. Don't use timers and callbacks when creating a window.`);
    }
    this.handles.set(id, window);
    const handler = (): void => {
      this.handles.delete(id);
      window.removeEventListener('beforeunload', handler);
    }
    window.addEventListener('beforeunload', handler);
  }

  async openStoreConfiguration(): Promise<void> {
    const url = this.getPageUrl('../store/config.html').toString();
    this.open(url, url);
  }

  async openHttpProject(init: INavRunHttpProjectDetail): Promise<void> {
    if (!init) {
      throw new Error(`The HTTP Project app initialization requires a configuration.`);
    }
    const url = this.getPageUrl('../http-project/main.html');
    const { key, sameWindow } = init;
    url.searchParams.set('key', key);
    const id = url.toString();
    this.open(id, id, sameWindow);
  }

  async openProjectRunner(init: INavRunProjectRunnerDetail): Promise<void> {
    if (!init) {
      throw new Error(`The Project Runner app initialization requires a configuration.`);
    }
    const url = this.getPageUrl('../project-runner/main.html');
    const { key, parent, sameWindow } = init;
    url.searchParams.set('key', key);
    const id = url.toString();
    if (parent) {
      url.searchParams.set('parent', parent);
    }
    this.open(id, url.toString(), sameWindow);
  }

  async openSuiteStart(init: INavDetail = {}): Promise<void> {
    // ../start/main.html
    const url = this.getPageUrl('../start/main.html').toString();
    this.open(url, url, init.sameWindow);
  }

  
  async openStoreAuthenticate(init: INavDetail = {}): Promise<void> {
    const url = this.getPageUrl('../init/ConfigAuthenticate.html').toString();
    this.open(url, url, init.sameWindow);
  }

  async openSchemaDesigner(init: INavRunSchemaDesignerDetail): Promise<void> {
    const uri = this.getPageUrl('../schema-design/main.html');
    const { key, sameWindow } = init;
    uri.searchParams.set('key', key);
    const url = uri.toString();
    this.open(url, url, sameWindow);
  }
}
