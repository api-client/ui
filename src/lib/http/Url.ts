import { IUrl } from '@api-client/core/build/browser.js';

/**
 * Lists the suggestions lists before rendering.
 */
export function sortUrls(list: IUrl[], query: string): void {
  list.sort((a, b) => {
    const lowerA = a.url.toLowerCase();
    const lowerB = b.url.toLowerCase();
    const aIndex = lowerA.indexOf(query);
    const bIndex = lowerB.indexOf(query);
    if (aIndex === bIndex) {
      return a.url.localeCompare(b.url);
    }
    if (aIndex === 0 && bIndex !== 0) {
      return -1;
    }
    if (bIndex === 0 && aIndex !== 0) {
      return 1;
    }
    if (a.url > b.url) {
      return 1;
    }
    if (a.url < b.url) {
      return -1;
    }
    return a.url.localeCompare(b.url);
  });
}
