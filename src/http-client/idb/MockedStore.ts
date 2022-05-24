import { ProjectMock } from '@api-client/core/build/browser.js';

/**
 * A class that generates HTTP Client data for tests.
 */
export class MockedStore {
  mock = new ProjectMock;
}
