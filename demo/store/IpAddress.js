import { networkInterfaces } from 'os';

const nets = networkInterfaces();

// eslint-disable-next-line import/no-mutable-exports
let ip = '127.0.0.1';

for (const interfaceName of Object.keys(nets)) {
  for (const net of nets[interfaceName]) {
    if (net.family === 'IPv4' && !net.internal) {
      ip = net.address;
    }
  }
}

export default ip;
