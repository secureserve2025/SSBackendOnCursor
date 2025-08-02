import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Only for client-side usage
});

// System prompt for video production specialist AI agent
const SYSTEM_PROMPT = `You are an expert video production specialist with 15+ years of experience. Your role is to collaborate with clients to create 3-15 measurable deliverables for their video projects.

CONVERSATION FLOW:
1. Start by acknowledging the project and showing you understand their needs
2. Ask 2-3 clarifying questions atleast to understand requirements better
3. When you have enough information, ask exactly: 'Should I generate the final deliverables list?'
4. If they say yes, create the deliverable list and ask: 'Are you satisfied with these deliverables?'

DELIVERABLE RULES:
- Each deliverable must be in a single text line and must be specific, measurable, and achievable
- Include technical details: Resolution standards: 1080p, 4K, 8K;  Frame rates: 24fps, 30fps, 60fps;  Aspect ratios: 16:9, 1:1, 9:16, 2.35:1; Duration requirements: Exact timing specifications; File formats: MP4, MOV, H.264, codec specifications; Audio quality: Sample rates, clarity standards, volume levels
Include creative Production Elements like Script structure: Word count, scene descriptions, voiceover requirements, key message; Camera work: Shot types, angles, movement specifications; Lighting requirements: natural, cinematic, mood/tone; Color grading: Palette specifications, correction standards; Sound design: Music integration, effects, mixing levels; Editing style: Pacing, transitions, graphic integration requirements; 
QUALITY EXAMPLES:
GOOD: "Create 60-second product demo video in 4K resolution with 3 key feature highlights and professional voice-over"
GOOD: "Deliver final MP4 file under 100MB with H.264 codec at 1920x1080 30fps resolution"
GOOD: "Provide storyboard with 8-12 frames showing key scenes and 30-second timing notes per frame"
POOR: "Make a video about the product"
POOR: "Edit the footage (with music and effects)"

- Range: minimum 3, maximum 15 deliverables

COMMUNICATION STYLE:
- Professional but conversational
- Ask one question at a time
- Be specific about video production requirements
- Show expertise through detailed technical knowledge
- Keep responses concise but helpful

IMPORTANT: When ready to generate deliverables, say exactly: 'Should I generate the final deliverables list?' This triggers the UI to show the generate button.`;

/**
 * Error types for better error handling
 */
const ERROR_TYPES = {
  RATE_LIMIT: 'rate_limit',
  API_FAILURE: 'api_failure',
  INSUFFICIENT_CREDITS: 'insufficient_credits',
  NETWORK_ERROR: 'network_error',
  INVALID_RESPONSE: 'invalid_response',
  UNKNOWN: 'unknown'
};

/**
 * User-friendly error messages
 */
const ERROR_MESSAGES = {
  [ERROR_TYPES.RATE_LIMIT]: 'The AI service is currently busy. Please wait a moment and try again.',
  [ERROR_TYPES.API_FAILURE]: 'There was an issue with the AI service. Please try again in a few moments.',
  [ERROR_TYPES.INSUFFICIENT_CREDITS]: 'AI service credits have been exhausted. Please contact support to add more credits.',
  [ERROR_TYPES.NETWORK_ERROR]: 'Network connection issue. Please check your internet connection and try again.',
  [ERROR_TYPES.INVALID_RESPONSE]: 'The AI response was invalid. Please try again.',
  [ERROR_TYPES.UNKNOWN]: 'An unexpected error occurred. Please try again.'
};

/**
 * AI Video Agent - Main AI service for project assistance
 */
class AIVideoAgent {
  constructor() {
    this.openai = openai;
    this.systemPrompt = SYSTEM_PROMPT;
    this.conversationHistory = [];
    this.retryCount = 0;
    this.maxRetries = 3;
  }

  /**
   * Initialize the AI agent with custom system prompt
   * @param {string} customSystemPrompt - Custom system prompt
   */
  initialize(customSystemPrompt = null) {
    if (customSystemPrompt) {
      this.systemPrompt = customSystemPrompt;
    }
    
    console.log('AI Video Agent initialized');
    return this;
  }

