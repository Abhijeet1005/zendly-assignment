# Inbox and Allocation Backend

A production-ready Node.js backend service for managing operator conversations with **AI-powered intelligent routing** using Google Gemini.

## 🚀 Quick Start

```bash
npm install
createdb inbox_allocation
cp .env.example .env
# Edit .env with your credentials
npm run migrate
npm run seed
npm run dev
```

Server starts on `http://localhost:3000`

👉 See [QUICKSTART.md](./QUICKSTART.md) for detailed quick start

## ✨ Features

- **AI-Powered Allocation**: Gemini AI analyzes urgency, sentiment, and complexity
- **Intelligent Routing**: Priority-based conversation assignment
- **Grace Periods**: Smooth handling of operator disconnections
- **Role-Based Access**: OPERATOR, MANAGER, ADMIN permissions
- **Label Management**: Organize and categorize conversations
- **Real-time Status**: Track operator availability
- **Search & Filter**: Find conversations by phone, state, operator, or label
- **External Integration**: Proxy to orchestrator for message history

## 🏗️ Architecture

Clean layered architecture with:
- Express.js REST API
- PostgreSQL database with optimized indexes
- Google Gemini AI integration with caching
- Background jobs for grace period management
- Comprehensive error handling and logging

## 📚 Documentation

- **[QUICKSTART.md](./QUICKSTART.md)** - Get running in 5 minutes
- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Detailed installation and configuration
- **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - Complete API reference
- **[PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)** - Architecture and design decisions

## 🛠️ Tech Stack

- Node.js + Express.js
- PostgreSQL 14+
- Google Gemini AI
- Winston (logging)
- Joi (validation)
- node-cron (background jobs)

## 📋 Prerequisites

- Node.js v18+
- MySQL 8.0+
- Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))

## 🔧 Installation

### 1. Install Dependencies
```bash
npm install
```

### 2. Database Setup
```bash
mysql -u root -p -e "CREATE DATABASE inbox_allocation;"
```

### 3. Configure Environment
```bash
cp .env.example .env
```

Edit `.env` with your:
- Database credentials
- Gemini API key
- Orchestrator URL

### 4. Run Migrations
```bash
npm run migrate
```

### 5. Seed Test Data (Optional)
```bash
npm run seed
```

### 6. Start Server
```bash
npm run dev  # Development with auto-reload
npm start    # Production
```

## API Endpoints

### Operator Status
- `PUT /api/operators/:operatorId/status` - Update operator status
- `GET /api/operators/:operatorId/status` - Get operator status
- `GET /api/operators/:operatorId/inboxes` - List operator inboxes

### Conversations
- `POST /api/conversations/allocate` - Auto-allocate next conversation
- `POST /api/conversations/:conversationId/claim` - Manually claim conversation
- `POST /api/conversations/:conversationId/resolve` - Resolve conversation
- `POST /api/conversations/:conversationId/deallocate` - Deallocate conversation
- `POST /api/conversations/:conversationId/reassign` - Reassign conversation
- `POST /api/conversations/:conversationId/move` - Move to different inbox
- `GET /api/inboxes/:inboxId/conversations` - List conversations
- `GET /api/conversations/search` - Search by phone number
- `GET /api/conversations/:conversationId/history` - Get message history
- `GET /api/conversations/:conversationId/contact` - Get contact info

### Labels
- `POST /api/inboxes/:inboxId/labels` - Create label
- `GET /api/inboxes/:inboxId/labels` - List labels
- `PUT /api/labels/:labelId` - Update label
- `DELETE /api/labels/:labelId` - Delete label
- `POST /api/conversations/:conversationId/labels/:labelId` - Attach label
- `DELETE /api/conversations/:conversationId/labels/:labelId` - Detach label

## Architecture

```
src/
├── config/          # Configuration modules
├── routes/          # API route definitions
├── controllers/     # Request handlers
├── services/        # Business logic
├── repositories/    # Database access
├── middleware/      # Express middleware
├── models/          # Data models and enums
├── jobs/            # Background jobs
└── utils/           # Utilities and helpers
```

## License

ISC
