const operatorRepository = require('../repositories/operatorRepository');
const inboxRepository = require('../repositories/inboxRepository');
const gracePeriodService = require('./gracePeriodService');
const { OperatorRole, OperatorStatus } = require('../models/enums');
const { NotFoundError, UnauthorizedError, ValidationError } = require('../utils/errors');
const logger = require('../utils/logger');

class OperatorService {
  async updateStatus(operatorId, status, tenantId) {
    // Validate status
    if (!Object.values(OperatorStatus).includes(status)) {
      throw new ValidationError(`Invalid status. Must be one of: ${Object.values(OperatorStatus).join(', ')}`);
    }

    // Verify operator exists and belongs to tenant
    const operator = await operatorRepository.findById(operatorId);
    if (!operator) {
      throw new NotFoundError('Operator');
    }
    if (operator.tenant_id !== tenantId) {
      throw new UnauthorizedError('Operator does not belong to this tenant');
    }

    // Get current status
    const currentStatus = await operatorRepository.getStatus(operatorId);

    // Update status
    const updatedStatus = await operatorRepository.upsertStatus(operatorId, status);

    // Handle grace period logic
    if (status === OperatorStatus.OFFLINE && currentStatus?.status === OperatorStatus.AVAILABLE) {
      // Operator going offline - create grace periods
      await gracePeriodService.createGracePeriods(operatorId);
      logger.info('Created grace periods for offline operator', { operatorId });
    } else if (status === OperatorStatus.AVAILABLE && currentStatus?.status === OperatorStatus.OFFLINE) {
      // Operator coming back online - remove grace periods
      await gracePeriodService.removeGracePeriods(operatorId);
      logger.info('Removed grace periods for returning operator', { operatorId });
    }

    return updatedStatus;
  }

  async getStatus(operatorId, tenantId) {
    // Verify operator exists and belongs to tenant
    const operator = await operatorRepository.findById(operatorId);
    if (!operator) {
      throw new NotFoundError('Operator');
    }
    if (operator.tenant_id !== tenantId) {
      throw new UnauthorizedError('Operator does not belong to this tenant');
    }

    const status = await operatorRepository.getStatus(operatorId);
    if (!status) {
      // Default to OFFLINE if no status record exists
      return {
        operator_id: operatorId,
        status: OperatorStatus.OFFLINE,
        last_status_change_at: operator.created_at
      };
    }

    return status;
  }

  async validatePermissions(operatorId, requiredRole) {
    const operator = await operatorRepository.findById(operatorId);
    if (!operator) {
      throw new NotFoundError('Operator');
    }

    const roleHierarchy = {
      [OperatorRole.OPERATOR]: 1,
      [OperatorRole.MANAGER]: 2,
      [OperatorRole.ADMIN]: 3
    };

    const operatorLevel = roleHierarchy[operator.role];
    const requiredLevel = roleHierarchy[requiredRole];

    if (operatorLevel < requiredLevel) {
      throw new UnauthorizedError(`Requires ${requiredRole} role or higher`);
    }

    return operator;
  }

  async getSubscribedInboxes(operatorId, tenantId) {
    // Verify operator exists and belongs to tenant
    const operator = await operatorRepository.findById(operatorId);
    if (!operator) {
      throw new NotFoundError('Operator');
    }
    if (operator.tenant_id !== tenantId) {
      throw new UnauthorizedError('Operator does not belong to this tenant');
    }

    return await inboxRepository.findByOperator(operatorId);
  }

  async isAvailable(operatorId) {
    const status = await operatorRepository.getStatus(operatorId);
    return status?.status === OperatorStatus.AVAILABLE;
  }
}

module.exports = new OperatorService();