  /**
   * Categorize error for better user feedback
   * @param {Error} error - The error object
   * @returns {Object} - Error type and user-friendly message
   */
  categorizeError(error) {
    const errorMessage = error.message?.toLowerCase() || '';
    const errorCode = error.code || '';

    // Rate limit errors
    if (errorCode === 'rate_limit_exceeded' || errorMessage.includes('rate limit')) {
      return {
        type: ERROR_TYPES.RATE_LIMIT,
        message: ERROR_MESSAGES[ERROR_TYPES.RATE_LIMIT],
        retryable: true
      };
    }

    // Insufficient credits
    if (errorCode === 'insufficient_quota' || errorMessage.includes('quota') || errorMessage.includes('credit')) {
      return {
        type: ERROR_TYPES.INSUFFICIENT_CREDITS,
        message: ERROR_MESSAGES[ERROR_TYPES.INSUFFICIENT_CREDITS],
        retryable: false
      };
    }

    // Network errors
    if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('timeout')) {
      return {
        type: ERROR_TYPES.NETWORK_ERROR,
        message: ERROR_MESSAGES[ERROR_TYPES.NETWORK_ERROR],
        retryable: true
      };
    }

    // API failures
    if (errorCode === 'invalid_api_key' || errorCode === 'server_error' || errorCode === 'service_unavailable') {
      return {
        type: ERROR_TYPES.API_FAILURE,
        message: ERROR_MESSAGES[ERROR_TYPES.API_FAILURE],
        retryable: true
      };
    }

