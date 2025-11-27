const express = require('express');
const router = express.Router();
const labelController = require('../controllers/labelController');
const { authenticate } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

// All routes require authentication
router.use(authenticate);

// Create label in inbox
router.post(
  '/inboxes/:inboxId/labels',
  validate(schemas.createLabel),
  labelController.create
);

// List labels in inbox
router.get(
  '/inboxes/:inboxId/labels',
  labelController.list
);

// Update label
router.put(
  '/labels/:labelId',
  validate(schemas.updateLabel),
  labelController.update
);

// Delete label
router.delete(
  '/labels/:labelId',
  labelController.delete
);

// Attach label to conversation
router.post(
  '/conversations/:conversationId/labels/:labelId',
  labelController.attach
);

// Detach label from conversation
router.delete(
  '/conversations/:conversationId/labels/:labelId',
  labelController.detach
);

module.exports = router;
