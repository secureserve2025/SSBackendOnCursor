import { supabase } from '../lib/supabase';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Google AI client
const geminiApiKey = import.meta.env.VITE_GOOGLE_AI_API_KEY || process.env.GOOGLE_AI_API_KEY;

// Debug environment variables
console.log('Gemini API Key check:');
console.log('VITE_GOOGLE_AI_API_KEY exists:', !!import.meta.env.VITE_GOOGLE_AI_API_KEY);
console.log('VITE_GOOGLE_AI_API_KEY length:', import.meta.env.VITE_GOOGLE_AI_API_KEY?.length);
console.log('process.env.GOOGLE_AI_API_KEY exists:', !!process.env.GOOGLE_AI_API_KEY);
console.log('Final geminiApiKey exists:', !!geminiApiKey);
console.log('Final geminiApiKey length:', geminiApiKey?.length);

if (!geminiApiKey) {
  console.error('Gemini API key is not configured!');
  throw new Error('Gemini API key is not configured. Please add GOOGLE_AI_API_KEY to your .env file.');
}

const genAI = new GoogleGenerativeAI(geminiApiKey);

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
- Summary: [brief overall assessment]`;

interface ProjectDetails {
  id: string;
  name: string;
  requirements: string;
  deliverables: any[];
  video_info?: any;
  completion_date?: string;
}

interface VerificationResult {
  verification_score: number;
  report_content: string;
  project_id: string;
}

/**
 * Fetch project details from database
 */
async function fetchProjectDetails(projectId: string): Promise<ProjectDetails | null> {
  try {
    console.log('Attempting to fetch project details for:', projectId);
    console.log('Supabase client configured:', !!supabase);
    
    // Check if Supabase is properly configured
    if (!supabase) {
      console.error('Supabase client is not configured');
      throw new Error('Supabase client is not configured');
    }

    // First, let's try a simple query to get basic project details
    const { data: project, error } = await supabase
      .from('projects')
      .select(`
        id,
        project_id,
        project_name,
        project_requirement,
        desired_completion_date
      `)
      .eq('project_id', projectId)
      .single();

    if (error) {
      console.error('Error fetching project details:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return null;
    }

    console.log('Project details fetched successfully:', project);

    // Fetch work products (videos) for this project
    const { data: workProducts, error: workProductsError } = await supabase
      .from('work_products')
      .select(`
        file_path,
        file_name,
        file_type,
        file_size,
        upload_status,
        created_at
      `)
      .eq('project_id', project.id)
      .order('created_at', { ascending: false });

    if (workProductsError) {
      console.error('Error fetching work products:', workProductsError);
    }

    console.log('Work products fetched:', workProducts);

    // Fetch deliverables for this project
    const { data: deliverablesData, error: deliverablesError } = await supabase
      .from('deliverables')
      .select(`
        deliverable_text,
        deliverable_order
      `)
      .eq('project_id', project.id)
      .order('deliverable_order', { ascending: true });

    if (deliverablesError) {
      console.error('Error fetching deliverables:', deliverablesError);
    }

    console.log('Deliverables fetched:', deliverablesData);

    // Extract video info from work products
    const videoInfo = workProducts && workProducts.length > 0 ? workProducts[0] : null;
    const deliverables = deliverablesData ? deliverablesData.map(d => d.deliverable_text) : [];

    return {
      id: project.project_id,
      uuid: project.id, // Add the actual UUID for database references
      name: project.project_name,
      requirements: project.project_requirement,
      deliverables: deliverables,
      video_info: videoInfo,
      completion_date: project.desired_completion_date
    };
  } catch (error) {
    console.error('Error in fetchProjectDetails:', error);
    console.error('Error type:', typeof error);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

/**
 * Call Gemini AI for project verification
 */
async function callAIModel(projectDetails: ProjectDetails): Promise<VerificationResult> {
  try {
    // Try different models in order of preference
    const models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"];
    let model;
    let lastError;
    
    for (const modelName of models) {
      try {
        console.log(`Trying model: ${modelName}`);
        model = genAI.getGenerativeModel({ model: modelName });
        break; // If successful, break out of the loop
      } catch (error) {
        console.log(`Model ${modelName} failed:`, error);
        lastError = error;
        continue;
      }
    }
    
    if (!model) {
      throw new Error(`All Gemini models failed. Last error: ${lastError}`);
    }

    // Format project data for AI
    const videoDetails = projectDetails.video_info ? 
      `VIDEO FILE: ${projectDetails.video_info.file_name}
