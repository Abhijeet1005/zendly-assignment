const allocationService = require('../services/allocationService');
const conversationService = require('../services/conversationService');
const logger = require('../utils/logger');

class ConversationController {
  async allocate(req, res, next) {
    try {
      const { id: operatorId, tenantId } = req.operator;

      const conversation = await allocationService.allocateNext(operatorId, tenantId);

      if (!conversation) {
        return res.json({
          success: true,
          data: null,
          message: 'No conversations available for allocation',
          timestamp: new Date().toISOString()
        });
      }

      res.json({
        success: true,
        data: conversation,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  async claim(req, res, next) {
    try {
      const { conversationId } = req.params;
      const { id: operatorId, tenantId } = req.operator;

      const conversation = await allocationService.claimConversation(conversationId, operatorId, tenantId);

      res.json({
        success: true,
        data: conversation,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  async resolve(req, res, next) {
    try {
      const { conversationId } = req.params;
      const { id: operatorId, tenantId } = req.operator;

      const conversation = await conversationService.resolve(conversationId, operatorId, tenantId);

      res.json({
        success: true,
        data: conversation,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  async deallocate(req, res, next) {
    try {
      const { conversationId } = req.params;
      const { id: operatorId, tenantId } = req.operator;

      const conversation = await conversationService.deallocate(conversationId, operatorId, tenantId);

      res.json({
        success: true,
        data: conversation,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  async reassign(req, res, next) {
    try {
      const { conversationId } = req.params;
      const { targetOperatorId } = req.body;
      const { id: operatorId, tenantId } = req.operator;

      const conversation = await conversationService.reassign(
        conversationId,
        targetOperatorId,
        operatorId,
        tenantId
      );

      res.json({
        success: true,
        data: conversation,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  async moveInbox(req, res, next) {
    try {
      const { conversationId } = req.params;
      const { targetInboxId } = req.body;
      const { id: operatorId, tenantId } = req.operator;

      const conversation = await conversationService.moveInbox(
        conversationId,
        targetInboxId,
        operatorId,
        tenantId
      );

      res.json({
        success: true,
        data: conversation,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  async list(req, res, next) {
    try {
      const { inboxId } = req.params;
      const filters = {
        state: req.query.state,
        assignedOperatorId: req.query.assignedOperatorId,
        labelId: req.query.labelId,
        sort: req.query.sort
      };
      const pagination = {
        limit: parseInt(req.query.limit) || 50,
        offset: parseInt(req.query.offset) || 0
      };

      const conversations = await conversationService.list(inboxId, filters, pagination);

      res.json({
        success: true,
        data: conversations,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  async search(req, res, next) {
    try {
      const { phoneNumber } = req.query;
      const { id: operatorId, tenantId } = req.operator;

      const conversations = await conversationService.search(phoneNumber, operatorId, tenantId);

      res.json({
        success: true,
        data: conversations,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  async getHistory(req, res, next) {
    try {
      const { conversationId } = req.params;
      const { id: operatorId, tenantId } = req.operator;
      const pagination = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 50
      };

      const history = await conversationService.getHistory(
        conversationId,
        operatorId,
        tenantId,
        pagination
      );

      res.json({
        success: true,
        data: history,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  async getContact(req, res, next) {
    try {
      const { conversationId } = req.params;
      const { id: operatorId, tenantId } = req.operator;

      const contact = await conversationService.getContact(conversationId, operatorId, tenantId);

      res.json({
        success: true,
        data: contact,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ConversationController();
