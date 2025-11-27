# Setup Guide

## Prerequisites

- Node.js v18 or higher
- PostgreSQL 14 or higher
- Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Database Setup

Create a PostgreSQL database:

```bash
createdb inbox_allocation
```

Or using psql:
```sql
CREATE DATABASE inbox_allocation;
```

### 3. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and configure:

```env
NODE_ENV=development
PORT=3000

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/inbox_allocation
DB_HOST=localhost
DB_PORT=5432
DB_NAME=inbox_allocation
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_POOL_MIN=2
DB_POOL_MAX=10

# Gemini AI Configuration
GEMINI_API_KEY=your_gemini_api_key_here

# Orchestrator Service (mock for testing)
ORCHESTRATOR_BASE_URL=http://localhost:4000

# Grace Period Configuration
GRACE_PERIOD_MINUTES=15

# Logging
LOG_LEVEL=info
```

### 4. Run Database Migrations

```bash
npm run migrate
```

This will create all necessary tables and indexes.

### 5. Seed Test Data (Optional)

```bash
npm run seed
```

This creates:
- 1 test tenant
- 4 operators (2 OPERATOR, 1 MANAGER, 1 ADMIN)
- 3 inboxes
- 5 conversations in various states
- 3 labels

Test tenant ID: `550e8400-e29b-41d4-a716-446655440000`

### 6. Start the Application

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start on `http://localhost:3000`

### 7. Verify Installation

Check health endpoint:
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "up",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Testing the API

### Using the Seeded Data

After seeding, you can test with these IDs:

**Tenant ID:** `550e8400-e29b-41d4-a716-446655440000`

**Operators:**
- Operator 1 (OPERATOR, AVAILABLE): `550e8400-e29b-41d4-a716-446655440001`
- Operator 2 (OPERATOR, AVAILABLE): `550e8400-e29b-41d4-a716-446655440002`
- Manager (MANAGER, AVAILABLE): `550e8400-e29b-41d4-a716-446655440003`
- Admin (ADMIN, OFFLINE): `550e8400-e29b-41d4-a716-446655440004`

**Inboxes:**
- Support Inbox: `550e8400-e29b-41d4-a716-446655440010`
- Sales Inbox: `550e8400-e29b-41d4-a716-446655440011`
- Billing Inbox: `550e8400-e29b-41d4-a716-446655440012`

### Example API Calls

#### 1. Get Operator Status

```bash
curl -X GET http://localhost:3000/api/operators/550e8400-e29b-41d4-a716-446655440001/status \
  -H "x-operator-id: 550e8400-e29b-41d4-a716-446655440001" \
  -H "x-tenant-id: 550e8400-e29b-41d4-a716-446655440000"
```

#### 2. Update Operator Status

```bash
curl -X PUT http://localhost:3000/api/operators/550e8400-e29b-41d4-a716-446655440001/status \
  -H "Content-Type: application/json" \
  -H "x-operator-id: 550e8400-e29b-41d4-a716-446655440001" \
  -H "x-tenant-id: 550e8400-e29b-41d4-a716-446655440000" \
  -d '{"status": "AVAILABLE"}'
```

#### 3. Auto-Allocate Next Conversation

```bash
curl -X POST http://localhost:3000/api/conversations/allocate \
  -H "x-operator-id: 550e8400-e29b-41d4-a716-446655440001" \
  -H "x-tenant-id: 550e8400-e29b-41d4-a716-446655440000"
```

#### 4. List Conversations in Inbox

```bash
curl -X GET "http://localhost:3000/api/inboxes/550e8400-e29b-41d4-a716-446655440010/conversations?state=QUEUED&sort=priority" \
  -H "x-operator-id: 550e8400-e29b-41d4-a716-446655440001" \
  -H "x-tenant-id: 550e8400-e29b-41d4-a716-446655440000"
```

#### 5. Search by Phone Number

```bash
curl -X GET "http://localhost:3000/api/conversations/search?phoneNumber=%2B1555000001" \
  -H "x-operator-id: 550e8400-e29b-41d4-a716-446655440001" \
  -H "x-tenant-id: 550e8400-e29b-41d4-a716-446655440000"
```

#### 6. Create Label

```bash
curl -X POST http://localhost:3000/api/inboxes/550e8400-e29b-41d4-a716-446655440010/labels \
  -H "Content-Type: application/json" \
  -H "x-operator-id: 550e8400-e29b-41d4-a716-446655440001" \
  -H "x-tenant-id: 550e8400-e29b-41d4-a716-446655440000" \
  -d '{"name": "High Priority", "color": "#FF0000"}'
```

## Troubleshooting

### Database Connection Issues

If you see database connection errors:

1. Verify PostgreSQL is running:
   ```bash
   pg_isready
   ```

2. Check database credentials in `.env`

3. Ensure database exists:
   ```bash
   psql -l | grep inbox_allocation
   ```

### Gemini AI Errors

If AI analysis fails:

1. Verify your API key is correct in `.env`
2. Check API key has proper permissions
3. The system will automatically fall back to time-based priority

### Port Already in Use

If port 3000 is already in use:

1. Change `PORT` in `.env` to another port
2. Or stop the process using port 3000:
   ```bash
   # Find process
   lsof -i :3000
   # Kill process
   kill -9 <PID>
   ```

### Migration Errors

If migrations fail:

1. Drop and recreate the database:
   ```bash
   dropdb inbox_allocation
   createdb inbox_allocation
   npm run migrate
   ```

2. Check PostgreSQL version (requires 14+)

## Development Tips

### Viewing Logs

Logs are written to:
- `logs/error.log` - Error logs only
- `logs/combined.log` - All logs

In development, logs also appear in console.

### Database Inspection

Connect to database:
```bash
psql inbox_allocation
```

Useful queries:
```sql
-- View all operators
SELECT * FROM operators;

-- View queued conversations
SELECT * FROM conversations WHERE state = 'QUEUED';

-- View operator subscriptions
SELECT o.id, o.role, i.display_name 
FROM operators o
JOIN operator_inbox_subscriptions ois ON o.id = ois.operator_id
JOIN inboxes i ON ois.inbox_id = i.id;
```

### Resetting Test Data

To reset and reseed:
```bash
npm run migrate
npm run seed
```

## Production Deployment

### Environment Variables

Ensure these are set in production:

```env
NODE_ENV=production
LOG_LEVEL=warn
DATABASE_URL=<production_database_url>
GEMINI_API_KEY=<production_api_key>
ORCHESTRATOR_BASE_URL=<production_orchestrator_url>
```

### Database

1. Run migrations on production database
2. Do NOT run seed script in production

### Process Management

Use a process manager like PM2:

```bash
npm install -g pm2
pm2 start src/app.js --name inbox-allocation
pm2 save
pm2 startup
```

### Monitoring

Monitor these metrics:
- Grace period job execution (runs every minute)
- Database connection pool usage
- Gemini AI API call success rate
- Response times for allocation endpoints

## Next Steps

- Read [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete API reference
- Integrate with your orchestrator service
- Set up monitoring and alerting
- Configure backup strategy for database
- Implement proper JWT authentication (currently using headers for MVP)
