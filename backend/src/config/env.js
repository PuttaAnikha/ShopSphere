const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const env = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/shopsphere',
  JWT_SECRET: process.env.JWT_SECRET || 'super_secret_shopsphere_jwt_key_2026_production_grade',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  AI_PROVIDER: process.env.AI_PROVIDER || 'mock',
  AI_API_KEY: process.env.AI_API_KEY || '',
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
  PAYMENT_PROVIDER: process.env.PAYMENT_PROVIDER || 'mock',
  PAYMENT_KEY: process.env.PAYMENT_KEY || 'mock_key',
  PAYMENT_SECRET: process.env.PAYMENT_SECRET || 'mock_secret'
};

module.exports = env;
