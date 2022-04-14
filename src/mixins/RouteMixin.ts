/* eslint-disable max-classes-per-file */
type Constructor<T = {}> = new (...args: any[]) => T;

export interface IRoute {
  /**
   * The route pattern to evaluate
   */
  pattern?: string;
  /**
   * Whether to call this method when a navigation occurs 
   * and the router function couldn't find a match.
   * 
   * Can be combined with a patter to define a default route.
   * Setting this multiple times on different route won't change
   * the fallback route. The first matched route will be called.
   */
  fallback?: boolean;
  /**
   * Optional name to pass to the route callback.
   */
  name?: string;
  /**
   * When set it automatically updated the document title on route.
   */
  title?: string;
  /**
   * The class method to call when the route is matched.
   */
  method: string;
}

export interface IRouteResult {
  /**
   * The matched route
   */
  route: IRoute;
  /**
   * Captured parameters
   */
  params?: Record<string, string|string[]>;
}

/**
 * @param value The pattern to evaluate
 */
function getPattern(value: string): RegExp {
  return new RegExp(`^${value}$`);
}

/**
 * @param uri The path value of the current URL.
 * @param pattern The pattern to evaluate
 */
function testRoute(uri: string, pattern: string): boolean {
  return getPattern(pattern).test(uri);
}

/**
 * @param pattern The pattern to evaluate
 * @param uri The path value of the current URL.
 */
function parseParams(pattern: string, uri: string): Record<string, string|string[]> | undefined {
  const r = getPattern(pattern);
  const match = r.exec(uri);
  if (!match) {
    return undefined;
  }
  const { groups } = match;
  const result: Record<string, string|string[]> = {};
  if (groups) {
    Object.keys(groups).forEach((key) => {
      let value = groups[key] as string;
      if (value[0] === '/') {
        value = value.substring(1);
      }
      if (value.includes('/')) {
        result[key] = value.split('/').map((i) => decodeURIComponent(i));
      } else {
        result[key] = decodeURIComponent(value);
      }
    });
  }
  return result
}

function warnNoFallback(path: string): void {
  // eslint-disable-next-line no-console
  console.warn(`Unable to find a fallback route for path ${path || '/'}.`);
}

function warnNoRoutes(): void {
  // eslint-disable-next-line no-console
  console.warn('The route callback was called but no routes are defined on the class.');
}

export declare class RouteMixinInterface {
  /**
   * The list of routes to handle.
   */
  static get routes(): IRoute[];

  /**
   * Initializes the routing.
   */
  initializeRouting(): void;

  /**
   * A handler when route change.
   */
  protected _routeHandler(): void;
}

export function RouteMixin<T extends Constructor<Object>>(superClass: T): Constructor<RouteMixinInterface> & T {
  class RouteMixinClass extends superClass {
    static get routes(): IRoute[] {
      return []
    }

    constructor(...args: any[]) {
      super(...args);
      this._routeHandler = this._routeHandler.bind(this);
    }

    initializeRouting(): void {
      window.onpopstate = (): void => this._routeHandler();
      requestAnimationFrame(() => {
        this._routeHandler();
      });
    }

    protected _routeHandler(): void {
      const routes = Reflect.get(this.constructor, 'routes') as IRoute[];
      if (!Array.isArray(routes) || !routes.length) {
        warnNoRoutes();
        return;
      }
      const url = new URL(window.location.href);
      const path = url.hash.replace('#', '');
      const patternRoutes = routes.filter(r => !!r.pattern && r.pattern !== '*');
      const requiredRoutes = routes.filter(r => r.pattern === '*');
      let activeRoute = patternRoutes.find((r) => testRoute(path, r.pattern as string));
      if (!activeRoute) {
        activeRoute = routes.find((r) => r.fallback);
        if (!activeRoute) {
          warnNoFallback(path);
          return;
        }
      }
      const routeCopy = { ...activeRoute };
      const argument: IRouteResult = {
        route: routeCopy,
      };
      if (activeRoute.pattern) {
        const params = parseParams(activeRoute.pattern, path);
        if (params) {
          argument.params = params;
        }
      }

      this._callRoute(activeRoute, argument);
      if (activeRoute.title) {
        document.title = activeRoute.title;
      }
      requiredRoutes.forEach((r) => {
        this._callRoute(r, argument)
      });
    }

    protected _callRoute(route: IRoute, argument: IRouteResult): void {
      if (typeof route.method !== 'string') {
        // eslint-disable-next-line no-console
        console.warn('The route method is not a string.');
        return;
      }
      // @ts-ignore
      const fn = this[route.method] as Function;
      // @ts-ignore
      if (typeof fn !== 'function') {
        // eslint-disable-next-line no-console
        console.warn('The route method is not defined.');
        return;
      }
      fn.apply(this, [argument]);
    }
  }
  // @ts-ignore
  return RouteMixinClass as Constructor<RouteMixinInterface> & T;
}
