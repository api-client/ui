import { IUrl } from '@api-client/core/build/browser.js';

/**
 * Lists the suggestions lists before rendering.
 */
export function sortUrls(list: IUrl[], query: string): void {
  list.sort((a, b) => {
    const lowerA = a.key.toLowerCase();
    const lowerB = b.key.toLowerCase();
    const aIndex = lowerA.indexOf(query);
    const bIndex = lowerB.indexOf(query);
    if (aIndex === bIndex) {
      return a.key.localeCompare(b.key);
    }
    if (aIndex === 0 && bIndex !== 0) {
      return -1;
    }
    if (bIndex === 0 && aIndex !== 0) {
      return 1;
    }
    if (a.key > b.key) {
      return 1;
    }
    if (a.key < b.key) {
      return -1;
    }
    return a.key.localeCompare(b.key);
  });
}