    // Default unknown error
    return {
      type: ERROR_TYPES.UNKNOWN,
      message: ERROR_MESSAGES[ERROR_TYPES.UNKNOWN],
      retryable: true
    };
  }

  /**
   * Send a message to the AI agent with enhanced error handling
   * @param {string} message - User message
   * @param {Object} context - Additional context (project data, files, etc.)
   * @returns {Promise<Object>} - AI response
   */
  async sendMessage(message, context = {}) {
    try {
      // Prepare messages array
      const messages = [
        {
          role: 'system',
          content: this.systemPrompt
        },
        ...this.conversationHistory,
        {
          role: 'user',
          content: this.formatUserMessage(message, context)
        }
      ];

      // Make API call to OpenAI with enhanced retry handling
      const response = await this.handleApiCallWithRetry(async () => {
        return await this.openai.chat.completions.create({
          model: 'gpt-4-1106-preview',
          messages: messages,
          max_tokens: 1000,
          temperature: 0.7,
          stream: false
        });
      });

      const aiResponse = response.choices[0].message.content;

      // Update conversation history
      this.conversationHistory.push(
        { role: 'user', content: message },
        { role: 'assistant', content: aiResponse }
      );

      // Keep conversation history manageable (last 10 exchanges)
      if (this.conversationHistory.length > 20) {
        this.conversationHistory = this.conversationHistory.slice(-20);
      }

      return {
        success: true,
        response: aiResponse,
        usage: response.usage
      };

    } catch (error) {
      console.error('AI Agent Error:', error);
      const errorInfo = this.categorizeError(error);
      
      return {
        success: false,
        error: errorInfo.message,
        errorType: errorInfo.type,
        retryable: errorInfo.retryable,
        originalError: error.message
      };
    }
  }

  /**
   * Format user message with context
   * @param {string} message - User message
   * @param {Object} context - Additional context
   * @returns {string} - Formatted message
   */
  formatUserMessage(message, context) {
    let formattedMessage = message;

    // Add project context if available
    if (context.projectSummary) {
      formattedMessage = `PROJECT CONTEXT:\n${context.projectSummary}\n\nUSER MESSAGE: ${message}`;
    }

    // Add file analysis if available
    if (context.fileAnalysis) {
      formattedMessage = `${formattedMessage}\n\nFILE ANALYSIS:\n${context.fileAnalysis}`;
    }

    return formattedMessage;
  }

  /**
   * Process project with AI assistance
   * @param {Object} projectData - Project information
   * @param {string} userQuery - User's question or request
   * @returns {Promise<Object>} - AI response
   */
  async processProject(projectData, userQuery) {
    try {
      // Import the project summary generator
      const { generateProjectSummary } = await import('../utils/projectSummary.js');
      
      // Generate project summary
      const projectSummary = await generateProjectSummary(projectData);
      
      // Send to AI with project context
      const response = await this.sendMessage(userQuery, {
        projectSummary: projectSummary
      });

      return response;

    } catch (error) {
      console.error('Project processing error:', error);
      const errorInfo = this.categorizeError(error);
      
      return {
        success: false,
        error: errorInfo.message,
        errorType: errorInfo.type,
        retryable: errorInfo.retryable
      };
    }
  }

  /**
   * Clear conversation history
   */
  clearHistory() {
    this.conversationHistory = [];
    this.retryCount = 0;
    console.log('Conversation history cleared');
  }

  /**
   * Get conversation history
   * @returns {Array} - Conversation history
   */
  getHistory() {
    return this.conversationHistory;
  }

  /**
   * Set custom system prompt
   * @param {string} prompt - New system prompt
   */
  setSystemPrompt(prompt) {
    this.systemPrompt = prompt;
    console.log('System prompt updated');
  }

  /**
   * Start a new conversation with project summary
   * @param {string} projectSummary - Project summary from Step 2
   * @returns {Promise<Object>} - AI's first response
   */
  async startConversation(projectSummary) {
    try {
      const initialMessage = `I have a new video project. Here are the details:\n\n${projectSummary}\n\nCan you help me create detailed deliverables for this project?`;
      
      const response = await this.sendMessage(initialMessage, {
        projectSummary: projectSummary
      });

      return response;

    } catch (error) {
      console.error('Start conversation error:', error);
      const errorInfo = this.categorizeError(error);
      
      return {
        success: false,
        error: errorInfo.message,
        errorType: errorInfo.type,
        retryable: errorInfo.retryable
      };
    }
  }

  /**
   * Continue conversation with new user message
   * @param {Array} conversationHistory - Previous conversation messages
   * @param {string} userMessage - New user message
   * @returns {Promise<Object>} - AI response
   */
  async continueConversation(conversationHistory, userMessage) {
    try {
      // Set the conversation history
      this.conversationHistory = conversationHistory || [];
      
      const response = await this.sendMessage(userMessage);
      
      return response;

    } catch (error) {
      console.error('Continue conversation error:', error);
      const errorInfo = this.categorizeError(error);
      
      return {
        success: false,
        error: errorInfo.message,
        errorType: errorInfo.type,
        retryable: errorInfo.retryable
      };
    }
  }

  /**
   * Generate final deliverables from conversation history
   * @param {Array} conversationHistory - Complete conversation history
   * @returns {Promise<Object>} - Extracted deliverables as JSON array
   */
  async generateDeliverables(conversationHistory) {
    try {
      // Set the conversation history
      this.conversationHistory = conversationHistory || [];
      
      const extractionPrompt = `Based on our conversation, please extract the final deliverables as a JSON array. Each deliverable should be a string with specific, measurable requirements. Return ONLY the JSON array, no other text. Example format: ["Create 60-second product demo video in 4K resolution", "Deliver final MP4 file under 100MB with H.264 codec"]`;
      
      const response = await this.handleApiCallWithRetry(async () => {
        return await this.openai.chat.completions.create({
          model: 'gpt-4-1106-preview',
          messages: [
            {
              role: 'system',
              content: this.systemPrompt
            },
            ...this.conversationHistory,
            {
              role: 'user',
              content: extractionPrompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.7,
          stream: false
        });
      });

      const aiResponse = response.choices[0].message.content;
      
      // Try to parse the JSON response
      let deliverables = [];
      try {
        // Clean the response to extract JSON
        const jsonMatch = aiResponse.match(/\[.*\]/s);
        if (jsonMatch) {
          deliverables = JSON.parse(jsonMatch[0]);
        } else {
          // If no JSON array found, try to parse the entire response
          deliverables = JSON.parse(aiResponse);
        }
      } catch (parseError) {
        console.error('Failed to parse deliverables JSON:', parseError);
        // Fallback: extract deliverables from text
        deliverables = this.extractDeliverablesFromText(aiResponse);
      }

      return {
        success: true,
        deliverables: deliverables,
        rawResponse: aiResponse,
        usage: response.usage
      };

    } catch (error) {
      console.error('Generate deliverables error:', error);
      const errorInfo = this.categorizeError(error);
      
      return {
        success: false,
        error: errorInfo.message,
        errorType: errorInfo.type,
        retryable: errorInfo.retryable,
        deliverables: []
      };
    }
  }

  /**
   * Extract deliverables from text response as fallback
   * @param {string} text - AI response text
   * @returns {Array} - Array of deliverable strings
   */
  extractDeliverablesFromText(text) {
    const deliverables = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      // Look for lines that start with numbers, dashes, or bullet points
      if (trimmedLine.match(/^(\d+\.|-|\*)\s+/)) {
        const deliverable = trimmedLine.replace(/^(\d+\.|-|\*)\s+/, '').trim();
        if (deliverable.length > 10) { // Minimum length for a meaningful deliverable
          deliverables.push(deliverable);
        }
      }
    }
    
    return deliverables;
  }

  /**
   * Enhanced API call with retry and rate limit handling
   * @param {Function} apiCall - API function to retry
   * @param {number} maxRetries - Maximum number of retries
   * @returns {Promise<Object>} - API response
   */
  async handleApiCallWithRetry(apiCall, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.retryCount = attempt;
        return await apiCall();
      } catch (error) {
        const errorInfo = this.categorizeError(error);
        
        // Don't retry if error is not retryable
        if (!errorInfo.retryable) {
          throw error;
        }
        
        // If this is the last attempt, throw the error
        if (attempt >= maxRetries) {
          throw error;
        }
        
        // Calculate delay with exponential backoff and jitter
        const baseDelay = Math.pow(2, attempt) * 1000;
        const jitter = Math.random() * 1000;
        const delay = baseDelay + jitter;
        
        console.log(`API call failed (attempt ${attempt}/${maxRetries}), retrying in ${Math.round(delay)}ms...`);
        console.log(`Error: ${error.message}`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  /**
   * Get retry count for debugging
   * @returns {number} - Current retry count
   */
  getRetryCount() {
    return this.retryCount;
  }

  /**
   * Reset retry count
   */
  resetRetryCount() {
    this.retryCount = 0;
  }
}

// Create and export singleton instance
const aiVideoAgent = new AIVideoAgent();

// Export all functions for API use
export default aiVideoAgent;
export { AIVideoAgent };

// Export individual functions
export const startConversation = (projectSummary) => aiVideoAgent.startConversation(projectSummary);
export const continueConversation = (conversationHistory, userMessage) => aiVideoAgent.continueConversation(conversationHistory, userMessage);
export const generateDeliverables = (conversationHistory) => aiVideoAgent.generateDeliverables(conversationHistory);
export const sendMessage = (message, context) => aiVideoAgent.sendMessage(message, context);
export const processProject = (projectData, userQuery) => aiVideoAgent.processProject(projectData, userQuery);
export const clearHistory = () => aiVideoAgent.clearHistory();
export const getHistory = () => aiVideoAgent.getHistory();
export const initialize = (customSystemPrompt) => aiVideoAgent.initialize(customSystemPrompt);
export const setSystemPrompt = (prompt) => aiVideoAgent.setSystemPrompt(prompt);
export const getRetryCount = () => aiVideoAgent.getRetryCount();
export const resetRetryCount = () => aiVideoAgent.resetRetryCount(); 