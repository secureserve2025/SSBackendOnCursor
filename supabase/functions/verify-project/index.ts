import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai@0.2.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Initialize Google AI client
const geminiApiKey = Deno.env.get('GOOGLE_AI_API_KEY')!
const genAI = new GoogleGenerativeAI(geminiApiKey)

// System prompt for project verification
const VERIFICATION_PROMPT = `You are a deliverable verification expert. Based on the deliverables and the submitted video, you must verify how much of each deliverable has been completed. Your response must be structured, concise, and consistent. Use numeric % values. Indicate if the submission is on time or late.

VERIFICATION PROCESS:
1. Analyze each deliverable against the submitted work
2. Assign a completion percentage (0-100%) for each deliverable
3. Calculate an overall completion score
4. Provide specific feedback on what was completed and what needs improvement
5. Determine if the submission is on time or late

RESPONSE FORMAT:
- Overall Completion: [X]%
- Deliverable 1: [X]% - [specific feedback]
- Deliverable 2: [X]% - [specific feedback]
- Timeline Status: [On Time/Late]
- Summary: [brief overall assessment]`

interface ProjectDetails {
  id: string
  name: string
  requirements: string
  deliverables: any[]
  video_info?: any
  completion_date?: string
}

interface VerificationResult {
  verification_score: number
  report_content: string
  project_id: string
}

/**
 * Fetch project details from database
 */
async function fetchProjectDetails(projectId: string): Promise<ProjectDetails | null> {
  try {
    const { data: project, error } = await supabase
      .from('projects')
      .select(`
        id,
        name,
        requirements,
        completion_date,
        deliverables (
          deliverable_text
        ),
        work_products (
          file_path,
          file_name,
          file_type,
          file_size
        )
      `)
      .eq('id', projectId)
      .single()

    if (error) {
      console.error('Error fetching project details:', error)
      return null
    }

    // Extract deliverables
    const deliverables = project.deliverables?.map((d: any) => d.deliverable_text) || []
    
    // Extract video info
    const videoInfo = project.work_products?.find((wp: any) => 
      wp.file_type?.includes('video') || wp.file_name?.toLowerCase().includes('video')
    )

    return {
      id: project.id,
      name: project.name,
      requirements: project.requirements,
      deliverables: deliverables,
      video_info: videoInfo,
      completion_date: project.completion_date
    }
  } catch (error) {
    console.error('Error in fetchProjectDetails:', error)
    return null
  }
}

/**
 * Call Gemini AI for project verification
 */
async function callAIModel(projectDetails: ProjectDetails): Promise<VerificationResult> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" })

    // Format project data for AI
    const projectData = `
PROJECT: ${projectDetails.name}
REQUIREMENTS: ${projectDetails.requirements}
DELIVERABLES: ${projectDetails.deliverables.join('\n')}
VIDEO SUBMISSION: ${projectDetails.video_info ? 'Video file submitted' : 'No video file submitted'}
COMPLETION DATE: ${projectDetails.completion_date || 'Not specified'}
    `.trim()

    const prompt = `${VERIFICATION_PROMPT}

Please verify this project:

${projectData}

Provide your verification analysis:`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Extract verification score from response
    const scoreMatch = text.match(/Overall Completion:\s*(\d+)%/)
    const verificationScore = scoreMatch ? parseInt(scoreMatch[1]) : 0

    return {
      verification_score: verificationScore,
      report_content: text,
      project_id: projectDetails.id
    }
  } catch (error) {
    console.error('Error calling AI model:', error)
    throw error
  }
}

/**
 * Save verification report to database
 */
async function saveVerificationReport(projectId: string, aiResponse: VerificationResult) {
  try {
    const { data, error } = await supabase
      .from('verification_reports')
      .insert({
        project_id: projectId,
        report_title: "AI Verification Report",
        report_content: aiResponse.report_content,
        report_type: "auto-ai",
        verification_status: "completed",
        verified_by: "Gemini Pro 2.5",
        verification_score: aiResponse.verification_score,
        verification_notes: null,
        file_path: null,
        file_type: null,
        file_size: null,
        storage_bucket: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving verification report:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error in saveVerificationReport:', error)
    throw error
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
      console.error('Request parsing error:', parseError)
      return new Response(
        JSON.stringify({ 
          error: 'Invalid JSON in request body'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { project_id } = requestData

    // Validate required fields
    if (!project_id) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing project_id parameter'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Step 1: Fetch project details
    console.log('Fetching project details for:', project_id)
    const projectDetails = await fetchProjectDetails(project_id)
    
    if (!projectDetails) {
      return new Response(
        JSON.stringify({ 
          error: 'Project not found'
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Step 2: Call AI model for verification
    console.log('Calling AI model for verification')
    const aiResponse = await callAIModel(projectDetails)

    // Step 3: Save verification report to database
    console.log('Saving verification report')
    const reportData = await saveVerificationReport(project_id, aiResponse)

    // Step 4: Return success response
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          report_id: reportData.id,
          verification_score: aiResponse.verification_score,
          report_title: "AI Verification Report",
          report_content: aiResponse.report_content,
          project_id: project_id
        }
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error in verify-project function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 