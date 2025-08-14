import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

// Fallback OpenAI API functions
const callOpenAI = async (messages, systemPrompt) => {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4-1106-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      max_tokens: 1000,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
};

// Helper function to extract deliverables from text
const extractDeliverablesFromText = (text) => {
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
};

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

// Component states
const STATES = {
  CHATTING: 'chatting',
  READY_TO_GENERATE: 'ready_to_generate',
  REVIEWING_DELIVERABLES: 'reviewing_deliverables'
};

// Loading states for better UX
const LOADING_STATES = {
  STARTING: 'starting',
  SENDING: 'sending',
  GENERATING: 'generating',
  ACCEPTING: 'accepting'
};

// Error types for better error handling
const ERROR_TYPES = {
  NETWORK: 'network',
  AI_SERVICE: 'ai_service',
  DATABASE: 'database',
  VALIDATION: 'validation',
  UNKNOWN: 'unknown'
};

const AIDeliverableChat = ({ 
  isOpen, 
  onClose, 
  projectData, 
  onDeliverablesGenerated 
}) => {
  const [currentState, setCurrentState] = useState(STATES.CHATTING);
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [loadingState, setLoadingState] = useState(null);
  const [error, setError] = useState(null);
  const [generatedDeliverables, setGeneratedDeliverables] = useState([]);
  const [retryCount, setRetryCount] = useState(0);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new messages appear
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Start conversation when modal opens
  useEffect(() => {
    if (isOpen && projectData) {
      startConversation();
    }
  }, [isOpen, projectData]);

  // Focus input when in chatting state
  useEffect(() => {
    if (currentState === STATES.CHATTING && !loadingState) {
      inputRef.current?.focus();
    }
  }, [currentState, loadingState]);

  // Clear error when user starts typing
  useEffect(() => {
    if (userInput.trim() && error) {
      setError(null);
    }
  }, [userInput]);

  const startConversation = async () => {
    setLoadingState(LOADING_STATES.STARTING);
    setError(null);
    setRetryCount(0);

    try {
      console.log('Starting AI conversation with project data:', projectData);
      
      // Try Supabase Edge Function first
      try {
        const { data, error } = await supabase.functions.invoke('ai-chat', {
          body: {
            action: 'start',
            projectId: projectData.id,
            projectData: projectData
          }
        });

        console.log('Supabase function response:', { data, error });

        if (error) {
          console.error('Supabase function error:', error);
          throw error;
        }

        if (data && data.success) {
          setMessages([
            { role: 'assistant', content: data.response, timestamp: new Date() }
          ]);
          return; // Success, exit early
        } else {
          console.error('AI response error:', data);
          throw new Error(data?.error || 'Failed to start conversation');
        }
      } catch (supabaseError) {
        console.log('Supabase Edge Function failed, trying fallback OpenAI API...');
        
        // Fallback to direct OpenAI API
        const projectSummary = `PROJECT: ${projectData.name}
REQUIREMENTS: ${projectData.requirements}
TIMELINE: Due ${projectData.completion_date || 'Not specified'}, assigned to freelancer ${projectData.freelancer_id || 'Unknown'}
UPLOADED FILES: ${projectData.files?.length > 0 ? 'Files uploaded' : 'No files uploaded'}
EXISTING DELIVERABLES: ${projectData.deliverables?.length > 0 ? 'Deliverables exist' : 'None yet'}
SCOPE: ${projectData.requirements?.length > 100 ? 'complex' : 'simple'}`;

        const initialMessage = `I have a new video project. Here are the details:\n\n${projectSummary}\n\nCan you help me create detailed deliverables for this project?`;
        
        const aiResponse = await callOpenAI([
          { role: 'user', content: initialMessage }
        ], SYSTEM_PROMPT);

        setMessages([
          { role: 'assistant', content: aiResponse, timestamp: new Date() }
        ]);
      }
    } catch (err) {
      console.error('Start conversation error:', err);
      const errorInfo = categorizeError(err);
      
      setError({
        message: errorInfo.message,
        type: errorInfo.type,
        retryable: errorInfo.retryable,
        originalError: err.message
      });
    } finally {
      setLoadingState(null);
    }
  };

  const sendMessage = async (message) => {
    if (!message.trim() || loadingState) return;

    const userMessage = { role: 'user', content: message, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setLoadingState(LOADING_STATES.SENDING);
    setError(null);

    try {
      console.log('Sending message to AI:', message);
      
      // Try Supabase Edge Function first
      try {
        const { data, error } = await supabase.functions.invoke('ai-chat', {
          body: {
            action: 'continue',
            projectId: projectData.id,
            userMessage: message
          }
        });

        console.log('Supabase function response for message:', { data, error });

        if (error) {
          console.error('Supabase function error for message:', error);
          throw error;
        }

        if (data && data.success) {
          const aiMessage = { role: 'assistant', content: data.response, timestamp: new Date() };
          setMessages(prev => [...prev, aiMessage]);

          // Check if AI is ready to generate deliverables
          if (data.isReadyToGenerate) {
            setCurrentState(STATES.READY_TO_GENERATE);
          }
          return; // Success, exit early
        } else {
          console.error('AI response error for message:', data);
          throw new Error(data?.error || 'Failed to send message');
        }
      } catch (supabaseError) {
        console.log('Supabase Edge Function failed, trying fallback OpenAI API...');
        
        // Fallback to direct OpenAI API
        const conversationHistory = messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }));
        
        const aiResponse = await callOpenAI([
          ...conversationHistory,
          { role: 'user', content: message }
        ], SYSTEM_PROMPT);

        const aiMessage = { role: 'assistant', content: aiResponse, timestamp: new Date() };
        setMessages(prev => [...prev, aiMessage]);

        // Check if AI is ready to generate deliverables
        if (aiResponse.includes('Should I generate the final deliverables list?')) {
          setCurrentState(STATES.READY_TO_GENERATE);
        }
      }
    } catch (err) {
      console.error('Send message error:', err);
      const errorInfo = categorizeError(err);
      
      setError({
        message: errorInfo.message,
        type: errorInfo.type,
        retryable: errorInfo.retryable,
        originalError: err.message
      });
    } finally {
      setLoadingState(null);
    }
  };

  const generateDeliverables = async () => {
    setLoadingState(LOADING_STATES.GENERATING);
    setError(null);

    try {
      // Try Supabase Edge Function first
      try {
        const { data, error } = await supabase.functions.invoke('ai-chat', {
          body: {
            action: 'generate',
            projectId: projectData.id
          }
        });

        if (error) throw error;

        if (data.success) {
          setGeneratedDeliverables(data.deliverables);
          setCurrentState(STATES.REVIEWING_DELIVERABLES);
          return; // Success, exit early
        } else {
          throw new Error(data.error || 'Failed to generate deliverables');
        }
      } catch (supabaseError) {
        console.log('Supabase Edge Function failed, trying fallback OpenAI API...');
        
        // Fallback to direct OpenAI API
        const conversationHistory = messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }));
        
        const extractionPrompt = `Based on our conversation, please extract the final deliverables as a JSON array. Each deliverable should be a string with specific, measurable requirements. Return ONLY the JSON array, no other text. Example format: ["Create 60-second product demo video in 4K resolution", "Deliver final MP4 file under 100MB with H.264 codec"]`;
        
        const aiResponse = await callOpenAI([
          ...conversationHistory,
          { role: 'user', content: extractionPrompt }
        ], SYSTEM_PROMPT);

        // Try to parse the JSON response
        let deliverables = [];
        try {
          const jsonMatch = aiResponse.match(/\[.*\]/s);
          if (jsonMatch) {
            deliverables = JSON.parse(jsonMatch[0]);
          } else {
            deliverables = JSON.parse(aiResponse);
          }
        } catch (parseError) {
          // Fallback: extract deliverables from text
          deliverables = extractDeliverablesFromText(aiResponse);
        }

        setGeneratedDeliverables(deliverables);
        setCurrentState(STATES.REVIEWING_DELIVERABLES);
      }
    } catch (err) {
      console.error('Generate deliverables error:', err);
      
      const errorInfo = categorizeError(err);
      setError({
        message: errorInfo.message,
        type: errorInfo.type,
        retryable: errorInfo.retryable,
        originalError: err.message
      });
    } finally {
      setLoadingState(null);
    }
  };

  const acceptDeliverables = async () => {
    setLoadingState(LOADING_STATES.ACCEPTING);
    setError(null);

    try {
      // Try Supabase Edge Function first
      try {
        const { data, error } = await supabase.functions.invoke('ai-chat', {
          body: {
            action: 'accept',
            projectId: projectData.id,
            deliverables: generatedDeliverables
          }
        });

        if (error) throw error;

        if (data.success) {
          // Call the callback to update parent component
          onDeliverablesGenerated(generatedDeliverables);
          onClose();
          return; // Success, exit early
        } else {
          throw new Error(data.error || 'Failed to accept deliverables');
        }
      } catch (supabaseError) {
        console.log('Supabase Edge Function failed, using fallback...');
        
        // Fallback: Just call the callback directly since we can't save to database
        // This will work for local development and Vercel deployment
        onDeliverablesGenerated(generatedDeliverables);
        onClose();
      }
    } catch (err) {
      console.error('Accept deliverables error:', err);
      
      const errorInfo = categorizeError(err);
      setError({
        message: errorInfo.message,
        type: errorInfo.type,
        retryable: errorInfo.retryable,
        originalError: err.message
      });
    } finally {
      setLoadingState(null);
    }
  };

  const handleContinueChatting = () => {
    setCurrentState(STATES.CHATTING);
  };

  const handleRequestChanges = () => {
    setCurrentState(STATES.CHATTING);
    setGeneratedDeliverables([]);
  };

  const handleRetry = () => {
    setError(null);
    setRetryCount(prev => prev + 1);
    
    if (loadingState === LOADING_STATES.STARTING) {
      startConversation();
    } else if (loadingState === LOADING_STATES.GENERATING) {
      generateDeliverables();
    } else if (loadingState === LOADING_STATES.ACCEPTING) {
      acceptDeliverables();
    }
  };



  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(userInput);
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const categorizeError = (error) => {
    const errorMessage = error.message?.toLowerCase() || '';
    
    // Network errors
    if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('timeout')) {
      return {
        type: ERROR_TYPES.NETWORK,
        message: 'Network connection issue. Please check your internet connection and try again.',
        retryable: true
      };
    }

    // AI service errors
    if (errorMessage.includes('ai service') || errorMessage.includes('rate limit') || errorMessage.includes('quota')) {
      return {
        type: ERROR_TYPES.AI_SERVICE,
        message: 'AI service is temporarily unavailable. Please try again in a moment.',
        retryable: true
      };
    }

    // Database errors
    if (errorMessage.includes('database') || errorMessage.includes('connection')) {
      return {
        type: ERROR_TYPES.DATABASE,
        message: 'Database connection issue. Please try again.',
        retryable: true
      };
    }

    // Validation errors
    if (errorMessage.includes('validation') || errorMessage.includes('invalid')) {
      return {
        type: ERROR_TYPES.VALIDATION,
        message: 'Invalid request. Please try again.',
        retryable: false
      };
    }

    // Default unknown error
    return {
      type: ERROR_TYPES.UNKNOWN,
      message: 'An unexpected error occurred. Please try again.',
      retryable: true
    };
  };

  const getLoadingMessage = () => {
    switch (loadingState) {
      case LOADING_STATES.STARTING:
        return 'Starting conversation with AI specialist...';
      case LOADING_STATES.SENDING:
        return 'AI is thinking...';
      case LOADING_STATES.GENERATING:
        return 'Generating deliverables...';
      case LOADING_STATES.ACCEPTING:
        return 'Saving deliverables...';
      default:
        return 'Processing...';
    }
  };



  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-cyan-500/30 rounded-xl shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col backdrop-blur-sm">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-cyan-500/30 bg-gradient-to-r from-gray-800/50 to-gray-700/50">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">AI Video Specialist</h2>
              <p className="text-sm text-cyan-300">Expert video production guidance</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-cyan-300 transition-colors p-2 rounded-full hover:bg-gray-700/50"
            disabled={loadingState}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-900/50 to-gray-800/50">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-lg ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white border border-blue-400/30'
                    : 'bg-gradient-to-r from-gray-800 to-gray-700 text-gray-100 border border-cyan-500/30'
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
                <div
                  className={`text-xs mt-2 ${
                    message.role === 'user' ? 'text-blue-100' : 'text-cyan-300'
                  }`}
                >
                  {formatTimestamp(message.timestamp)}
                </div>
              </div>
            </div>
          ))}

          {loadingState && (
            <div className="flex justify-start">
              <div className="bg-gradient-to-r from-gray-800 to-gray-700 border border-cyan-500/30 rounded-2xl px-4 py-3 shadow-lg">
                <div className="flex items-center space-x-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-cyan-300">{getLoadingMessage()}</span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex justify-start">
              <div className="bg-gradient-to-r from-red-900/80 to-red-800/80 border border-red-500/50 rounded-2xl px-4 py-3 max-w-[80%] shadow-lg">
                <div className="text-red-200 text-sm">
                  <div className="font-medium mb-2 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Error
                  </div>
                  <div className="mb-3">{error.message}</div>
                  
                  {/* Retry button */}
                  {error.retryable && retryCount < 2 && (
                    <button
                      onClick={handleRetry}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 transition-colors mr-3 shadow-md"
                    >
                      Retry
                    </button>
                  )}
                  
                  {/* Dismiss button */}
                  <button
                    onClick={() => setError(null)}
                    className="text-red-300 hover:text-red-100 underline text-sm"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}



          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Section - Different based on state */}
        <div className="border-t border-cyan-500/30 p-6 bg-gradient-to-r from-gray-800/50 to-gray-700/50">
          {currentState === STATES.CHATTING && (
            <div className="space-y-4">
              <div className="flex space-x-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about your video project requirements..."
                  className="flex-1 border border-cyan-500/30 bg-gray-800/80 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent placeholder-gray-400 shadow-lg backdrop-blur-sm"
                  disabled={loadingState}
                />
                <button
                  onClick={() => sendMessage(userInput)}
                  disabled={!userInput.trim() || loadingState}
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-xl hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg font-medium"
                >
                  Send
                </button>
              </div>
              
              {/* Helpful tips */}
              <div className="text-xs text-cyan-300 bg-cyan-900/20 border border-cyan-500/30 rounded-lg p-3">
                💡 Tip: Ask about video length, style, or specific requirements to get better deliverables
              </div>
            </div>
          )}

          {currentState === STATES.READY_TO_GENERATE && (
            <div className="space-y-4">
              <div className="text-center text-gray-300 mb-4 bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-500/30 rounded-xl p-4">
                <div className="font-bold text-lg mb-2 text-green-300">Ready to generate deliverables!</div>
                <div className="text-sm">The AI specialist has gathered enough information to create your project deliverables.</div>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={generateDeliverables}
                  disabled={loadingState}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-xl hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg font-medium"
                >
                  {loadingState === LOADING_STATES.GENERATING ? 'Generating...' : 'Yes, Generate Deliverables'}
                </button>
                <button
                  onClick={handleContinueChatting}
                  disabled={loadingState}
                  className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 text-white px-6 py-3 rounded-xl hover:from-gray-600 hover:to-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg font-medium"
                >
                  Continue Chatting
                </button>
              </div>
            </div>
          )}

          {currentState === STATES.REVIEWING_DELIVERABLES && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 border border-blue-500/30 rounded-xl p-4 shadow-lg">
                <h3 className="font-bold text-blue-200 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Generated Deliverables
                </h3>
                <div className="space-y-3 max-h-40 overflow-y-auto">
                  {generatedDeliverables.map((deliverable, index) => (
                    <div key={index} className="flex items-start space-x-3 bg-blue-800/30 rounded-lg p-3 border border-blue-500/20">
                      <div className="w-6 h-6 bg-gradient-to-r from-blue-400 to-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5 flex-shrink-0 shadow-md">
                        {index + 1}
                      </div>
                      <div className="flex-1 text-blue-100 text-sm">{deliverable}</div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex space-x-4">
                <button
                  onClick={acceptDeliverables}
                  disabled={loadingState}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-xl hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg font-medium"
                >
                  {loadingState === LOADING_STATES.ACCEPTING ? 'Accepting...' : 'Accept These Deliverables'}
                </button>
                <button
                  onClick={handleRequestChanges}
                  disabled={loadingState}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-xl hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg font-medium"
                >
                  Request Changes
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIDeliverableChat; 