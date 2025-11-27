const express = require('express');
const router = express.Router();
const conversationController = require('../controllers/conversationController');
const { authenticate } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

// All routes require authentication
router.use(authenticate);

// List conversations in inbox
router.get(
  '/:inboxId/conversations',
  validate(schemas.conversationFilters),
  conversationController.list
);

module.exports = router;
