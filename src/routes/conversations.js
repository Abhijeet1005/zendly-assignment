const express = require('express');
const router = express.Router();
const conversationController = require('../controllers/conversationController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

// All routes require authentication
router.use(authenticate);

// Auto-allocate next conversation
router.post(
  '/allocate',
  conversationController.allocate
);

// Manually claim a conversation
router.post(
  '/:conversationId/claim',
  conversationController.claim
);

// Resolve a conversation
router.post(
  '/:conversationId/resolve',
  conversationController.resolve
);

// Deallocate a conversation (managers only)
router.post(
  '/:conversationId/deallocate',
  authorize(['MANAGER', 'ADMIN']),
  conversationController.deallocate
);

// Reassign a conversation (managers only)
router.post(
  '/:conversationId/reassign',
  authorize(['MANAGER', 'ADMIN']),
  validate(schemas.reassign),
  conversationController.reassign
);

// Move conversation to different inbox (managers only)
router.post(
  '/:conversationId/move',
  authorize(['MANAGER', 'ADMIN']),
  validate(schemas.moveInbox),
  conversationController.moveInbox
);

// Search conversations by phone number
router.get(
  '/search',
  validate(schemas.phoneSearch),
  conversationController.search
);

// Get conversation history
router.get(
  '/:conversationId/history',
  validate(schemas.pagination),
  conversationController.getHistory
);

// Get contact information
router.get(
  '/:conversationId/contact',
  conversationController.getContact
);

module.exports = router;
