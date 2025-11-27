const labelRepository = require('../repositories/labelRepository');
const inboxRepository = require('../repositories/inboxRepository');
const conversationRepository = require('../repositories/conversationRepository');
const operatorRepository = require('../repositories/operatorRepository');
const { NotFoundError, UnauthorizedError, ValidationError } = require('../utils/errors');
const logger = require('../utils/logger');

class LabelService {
  async create(inboxId, name, color, operatorId, tenantId) {
    // Verify inbox exists and belongs to tenant
    const inbox = await inboxRepository.findById(inboxId);
    if (!inbox) {
      throw new NotFoundError('Inbox');
    }
    if (inbox.tenant_id !== tenantId) {
      throw new UnauthorizedError('Inbox does not belong to this tenant');
    }

    // Verify operator has access to this inbox
    const subscriptions = await operatorRepository.getSubscriptions(operatorId);
    if (!subscriptions.includes(inboxId)) {
      throw new UnauthorizedError('Operator does not have access to this inbox');
    }

    // Create label
    const label = await labelRepository.create(tenantId, inboxId, name, color, operatorId);

    logger.info('Label created', {
      labelId: label.id,
      inboxId,
      name,
      operatorId
    });

    return label;
  }

  async list(inboxId, operatorId, tenantId) {
    // Verify inbox exists and belongs to tenant
    const inbox = await inboxRepository.findById(inboxId);
    if (!inbox) {
      throw new NotFoundError('Inbox');
    }
    if (inbox.tenant_id !== tenantId) {
      throw new UnauthorizedError('Inbox does not belong to this tenant');
    }

    // Verify operator has access to this inbox
    const subscriptions = await operatorRepository.getSubscriptions(operatorId);
    if (!subscriptions.includes(inboxId)) {
      throw new UnauthorizedError('Operator does not have access to this inbox');
    }

    return await labelRepository.findByInbox(inboxId);
  }

  async update(labelId, name, color, operatorId, tenantId) {
    // Get label
    const label = await labelRepository.findById(labelId);
    if (!label) {
      throw new NotFoundError('Label');
    }

    if (label.tenant_id !== tenantId) {
      throw new UnauthorizedError('Label does not belong to this tenant');
    }

    // Verify operator has access to the inbox
    const subscriptions = await operatorRepository.getSubscriptions(operatorId);
    if (!subscriptions.includes(label.inbox_id)) {
      throw new UnauthorizedError('Operator does not have access to this inbox');
    }

    // Update label
    const updated = await labelRepository.update(labelId, name, color);

    logger.info('Label updated', {
      labelId,
      name,
      operatorId
    });

    return updated;
  }

  async delete(labelId, operatorId, tenantId) {
    // Get label
    const label = await labelRepository.findById(labelId);
    if (!label) {
      throw new NotFoundError('Label');
    }

    if (label.tenant_id !== tenantId) {
      throw new UnauthorizedError('Label does not belong to this tenant');
    }

    // Verify operator has access to the inbox
    const subscriptions = await operatorRepository.getSubscriptions(operatorId);
    if (!subscriptions.includes(label.inbox_id)) {
      throw new UnauthorizedError('Operator does not have access to this inbox');
    }

    // Delete label (cascade will remove conversation_labels)
    await labelRepository.delete(labelId);

    logger.info('Label deleted', {
      labelId,
      operatorId
    });
  }

  async attachLabel(conversationId, labelId, operatorId, tenantId) {
    // Get conversation
    const conversation = await conversationRepository.findById(conversationId);
    if (!conversation) {
      throw new NotFoundError('Conversation');
    }

    if (conversation.tenant_id !== tenantId) {
      throw new UnauthorizedError('Conversation does not belong to this tenant');
    }

    // Get label
    const label = await labelRepository.findById(labelId);
    if (!label) {
      throw new NotFoundError('Label');
    }

    // Verify label belongs to the same inbox
    if (label.inbox_id !== conversation.inbox_id) {
      throw new ValidationError('Label does not belong to the conversation inbox');
    }

    // Verify operator has access to the inbox
    const subscriptions = await operatorRepository.getSubscriptions(operatorId);
    if (!subscriptions.includes(conversation.inbox_id)) {
      throw new UnauthorizedError('Operator does not have access to this inbox');
    }

    // Attach label
    await labelRepository.attachToConversation(conversationId, labelId);

    logger.info('Label attached to conversation', {
      conversationId,
      labelId,
      operatorId
    });
  }

  async detachLabel(conversationId, labelId, operatorId, tenantId) {
    // Get conversation
    const conversation = await conversationRepository.findById(conversationId);
    if (!conversation) {
      throw new NotFoundError('Conversation');
    }

    if (conversation.tenant_id !== tenantId) {
      throw new UnauthorizedError('Conversation does not belong to this tenant');
    }

    // Verify operator has access to the inbox
    const subscriptions = await operatorRepository.getSubscriptions(operatorId);
    if (!subscriptions.includes(conversation.inbox_id)) {
      throw new UnauthorizedError('Operator does not have access to this inbox');
    }

    // Detach label
    await labelRepository.detachFromConversation(conversationId, labelId);

    logger.info('Label detached from conversation', {
      conversationId,
      labelId,
      operatorId
    });
  }
}

module.exports = new LabelService();
