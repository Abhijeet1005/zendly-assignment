const conversationRepository = require('../repositories/conversationRepository');
const operatorRepository = require('../repositories/operatorRepository');
const inboxRepository = require('../repositories/inboxRepository');
const gracePeriodRepository = require('../repositories/gracePeriodRepository');
const orchestratorService = require('./orchestratorService');
const { ConversationState, OperatorRole } = require('../models/enums');
const { NotFoundError, UnauthorizedError, ValidationError } = require('../utils/errors');
const logger = require('../utils/logger');

class ConversationService {
  async resolve(conversationId, operatorId, tenantId) {
    // Get conversation
    const conversation = await conversationRepository.findById(conversationId);
    if (!conversation) {
      throw new NotFoundError('Conversation');
    }

    if (conversation.tenant_id !== tenantId) {
      throw new UnauthorizedError('Conversation does not belong to this tenant');
    }

    // Check if already resolved (idempotent)
    if (conversation.state === ConversationState.RESOLVED) {
      logger.info('Conversation already resolved', { conversationId });
      return conversation;
    }

    // Validate operator permissions
    const operator = await operatorRepository.findById(operatorId);
    if (!operator) {
      throw new NotFoundError('Operator');
    }

    // Check if operator is the owner OR has MANAGER/ADMIN role
    const isOwner = conversation.assigned_operator_id === operatorId;
    const isManagerOrAdmin = [OperatorRole.MANAGER, OperatorRole.ADMIN].includes(operator.role);

    if (!isOwner && !isManagerOrAdmin) {
      throw new UnauthorizedError('Only the assigned operator or managers can resolve this conversation');
    }

    // Update conversation to RESOLVED
    const resolved = await conversationRepository.updateState(conversationId, ConversationState.RESOLVED, {
      resolvedAt: new Date()
    });

    // Notify orchestrator
    await orchestratorService.notifyResolution(conversation.external_conversation_id);

    logger.info('Conversation resolved', {
      conversationId,
      operatorId,
      wasOwner: isOwner
    });

    return resolved;
  }

  async deallocate(conversationId, operatorId, tenantId) {
    // Validate operator has MANAGER or ADMIN role
    const operator = await operatorRepository.findById(operatorId);
    if (!operator) {
      throw new NotFoundError('Operator');
    }

    if (![OperatorRole.MANAGER, OperatorRole.ADMIN].includes(operator.role)) {
      throw new UnauthorizedError('Only managers and admins can deallocate conversations');
    }

    // Get conversation
    const conversation = await conversationRepository.findById(conversationId);
    if (!conversation) {
      throw new NotFoundError('Conversation');
    }

    if (conversation.tenant_id !== tenantId) {
      throw new UnauthorizedError('Conversation does not belong to this tenant');
    }

    // Update to QUEUED state
    const deallocated = await conversationRepository.updateState(conversationId, ConversationState.QUEUED, {
      assignedOperatorId: null
    });

    // Remove any grace period assignments
    await gracePeriodRepository.deleteByConversation(conversationId);

    logger.info('Conversation deallocated', {
      conversationId,
      operatorId,
      previousOperator: conversation.assigned_operator_id
    });

    return deallocated;
  }

  async reassign(conversationId, targetOperatorId, requestingOperatorId, tenantId) {
    // Validate requesting operator has MANAGER or ADMIN role
    const requestingOperator = await operatorRepository.findById(requestingOperatorId);
    if (!requestingOperator) {
      throw new NotFoundError('Requesting operator');
    }

    if (![OperatorRole.MANAGER, OperatorRole.ADMIN].includes(requestingOperator.role)) {
      throw new UnauthorizedError('Only managers and admins can reassign conversations');
    }

    // Get conversation
    const conversation = await conversationRepository.findById(conversationId);
    if (!conversation) {
      throw new NotFoundError('Conversation');
    }

    if (conversation.tenant_id !== tenantId) {
      throw new UnauthorizedError('Conversation does not belong to this tenant');
    }

    // Validate target operator
    const targetOperator = await operatorRepository.findById(targetOperatorId);
    if (!targetOperator) {
      throw new NotFoundError('Target operator');
    }

    if (targetOperator.tenant_id !== tenantId) {
      throw new ValidationError('Target operator does not belong to this tenant');
    }

    // Verify target operator is subscribed to the inbox
    const subscriptions = await operatorRepository.getSubscriptions(targetOperatorId);
    if (!subscriptions.includes(conversation.inbox_id)) {
      throw new ValidationError('Target operator is not subscribed to this inbox');
    }

    // Update assignment
    const reassigned = await conversationRepository.update(conversationId, {
      assignedOperatorId: targetOperatorId,
      state: ConversationState.ALLOCATED
    });

    // Remove any grace period assignments
    await gracePeriodRepository.deleteByConversation(conversationId);

    logger.info('Conversation reassigned', {
      conversationId,
      fromOperator: conversation.assigned_operator_id,
      toOperator: targetOperatorId,
      requestedBy: requestingOperatorId
    });

    return reassigned;
  }

