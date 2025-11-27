const { UnauthorizedError } = require('../utils/errors');
const logger = require('../utils/logger');

/**
 * Middleware to extract operator context from request headers
 * In a real application, this would validate JWT tokens
 * For this MVP, we expect headers: x-operator-id and x-tenant-id
 */
function authenticate(req, res, next) {
  try {
    const operatorId = req.headers['x-operator-id'];
    const tenantId = req.headers['x-tenant-id'];

    if (!operatorId || !tenantId) {
      throw new UnauthorizedError('Missing authentication headers');
    }

    // Attach to request object
    req.operator = {
      id: operatorId,
      tenantId: tenantId
    };

    logger.debug('Request authenticated', { operatorId, tenantId, path: req.path });
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware to check if operator has required role
 * Usage: authorize(['MANAGER', 'ADMIN'])
 */
function authorize(allowedRoles) {
  return async (req, res, next) => {
    try {
      // In a real app, we would fetch operator role from database or JWT
      // For MVP, we expect it in header
      const operatorRole = req.headers['x-operator-role'];

      if (!operatorRole) {
        throw new UnauthorizedError('Missing role information');
      }

      if (!allowedRoles.includes(operatorRole)) {
        throw new UnauthorizedError(`Requires one of: ${allowedRoles.join(', ')}`);
      }

      req.operator.role = operatorRole;
      next();
    } catch (error) {
      next(error);
    }
  };
}

module.exports = {
  authenticate,
  authorize
};
