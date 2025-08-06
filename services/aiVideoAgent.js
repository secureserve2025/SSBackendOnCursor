import OpenAI from 'openai';

// Initialize OpenAI client with better error handling
let openai;
try {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey || !apiKey.startsWith('sk-')) {
    throw new Error('OpenAI API key not configured properly');
  }
  openai = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true // Only for client-side usage
  });
} catch (error) {
  console.error('OpenAI client initialization failed:', error.message);
  console.error('Please ensure VITE_OPENAI_API_KEY is set in your .env file');
  openai = null;
}

// System prompt for video production specialist AI agent
const SYSTEM_PROMPT = `You are an expert video production specialist with 15+ years of experience. Your role is to collaborate with clients to create 3-15 measurable deliverables for their video projects.

CONVERSATION FLOW:
1. Read analyze the Start by acknowledging the project and showing you understand their needs
2. Ask clarifying questions to understand requirements better
3. Ask one question at a time
4. When you have enough information, ask exactly: 'Should I generate the final deliverables list?'
5. If they say yes, create the deliverable list and ask: 'Are you satisfied with these deliverables?'


How to know if you have enough information to generate deliverable list? 
To find out 
Correlate all information you gathered or gathering from the user through inputs and questioning to make sure you have enough information covering the following technical details: 
Resolution standards: 1080p, 4K, 8K 
Frame rates: 24fps, 30fps, 60fps
Aspect ratios: 16:9, 1:1, 9:16, 2.35:1
Duration requirements: Exact timing specifications
File formats: MP4, MOV, H.264, codec specifications
Audio quality: Sample rates, clarity standards, volume levels
Include creative Production Elements like 
Script structure: Word count, scene descriptions, voiceover requirements, key message
Camera work: Shot types, angles, movement specifications
Lighting requirements: natural, cinematic, mood/tone
Color grading: Palette specifications, correction standards
Sound design: Music integration, effects, mixing levels
Editing style: Pacing, transitions, graphic integration requirements 


QUALITY EXAMPLES:
GOOD: "Create 60-second product demo video in 4K resolution with 3 key feature highlights and professional voice-over"
GOOD: "Deliver final MP4 file under 100MB with H.264 codec at 1920x1080 30fps resolution"
GOOD: "Provide storyboard with 8-12 frames showing key scenes and 30-second timing notes per frame"
POOR: "Make a video about the product"
POOR: "Edit the footage (with music and effects)"

DELIVERABLE RULES:
- Each deliverable must be in a single text line and must be specific, measurable, and achievable
- Range: minimum 3, maximum 15 deliverables

COMMUNICATION STYLE:
- Professional but conversational
- Ask ONLY one question at a time
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
  CONFIGURATION_ERROR: 'configuration_error',
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
  [ERROR_TYPES.CONFIGURATION_ERROR]: 'AI service is not properly configured. Please check your OpenAI API key.',
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
   * Check if the AI agent is properly configured
   * @returns {boolean} - True if configured, false otherwise
   */
  isConfigured() {
    return this.openai !== null;
  }

  /**
   * Get configuration status message
   * @returns {string} - Configuration status message
   */
  getConfigurationStatus() {
    if (!this.isConfigured()) {
      return 'OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your .env file.';
    }
    return 'AI agent is properly configured.';
  }

  /**
   * Initialize the AI agent with custom system prompt
   * @param {string} customSystemPrompt - Custom system prompt
   */
  initialize(customSystemPrompt = null) {
    if (!this.isConfigured()) {
      console.error('Cannot initialize AI agent: OpenAI not configured');
      return this;
    }
    
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

    // Configuration errors
    if (!this.isConfigured() || errorMessage.includes('api key') || errorMessage.includes('configuration')) {
      return {
        type: ERROR_TYPES.CONFIGURATION_ERROR,
        message: ERROR_MESSAGES[ERROR_TYPES.CONFIGURATION_ERROR],
        retryable: false
      };
    }

    // Rate limit errors
    if (errorCode === 'rate_limit_exceeded' || errorMessage.includes('rate limit')) {
      return {
        type: ERROR_TYPES.RATE_LIMIT,
        message: ERROR_MESSAGES[ERROR_TYPES.RATE_LIMIT],
        retryable: true
      };
    }

    // API failures
    if (errorCode === 'api_error' || errorMessage.includes('api') || errorMessage.includes('service')) {
      return {
        type: ERROR_TYPES.API_FAILURE,
        message: ERROR_MESSAGES[ERROR_TYPES.API_FAILURE],
        retryable: true
      };
    }

    // Insufficient credits
    if (errorCode === 'insufficient_quota' || errorMessage.includes('quota') || errorMessage.includes('credits')) {
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

    // Invalid response
    if (errorMessage.includes('invalid') || errorMessage.includes('parse')) {
      return {
        type: ERROR_TYPES.INVALID_RESPONSE,
        message: ERROR_MESSAGES[ERROR_TYPES.INVALID_RESPONSE],
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
   * Send a message to the AI and get a response
   * @param {string} message - The message to send
   * @param {Object} context - Additional context
   * @returns {Promise<Object>} - Response object with success, response, and error
   */
  async sendMessage(message, context = {}) {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'AI agent is not configured. Please check your OpenAI API key.',
        type: ERROR_TYPES.CONFIGURATION_ERROR
      };
    }

    try {
      const response = await this.handleApiCallWithRetry(async () => {
        const messages = [
          { role: 'system', content: this.systemPrompt },
          ...this.conversationHistory,
          { role: 'user', content: this.formatUserMessage(message, context) }
        ];

        return await this.openai.chat.completions.create({
          model: 'gpt-4-1106-preview',
          messages: messages,
          temperature: 0.7,
          max_tokens: 2000
        });
      });

      const aiResponse = response.choices[0].message.content;
      
      // Update conversation history
      this.conversationHistory.push(
        { role: 'user', content: message },
        { role: 'assistant', content: aiResponse }
      );

      return {
        success: true,
        response: aiResponse
      };
    } catch (error) {
      console.error('AI sendMessage error:', error);
      const errorInfo = this.categorizeError(error);
      
      return {
        success: false,
        error: errorInfo.message,
        type: errorInfo.type,
        retryable: errorInfo.retryable
      };
    }
  }

  /**
   * Format user message with context
   * @param {string} message - The user message
   * @param {Object} context - Additional context
   * @returns {string} - Formatted message
   */
  formatUserMessage(message, context = {}) {
    let formattedMessage = message;
    
    if (context.projectData) {
      formattedMessage = `Project Context: ${JSON.stringify(context.projectData)}\n\nUser Message: ${message}`;
    }
    
    return formattedMessage;
  }

  /**
   * Process project data and user query
   * @param {Object} projectData - Project information
   * @param {string} userQuery - User's query
   * @returns {Promise<Object>} - Response object
   */
  async processProject(projectData, userQuery) {
    const context = { projectData };
    return await this.sendMessage(userQuery, context);
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
    return [...this.conversationHistory];
  }

  /**
   * Set custom system prompt
   * @param {string} prompt - Custom system prompt
   */
  setSystemPrompt(prompt) {
    this.systemPrompt = prompt;
    console.log('System prompt updated');
  }

  /**
   * Start a new conversation with project summary
   * @param {string} projectSummary - Project summary
   * @returns {Promise<Object>} - Response object
   */
  async startConversation(projectSummary) {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'AI agent is not configured. Please check your OpenAI API key.',
        type: ERROR_TYPES.CONFIGURATION_ERROR
      };
    }

    try {
      this.clearHistory();
      
      const response = await this.handleApiCallWithRetry(async () => {
        const messages = [
          { role: 'system', content: this.systemPrompt },
          { role: 'user', content: `Here's my project summary: ${projectSummary}\n\nPlease start our conversation as an expert video production specialist.` }
        ];

        return await this.openai.chat.completions.create({
          model: 'gpt-4-1106-preview',
          messages: messages,
          temperature: 0.7,
          max_tokens: 1000
        });
      });

      const aiResponse = response.choices[0].message.content;
      
      // Update conversation history
      this.conversationHistory.push(
        { role: 'user', content: `Here's my project summary: ${projectSummary}\n\nPlease start our conversation as an expert video production specialist.` },
        { role: 'assistant', content: aiResponse }
      );

      return {
        success: true,
        response: aiResponse
      };
    } catch (error) {
      console.error('AI startConversation error:', error);
      const errorInfo = this.categorizeError(error);
      
      return {
        success: false,
        error: errorInfo.message,
        type: errorInfo.type,
        retryable: errorInfo.retryable
      };
    }
  }

  /**
   * Continue conversation with new user message
   * @param {Array} conversationHistory - Previous conversation history
   * @param {string} userMessage - New user message
   * @returns {Promise<Object>} - Response object
   */
  async continueConversation(conversationHistory, userMessage) {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'AI agent is not configured. Please check your OpenAI API key.',
        type: ERROR_TYPES.CONFIGURATION_ERROR
      };
    }

    try {
      this.conversationHistory = [...conversationHistory];
      
      const response = await this.handleApiCallWithRetry(async () => {
        const messages = [
          { role: 'system', content: this.systemPrompt },
          ...this.conversationHistory,
          { role: 'user', content: userMessage }
        ];

        return await this.openai.chat.completions.create({
          model: 'gpt-4-1106-preview',
          messages: messages,
          temperature: 0.7,
          max_tokens: 1000
        });
      });

      const aiResponse = response.choices[0].message.content;
      
      // Update conversation history
      this.conversationHistory.push(
        { role: 'user', content: userMessage },
        { role: 'assistant', content: aiResponse }
      );

      return {
        success: true,
        response: aiResponse
      };
    } catch (error) {
      console.error('AI continueConversation error:', error);
      const errorInfo = this.categorizeError(error);
      
      return {
        success: false,
        error: errorInfo.message,
        type: errorInfo.type,
        retryable: errorInfo.retryable
      };
    }
  }

  /**
   * Generate deliverables from conversation history
   * @param {Array} conversationHistory - Conversation history
   * @returns {Promise<Object>} - Response object with deliverables
   */
  async generateDeliverables(conversationHistory) {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'AI agent is not configured. Please check your OpenAI API key.',
        type: ERROR_TYPES.CONFIGURATION_ERROR
      };
    }

    try {
      const response = await this.handleApiCallWithRetry(async () => {
        const messages = [
          { role: 'system', content: this.systemPrompt },
          ...conversationHistory,
          { role: 'user', content: 'Please generate the final deliverables list based on our conversation. Return only a JSON array of strings, with each string being a specific, measurable deliverable. Example: ["Create 60-second product demo video in 4K resolution", "Deliver final MP4 file under 100MB with H.264 codec"]' }
        ];

        return await this.openai.chat.completions.create({
          model: 'gpt-4-1106-preview',
          messages: messages,
          temperature: 0.7,
          max_tokens: 1000
        });
      });

      const aiResponse = response.choices[0].message.content;
      const deliverables = this.extractDeliverablesFromText(aiResponse);

      return {
        success: true,
        deliverables: deliverables,
        response: aiResponse
      };
    } catch (error) {
      console.error('AI generateDeliverables error:', error);
      const errorInfo = this.categorizeError(error);
      
      return {
        success: false,
        error: errorInfo.message,
        type: errorInfo.type,
        retryable: errorInfo.retryable
      };
    }
  }

  /**
   * Extract deliverables from AI response text
   * @param {string} text - AI response text
   * @returns {Array} - Array of deliverables
   */
  extractDeliverablesFromText(text) {
    try {
      // Try to parse as JSON first
      const jsonMatch = text.match(/\[.*\]/s);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed)) {
          return parsed.filter(item => typeof item === 'string' && item.trim().length > 0);
        }
      }
      
      // Fallback: extract numbered or bulleted items
      const lines = text.split('\n');
      const deliverables = [];
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && (trimmed.match(/^\d+\./) || trimmed.match(/^[-•*]/) || trimmed.match(/^[A-Z]/))) {
          const deliverable = trimmed.replace(/^\d+\.\s*/, '').replace(/^[-•*]\s*/, '').trim();
          if (deliverable && deliverable.length > 10) {
            deliverables.push(deliverable);
          }
        }
      }
      
      return deliverables.length > 0 ? deliverables : ['Create video project deliverables based on requirements'];
    } catch (error) {
      console.error('Error extracting deliverables:', error);
      return ['Create video project deliverables based on requirements'];
    }
  }

  /**
   * Handle API calls with retry logic and exponential backoff
   * @param {Function} apiCall - The API call function
   * @param {number} maxRetries - Maximum number of retries
   * @returns {Promise} - API response
   */
  async handleApiCallWithRetry(apiCall, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await apiCall();
      } catch (error) {
        lastError = error;
        
        // Don't retry on configuration errors
        if (error.message?.includes('api key') || error.message?.includes('configuration')) {
          throw error;
        }
        
        // Don't retry on insufficient credits
        if (error.message?.includes('quota') || error.message?.includes('credits')) {
          throw error;
        }
        
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt) + Math.random() * 1000, 10000);
          console.log(`API call failed, retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries + 1})`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Get current retry count
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

// Create and export the AI agent instance
const aiVideoAgent = new AIVideoAgent();

// Export the instance and individual functions
export default aiVideoAgent;

// Export individual functions for easier imports
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
export const isConfigured = () => aiVideoAgent.isConfigured();
export const getConfigurationStatus = () => aiVideoAgent.getConfigurationStatus(); 