/* eslint-disable @typescript-eslint/explicit-function-return-type */
// import { playwrightLauncher } from '@web/test-runner-playwright';
import { esbuildPlugin } from '@web/dev-server-esbuild';

const filteredLogs = ['Running in dev mode', 'lit-html is in dev mode'];

export default /** @type {import("@web/test-runner").TestRunnerConfig} */ ({
  /** Test files to run */
  files: 'test/**/**/*.test.ts',

  /** Resolve bare module imports */
  nodeResolve: {
    exportConditions: ['browser', 'production'],
  },

  /** Filter out lit dev mode logs */
  filterBrowserLogs(log) {
    for (const arg of log.args) {
      if (typeof arg === 'string' && filteredLogs.some(l => arg.includes(l))) {
        return false;
      }
    }
    return true;
  },

  /** Compile JS for older browsers. Requires @web/dev-server-esbuild plugin */
  // esbuildTarget: 'auto',

  /** Amount of browsers to run concurrently */
  concurrentBrowsers: 3,

  plugins: [
    esbuildPlugin({ ts: true, target: 'es2020' }),
  ],

  /** Amount of test files per browser to test concurrently */
  // concurrency: 1,

  /** Browsers to run tests on */
  // browsers: [
  //   playwrightLauncher({ product: 'chromium' }),
  //   playwrightLauncher({ product: 'firefox' }),
  //   playwrightLauncher({ product: 'webkit' }),
  // ],

  // See documentation for all available options

  testRunnerHtml: testFramework =>
  `<html>
    <head>
      <link rel="stylesheet" href="/test/visualization/lib/test-styles.css" />
    </head>
    <body>
      <script type="module" src="${testFramework}"></script>
    </body>
  </html>`,
});
