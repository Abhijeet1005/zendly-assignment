const db = require('../config/database');
const conversationRepository = require('../repositories/conversationRepository');
const gracePeriodRepository = require('../repositories/gracePeriodRepository');
const { config } = require('../config/env');
const { ConversationState, GracePeriodReason } = require('../models/enums');
const logger = require('../utils/logger');

class GracePeriodService {
  async createGracePeriods(operatorId) {
    // Find all conversations currently allocated to this operator
    const conversations = await conversationRepository.findAllocatedByOperator(operatorId);

    if (conversations.length === 0) {
      logger.debug('No allocated conversations for operator', { operatorId });
      return [];
    }

    // Calculate expiration time
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + config.gracePeriod.minutes);

    // Create grace period for each conversation
    const gracePeriods = [];
    for (const conversation of conversations) {
      try {
        const gracePeriod = await gracePeriodRepository.create(
          conversation.id,
          operatorId,
          expiresAt,
          GracePeriodReason.OFFLINE
        );
        
        if (gracePeriod) {
          gracePeriods.push(gracePeriod);
        }
      } catch (error) {
        logger.error('Failed to create grace period', {
          conversationId: conversation.id,
          operatorId,
          error: error.message
        });
      }
    }

    logger.info('Created grace periods', {
      operatorId,
      count: gracePeriods.length,
      expiresAt
    });

    return gracePeriods;
  }

  async removeGracePeriods(operatorId) {
    await gracePeriodRepository.deleteByOperator(operatorId);

    logger.info('Removed grace periods for operator', { operatorId });
  }

  async processExpiredGracePeriods() {
    const expired = await gracePeriodRepository.findExpired();

    if (expired.length === 0) {
      return 0;
    }

    logger.info('Processing expired grace periods', { count: expired.length });

    let processed = 0;
    for (const gracePeriod of expired) {
      const client = await db.getClient();
      
      try {
        await client.query('START TRANSACTION');

        // Lock and update conversation
        const updated = await conversationRepository.lockAndUpdate(client, gracePeriod.conversation_id, {
          state: ConversationState.QUEUED,
          assignedOperatorId: null
        });

        if (updated) {
          // Delete grace period
          await client.execute('DELETE FROM grace_period_assignments WHERE id = ?', [gracePeriod.id]);
          
          await client.query('COMMIT');
          processed++;

          logger.info('Processed expired grace period', {
            conversationId: gracePeriod.conversation_id,
            operatorId: gracePeriod.operator_id
          });
        } else {
          await client.query('ROLLBACK');
          logger.warn('Could not lock conversation for grace period expiration', {
            conversationId: gracePeriod.conversation_id
          });
        }
      } catch (error) {
        await client.query('ROLLBACK');
        logger.error('Failed to process expired grace period', {
          gracePeriodId: gracePeriod.id,
          error: error.message
        });
      } finally {
        client.release();
      }
    }

    logger.info('Completed processing expired grace periods', {
      total: expired.length,
      processed
    });

    return processed;
  }
}

module.exports = new GracePeriodService();
