import { PlatformBindings } from './PlatformBindings.js';
import { EventTypes } from '../../events/EventTypes.js';
import { AppNavigationEvent, INavRunHttpProjectDetail, INavRunProjectRunnerDetail, INavDetail } from '../../events/NavigationEvents.js';

/**
 * Global navigation bindings.
 * This class handles navigation that cannot be handled by any specific
 * application in the suite but rather the event should be transferred
 * to the main process.
 * 
 * An example of such is the store configuration which is handled by the main process
 * instead of an application.
 */
export abstract class NavigationBindings extends PlatformBindings {
  async initialize(): Promise<void> {
    window.addEventListener(EventTypes.Navigation.Store.config, this.storeConfigHandler.bind(this));
    window.addEventListener(EventTypes.Navigation.App.runHttpProject, this.appNavigationHandler.bind(this) as EventListener);
    window.addEventListener(EventTypes.Navigation.App.runProjectRunner, this.appNavigationHandler.bind(this) as EventListener);
    window.addEventListener(EventTypes.Navigation.App.runStart, this.appNavigationHandler.bind(this) as EventListener);
    window.addEventListener(EventTypes.Navigation.Store.authenticate, this.appNavigationHandler.bind(this) as EventListener);
  }

  /**
   * The application assumes that all screens are located in the same directory
   * in which we have sub-directories for each screen
   * ```
   * (...)/public/pages
   * (...)/public/pages/page1/main.html
   * (...)/public/pages/page2/main.html
   * (...)/public/pages/page3/main.html
   * ```
   * Then switching from one screen to another should be by providing a relative path from 
   * the current page to the target page. For example switching from `page1/main.html`
   * to `page2/main.html` would be
   * 
   * ```
   * ../page2/main.html
   * ```
   * 
   * In a different platforms this can be overwritten to support different way of creating URLs
   * 
   * @param relative The relative position from the current page.
   * @returns The full URL to the screen HTML page.
   */
  public getPageUrl(relative: string): URL {
    const url = new URL(relative, window.location.href);
    return url;
  }

  protected storeConfigHandler(e: Event): void {
    e.preventDefault();
    this.openStoreConfiguration();
  }

  /**
   * Handles and proxies all kind of intra-app navigation.
   */
  protected appNavigationHandler(e: AppNavigationEvent): void {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    switch (e.type) {
      case EventTypes.Navigation.App.runHttpProject: 
        this.openHttpProject(e.detail as INavRunHttpProjectDetail);
        break;
      case EventTypes.Navigation.App.runProjectRunner: 
        this.openProjectRunner(e.detail as INavRunProjectRunnerDetail);
        break;
      case EventTypes.Navigation.App.runStart: 
        this.openSuiteStart(e.detail as INavDetail);
        break;
      case EventTypes.Navigation.Store.authenticate: 
        this.openStoreAuthenticate(e.detail as INavDetail);
        break;
      default:
        // nothing, just ignore.
    }
  }

  /**
   * Opens a new window with the store configuration
   */
  abstract openStoreConfiguration(): Promise<void>;

  /**
   * Opens a new window with the HTTP Project
   * @param init The HTTP Project app init options.
   */
  abstract openHttpProject(init: INavRunHttpProjectDetail): Promise<void>;

  /**
   * Opens a new window with the Project runner.
   * @param init The Project Runner app init options.
   */
  abstract openProjectRunner(init: INavRunProjectRunnerDetail): Promise<void>;

  /**
   * Opens the suite's start page.
   */
  abstract openSuiteStart(init?: INavDetail): Promise<void>;

  /**
   * Opens store authentication configuration.
   */
  abstract openStoreAuthenticate(init?: INavDetail): Promise<void>;
}
