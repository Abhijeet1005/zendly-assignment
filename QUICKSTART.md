# Quick Start Guide

Get the Inbox and Allocation Backend running in 5 minutes!

## Prerequisites

- Node.js v18+
- MySQL 8.0+
- Gemini API key

## Installation

```bash
# 1. Install dependencies
npm install

# 2. Create database
mysql -u root -p -e "CREATE DATABASE inbox_allocation;"

# 3. Configure environment
cp .env.example .env
# Edit .env with your database credentials and Gemini API key

# 4. Run migrations
npm run migrate

# 5. Seed test data
npm run seed

# 6. Start server
npm run dev
```

Server runs on `http://localhost:3000`

## Test It Out

### Check Health
```bash
curl http://localhost:3000/health
```

### Allocate a Conversation
```bash
curl -X POST http://localhost:3000/api/conversations/allocate \
  -H "x-operator-id: 550e8400-e29b-41d4-a716-446655440001" \
  -H "x-tenant-id: 550e8400-e29b-41d4-a716-446655440000"
```

### List Queued Conversations
```bash
curl "http://localhost:3000/api/inboxes/550e8400-e29b-41d4-a716-446655440010/conversations?state=QUEUED" \
  -H "x-operator-id: 550e8400-e29b-41d4-a716-446655440001" \
  -H "x-tenant-id: 550e8400-e29b-41d4-a716-446655440000"
```

## What's Next?

- Read [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for all endpoints
- See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed configuration
- Check [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) for architecture overview

## Test Data

After seeding, use these IDs:

**Tenant**: `550e8400-e29b-41d4-a716-446655440000`

**Operators**:
- Operator 1: `550e8400-e29b-41d4-a716-446655440001` (OPERATOR, AVAILABLE)
- Operator 2: `550e8400-e29b-41d4-a716-446655440002` (OPERATOR, AVAILABLE)
- Manager: `550e8400-e29b-41d4-a716-446655440003` (MANAGER, AVAILABLE)

**Inboxes**:
- Support: `550e8400-e29b-41d4-a716-446655440010`
- Sales: `550e8400-e29b-41d4-a716-446655440011`
- Billing: `550e8400-e29b-41d4-a716-446655440012`

## Troubleshooting

**Database connection failed?**
- Check PostgreSQL is running: `pg_isready`
- Verify credentials in `.env`

**Port 3000 in use?**
- Change `PORT` in `.env`

**Gemini AI errors?**
- System falls back to time-based priority automatically
- Verify API key in `.env`

That's it! You're ready to go. 🚀
