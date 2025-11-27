const OperatorRole = {
  OPERATOR: 'OPERATOR',
  MANAGER: 'MANAGER',
  ADMIN: 'ADMIN'
};

const OperatorStatus = {
  AVAILABLE: 'AVAILABLE',
  OFFLINE: 'OFFLINE'
};

const ConversationState = {
  QUEUED: 'QUEUED',
  ALLOCATED: 'ALLOCATED',
  RESOLVED: 'RESOLVED'
};

const GracePeriodReason = {
  OFFLINE: 'OFFLINE',
  MANUAL: 'MANUAL'
};

const UrgencyLevel = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

const ComplexityRating = {
  SIMPLE: 'SIMPLE',
  MEDIUM: 'MEDIUM',
  COMPLEX: 'COMPLEX'
};

module.exports = {
  OperatorRole,
  OperatorStatus,
  ConversationState,
  GracePeriodReason,
  UrgencyLevel,
  ComplexityRating
};
