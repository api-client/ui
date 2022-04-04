/* eslint-disable no-param-reassign */
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
}

interface IRouteInternal extends IRoute {
  descriptor: (...args: any[]) => any;
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

function onRoute(): void {
  // the `this` is the instance of the class.
  // @ts-ignore
  const target = this as any;
  const routes = Reflect.get(target, 'routes') as IRouteInternal[];
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
  Reflect.deleteProperty(routeCopy, 'descriptor');
  const argument: IRouteResult = {
    route: routeCopy,
  };
  if (activeRoute.pattern) {
    const params = parseParams(activeRoute.pattern, path);
    if (params) {
      argument.params = params;
    }
  }
  activeRoute.descriptor.apply(target, [argument]);
  if (activeRoute.title) {
    document.title = activeRoute.title;
  }
  requiredRoutes.forEach((r) => {
    r.descriptor.apply(target, [argument]);
  });
}

/**
 * A route decorator that activates a function when a navigation occurs that matches the pattern.
 * 
 * ```javascript
 * @route({ pattern: '/' })
 * renderIndex(): void {
 *  this.page = 'index';
 * }
 * 
 * @route({ pattern: '*' })
 * reportPageView(): void {
 *  // called for each route
 * }
 * 
 * @route({ fallback: true })
 * render404(): void {
 *  this.page = '404';
 * }
 * ```
 */
export function route(properties: IRoute) {
  return (target: any, name: PropertyKey, descriptor: PropertyDescriptor): any => {
    const method = descriptor.value!;
    if (typeof method !== 'function') {
      throw new Error(`@route() can only by applied to a class method.`);
    }

    // sets routes
    if (!Reflect.has(target, 'routes')) {
      Reflect.set(target, 'routes', []);
    }
    // sets the "onRoute" function.
    if (!Reflect.has(target, 'onRoute')) {
      Reflect.set(target, 'onRoute', onRoute.bind(target));
    }
    const routes = Reflect.get(target, 'routes') as IRouteInternal[];
    routes.push({ ...properties, descriptor: method});
  }
}

function warnNoRoutes(): void {
  // eslint-disable-next-line no-console
  console.warn('The route callback was called but no routes are defined on the class.');
}

function runRoute(target: any): void {
  if (!Reflect.has(target, 'onRoute')) {
    warnNoRoutes();
    return;
  }
  target.onRoute();
}

function initRoute(target: any): void {
  window.onpopstate = (): void => {
    runRoute(target);
  }
  requestAnimationFrame(() => {
    runRoute(target);
  });
}

/**
 * A decorator to be set on the initializer function of the application screen.
 * After the initializer function is executed the decorator will call 
 * the route function.
 * 
 * ```typescript
 * 
 * \@routeInitializer()
 * async initialize(): Promise<void> {
 *   ...
 * }
 * 
 * \@route({ pattern: '/' })
 * renderIndex(): void {
 *  this.page = 'index';
 * }
 * ```
 * 
 * If not using the decorator, call the `onRoute()` function which is injected into the 
 * page's prototype. Note, TS won't reflect this in the type definition.
 * 
 * ```typescript
 * constructor() {
 *  ...
 *  // @ts-ignore
 *  this.onRoute();
 * }
 * ```
 */
export function routeInitializer() {
  return (target: any, name: PropertyKey, descriptor: TypedPropertyDescriptor<any>): any => {
    const method = descriptor.value!;
    if (typeof method !== 'function') {
      throw new Error(`@routeInitializer() can only by applied to a class method.`);
    }

    descriptor.value = (...args: any[]): any => {
      const result = method.apply(target, args);
      if (typeof result.finally === 'function') {
        return result.finally(() => {
          initRoute(target);
        });
      }
      initRoute(target);
      return result;
    }
  }
}
