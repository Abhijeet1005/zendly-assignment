const { GoogleGenerativeAI } = require('@google/generative-ai');
const { config } = require('./env');
const logger = require('../utils/logger');

let genAI;
let model;

function initializeGemini() {
  try {
    genAI = new GoogleGenerativeAI(config.gemini.apiKey);
    model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    logger.info('Gemini AI initialized successfully');
    return model;
  } catch (error) {
    logger.error('Failed to initialize Gemini AI', { error: error.message });
    throw error;
  }
}

function getModel() {
  if (!model) {
    return initializeGemini();
  }
  return model;
}

async function checkConnection() {
  try {
    const testModel = getModel();
    const result = await testModel.generateContent('test');
    return true;
  } catch (error) {
    logger.error('Gemini AI connection check failed', { error: error.message });
    return false;
  }
}

module.exports = {
  initializeGemini,
  getModel,
  checkConnection
};