  async moveInbox(conversationId, targetInboxId, operatorId, tenantId) {
    // Validate operator has MANAGER or ADMIN role
    const operator = await operatorRepository.findById(operatorId);
    if (!operator) {
      throw new NotFoundError('Operator');
    }

    if (![OperatorRole.MANAGER, OperatorRole.ADMIN].includes(operator.role)) {
      throw new UnauthorizedError('Only managers and admins can move conversations');
    }

    // Get conversation
    const conversation = await conversationRepository.findById(conversationId);
    if (!conversation) {
      throw new NotFoundError('Conversation');
    }

    if (conversation.tenant_id !== tenantId) {
      throw new UnauthorizedError('Conversation does not belong to this tenant');
    }

    // Get target inbox
    const targetInbox = await inboxRepository.findById(targetInboxId);
    if (!targetInbox) {
      throw new NotFoundError('Target inbox');
    }

    // Verify both inboxes belong to same tenant
    if (targetInbox.tenant_id !== tenantId) {
      throw new ValidationError('Target inbox does not belong to this tenant');
    }

    // Move conversation
    const moved = await conversationRepository.update(conversationId, {
      inboxId: targetInboxId,
      state: ConversationState.QUEUED,
      assignedOperatorId: null
    });

    logger.info('Conversation moved to different inbox', {
      conversationId,
      fromInbox: conversation.inbox_id,
      toInbox: targetInboxId,
      operatorId
    });

    return moved;
  }

  async list(inboxId, filters = {}, pagination = {}) {
    const { limit = 50, offset = 0 } = pagination;
    
    const conversations = await conversationRepository.findByInbox(
      inboxId,
      filters,
      Math.min(limit, 100), // Cap at 100
      offset
    );

    return conversations;
  }

  async search(phoneNumber, operatorId, tenantId) {
    // Get operator's subscribed inboxes
    const inboxIds = await operatorRepository.getSubscriptions(operatorId);

    if (inboxIds.length === 0) {
      return [];
    }

    const conversations = await conversationRepository.search(phoneNumber, inboxIds, 100);

    return conversations;
  }

  async getHistory(conversationId, operatorId, tenantId, pagination = {}) {
    // Get conversation
    const conversation = await conversationRepository.findById(conversationId);
    if (!conversation) {
      throw new NotFoundError('Conversation');
    }

    if (conversation.tenant_id !== tenantId) {
      throw new UnauthorizedError('Conversation does not belong to this tenant');
    }

    // Verify operator has access to this inbox
    const subscriptions = await operatorRepository.getSubscriptions(operatorId);
    if (!subscriptions.includes(conversation.inbox_id)) {
      throw new UnauthorizedError('Operator does not have access to this inbox');
    }

    // Proxy to orchestrator
    const history = await orchestratorService.getConversationHistory(
      conversation.external_conversation_id,
      pagination
    );

    return history;
  }

  async getContact(conversationId, operatorId, tenantId) {
    // Get conversation
    const conversation = await conversationRepository.findById(conversationId);
    if (!conversation) {
      throw new NotFoundError('Conversation');
    }

    if (conversation.tenant_id !== tenantId) {
      throw new UnauthorizedError('Conversation does not belong to this tenant');
    }

    // Verify operator has access to this inbox
    const subscriptions = await operatorRepository.getSubscriptions(operatorId);
    if (!subscriptions.includes(conversation.inbox_id)) {
      throw new UnauthorizedError('Operator does not have access to this inbox');
    }

    // Get contact info from orchestrator
    const contact = await orchestratorService.getContactInfo(conversation.customer_phone_number);

    return contact;
  }
}

module.exports = new ConversationService();
