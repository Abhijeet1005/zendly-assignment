const mysql = require('mysql2/promise');
require('dotenv').config();

async function seed() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 3306,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  });

  try {
    console.log('Starting database seeding...');

    await connection.query('START TRANSACTION');

    // Create test tenant
    const tenantId = '550e8400-e29b-41d4-a716-446655440000';

    // Create operators
    console.log('Creating operators...');
    const [operatorResult] = await connection.query(`
      INSERT IGNORE INTO operators (id, tenant_id, role) VALUES
      ('550e8400-e29b-41d4-a716-446655440001', ?, 'OPERATOR'),
      ('550e8400-e29b-41d4-a716-446655440002', ?, 'OPERATOR'),
      ('550e8400-e29b-41d4-a716-446655440003', ?, 'MANAGER'),
      ('550e8400-e29b-41d4-a716-446655440004', ?, 'ADMIN')
    `, [tenantId, tenantId, tenantId, tenantId]);
    console.log(`✓ Created ${operatorResult.affectedRows} operators`);

    // Set operator statuses
    console.log('Setting operator statuses...');
    await connection.query(`
      INSERT INTO operator_status (operator_id, status) VALUES
      ('550e8400-e29b-41d4-a716-446655440001', 'AVAILABLE'),
      ('550e8400-e29b-41d4-a716-446655440002', 'AVAILABLE'),
      ('550e8400-e29b-41d4-a716-446655440003', 'AVAILABLE'),
      ('550e8400-e29b-41d4-a716-446655440004', 'OFFLINE')
      ON DUPLICATE KEY UPDATE status = VALUES(status)
    `);
    console.log('✓ Set operator statuses');

    // Create inboxes
    console.log('Creating inboxes...');
    const [inboxResult] = await connection.query(`
      INSERT IGNORE INTO inboxes (id, tenant_id, phone_number, display_name) VALUES
      ('550e8400-e29b-41d4-a716-446655440010', ?, '+1234567890', 'Support Inbox'),
      ('550e8400-e29b-41d4-a716-446655440011', ?, '+1234567891', 'Sales Inbox'),
      ('550e8400-e29b-41d4-a716-446655440012', ?, '+1234567892', 'Billing Inbox')
    `, [tenantId, tenantId, tenantId]);
    console.log(`✓ Created ${inboxResult.affectedRows} inboxes`);

    // Create operator subscriptions
    console.log('Creating operator subscriptions...');
    await connection.query(`
      INSERT IGNORE INTO operator_inbox_subscriptions (operator_id, inbox_id) VALUES
      ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440010'),
      ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440011'),
      ('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440010'),
      ('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440012'),
      ('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440010'),
      ('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440011'),
      ('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440012')
    `);
    console.log('✓ Created operator subscriptions');

    // Create conversations
    console.log('Creating conversations...');
    const [conversationResult] = await connection.query(`
      INSERT IGNORE INTO conversations (
        id, tenant_id, inbox_id, external_conversation_id, 
        customer_phone_number, state, last_message_at, message_count, priority_score
      ) VALUES
      ('550e8400-e29b-41d4-a716-446655440020', ?, '550e8400-e29b-41d4-a716-446655440010', 
       'ext-conv-001', '+1555000001', 'QUEUED', DATE_SUB(NOW(), INTERVAL 5 MINUTE), 3, 75.5),
      ('550e8400-e29b-41d4-a716-446655440021', ?, '550e8400-e29b-41d4-a716-446655440010', 
       'ext-conv-002', '+1555000002', 'QUEUED', DATE_SUB(NOW(), INTERVAL 10 MINUTE), 5, 85.0),
      ('550e8400-e29b-41d4-a716-446655440022', ?, '550e8400-e29b-41d4-a716-446655440011', 
       'ext-conv-003', '+1555000003', 'QUEUED', DATE_SUB(NOW(), INTERVAL 2 MINUTE), 1, 50.0),
      ('550e8400-e29b-41d4-a716-446655440023', ?, '550e8400-e29b-41d4-a716-446655440010', 
       'ext-conv-004', '+1555000004', 'ALLOCATED', DATE_SUB(NOW(), INTERVAL 15 MINUTE), 8, 90.0),
      ('550e8400-e29b-41d4-a716-446655440024', ?, '550e8400-e29b-41d4-a716-446655440012', 
       'ext-conv-005', '+1555000005', 'RESOLVED', DATE_SUB(NOW(), INTERVAL 1 HOUR), 12, 70.0)
    `, [tenantId, tenantId, tenantId, tenantId, tenantId]);
    console.log(`✓ Created ${conversationResult.affectedRows} conversations`);

    // Assign allocated conversation
    await connection.query(`
      UPDATE conversations 
      SET assigned_operator_id = '550e8400-e29b-41d4-a716-446655440001',
          resolved_at = NULL
      WHERE id = '550e8400-e29b-41d4-a716-446655440023'
    `);

    // Set resolved_at for resolved conversation
    await connection.query(`
      UPDATE conversations 
      SET resolved_at = DATE_SUB(NOW(), INTERVAL 30 MINUTE),
          assigned_operator_id = '550e8400-e29b-41d4-a716-446655440002'
      WHERE id = '550e8400-e29b-41d4-a716-446655440024'
    `);

    // Create labels
    console.log('Creating labels...');
    const [labelResult] = await connection.query(`
      INSERT IGNORE INTO labels (id, tenant_id, inbox_id, name, color, created_by) VALUES
      ('550e8400-e29b-41d4-a716-446655440030', ?, '550e8400-e29b-41d4-a716-446655440010', 
       'Urgent', '#FF0000', '550e8400-e29b-41d4-a716-446655440001'),
      ('550e8400-e29b-41d4-a716-446655440031', ?, '550e8400-e29b-41d4-a716-446655440010', 
       'Follow-up', '#FFA500', '550e8400-e29b-41d4-a716-446655440001'),
      ('550e8400-e29b-41d4-a716-446655440032', ?, '550e8400-e29b-41d4-a716-446655440011', 
       'VIP', '#FFD700', '550e8400-e29b-41d4-a716-446655440002')
    `, [tenantId, tenantId, tenantId]);
    console.log(`✓ Created ${labelResult.affectedRows} labels`);

    await connection.query('COMMIT');
    console.log('\n✅ Database seeding completed successfully!');
    console.log('\nTest Data Summary:');
    console.log('- Tenant ID:', tenantId);
    console.log('- Operators: 4 (2 OPERATOR, 1 MANAGER, 1 ADMIN)');
    console.log('- Inboxes: 3');
    console.log('- Conversations: 5 (3 QUEUED, 1 ALLOCATED, 1 RESOLVED)');
    console.log('- Labels: 3');

  } catch (error) {
    await connection.query('ROLLBACK');
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

seed();
