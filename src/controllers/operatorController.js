const operatorService = require('../services/operatorService');
const logger = require('../utils/logger');

class OperatorController {
  async updateStatus(req, res, next) {
    try {
      const { operatorId } = req.params;
      const { status } = req.body;
      const { tenantId } = req.operator;

      const updatedStatus = await operatorService.updateStatus(operatorId, status, tenantId);

      res.json({
        success: true,
        data: updatedStatus,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  async getStatus(req, res, next) {
    try {
      const { operatorId } = req.params;
      const { tenantId } = req.operator;

      const status = await operatorService.getStatus(operatorId, tenantId);

      res.json({
        success: true,
        data: status,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  async getInboxes(req, res, next) {
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

module.exports = new OperatorController();
