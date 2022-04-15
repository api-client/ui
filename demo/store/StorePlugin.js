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
const host = '192.168.86.249';
const prefix = '/v1';
const singlePort = 8550;
const multiPort = 8551;
const singleBaseUri = `http://${host}:${singlePort}${prefix}`;
const multiBaseUri = `http://${host}:${multiPort}${prefix}`;

const singleUser = /** @type IServerConfiguration */ ({
  logger,
  portOrSocket: singlePort,
  host,
  router: {
    prefix,
  },
  session: {
    secret: Secrets.secret,
    expiresIn: '5d',
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
  portOrSocket: multiPort,
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
    expiresIn: '5d',
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
    await singleServer.start();
    await multiServer.initialize();
    await multiServer.start();

    console.log(`Running store: ${singleBaseUri}, ${multiBaseUri}`);
  },

  async serverStop() {
    await singleServer.stop();
    await multiServer.stop();
    await store.cleanup();
  }
});
