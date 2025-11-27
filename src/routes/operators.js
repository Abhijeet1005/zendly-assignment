const express = require('express');
const router = express.Router();
const operatorController = require('../controllers/operatorController');
const { authenticate } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

// All routes require authentication
router.use(authenticate);

// Update operator status
router.put(
  '/:operatorId/status',
  validate(schemas.operatorStatus),
  operatorController.updateStatus
);

// Get operator status
router.get(
  '/:operatorId/status',
  operatorController.getStatus
);

// Get operator's subscribed inboxes
router.get(
  '/:operatorId/inboxes',
  operatorController.getInboxes
);

module.exports = router;
