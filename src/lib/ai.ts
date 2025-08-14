import { GoogleGenerativeAI } from '@google/generative-ai';
import { getISTDateForInput } from './istUtils';

// Initialize Google AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

interface ProjectDetails {
  project_id: string;
  project_name: string;
  freelancer_id: string;
  desired_completion_date: string;
  last_video_upload_date: string | null;
  final_video_url: string | null;
  deliverables: Array<{
    deliverable_order: number;
    deliverable_text: string;
  }>;
}

interface AIResponse {
  success: boolean;
  verification_score: number;
  report_content: string;
  error?: string;
}

export const callAIModel = async (projectDetails: ProjectDetails): Promise<AIResponse> => {
  try {
    console.log('Calling AI model for project verification:', projectDetails.project_id);

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // System prompt
    const systemPrompt = `You are a deliverable verification expert. Based on the deliverables and the submitted video, you must verify how much of each deliverable has been completed. Your response must be structured, concise, and consistent. Use numeric % values. Indicate if the submission is on time or late.

VERIFICATION PROCESS:
1. Analyze each deliverable against the submitted work
2. Assign a completion percentage (0-100%) for each deliverable
3. Calculate an overall completion score
4. Provide specific feedback on what was completed and what needs improvement
5. Determine if the submission is on time or late

RESPONSE FORMAT:

Project Name: [Insert the actual project name from the Project Name field in the input data]

- Overall Completion: [X]%

- Deliverable 1: [X]% - [specific feedback]
- Deliverable 2: [X]% - [specific feedback]

- Timeline Status: [Before time/On time/Late by X days]
  * Use 'Before time' if CURRENT DATE is less than DESIRED COMPLETION DATE
  * Use 'On time' if CURRENT DATE matches DESIRED COMPLETION DATE
  * Use 'Late by X days' if CURRENT DATE is after DESIRED COMPLETION DATE (where X = CURRENT DATE - DESIRED COMPLETION DATE)

- SUMMARY: [brief overall assessment]`;

    // User prompt with project details
    const currentDate = getISTDateForInput(); // Get current date in IST (YYYY-MM-DD format)
    const userPrompt = `
Project ID: ${projectDetails.project_id}
Project Name: ${projectDetails.project_name}
Freelancer ID: ${projectDetails.freelancer_id}
Desired Completion Date: ${projectDetails.desired_completion_date}
Current Date: ${currentDate}
Last Video Upload Date: ${projectDetails.last_video_upload_date || 'No video uploaded'}
Final Video URL: ${projectDetails.final_video_url || 'No video URL available'}

Deliverables:
${projectDetails.deliverables.map(d => `${d.deliverable_order}. ${d.deliverable_text}`).join('\n')}

Please verify this project and provide your analysis in the specified format.
    `;

    // Create the full prompt with system and user parts
    const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    // Extract the overall completion score from the response
    // Look for "Overall Completion:" followed by a number
    const overallCompletionRegex = /Overall Completion:\s*(\d+)/i;
    const overallCompletionMatch = text.match(overallCompletionRegex);
    const verificationScore = overallCompletionMatch ? parseInt(overallCompletionMatch[1]) : 75; // Default to 75% if no score found

    console.log('AI verification completed with score:', verificationScore);

    return {
      success: true,
      verification_score: verificationScore,
      report_content: text
    };

  } catch (error) {
    console.error('Error calling AI model:', error);
    return {
      success: false,
      verification_score: 0,
      report_content: 'AI verification failed due to technical error.',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}; 