# AI Chat API Endpoint

This Supabase Edge Function handles all communication between the frontend and the AI agent for video production deliverables generation.

## Endpoint

```
POST /functions/v1/ai-chat
```

## Authentication

Requires Supabase authentication headers:
- `Authorization: Bearer <supabase-anon-key>`
- `apikey: <supabase-anon-key>`

## Request Format

All requests should include an `action` parameter and additional data based on the action:

```javascript
{
  "action": "start|continue|generate|accept",
  "projectId": "uuid",
  "userMessage": "string", // for continue action
  "projectData": {}, // for start action
  "deliverables": [] // for accept action
}
```

## Actions

### 1. "start" - Begin a new AI conversation

**Request:**
```javascript
{
  "action": "start",
  "projectId": "uuid",
  "projectData": {
    "name": "Project Name",
    "requirements": "Project requirements text",
    "files": [],
    "deliverables": [],
    "freelancer_id": "FL12345",
    "completion_date": "2024-03-15"
  }
}
```

**Response:**
```javascript
{
  "success": true,
  "response": "AI's first response",
  "usage": {
    "prompt_tokens": 100,
    "completion_tokens": 200,
    "total_tokens": 300
  }
}
```

**What it does:**
- Generates project summary using project data
- Starts AI conversation with project context
- Saves conversation to database in `ai_chat_messages` field
- Returns AI's first response

### 2. "continue" - Continue an existing conversation

**Request:**
```javascript
{
  "action": "continue",
  "projectId": "uuid",
  "userMessage": "User's message to continue conversation"
}
```

**Response:**
```javascript
{
  "success": true,
  "response": "AI's response",
  "isReadyToGenerate": true, // true if AI asks to generate deliverables
  "usage": {
    "prompt_tokens": 100,
    "completion_tokens": 200,
    "total_tokens": 300
  }
}
```

**What it does:**
- Retrieves conversation history from database
- Adds new user message to conversation
- Continues AI conversation with context
- Updates conversation in database
- Returns AI response and whether ready to generate

### 3. "generate" - Create the deliverables list

**Request:**
```javascript
{
  "action": "generate",
  "projectId": "uuid"
}
```

**Response:**
```javascript
{
  "success": true,
  "deliverables": [
    "Create 60-second product demo video in 4K resolution",
    "Deliver final MP4 file under 100MB with H.264 codec",
    "Provide storyboard with 8-12 frames showing key scenes"
  ],
  "rawResponse": "AI's raw response",
  "usage": {
    "prompt_tokens": 100,
    "completion_tokens": 200,
    "total_tokens": 300
  }
}
```

**What it does:**
- Retrieves complete conversation history from database
- Generates deliverables using AI agent
- Updates conversation with generation result
- Returns structured deliverables array

### 4. "accept" - Save final deliverables

**Request:**
```javascript
{
  "action": "accept",
  "projectId": "uuid",
  "deliverables": [
    "Create 60-second product demo video in 4K resolution",
    "Deliver final MP4 file under 100MB with H.264 codec"
  ]
}
```

**Response:**
```javascript
{
  "success": true,
  "message": "Deliverables saved successfully"
}
```

**What it does:**
- Updates project record with final deliverables
- Clears chat messages from database
- Returns success confirmation

## Error Handling

All endpoints return consistent error responses:

```javascript
{
  "error": "Error message",
  "details": "Additional error details" // for internal server errors
}
```

Common error scenarios:
- Missing required parameters
- Invalid action type
- Database connection issues
- OpenAI API failures
- Rate limiting

## Database Integration

The endpoint integrates with the `deliverables` table:

- **`ai_chat_messages`**: JSONB field storing conversation history
- **`deliverable_text`**: Text field storing final deliverables
- **`project_id`**: Foreign key to projects table

## Environment Variables

Required environment variables:
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key
- `OPENAI_API_KEY`: OpenAI API key

## AI Agent Features

- **Expert Video Production Knowledge**: 15+ years experience
- **Structured Conversation Flow**: Guided process
- **Technical Specifications**: Detailed requirements
- **Measurable Deliverables**: Specific, measurable outcomes
- **Conversation History**: Maintains context across interactions

## Usage Example

```javascript
// Start conversation
const startResponse = await fetch('/functions/v1/ai-chat', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    action: 'start',
    projectId: 'project-uuid',
    projectData: {
      name: 'Product Launch Video',
      requirements: 'Create promotional video...',
      freelancer_id: 'FL12345',
      completion_date: '2024-03-15'
    }
  })
})

// Continue conversation
const continueResponse = await fetch('/functions/v1/ai-chat', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    action: 'continue',
    projectId: 'project-uuid',
    userMessage: 'What specific features should we highlight?'
  })
})

// Generate deliverables
const generateResponse = await fetch('/functions/v1/ai-chat', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    action: 'generate',
    projectId: 'project-uuid'
  })
})

// Accept deliverables
const acceptResponse = await fetch('/functions/v1/ai-chat', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    action: 'accept',
    projectId: 'project-uuid',
    deliverables: ['Deliverable 1', 'Deliverable 2']
  })
})
```

## Deployment

Deploy to Supabase using:
```bash
supabase functions deploy ai-chat
```

## Security

- Uses Supabase service role for database access
- Validates all input parameters
- Handles CORS properly
- Includes comprehensive error handling 