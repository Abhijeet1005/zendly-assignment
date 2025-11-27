const axios = require('axios');
const { config } = require('../config/env');
const { ExternalServiceError } = require('../utils/errors');
const logger = require('../utils/logger');

class OrchestratorService {
  constructor() {
    this.baseUrl = config.orchestrator.baseUrl;
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  async getConversationHistory(externalConversationId, pagination = {}) {
    try {
      const { page = 1, limit = 50 } = pagination;
      
      const response = await this.client.get(`/conversations/${externalConversationId}/history`, {
        params: { page, limit }
      });

      logger.debug('Retrieved conversation history from orchestrator', {
        externalConversationId,
        messageCount: response.data?.messages?.length || 0
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to get conversation history from orchestrator', {
        externalConversationId,
        error: error.message
      });
      throw new ExternalServiceError('Orchestrator', error.message);
    }
  }

  async getContactInfo(customerId) {
    try {
      const response = await this.client.get(`/contacts/${customerId}`);

      logger.debug('Retrieved contact info from orchestrator', { customerId });

      return response.data;
    } catch (error) {
      logger.error('Failed to get contact info from orchestrator', {
        customerId,
        error: error.message
      });
      throw new ExternalServiceError('Orchestrator', error.message);
    }
  }

  async notifyResolution(externalConversationId) {
    try {
      await this.client.post(`/conversations/${externalConversationId}/resolved`);

      logger.info('Notified orchestrator of conversation resolution', {
        externalConversationId
      });
    } catch (error) {
      logger.error('Failed to notify orchestrator of resolution', {
        externalConversationId,
        error: error.message
      });
      // Don't throw - this is a non-critical notification
    }
  }

  async getRecentMessages(externalConversationId, limit = 10) {
    try {
      const response = await this.client.get(`/conversations/${externalConversationId}/messages/recent`, {
        params: { limit }
      });

      logger.debug('Retrieved recent messages from orchestrator', {
        externalConversationId,
        count: response.data?.messages?.length || 0
      });

      return response.data?.messages || [];
    } catch (error) {
      logger.error('Failed to get recent messages from orchestrator', {
        externalConversationId,
        error: error.message
      });
      // Return empty array as fallback
      return [];
    }
  }
}

module.exports = new OrchestratorService();
