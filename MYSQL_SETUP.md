# MySQL Setup Guide

## Why MySQL?

This project uses **MySQL** because:

1. **ACID Transactions** - Ensures atomic conversation allocation
2. **Row-Level Locking** - `SELECT FOR UPDATE` prevents race conditions
3. **Foreign Keys** - Maintains data integrity
4. **Proven & Reliable** - Battle-tested in production
5. **Easy to Use** - Familiar to most developers

## Installation

### Windows
Download from: https://dev.mysql.com/downloads/mysql/

Or use Chocolatey:
```bash
choco install mysql
```

### macOS
```bash
brew install mysql
brew services start mysql
```

### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
```

## Initial Setup

### 1. Secure Installation (Recommended)
```bash
mysql_secure_installation
```

Follow prompts to:
- Set root password
- Remove anonymous users
- Disallow root login remotely
- Remove test database

### 2. Create Database
```bash
mysql -u root -p
```

Then in MySQL:
```sql
CREATE DATABASE inbox_allocation;
EXIT;
```

### 3. Create User (Optional but Recommended)
```sql
CREATE USER 'inbox_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON inbox_allocation.* TO 'inbox_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## Configure Application

Update `.env`:
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=inbox_allocation
DB_USER=root  # or inbox_user if you created one
DB_PASSWORD=your_password
```

## Run Migrations

```bash
npm run migrate
```

## Seed Test Data

```bash
npm run seed
```

## Verify Setup

```bash
mysql -u root -p inbox_allocation -e "SHOW TABLES;"
```

You should see 8 tables:
- conversations
- conversation_labels
- grace_period_assignments
- inboxes
- labels
- operator_inbox_subscriptions
- operator_status
- operators

## Common Issues

### Can't Connect
```bash
# Check MySQL is running
mysql --version
sudo systemctl status mysql  # Linux
brew services list  # macOS
```

### Access Denied
- Verify password in `.env`
- Check user has permissions:
```sql
SHOW GRANTS FOR 'your_user'@'localhost';
```

### Port Already in Use
- Default MySQL port is 3306
- Check if another instance is running:
```bash
netstat -an | grep 3306
```

## MySQL Workbench (GUI Tool)

Download: https://dev.mysql.com/downloads/workbench/

Great for:
- Viewing data
- Running queries
- Database management

## Key MySQL Features Used

### 1. Row-Level Locking
```sql
SELECT * FROM conversations WHERE id = ? FOR UPDATE;
```
Prevents concurrent allocation conflicts.

### 2. Transactions
```sql
START TRANSACTION;
-- operations
COMMIT;
```
Ensures atomic state changes.

### 3. Foreign Keys
```sql
FOREIGN KEY (inbox_id) REFERENCES inboxes(id)
```
Maintains referential integrity.

### 4. ENUM Types
```sql
state ENUM('QUEUED', 'ALLOCATED', 'RESOLVED')
```
Enforces valid values at database level.

### 5. Indexes
```sql
INDEX idx_conversations_priority (priority_score DESC, last_message_at ASC)
```
Optimizes allocation queries.

## Performance Tips

1. **Connection Pooling** - Already configured (max 10 connections)
2. **Indexes** - All critical queries are indexed
3. **Query Optimization** - Use `EXPLAIN` to analyze slow queries
4. **Regular Maintenance**:
```sql
OPTIMIZE TABLE conversations;
ANALYZE TABLE conversations;
```

## Backup & Restore

### Backup
```bash
mysqldump -u root -p inbox_allocation > backup.sql
```

### Restore
```bash
mysql -u root -p inbox_allocation < backup.sql
```

## Production Considerations

1. **Use InnoDB Engine** - Already configured (default)
2. **Enable Binary Logging** - For point-in-time recovery
3. **Set up Replication** - For high availability
4. **Monitor Performance** - Use MySQL Enterprise Monitor or Percona Monitoring
5. **Regular Backups** - Automated daily backups

## Useful Commands

```sql
-- Show all databases
SHOW DATABASES;

-- Use database
USE inbox_allocation;

-- Show tables
SHOW TABLES;

-- Describe table structure
DESCRIBE conversations;

-- Show indexes
SHOW INDEX FROM conversations;

-- Check table size
SELECT 
  table_name,
  ROUND(((data_length + index_length) / 1024 / 1024), 2) AS "Size (MB)"
FROM information_schema.TABLES
WHERE table_schema = "inbox_allocation";

-- Show active connections
SHOW PROCESSLIST;

-- Show current queries
SELECT * FROM information_schema.processlist WHERE command != 'Sleep';
```

## Resources

- [MySQL Documentation](https://dev.mysql.com/doc/)
- [MySQL Tutorial](https://www.mysqltutorial.org/)
- [MySQL Performance Blog](https://www.percona.com/blog/)

---

**You're all set with MySQL!** 🎉
