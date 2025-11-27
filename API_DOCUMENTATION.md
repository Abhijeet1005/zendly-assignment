# API Documentation

## Authentication

All API endpoints require authentication headers:
- `x-operator-id`: UUID of the operator making the request
- `x-tenant-id`: UUID of the tenant
- `x-operator-role`: Role of the operator (OPERATOR, MANAGER, or ADMIN) - required for role-based endpoints

## Base URL

```
http://localhost:3000/api
```

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": { ... }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Endpoints

### Operator Status

#### Update Operator Status
```
PUT /operators/:operatorId/status
```

**Request Body:**
```json
{
  "status": "AVAILABLE"
}
```

**Status Values:** `AVAILABLE`, `OFFLINE`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "operator_id": "uuid",
    "status": "AVAILABLE",
    "last_status_change_at": "2024-01-15T10:30:00Z"
  }
}
```

#### Get Operator Status
```
GET /operators/:operatorId/status
```

**Response:** Same as update status

#### Get Operator Inboxes
```
GET /operators/:operatorId/inboxes
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "tenant_id": "uuid",
      "phone_number": "+1234567890",
      "display_name": "Support Inbox",
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### Conversations

#### Auto-Allocate Next Conversation
```
POST /conversations/allocate
```

**Description:** Automatically assigns the next highest priority queued conversation to the requesting operator.

**Requirements:**
- Operator must have AVAILABLE status
- Operator must be subscribed to at least one inbox

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "tenant_id": "uuid",
    "inbox_id": "uuid",
    "external_conversation_id": "ext-123",
    "customer_phone_number": "+1555000001",
    "state": "ALLOCATED",
    "assigned_operator_id": "uuid",
    "last_message_at": "2024-01-15T10:25:00Z",
    "message_count": 5,
    "priority_score": 85.5,
    "urgency_level": "HIGH",
    "sentiment_score": -0.6,
    "complexity_rating": "MEDIUM",
    "analyzed_at": "2024-01-15T10:30:00Z",
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

If no conversations available:
```json
{
  "success": true,
  "data": null,
  "message": "No conversations available for allocation"
}
```

#### Manually Claim Conversation
```
POST /conversations/:conversationId/claim
```

**Description:** Manually claim a specific queued conversation.

**Requirements:**
- Conversation must be in QUEUED state
- Operator must be subscribed to the conversation's inbox

**Response:** Same as allocate

#### Resolve Conversation
```
POST /conversations/:conversationId/resolve
```

**Description:** Mark a conversation as resolved.

**Requirements:**
- Operator must be the assigned owner OR have MANAGER/ADMIN role

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "state": "RESOLVED",
    "resolved_at": "2024-01-15T10:30:00Z",
    ...
  }
}
```

#### Deallocate Conversation
```
POST /conversations/:conversationId/deallocate
```

**Roles Required:** MANAGER, ADMIN

**Description:** Return an allocated conversation to the queue.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "state": "QUEUED",
    "assigned_operator_id": null,
    ...
  }
}
```

#### Reassign Conversation
```
POST /conversations/:conversationId/reassign
```

**Roles Required:** MANAGER, ADMIN

**Request Body:**
```json
{
  "targetOperatorId": "uuid"
}
```

**Requirements:**
- Target operator must be subscribed to the conversation's inbox

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "assigned_operator_id": "new-operator-uuid",
    ...
  }
}
```

#### Move Conversation to Different Inbox
```
POST /conversations/:conversationId/move
```

**Roles Required:** MANAGER, ADMIN

**Request Body:**
```json
{
  "targetInboxId": "uuid"
}
```

**Requirements:**
- Target inbox must belong to the same tenant

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "inbox_id": "new-inbox-uuid",
    "state": "QUEUED",
    "assigned_operator_id": null,
    ...
  }
}
```

#### List Conversations in Inbox
```
GET /inboxes/:inboxId/conversations
```

