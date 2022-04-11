/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { Server, StoreLevelUp } from '@api-client/net-store';
import { DefaultLogger } from '@api-client/core';
import Secrets from './secrets.js';

/** @typedef {import('@web/dev-server-core').Plugin} Plugin */
/** @typedef {import('@web/dev-server-core').ServerStartParams} ServerStartParams */
/** @typedef {import('@api-client/net-store').IServerConfiguration} IServerConfiguration */

const logger = new DefaultLogger();
const store = new StoreLevelUp(logger, 'demo/store/data');
const prefix = '/v1';
const singlePort = 8550;
const multiPort = 8551;
const singleBaseUri = `http://localhost:${singlePort}${prefix}`;
const multiBaseUri = `http://localhost:${multiPort}${prefix}`;

const singleUser = /** @type IServerConfiguration */ ({
  logger,
  router: {
    prefix,
  },
  session: {
    secret: Secrets.secret,
  },
  mode: 'single-user',
  cors: {
    enabled: true,
    cors: {
      exposeHeaders: ['location'],
      allowHeaders: ['authorization'],
    },
  },
});

const multiUser = /** @type IServerConfiguration */ ({ 
  ...singleUser,
  mode: 'multi-user',
  authentication: {
    type: 'oidc',
    config: {
      issuerUri: 'https://accounts.google.com/',
      clientId: Secrets.clientId,
      clientSecret: Secrets.clientSecret,
      redirectBaseUri: multiBaseUri,
    }
  },
  logger,
  session: {
    expiresIn: '1d',
    secret: Secrets.secret,
  }
});

const singleServer = new Server(store, singleUser);
const multiServer = new Server(store, multiUser);

export default /** @type Plugin */ ({
  name: 'api-store',
  /**
   * @param {ServerStartParams} args
   */
  async serverStart(args) {
    await store.initialize();
    await singleServer.initialize();
    await singleServer.startHttp(singlePort);
    await multiServer.initialize();
    await multiServer.startHttp(multiPort);

    console.log(`Running store: ${singleBaseUri}, ${multiBaseUri}`);
  },

  async serverStop() {
    await singleServer.stopHttp();
    await multiServer.stopHttp();
    await store.cleanup();
  }
});
