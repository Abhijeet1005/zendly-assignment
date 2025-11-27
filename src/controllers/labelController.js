const labelService = require('../services/labelService');

class LabelController {
  async create(req, res, next) {
    try {
      const { inboxId } = req.params;
      const { name, color } = req.body;
      const { id: operatorId, tenantId } = req.operator;

      const label = await labelService.create(inboxId, name, color, operatorId, tenantId);

      res.status(201).json({
        success: true,
        data: label,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  async list(req, res, next) {
    try {
      const { inboxId } = req.params;
      const { id: operatorId, tenantId } = req.operator;

      const labels = await labelService.list(inboxId, operatorId, tenantId);

      res.json({
        success: true,
        data: labels,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { labelId } = req.params;
      const { name, color } = req.body;
      const { id: operatorId, tenantId } = req.operator;

      const label = await labelService.update(labelId, name, color, operatorId, tenantId);

      res.json({
        success: true,
        data: label,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const { labelId } = req.params;
      const { id: operatorId, tenantId } = req.operator;

      await labelService.delete(labelId, operatorId, tenantId);

      res.json({
        success: true,
        message: 'Label deleted successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  async attach(req, res, next) {
    try {
      const { conversationId, labelId } = req.params;
      const { id: operatorId, tenantId } = req.operator;

      await labelService.attachLabel(conversationId, labelId, operatorId, tenantId);

      res.json({
        success: true,
        message: 'Label attached successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  async detach(req, res, next) {
    try {
      const { conversationId, labelId } = req.params;
      const { id: operatorId, tenantId } = req.operator;

      await labelService.detachLabel(conversationId, labelId, operatorId, tenantId);

      res.json({
        success: true,
        message: 'Label detached successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new LabelController();
