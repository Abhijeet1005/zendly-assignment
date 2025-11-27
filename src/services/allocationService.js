const db = require('../config/database');
const conversationRepository = require('../repositories/conversationRepository');
const operatorRepository = require('../repositories/operatorRepository');
const geminiService = require('./geminiService');
const orchestratorService = require('./orchestratorService');
const { ConversationState, UrgencyLevel, ComplexityRating } = require('../models/enums');
const { ValidationError, NotFoundError, ConflictError } = require('../utils/errors');
const logger = require('../utils/logger');

class AllocationService {
  async allocateNext(operatorId, tenantId) {
    // Validate operator exists and belongs to tenant
    const operator = await operatorRepository.findById(operatorId);
    if (!operator) {
      throw new NotFoundError('Operator');
    }
    if (operator.tenant_id !== tenantId) {
      throw new ValidationError('Operator does not belong to this tenant');
    }

    // Check operator is available
    const status = await operatorRepository.getStatus(operatorId);
    if (!status || status.status !== 'AVAILABLE') {
      throw new ValidationError('Operator must be AVAILABLE to receive allocations');
    }

    // Build candidate list
    const candidates = await this.buildCandidates(operatorId);

    if (candidates.length === 0) {
      logger.info('No allocatable conversations found', { operatorId });
      return null;
    }

    // Calculate priority for each candidate
    const candidatesWithPriority = await Promise.all(
      candidates.map(async (conversation) => {
        const priority = await this.calculatePriority(conversation);
        return { ...conversation, calculated_priority: priority };
      })
    );

    // Sort by priority (descending) then by last_message_at (ascending)
    candidatesWithPriority.sort((a, b) => {
      if (b.calculated_priority !== a.calculated_priority) {
        return b.calculated_priority - a.calculated_priority;
      }
      return new Date(a.last_message_at) - new Date(b.last_message_at);
    });

    // Try to allocate the top candidate
    const topCandidate = candidatesWithPriority[0];
    const allocated = await this.lockAndAssign(topCandidate.id, operatorId);

    if (!allocated) {
      throw new ConflictError('Conversation was claimed by another operator');
    }

    logger.info('Conversation allocated', {
      conversationId: allocated.id,
      operatorId,
      priority: allocated.priority_score
    });

    return allocated;
  }

  async buildCandidates(operatorId) {
    // Get operator's subscribed inboxes
    const inboxIds = await operatorRepository.getSubscriptions(operatorId);

    if (inboxIds.length === 0) {
      return [];
    }

    // Find queued conversations in subscribed inboxes
    const candidates = await conversationRepository.findQueuedByInboxes(inboxIds, 100);

    return candidates;
  }

  async calculatePriority(conversation) {
    try {
      // Try to get AI analysis
      const recentMessages = await orchestratorService.getRecentMessages(
        conversation.external_conversation_id,
        10
      );

      const analysis = await geminiService.analyzeConversation(conversation, recentMessages);

      // Calculate priority score based on AI analysis
      const urgencyWeight = {
        [UrgencyLevel.CRITICAL]: 100,
        [UrgencyLevel.HIGH]: 75,
        [UrgencyLevel.MEDIUM]: 50,
        [UrgencyLevel.LOW]: 25
      };

      const complexityWeight = {
        [ComplexityRating.COMPLEX]: 30,
        [ComplexityRating.MEDIUM]: 20,
        [ComplexityRating.SIMPLE]: 10
      };

      // Negative sentiment increases priority
      const sentimentScore = analysis.sentiment_score < 0
        ? Math.abs(analysis.sentiment_score) * 20
        : 0;

      const priorityScore = 
        urgencyWeight[analysis.urgency_level] +
        complexityWeight[analysis.complexity_rating] +
        sentimentScore;

      // Update conversation with priority score
      await conversationRepository.update(conversation.id, {
        priorityScore
      });

      return priorityScore;
    } catch (error) {
      // Fallback to time-based priority if AI fails
      logger.warn('Using fallback priority calculation', {
        conversationId: conversation.id,
        error: error.message
      });

      const fallbackPriority = geminiService.calculateFallbackPriority(conversation);

      await conversationRepository.update(conversation.id, {
        priorityScore: fallbackPriority
      });

      return fallbackPriority;
    }
  }

  async lockAndAssign(conversationId, operatorId) {
    const client = await db.getClient();

    try {
      await client.query('START TRANSACTION');

      // Lock and update the conversation
      const updated = await conversationRepository.lockAndUpdate(client, conversationId, {
        state: ConversationState.ALLOCATED,
        assignedOperatorId: operatorId
      });

      if (!updated) {
        await client.query('ROLLBACK');
        return null;
      }

      // Verify it was in QUEUED state before we locked it
      if (updated.state !== ConversationState.ALLOCATED) {
        await client.query('ROLLBACK');
        return null;
      }

      await client.query('COMMIT');
      return updated;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to lock and assign conversation', {
        conversationId,
        operatorId,
        error: error.message
      });
      throw error;
    } finally {
      client.release();
    }
  }

  async claimConversation(conversationId, operatorId, tenantId) {
    // Validate operator
    const operator = await operatorRepository.findById(operatorId);
    if (!operator) {
      throw new NotFoundError('Operator');
    }
    if (operator.tenant_id !== tenantId) {
      throw new ValidationError('Operator does not belong to this tenant');
    }

    // Get conversation
    const conversation = await conversationRepository.findById(conversationId);
    if (!conversation) {
      throw new NotFoundError('Conversation');
    }

    // Verify conversation is in QUEUED state
    if (conversation.state !== ConversationState.QUEUED) {
      throw new ConflictError('Conversation is not available for claiming');
    }

    // Verify operator is subscribed to the inbox
    const subscriptions = await operatorRepository.getSubscriptions(operatorId);
    if (!subscriptions.includes(conversation.inbox_id)) {
      throw new ValidationError('Operator is not subscribed to this inbox');
    }

    // Lock and assign
    const claimed = await this.lockAndAssign(conversationId, operatorId);

    if (!claimed) {
      throw new ConflictError('Conversation was claimed by another operator');
    }

    logger.info('Conversation claimed', {
      conversationId,
      operatorId
    });

    return claimed;
  }
}

module.exports = new AllocationService();
