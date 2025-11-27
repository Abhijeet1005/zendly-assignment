const operatorService = require('../services/operatorService');

class InboxController {
  async listInboxes(req, res, next) {
    try {
      const { operatorId } = req.params;
      const { tenantId } = req.operator;

      const inboxes = await operatorService.getSubscribedInboxes(operatorId, tenantId);

      res.json({
        success: true,
        data: inboxes,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new InboxController();
