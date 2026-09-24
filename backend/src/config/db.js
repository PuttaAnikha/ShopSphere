const mongoose = require('mongoose');
const env = require('./env');

const connectDB = async (customUri) => {
  const uri = customUri || env.MONGO_URI;
  const connectionOptions = {
    serverSelectionTimeoutMS: 30000,
    connectTimeoutMS: 10000,
    family: 4,
  };

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const conn = await mongoose.connect(uri, connectionOptions);
      if (env.NODE_ENV !== 'test') {
        console.log(`[MongoDB] Connected: ${conn.connection.host}/${conn.connection.name}`);
      }
      return conn;
    } catch (error) {
      await mongoose.disconnect();
      if (attempt === 3) {
        if (env.NODE_ENV !== 'test') {
          console.error(`[MongoDB Connection Error]: ${error.message}`);
        }
        throw error;
      }
      if (env.NODE_ENV !== 'test') {
        console.warn(`[MongoDB] Connection attempt ${attempt} failed; retrying...`);
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
};

module.exports = { connectDB, disconnectDB };
