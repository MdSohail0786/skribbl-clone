const http = require('http');
const { Server } = require('socket.io');

const createApp = require('./app');
const env = require('./config/env');
const { connectDatabase } = require('./config/database');
const { initSocket } = require('./socket');

async function bootstrap() {
  await connectDatabase();

  const app = createApp();
  const server = http.createServer(app);

  const io = new Server(server, {
    cors: {
      origin: env.CLIENT_ORIGIN,
      credentials: true,
    },
    pingTimeout: 20000,
    pingInterval: 10000,
  });

  initSocket(io);

  server.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`[server] Listening on port ${env.PORT} (${env.NODE_ENV})`);
    // eslint-disable-next-line no-console
    console.log(`[server] Allowed client origins: ${env.CLIENT_ORIGIN.join(', ')}`);
  });

  process.on('unhandledRejection', (err) => {
    // eslint-disable-next-line no-console
    console.error('[fatal] Unhandled rejection:', err);
  });
}

bootstrap();
