import { EventTypes } from './EventTypes.js';

export interface INavDetail {
  /**
   * Whether to load the requested page in the same window replacing the contents.
   * In an electron application this probably would mean closing the current window and
   * opening a new one as the preload script may be different for the target page.
   */
  sameWindow?: boolean;
}

export interface INavRunHttpProjectDetail extends INavDetail {
  /**
   * The project key to run
   */
  key: string;
}

export interface INavRunSchemaDesignerDetail extends INavDetail {
  /**
   * The schema file id to run
   */
  key: string;
}

export interface INavRunProjectRunnerDetail extends INavDetail {
  /**
   * The project key to run
   */
  key: string;
  /**
   * Optional parent folder to open the runner for.
   * When not set it opens a runner for the project.
   */
  parent?: string;
}

export type NavRunDetail = INavRunHttpProjectDetail | INavRunProjectRunnerDetail | INavRunSchemaDesignerDetail | INavDetail;

export class AppNavigationEvent extends CustomEvent<NavRunDetail> {
  constructor(type: string, detail: NavRunDetail) {
    super(type, {
      bubbles: true,
      cancelable: true,
      composed: true,
      detail,
    });
  }
}

export const NavigationEvents = Object.freeze({
  /** 
   * Inter-app navigation events.
   * They allow to open one app from another.
   * The controller is the `NavigationBindings` class.
   */
  App: Object.freeze({
    /**
     * Opens the Project Runner application. The detail object requires providing at least the `key` of the project to run.
     * The `NavigationBindings` should focus on the already created window or create a new one when previous window does not exist.
     * 
     * @param detail The init environment for the Project Runner app.
     * @param target Optional events target
     */
    runProjectRunner: (detail: INavRunProjectRunnerDetail, target: EventTarget=document.body): void => {
      const e = new AppNavigationEvent(EventTypes.Navigation.App.runProjectRunner, detail);
      target.dispatchEvent(e);
    },
    /**
     * Opens the HTTP Project application. The detail object requires providing at least the `key` of the project to run.
     * The `NavigationBindings` should focus on the already created window or create a new one when previous window does not exist.
     * 
     * @param detail The init environment for the HTTP Project app.
     * @param target Optional events target
     */
    runHttpProject: (detail: INavRunHttpProjectDetail, target: EventTarget=document.body): void => {
      const e = new AppNavigationEvent(EventTypes.Navigation.App.runHttpProject, detail);
      target.dispatchEvent(e);
    },
    /**
     * Opens the Schema Designer application. The detail object requires providing at least the `key` of the schema to run.
     * 
     * @param detail The init environment for the Schema Designer app.
     * @param target Optional events target
     */
    runSchemaDesigner: (detail: INavRunSchemaDesignerDetail, target: EventTarget=document.body): void => {
      const e = new AppNavigationEvent(EventTypes.Navigation.App.runSchemaDesigner, detail);
      target.dispatchEvent(e);
    },
    /**
     * Opens the main start window.
     * 
     * @param target Optional events target
     */
    runStart: (detail?: INavDetail, target: EventTarget=document.body): void => {
      const e = new AppNavigationEvent(EventTypes.Navigation.App.runStart, detail || {});
      target.dispatchEvent(e);
    },
  }),
  Store: Object.freeze({
    /**
     * Requests the application to open the screen with the store configuration.
     */
    config: (target: EventTarget=document.body): void => {
      const e = new Event(EventTypes.Navigation.Store.config, {
        bubbles: true,
        cancelable: true,
        composed: true,
      });
      target.dispatchEvent(e);
    },

    /**
     * Opens the store authentication window.
     * 
     * @param target Optional events target
     */
    authenticate: (detail?: INavDetail, target: EventTarget=document.body): void => {
      const e = new AppNavigationEvent(EventTypes.Navigation.Store.authenticate, detail || {});
      target.dispatchEvent(e);
    },
  }),
});
