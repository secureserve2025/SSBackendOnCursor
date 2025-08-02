# AI Video Agent Service

This service provides an AI-powered video production specialist that helps clients create detailed, measurable deliverables for their video projects.

## Features

- **Expert Video Production Knowledge**: 15+ years of experience in video production
- **Structured Conversation Flow**: Guided process to understand client needs
- **Technical Specifications**: Detailed technical requirements for video deliverables
- **Measurable Deliverables**: Creates specific, measurable, and achievable deliverables
- **Project Integration**: Works with project data and file analysis from previous steps
- **Conversation History**: Maintains context across multiple interactions

## System Prompt

The AI agent is configured with a comprehensive system prompt that defines:

### Conversation Flow
1. Acknowledge the project and show understanding of needs
2. Ask 2-3 clarifying questions to understand requirements better
3. Ask exactly: "Should I generate the final deliverables list?"
4. If yes, create deliverable list and ask: "Are you satisfied with these deliverables?"

### Deliverable Rules
- Each deliverable must be specific, measurable, and achievable
- Include technical details: Resolution, frame rates, aspect ratios, duration, file formats, audio quality
- Include creative production elements: Script structure, camera work, lighting, color grading, sound design, editing style
- Range: minimum 3, maximum 15 deliverables

### Quality Examples
**GOOD:**
- "Create 60-second product demo video in 4K resolution with 3 key feature highlights and professional voice-over"
- "Deliver final MP4 file under 100MB with H.264 codec at 1920x1080 30fps resolution"
- "Provide storyboard with 8-12 frames showing key scenes and 30-second timing notes per frame"

**POOR:**
- "Make a video about the product"
- "Edit the footage (with music and effects)"

## Usage

```javascript
import aiVideoAgent from './services/aiVideoAgent.js';

// Initialize the agent
aiVideoAgent.initialize();

// Prepare project data
const projectData = {
  name: 'Product Launch Video',
  requirements: 'Create a promotional video for our new mobile app...',
  files: uploadedFiles,
  deliverables: existingDeliverables,
  freelancer_id: 'FL12345',
  completion_date: '2024-03-15'
};

// Send message to AI
const response = await aiVideoAgent.processProject(projectData, userMessage);

// Handle response
if (response.success) {
  console.log('AI Response:', response.response);
} else {
  console.error('Error:', response.error);
}
```

## API Methods

### `initialize(customSystemPrompt = null)`
Initialize the AI agent with optional custom system prompt.

### `sendMessage(message, context = {})`
Send a message to the AI agent with optional context.

**Parameters:**
- `message` (string): User message
- `context` (object): Additional context (project data, files, etc.)

**Returns:**
```javascript
{
  success: boolean,
  response: string,
  usage: object,
  error: string (if success is false)
}
```

### `processProject(projectData, userQuery)`
Process a project with AI assistance.

**Parameters:**
- `projectData` (object): Project information
- `userQuery` (string): User's question or request

**Returns:** Same as `sendMessage`

### `startConversation(projectSummary)`
Start a new conversation with project summary.

**Parameters:**
- `projectSummary` (string): Project summary from Step 2

**Returns:** Same as `sendMessage`

### `continueConversation(conversationHistory, userMessage)`
Continue conversation with new user message.

**Parameters:**
- `conversationHistory` (array): Previous conversation messages
- `userMessage` (string): New user message

**Returns:** Same as `sendMessage`

### `generateDeliverables(conversationHistory)`
Generate final deliverables from conversation history.

**Parameters:**
- `conversationHistory` (array): Complete conversation history

**Returns:**
```javascript
{
  success: boolean,
  deliverables: array,
  rawResponse: string,
  usage: object,
  error: string (if success is false)
}
```

### `clearHistory()`
Clear the conversation history.

### `getHistory()`
Get the current conversation history.

### `setSystemPrompt(prompt)`
Set a custom system prompt.

## Integration

The AI agent integrates with:
- **File Analyzer** (Step 1): Processes uploaded files for context
- **Project Summary Generator** (Step 2): Uses project summaries for better understanding

## Environment Variables

The service requires an OpenAI API key:
- `OPENAI_API_KEY` or `VITE_OPENAI_API_KEY`

## Model Configuration

- **Model**: `gpt-4-1106-preview`
- **Temperature**: 0.7
- **Max Tokens**: 1000
- **Stream**: false

## Error Handling

- **Rate Limiting**: Automatic retry with exponential backoff
- **API Failures**: Graceful error handling with fallback responses
- **JSON Parsing**: Fallback text extraction for deliverables
- **Network Issues**: Retry mechanism for failed requests

## Dependencies

- `openai`: OpenAI API client

## Communication Style

- Professional but conversational
- Asks one question at a time
- Specific about video production requirements
- Shows expertise through detailed technical knowledge
- Keeps responses concise but helpful

## Important Notes

- The AI agent will ask exactly: "Should I generate the final deliverables list?" when ready
- This triggers the UI to show the generate button
- The agent maintains conversation history (last 20 messages)
- All responses include detailed technical specifications for video production 