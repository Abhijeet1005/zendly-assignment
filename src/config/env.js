require('dotenv').config();

const requiredEnvVars = [
  'DB_HOST',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
  'GEMINI_API_KEY',
  'ORCHESTRATOR_BASE_URL'
];

function validateEnv() {
  const missing = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT) || 3000,
  
  database: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 3306,
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    poolMin: parseInt(process.env.DB_POOL_MIN) || 2,
    poolMax: parseInt(process.env.DB_POOL_MAX) || 10
  },
  
  gemini: {
    apiKey: process.env.GEMINI_API_KEY
  },
  
  orchestrator: {
    baseUrl: process.env.ORCHESTRATOR_BASE_URL
  },
  
  gracePeriod: {
    minutes: parseInt(process.env.GRACE_PERIOD_MINUTES) || 15
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  }
};

module.exports = {
  validateEnv,
  config
};
