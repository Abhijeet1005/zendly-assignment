const cron = require('node-cron');
const gracePeriodService = require('../services/gracePeriodService');
const logger = require('../utils/logger');

let jobInstance = null;

function startGracePeriodJob() {
  if (jobInstance) {
    logger.warn('Grace period job already running');
    return jobInstance;
  }

  // Run every minute
  jobInstance = cron.schedule('* * * * *', async () => {
    try {
      logger.debug('Running grace period expiration job');
      const processed = await gracePeriodService.processExpiredGracePeriods();
      
      if (processed > 0) {
        logger.info('Grace period job completed', { processed });
      }
    } catch (error) {
      logger.error('Grace period job failed', { error: error.message });
    }
  });

  logger.info('Grace period job started (runs every minute)');
  return jobInstance;
}

function stopGracePeriodJob() {
  if (jobInstance) {
    jobInstance.stop();
    jobInstance = null;
    logger.info('Grace period job stopped');
  }
}

module.exports = {
  startGracePeriodJob,
  stopGracePeriodJob
};
