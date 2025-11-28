const Joi = require('joi');
const { ValidationError } = require('../utils/errors');

/**
 * Middleware factory to validate request data
 * @param {Object} schema - Joi validation schema with optional body, query, params
 */
function validate(schema) {
  return (req, res, next) => {
    const validationOptions = {
      abortEarly: false,
      allowUnknown: true,
      stripUnknown: true
    };

    const toValidate = {};
    if (schema.body) toValidate.body = req.body;
    if (schema.query) toValidate.query = req.query;
    if (schema.params) toValidate.params = req.params;

    // Schema is already a Joi object, don't wrap it again
    const { error, value } = schema.validate(toValidate, validationOptions);

    if (error) {
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return next(new ValidationError('Validation failed', details));
    }

    // Replace request data with validated data
    if (value.body) req.body = value.body;
    if (value.query) req.query = value.query;
    if (value.params) req.params = value.params;

    next();
  };
}

// Common validation schemas
const schemas = {
  uuid: Joi.string().uuid(),
  
  operatorStatus: Joi.object({
    body: Joi.object({
      status: Joi.string().valid('AVAILABLE', 'OFFLINE').required()
    })
  }),

  conversationFilters: Joi.object({
    query: Joi.object({
      state: Joi.string().valid('QUEUED', 'ALLOCATED', 'RESOLVED'),
      assignedOperatorId: Joi.string().uuid(),
      labelId: Joi.string().uuid(),
      sort: Joi.string().valid('newest', 'oldest', 'priority'),
      limit: Joi.number().integer().min(1).max(100).default(50),
      offset: Joi.number().integer().min(0).default(0)
    })
  }),

  phoneSearch: Joi.object({
    query: Joi.object({
      phoneNumber: Joi.string().required()
    })
  }),

  reassign: Joi.object({
    body: Joi.object({
      targetOperatorId: Joi.string().uuid().required()
    })
  }),

  moveInbox: Joi.object({
    body: Joi.object({
      targetInboxId: Joi.string().uuid().required()
    })
  }),

  createLabel: Joi.object({
    body: Joi.object({
      name: Joi.string().max(100).required(),
      color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional()
    })
  }),

  updateLabel: Joi.object({
    body: Joi.object({
      name: Joi.string().max(100).required(),
      color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional()
    })
  }),

  pagination: Joi.object({
    query: Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(50)
    })
  })
};

module.exports = {
  validate,
  schemas
};
