import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// OpenAI client for AI agent
const openai = new (await import('https://esm.sh/openai@4')).default({
  apiKey: Deno.env.get('OPENAI_API_KEY'),
})

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

IMPORTANT: When ready to generate deliverables, say exactly: 'Should I generate the final deliverables list?' This triggers the UI to show the generate button.`

// Error types and messages
const ERROR_TYPES = {
  VALIDATION_ERROR: 'validation_error',
  DATABASE_ERROR: 'database_error',
  AI_SERVICE_ERROR: 'ai_service_error',
  NETWORK_ERROR: 'network_error',
  RATE_LIMIT: 'rate_limit',
  INSUFFICIENT_CREDITS: 'insufficient_credits',
  UNKNOWN: 'unknown'
}

const ERROR_MESSAGES = {
  [ERROR_TYPES.VALIDATION_ERROR]: 'Invalid request data. Please check your input and try again.',
  [ERROR_TYPES.DATABASE_ERROR]: 'Database connection issue. Please try again in a moment.',
  [ERROR_TYPES.AI_SERVICE_ERROR]: 'AI service is temporarily unavailable. Please try again.',
  [ERROR_TYPES.NETWORK_ERROR]: 'Network connection issue. Please check your internet connection.',
  [ERROR_TYPES.RATE_LIMIT]: 'Service is currently busy. Please wait a moment and try again.',
  [ERROR_TYPES.INSUFFICIENT_CREDITS]: 'AI service credits have been exhausted. Please contact support.',
  [ERROR_TYPES.UNKNOWN]: 'An unexpected error occurred. Please try again.'
}

/**
 * Categorize error for better user feedback
 */
function categorizeError(error: any) {
  const errorMessage = error.message?.toLowerCase() || ''
  const errorCode = error.code || ''

  // Rate limit errors
  if (errorCode === 'rate_limit_exceeded' || errorMessage.includes('rate limit')) {
    return {
      type: ERROR_TYPES.RATE_LIMIT,
      message: ERROR_MESSAGES[ERROR_TYPES.RATE_LIMIT],
      statusCode: 429
    }
  }

  // Insufficient credits
  if (errorCode === 'insufficient_quota' || errorMessage.includes('quota') || errorMessage.includes('credit')) {
    return {
      type: ERROR_TYPES.INSUFFICIENT_CREDITS,
      message: ERROR_MESSAGES[ERROR_TYPES.INSUFFICIENT_CREDITS],
      statusCode: 402
    }
  }

  // Network errors
  if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('timeout')) {
    return {
      type: ERROR_TYPES.NETWORK_ERROR,
      message: ERROR_MESSAGES[ERROR_TYPES.NETWORK_ERROR],
      statusCode: 503
    }
  }

  // AI service errors
  if (errorCode === 'invalid_api_key' || errorCode === 'server_error' || errorCode === 'service_unavailable') {
    return {
      type: ERROR_TYPES.AI_SERVICE_ERROR,
      message: ERROR_MESSAGES[ERROR_TYPES.AI_SERVICE_ERROR],
      statusCode: 503
    }
  }

  // Database errors
  if (errorMessage.includes('database') || errorMessage.includes('connection')) {
    return {
      type: ERROR_TYPES.DATABASE_ERROR,
      message: ERROR_MESSAGES[ERROR_TYPES.DATABASE_ERROR],
      statusCode: 503
    }
  }

  // Default unknown error
  return {
    type: ERROR_TYPES.UNKNOWN,
    message: ERROR_MESSAGES[ERROR_TYPES.UNKNOWN],
    statusCode: 500
  }
}

/**
 * Validate required fields for each action
 */
function validateRequest(action: string, data: any) {
  const errors: string[] = []

  switch (action) {
    case 'start':
      if (!data.projectData) {
        errors.push('Missing project data')
      }
      if (!data.projectId) {
        errors.push('Missing project ID')
      }
      break

    case 'continue':
      if (!data.projectId) {
        errors.push('Missing project ID')
      }
      if (!data.userMessage) {
        errors.push('Missing user message')
      }
      break

    case 'generate':
      if (!data.projectId) {
        errors.push('Missing project ID')
      }
      break

    case 'accept':
      if (!data.projectId) {
        errors.push('Missing project ID')
      }
      if (!data.deliverables || !Array.isArray(data.deliverables)) {
        errors.push('Missing or invalid deliverables array')
      }
      break

    default:
      errors.push('Invalid action')
  }

  return errors
}

/**
 * Log error for debugging
 */
function logError(context: string, error: any, requestData?: any) {
  console.error(`[${new Date().toISOString()}] ${context}:`, {
    error: error.message,
    code: error.code,
    stack: error.stack,
    requestData: requestData ? JSON.stringify(requestData) : 'N/A'
  })
}

// AI Agent functions with enhanced error handling
async function startConversation(projectSummary: string) {
  try {
    const initialMessage = `I have a new video project. Here are the details:\n\n${projectSummary}\n\nCan you help me create detailed deliverables for this project?`
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4-1106-preview',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: initialMessage }
      ],
      max_tokens: 1000,
      temperature: 0.7,
      stream: false
    })

    return {
      success: true,
      response: response.choices[0].message.content,
      usage: response.usage
    }
  } catch (error) {
    logError('Start conversation error', error, { projectSummary: projectSummary.substring(0, 100) + '...' })
    const errorInfo = categorizeError(error)
    
    return {
      success: false,
      error: errorInfo.message,
      errorType: errorInfo.type,
      statusCode: errorInfo.statusCode
    }
  }
}

async function continueConversation(conversationHistory: any[], userMessage: string) {
  try {
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...conversationHistory,
      { role: 'user', content: userMessage }
    ]

    const response = await openai.chat.completions.create({
      model: 'gpt-4-1106-preview',
      messages: messages,
      max_tokens: 1000,
      temperature: 0.7,
      stream: false
    })

    const aiResponse = response.choices[0].message.content
    const isReadyToGenerate = aiResponse?.includes('Should I generate the final deliverables list?')

    return {
      success: true,
      response: aiResponse,
      isReadyToGenerate: isReadyToGenerate || false,
      usage: response.usage
    }
  } catch (error) {
    logError('Continue conversation error', error, { userMessage: userMessage.substring(0, 100) + '...' })
    const errorInfo = categorizeError(error)
    
    return {
      success: false,
      error: errorInfo.message,
      errorType: errorInfo.type,
      statusCode: errorInfo.statusCode,
      isReadyToGenerate: false
    }
  }
}

async function generateDeliverables(conversationHistory: any[]) {
  try {
    const extractionPrompt = `Based on our conversation, please extract the final deliverables as a JSON array. Each deliverable should be a string with specific, measurable requirements. Return ONLY the JSON array, no other text. Example format: ["Create 60-second product demo video in 4K resolution", "Deliver final MP4 file under 100MB with H.264 codec"]`
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4-1106-preview',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...conversationHistory,
        { role: 'user', content: extractionPrompt }
      ],
      max_tokens: 1000,
      temperature: 0.7,
      stream: false
    })

    const aiResponse = response.choices[0].message.content
    
    // Try to parse the JSON response
    let deliverables: string[] = []
    try {
      // Clean the response to extract JSON
      const jsonMatch = aiResponse?.match(/\[.*\]/s)
      if (jsonMatch) {
        deliverables = JSON.parse(jsonMatch[0])
      } else if (aiResponse) {
        // If no JSON array found, try to parse the entire response
        deliverables = JSON.parse(aiResponse)
      }
    } catch (parseError) {
      console.error('Failed to parse deliverables JSON:', parseError)
      // Fallback: extract deliverables from text
      deliverables = extractDeliverablesFromText(aiResponse || '')
    }

    return {
      success: true,
      deliverables: deliverables,
      rawResponse: aiResponse,
      usage: response.usage
    }
  } catch (error) {
    logError('Generate deliverables error', error)
    const errorInfo = categorizeError(error)
    
    return {
      success: false,
      error: errorInfo.message,
      errorType: errorInfo.type,
      statusCode: errorInfo.statusCode,
      deliverables: []
    }
  }
}

function extractDeliverablesFromText(text: string): string[] {
  const deliverables: string[] = []
  const lines = text.split('\n')
  
  for (const line of lines) {
    const trimmedLine = line.trim()
    // Look for lines that start with numbers, dashes, or bullet points
    if (trimmedLine.match(/^(\d+\.|-|\*)\s+/)) {
      const deliverable = trimmedLine.replace(/^(\d+\.|-|\*)\s+/, '').trim()
      if (deliverable.length > 10) { // Minimum length for a meaningful deliverable
        deliverables.push(deliverable)
      }
    }
  }
  
  return deliverables
}

// Project summary generator function
async function generateProjectSummary(projectData: any) {
  try {
    const {
      name = 'Unnamed Project',
      requirements = 'No requirements specified',
      files = [],
      deliverables = [],
      freelancer_id = 'Unknown',
      completion_date = 'Not specified'
    } = projectData

    // Process deliverables
    let deliverablesText = 'None yet'
    if (deliverables && deliverables.length > 0) {
      const deliverableList = deliverables.map((deliverable: any) => {
        if (typeof deliverable === 'string') {
          return deliverable
        } else if (deliverable && deliverable.deliverable_text) {
          return deliverable.deliverable_text
        } else if (deliverable && deliverable.text) {
          return deliverable.text
        }
        return 'Unknown deliverable'
      }).join(', ')
      
      deliverablesText = deliverableList || 'None yet'
    }

    // Assess project scope
    const scope = assessProjectScope(requirements, files.length)
    const formattedDate = formatCompletionDate(completion_date)

    const summary = `PROJECT: ${name}
