export interface Route {
  /**
   * The name of the route
   */
  name: string;
  /**
   * The pattern to evaluate
   */
  pattern: string;
}

export interface RouteResult {
  /**
   * The matched route
   */
  route: Route;
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
export function testRoute(uri: string, pattern: string): boolean {
  return getPattern(pattern).test(uri);
}

/**
 * @param pattern The pattern to evaluate
 * @param uri The path value of the current URL.
 */
export function parseParams(pattern: string, uri: string): Record<string, string|string[]> {
  const r = getPattern(pattern);
  const match = r.exec(uri);
  // @ts-ignore
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

/**
 * @param routes List of routes to evaluate
 * @param path Current path
 */
export function findRoute(routes: Route[], path: string): RouteResult|null {
  const activeRoute = routes.find((route) => route.pattern !== '*' && testRoute(path, route.pattern));
  if (activeRoute) {
    const params = parseParams(activeRoute.pattern, path);
    return {
      route: activeRoute,
      params,
    }
  }
  const notFoundRoute = routes.find((route) => route.pattern === '*');
  if (notFoundRoute) {
    return {
      route: notFoundRoute,
    };
  }
  return null;
}

/**
 * Navigates to another page.
 * 
 * @param htmlFile The relative location of the target HTML file.
 * @param route Optional route params to add to the has part of the url.
 */
export function navigatePage(htmlFile: string, ...route: string[]): void {
  const hash = route.map(encodeURIComponent).join('/');
  const url = new URL(htmlFile, window.location.href);
  url.hash = hash;
  window.location.href = url.toString();
}

/**
 * Navigates to a route.
 * 
 * @param route Optional route params to add to the has part of the url.
 */
export function navigate(...route: string[]): void {
  const hash = route.map(encodeURIComponent).join('/');
  const url = new URL(window.location.href);
  url.hash = hash;
  window.location.href = url.toString();
}