**Query Parameters:**
- `state` (optional): Filter by state (QUEUED, ALLOCATED, RESOLVED)
- `assignedOperatorId` (optional): Filter by assigned operator
- `labelId` (optional): Filter by label
- `sort` (optional): Sort order (newest, oldest, priority) - default: newest
- `limit` (optional): Results per page (1-100) - default: 50
- `offset` (optional): Pagination offset - default: 0

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "state": "QUEUED",
      "priority_score": 85.5,
      ...
    }
  ]
}
```

#### Search Conversations by Phone Number
```
GET /conversations/search?phoneNumber=+1555000001
```

**Query Parameters:**
- `phoneNumber` (required): Exact phone number to search

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "customer_phone_number": "+1555000001",
      ...
    }
  ]
}
```

#### Get Conversation History
```
GET /conversations/:conversationId/history
```

**Query Parameters:**
- `page` (optional): Page number - default: 1
- `limit` (optional): Results per page (1-100) - default: 50

**Description:** Proxies request to orchestrator service for message history.

**Response:**
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "msg-123",
        "sender": "customer",
        "text": "Hello, I need help",
        "timestamp": "2024-01-15T10:25:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 100
    }
  }
}
```

#### Get Contact Information
```
GET /conversations/:conversationId/contact
```

**Description:** Retrieves read-only contact information from orchestrator.

**Response:**
```json
{
  "success": true,
  "data": {
    "phone": "+1555000001",
    "name": "John Doe",
    "email": "john@example.com",
    ...
  }
}
```

### Labels

#### Create Label
```
POST /inboxes/:inboxId/labels
```

**Request Body:**
```json
{
  "name": "Urgent",
  "color": "#FF0000"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "tenant_id": "uuid",
    "inbox_id": "uuid",
    "name": "Urgent",
    "color": "#FF0000",
    "created_by": "uuid",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

#### List Labels in Inbox
```
GET /inboxes/:inboxId/labels
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Urgent",
      "color": "#FF0000",
      ...
    }
  ]
}
```

#### Update Label
```
PUT /labels/:labelId
```

**Request Body:**
```json
{
  "name": "Very Urgent",
  "color": "#CC0000"
}
```

**Response:** Same as create label

#### Delete Label
```
DELETE /labels/:labelId
```

**Description:** Deletes label and removes all attachments to conversations.

**Response:**
```json
{
  "success": true,
  "message": "Label deleted successfully"
}
```

#### Attach Label to Conversation
```
POST /conversations/:conversationId/labels/:labelId
```

**Response:**
```json
{
  "success": true,
  "message": "Label attached successfully"
}
```

#### Detach Label from Conversation
```
DELETE /conversations/:conversationId/labels/:labelId
```

**Response:**
```json
{
  "success": true,
  "message": "Label detached successfully"
}
```

## Error Codes

- `VALIDATION_ERROR` (400): Invalid request data
- `UNAUTHORIZED` (403): Insufficient permissions
- `NOT_FOUND` (404): Resource not found
- `CONFLICT` (409): Resource conflict (e.g., conversation already claimed)
- `EXTERNAL_SERVICE_ERROR` (502): External service (Gemini AI or Orchestrator) error
- `INTERNAL_SERVER_ERROR` (500): Unexpected server error

## Polling Best Practices

For efficient polling:
1. Use the `timestamp` field in responses to track last update
2. Poll at reasonable intervals (e.g., every 5-10 seconds)
3. Use filtering to reduce payload size
4. Limit results to necessary data only

## Grace Period Behavior

When an operator goes OFFLINE:
- Allocated conversations remain assigned for a grace period (default: 15 minutes)
- If operator returns to AVAILABLE before expiration, conversations stay assigned
- If grace period expires, conversations return to QUEUED state

## AI-Powered Priority

Conversations are analyzed by Gemini AI to determine:
- **Urgency Level**: LOW, MEDIUM, HIGH, CRITICAL
- **Sentiment Score**: -1.0 (very negative) to 1.0 (very positive)
- **Complexity Rating**: SIMPLE, MEDIUM, COMPLEX

Priority score is calculated as:
```
priority_score = urgency_weight + complexity_weight + sentiment_adjustment
```

If AI analysis fails, fallback to time-based priority (older = higher priority).
