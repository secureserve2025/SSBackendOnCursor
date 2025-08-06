import { GoogleGenerativeAI } from '@google/generative-ai';

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
    const systemPrompt = "You are a deliverable verification expert. Based on the deliverables and the submitted video, you must verify how much of each deliverable has been completed. Your response must be structured, concise, and consistent. Use numeric % values. Indicate if the submission is on time or late.";

    // User prompt with project details
    const userPrompt = `
Project ID: ${projectDetails.project_id}
Project Name: ${projectDetails.project_name}
Freelancer ID: ${projectDetails.freelancer_id}
Desired Completion Date: ${projectDetails.desired_completion_date}
Last Video Upload Date: ${projectDetails.last_video_upload_date || 'No video uploaded'}
Final Video URL: ${projectDetails.final_video_url || 'No video URL available'}

Deliverables:
${projectDetails.deliverables.map(d => `${d.deliverable_order}. ${d.deliverable_text}`).join('\n')}

Please return the report in this exact format:

Project ID: ${projectDetails.project_id}
Project Name: ${projectDetails.project_name}
Desired Completion Date: ${projectDetails.desired_completion_date}
Freelancer ID: ${projectDetails.freelancer_id}

Deliverables Checklist
Deliverable 1: % achieved – Analysis Findings for Deliverable 1
Deliverable 2: % achieved - Analysis Findings for Deliverable 2
...
Total % match:
Timeline Status: On time / Late by X days
    `;

    // Create the full prompt with system and user parts
    const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    // Extract the total % match from the response
    // Look for "Total % match:" followed by a number
    const totalMatchRegex = /Total % match:\s*(\d+)/i;
    const totalMatchMatch = text.match(totalMatchRegex);
    const verificationScore = totalMatchMatch ? parseInt(totalMatchMatch[1]) : 75; // Default to 75% if no score found

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