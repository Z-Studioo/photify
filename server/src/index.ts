import { initializeApp } from './app';
import { config } from '@/config/environment';

const PORT = config.PORT || 5000;

async function start() {
  const app = await initializeApp();

  const server = app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`🚀 Server running on port ${PORT} in ${config.NODE_ENV} mode`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    // eslint-disable-next-line no-console
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
      // eslint-disable-next-line no-console
      console.log('HTTP server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    // eslint-disable-next-line no-console
    console.log('SIGINT signal received: closing HTTP server');
    server.close(() => {
      // eslint-disable-next-line no-console
      console.log('HTTP server closed');
      process.exit(0);
    });
  });

  return server;
}

const serverPromise = start().catch(err => {
  // eslint-disable-next-line no-console
  console.error('Failed to start server:', err);
  process.exit(1);
});

export { serverPromise };