REQUIREMENTS: ${requirements}
TIMELINE: Due ${formattedDate}, assigned to freelancer ${freelancer_id}
UPLOADED FILES: ${files.length > 0 ? 'Files uploaded' : 'No files uploaded'}
EXISTING DELIVERABLES: ${deliverablesText}
SCOPE: ${scope}`

    return summary
  } catch (error) {
    logError('Error generating project summary', error, { projectData })
    return `PROJECT: ${projectData.name || 'Unknown Project'}
REQUIREMENTS: Error generating summary
TIMELINE: Due ${projectData.completion_date || 'Not specified'}, assigned to freelancer ${projectData.freelancer_id || 'Unknown'}
UPLOADED FILES: Error processing files
EXISTING DELIVERABLES: Error processing deliverables
SCOPE: Unknown`
  }
}

function assessProjectScope(requirements: string, fileCount: number): string {
  const requirementsLength = requirements.length
  const wordCount = requirements.split(/\s+/).length
  
  let score = 0
  
  if (requirementsLength < 100) score += 1
  else if (requirementsLength < 500) score += 2
  else score += 3
  
  if (wordCount < 20) score += 1
  else if (wordCount < 100) score += 2
  else score += 3
  
  if (fileCount === 0) score += 1
  else if (fileCount < 3) score += 2
  else score += 3
  
  if (score <= 4) return 'simple'
  else if (score <= 7) return 'medium'
  else return 'complex'
}

function formatCompletionDate(completionDate: string): string {
  if (!completionDate || completionDate === 'Not specified') {
    return 'Not specified'
  }
  
  try {
    const date = new Date(completionDate)
    if (isNaN(date.getTime())) {
      return completionDate
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch (error) {
    return completionDate
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body
    let requestData
    try {
      requestData = await req.json()
    } catch (parseError) {
      logError('Request parsing error', parseError)
      return new Response(
        JSON.stringify({ 
          error: 'Invalid JSON in request body',
          errorType: ERROR_TYPES.VALIDATION_ERROR
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { action, projectId, userMessage, projectData, deliverables } = requestData
    
    // Validate required fields
    if (!action) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing action parameter',
          errorType: ERROR_TYPES.VALIDATION_ERROR
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate action-specific fields
    const validationErrors = validateRequest(action, requestData)
    if (validationErrors.length > 0) {
      return new Response(
        JSON.stringify({ 
          error: validationErrors.join(', '),
          errorType: ERROR_TYPES.VALIDATION_ERROR
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    let result: any = {}

    switch (action) {
      case 'start':
        // Generate project summary
        const projectSummary = await generateProjectSummary(projectData)
        
        // Start conversation
        const startResult = await startConversation(projectSummary)
        
        if (startResult.success) {
          // Save conversation to database
          const conversationData = [
            { role: 'user', content: `I have a new video project. Here are the details:\n\n${projectSummary}\n\nCan you help me create detailed deliverables for this project?` },
            { role: 'assistant', content: startResult.response }
          ]

          try {
            const { error: dbError } = await supabase
              .from('deliverables')
              .update({ ai_chat_messages: conversationData })
              .eq('project_id', projectId)

            if (dbError) {
              logError('Database error during start conversation', dbError, { projectId })
              // Don't fail the request if database save fails
              console.warn('Failed to save conversation to database, but continuing with response')
            }
          } catch (dbError) {
            logError('Database connection error during start conversation', dbError, { projectId })
            console.warn('Database connection failed, but continuing with response')
          }
        }

        result = startResult
        break

      case 'continue':
        // Get conversation history from database
        let conversationHistory: any[] = []
        try {
          const { data: deliverableData, error: fetchError } = await supabase
            .from('deliverables')
            .select('ai_chat_messages')
            .eq('project_id', projectId)
            .single()

          if (fetchError) {
            logError('Error fetching conversation history', fetchError, { projectId })
            return new Response(
              JSON.stringify({ 
                error: 'Failed to fetch conversation history',
                errorType: ERROR_TYPES.DATABASE_ERROR
              }),
              { 
                status: 500, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              }
            )
          }

          conversationHistory = deliverableData?.ai_chat_messages || []
        } catch (dbError) {
          logError('Database connection error during continue conversation', dbError, { projectId })
          return new Response(
            JSON.stringify({ 
              error: 'Database connection failed',
              errorType: ERROR_TYPES.DATABASE_ERROR
            }),
            { 
              status: 503, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }
        
        // Continue conversation
        const continueResult = await continueConversation(conversationHistory, userMessage)
        
        if (continueResult.success) {
          // Update conversation in database
          try {
            const updatedHistory = [
              ...conversationHistory,
              { role: 'user', content: userMessage },
              { role: 'assistant', content: continueResult.response }
            ]

            const { error: updateError } = await supabase
              .from('deliverables')
              .update({ ai_chat_messages: updatedHistory })
              .eq('project_id', projectId)

            if (updateError) {
              logError('Database update error during continue conversation', updateError, { projectId })
              console.warn('Failed to update conversation in database, but continuing with response')
            }
          } catch (dbError) {
            logError('Database connection error during continue conversation update', dbError, { projectId })
            console.warn('Database connection failed during update, but continuing with response')
          }
        }

        result = continueResult
        break

      case 'generate':
        // Get conversation history from database
        let generateHistory: any[] = []
        try {
          const { data: generateData, error: generateFetchError } = await supabase
            .from('deliverables')
            .select('ai_chat_messages')
            .eq('project_id', projectId)
            .single()

          if (generateFetchError) {
            logError('Error fetching conversation history for generation', generateFetchError, { projectId })
            return new Response(
              JSON.stringify({ 
                error: 'Failed to fetch conversation history',
                errorType: ERROR_TYPES.DATABASE_ERROR
              }),
              { 
                status: 500, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              }
            )
          }

          generateHistory = generateData?.ai_chat_messages || []
        } catch (dbError) {
          logError('Database connection error during generate deliverables', dbError, { projectId })
          return new Response(
            JSON.stringify({ 
              error: 'Database connection failed',
              errorType: ERROR_TYPES.DATABASE_ERROR
            }),
            { 
              status: 503, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }
        
        // Generate deliverables
        const generateResult = await generateDeliverables(generateHistory)
        
        if (generateResult.success) {
          // Update conversation with generation result
          try {
            const finalHistory = [
              ...generateHistory,
              { role: 'user', content: 'Please generate the final deliverables list.' },
              { role: 'assistant', content: `Generated deliverables:\n${generateResult.deliverables.map((d: string, i: number) => `${i + 1}. ${d}`).join('\n')}` }
            ]

            const { error: finalUpdateError } = await supabase
              .from('deliverables')
              .update({ ai_chat_messages: finalHistory })
              .eq('project_id', projectId)

            if (finalUpdateError) {
              logError('Database final update error during generate deliverables', finalUpdateError, { projectId })
              console.warn('Failed to update conversation in database, but continuing with response')
            }
          } catch (dbError) {
            logError('Database connection error during generate deliverables update', dbError, { projectId })
            console.warn('Database connection failed during update, but continuing with response')
          }
        }

        result = generateResult
        break

      case 'accept':
        // Update project with final deliverables
        try {
          const { error: acceptError } = await supabase
            .from('deliverables')
            .update({ 
              deliverable_text: deliverables.join('\n'),
              ai_chat_messages: null // Clear chat messages after acceptance
            })
            .eq('project_id', projectId)

          if (acceptError) {
            logError('Error accepting deliverables', acceptError, { projectId })
            return new Response(
              JSON.stringify({ 
                error: 'Failed to save deliverables',
                errorType: ERROR_TYPES.DATABASE_ERROR
              }),
              { 
                status: 500, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              }
            )
          }
        } catch (dbError) {
          logError('Database connection error during accept deliverables', dbError, { projectId })
          return new Response(
            JSON.stringify({ 
              error: 'Database connection failed',
              errorType: ERROR_TYPES.DATABASE_ERROR
            }),
            { 
              status: 503, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        result = {
          success: true,
          message: 'Deliverables saved successfully'
        }
        break

      default:
        return new Response(
          JSON.stringify({ 
            error: 'Invalid action. Supported actions: start, continue, generate, accept',
            errorType: ERROR_TYPES.VALIDATION_ERROR
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
    }
    
    // Return appropriate status code based on result
    const statusCode = result.success ? 200 : (result.statusCode || 500)
    
    return new Response(
      JSON.stringify(result),
      { 
        status: statusCode,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    logError('Unexpected error in ai-chat function', error)
    const errorInfo = categorizeError(error)
    
    return new Response(
      JSON.stringify({ 
        error: errorInfo.message,
        errorType: errorInfo.type,
        details: error.message 
      }),
      { 
        status: errorInfo.statusCode, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 