-- Create inboxes table
CREATE TABLE IF NOT EXISTS inboxes (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  tenant_id CHAR(36) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_tenant_phone (tenant_id, phone_number),
  INDEX idx_inboxes_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create operators table
CREATE TABLE IF NOT EXISTS operators (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  tenant_id CHAR(36) NOT NULL,
  role ENUM('OPERATOR', 'MANAGER', 'ADMIN') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_operators_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create operator_inbox_subscriptions table
CREATE TABLE IF NOT EXISTS operator_inbox_subscriptions (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  operator_id CHAR(36) NOT NULL,
  inbox_id CHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_operator_inbox (operator_id, inbox_id),
  INDEX idx_subscriptions_operator (operator_id),
  INDEX idx_subscriptions_inbox (inbox_id),
  FOREIGN KEY (operator_id) REFERENCES operators(id) ON DELETE CASCADE,
  FOREIGN KEY (inbox_id) REFERENCES inboxes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  tenant_id CHAR(36) NOT NULL,
  inbox_id CHAR(36) NOT NULL,
  external_conversation_id VARCHAR(255) NOT NULL,
  customer_phone_number VARCHAR(20) NOT NULL,
  state ENUM('QUEUED', 'ALLOCATED', 'RESOLVED') NOT NULL,
  assigned_operator_id CHAR(36) NULL,
  last_message_at TIMESTAMP NOT NULL,
  message_count INT DEFAULT 0,
  priority_score DECIMAL(10, 4) DEFAULT 0,
  urgency_level VARCHAR(20) NULL,
  sentiment_score DECIMAL(5, 4) NULL,
  complexity_rating VARCHAR(20) NULL,
  analyzed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP NULL,
  UNIQUE KEY unique_tenant_external (tenant_id, external_conversation_id),
  INDEX idx_conversations_tenant (tenant_id),
  INDEX idx_conversations_inbox (inbox_id),
  INDEX idx_conversations_state (state),
  INDEX idx_conversations_assigned (assigned_operator_id),
  INDEX idx_conversations_priority (priority_score DESC, last_message_at ASC),
  INDEX idx_conversations_phone (customer_phone_number),
  FOREIGN KEY (inbox_id) REFERENCES inboxes(id),
  FOREIGN KEY (assigned_operator_id) REFERENCES operators(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create labels table
CREATE TABLE IF NOT EXISTS labels (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  tenant_id CHAR(36) NOT NULL,
  inbox_id CHAR(36) NOT NULL,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7) NULL,
  created_by CHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_inbox_name (inbox_id, name),
  INDEX idx_labels_inbox (inbox_id),
  FOREIGN KEY (inbox_id) REFERENCES inboxes(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES operators(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create conversation_labels table
CREATE TABLE IF NOT EXISTS conversation_labels (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  conversation_id CHAR(36) NOT NULL,
  label_id CHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_conversation_label (conversation_id, label_id),
  INDEX idx_conversation_labels_conversation (conversation_id),
  INDEX idx_conversation_labels_label (label_id),
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (label_id) REFERENCES labels(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create operator_status table
CREATE TABLE IF NOT EXISTS operator_status (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  operator_id CHAR(36) NOT NULL UNIQUE,
  status ENUM('AVAILABLE', 'OFFLINE') NOT NULL,
  last_status_change_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_operator_status_operator (operator_id),
  FOREIGN KEY (operator_id) REFERENCES operators(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create grace_period_assignments table
CREATE TABLE IF NOT EXISTS grace_period_assignments (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  conversation_id CHAR(36) NOT NULL UNIQUE,
  operator_id CHAR(36) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  reason ENUM('OFFLINE', 'MANUAL') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_grace_period_expires (expires_at),
  INDEX idx_grace_period_operator (operator_id),
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (operator_id) REFERENCES operators(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
