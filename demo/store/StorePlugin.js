/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { Server, StoreLevelUp, ProxyServer } from '@api-client/net-store';
import { DefaultLogger } from '@api-client/core';
import Secrets from './secrets.js';

/** @typedef {import('@web/dev-server-core').Plugin} Plugin */
/** @typedef {import('@web/dev-server-core').ServerStartParams} ServerStartParams */
/** @typedef {import('@api-client/net-store').IServerConfiguration} IServerConfiguration */
/** @typedef {import('@api-client/net-store').IServerProxyConfiguration} IServerProxyConfiguration */

const logger = new DefaultLogger();
const store = new StoreLevelUp(logger, 'demo/store/data');
const host = '192.168.86.249';
const prefix = '/v1';
const singlePort = 8550;
const multiPort = 8551;
const proxyPort = 8553;
const singleBaseUri = `http://${host}:${singlePort}${prefix}`;
const multiBaseUri = `http://${host}:${multiPort}${prefix}`;
const proxyUri = `http://${host}:${proxyPort}${prefix}`;

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

const proxyConfig = /** @type IServerProxyConfiguration */ ({
  port: proxyPort,
  prefix,
  logger,
  cors: {
    enabled: true,
    cors: {
      exposeHeaders: ['location'],
      // allowHeaders: '*',
      allowMethods: 'GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS',
      origin: (ctx) =>  ctx.request.header.origin,
    },
  },
});

const singleServer = new Server(store, singleUser);
const multiServer = new Server(store, multiUser);
const proxyServer = new ProxyServer(proxyConfig);

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
    await proxyServer.start();

    console.log(`Running store: ${singleBaseUri}, ${multiBaseUri}`);
    console.log(`Running proxy: ${proxyUri}`);
  },

  async serverStop() {
    await singleServer.stop();
    await multiServer.stop();
    await proxyServer.stop();
    await store.cleanup();
  }
});