VIDEO PATH: ${projectDetails.video_info.file_path}
VIDEO TYPE: ${projectDetails.video_info.file_type}
VIDEO SIZE: ${projectDetails.video_info.file_size} bytes
UPLOAD STATUS: ${projectDetails.video_info.upload_status}
UPLOAD DATE: ${projectDetails.video_info.created_at}` : 
      'No video file submitted';

    const projectData = `
PROJECT: ${projectDetails.name}
REQUIREMENTS: ${projectDetails.requirements}
DELIVERABLES: ${projectDetails.deliverables.join('\n')}
VIDEO SUBMISSION: ${videoDetails}
COMPLETION DATE: ${projectDetails.completion_date || 'Not specified'}
    `.trim();

    const prompt = `${VERIFICATION_PROMPT}

Please verify this project:

${projectData}

Provide your verification analysis:`;

    // Add retry logic for rate limiting
    let result;
    let response;
    let text;
    let retries = 0;
    const maxRetries = 3;
    
    while (retries < maxRetries) {
      try {
        console.log(`Attempt ${retries + 1} of ${maxRetries}`);
        result = await model.generateContent(prompt);
        response = await result.response;
        text = response.text();
        break; // Success, exit the retry loop
      } catch (error) {
        retries++;
        console.log(`Attempt ${retries} failed:`, error);
        
        if (retries >= maxRetries) {
          throw error; // Re-throw the error if we've exhausted retries
        }
        
        // Wait before retrying (exponential backoff)
        const waitTime = Math.pow(2, retries) * 1000; // 2s, 4s, 8s
        console.log(`Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    // Extract verification score from response
    const scoreMatch = text.match(/Overall Completion:\s*(\d+)%/);
    const verificationScore = scoreMatch ? parseInt(scoreMatch[1]) : 0;
    
    // Convert percentage (0-100) to decimal (0.00-1.00) for database
    const verificationScoreDecimal = verificationScore / 100;

    return {
      verification_score: verificationScoreDecimal, // Use decimal for database
      report_content: text,
      project_id: projectDetails.id
    };
  } catch (error) {
    console.error('Error calling AI model:', error);
    throw error;
  }
}

/**
 * Save verification report to database
 */
async function saveVerificationReport(projectUuid: string, aiResponse: VerificationResult) {
  try {
    // Only include essential fields to avoid constraint issues
    const { data, error } = await supabase
      .from('verification_reports')
      .insert({
        project_id: projectUuid,
        report_title: "AI Verification Report",
        report_content: aiResponse.report_content,
        verified_by: "Gemini Pro 2.5",
        verification_score: aiResponse.verification_score
        // Let other fields use their defaults or be null
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving verification report:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in saveVerificationReport:', error);
    throw error;
  }
}

/**
 * Main verification function
 */
export async function verifyProject(projectId: string) {
  try {
    console.log('Starting verification process for project:', projectId);
    
    // Step 1: Fetch project details
    console.log('Step 1: Fetching project details for:', projectId);
    const projectDetails = await fetchProjectDetails(projectId);
    
    if (!projectDetails) {
      console.error('Project not found or could not be fetched');
      return {
        success: false,
        error: 'Project not found or could not be fetched',
        details: 'The project details could not be retrieved from the database'
      };
    }

    console.log('Project details fetched successfully:', projectDetails);

    // Step 2: Call AI model for verification
    console.log('Step 2: Calling AI model for verification');
    const aiResponse = await callAIModel(projectDetails);

    // Step 3: Save verification report to database
    console.log('Step 3: Saving verification report');
    const reportData = await saveVerificationReport(projectDetails.uuid, aiResponse);

    // Step 4: Return success response
    console.log('Step 4: Returning success response');
    return {
      success: true,
      data: {
        report_id: reportData.id,
        verification_score: aiResponse.verification_score * 100, // Convert back to percentage for display
        report_title: "AI Verification Report",
        report_content: aiResponse.report_content,
        project_id: projectId
      }
    };

  } catch (error) {
    console.error('Unexpected error in verifyProject function:', error);
    console.error('Error type:', typeof error);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return {
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
} 