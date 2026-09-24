const app = require('./src/app');
const env = require('./src/config/env');
const { connectDB } = require('./src/config/db');

const PORT = env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    const server = app.listen(PORT, () => {
      console.log(`==================================================`);
      console.log(`  ShopSphere Multi-Vendor API Server Running`);
      console.log(`  Port:        ${PORT}`);
      console.log(`  Environment: ${env.NODE_ENV}`);
      console.log(`  Health API:  http://localhost:${PORT}/api/health`);
      console.log(`==================================================`);
    });

    const shutdown = () => {
      console.log('\n[Server] Gracefully shutting down...');
      server.close(() => {
        console.log('[Server] HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    console.error(`[Server Startup Failed]: ${error.message}`);
    process.exit(1);
  }
};

startServer();
