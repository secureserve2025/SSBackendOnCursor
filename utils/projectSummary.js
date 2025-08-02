// Dynamic import to avoid pdf-parse initialization issues
// import { analyzeFiles } from './fileAnalyzer.js';

/**
 * Generates a structured project summary for AI processing
 * @param {Object} projectData - Project information object
 * @param {string} projectData.name - Project name
 * @param {string} projectData.requirements - Project requirements text
 * @param {Array} projectData.files - Array of uploaded file objects
 * @param {Array} projectData.deliverables - Array of existing deliverables
 * @param {string} projectData.freelancer_id - Freelancer ID
 * @param {string} projectData.completion_date - Desired completion date
 * @returns {Promise<string>} - Structured project summary
 */
export const generateProjectSummary = async (projectData) => {
  try {
    const {
      name = 'Unnamed Project',
      requirements = 'No requirements specified',
      files = [],
      deliverables = [],
      freelancer_id = 'Unknown',
      completion_date = 'Not specified'
    } = projectData;

    // Process uploaded files using the file analyzer (dynamic import)
    let fileSummary = 'No files uploaded';
    if (files && files.length > 0) {
      try {
        // Dynamic import to avoid pdf-parse initialization issues
        const { analyzeFiles } = await import('./fileAnalyzer.js');
        const fileAnalysis = await analyzeFiles(files);
        fileSummary = fileAnalysis.summary || 'Files uploaded but content could not be extracted';
      } catch (error) {
        console.error('Error analyzing files:', error);
        fileSummary = 'Files uploaded but analysis failed';
      }
    }

    // Process deliverables
    let deliverablesText = 'None yet';
    if (deliverables && deliverables.length > 0) {
      const deliverableList = deliverables.map(deliverable => {
        if (typeof deliverable === 'string') {
          return deliverable;
        } else if (deliverable && deliverable.deliverable_text) {
          return deliverable.deliverable_text;
        } else if (deliverable && deliverable.text) {
          return deliverable.text;
        }
        return 'Unknown deliverable';
      }).join(', ');
      
      deliverablesText = deliverableList || 'None yet';
    }

    // Assess project scope based on requirements length and file count
    const scope = assessProjectScope(requirements, files.length);

    // Format completion date
    const formattedDate = formatCompletionDate(completion_date);

    // Generate the structured summary
    const summary = `PROJECT: ${name}
REQUIREMENTS: ${requirements}
TIMELINE: Due ${formattedDate}, assigned to freelancer ${freelancer_id}
UPLOADED FILES: ${fileSummary}
EXISTING DELIVERABLES: ${deliverablesText}
SCOPE: ${scope}`;

    // Ensure the summary doesn't exceed 500 words
    return truncateToWordLimit(summary, 500);

  } catch (error) {
    console.error('Error generating project summary:', error);
    return `PROJECT: ${projectData.name || 'Unknown Project'}
REQUIREMENTS: Error generating summary
TIMELINE: Due ${projectData.completion_date || 'Not specified'}, assigned to freelancer ${projectData.freelancer_id || 'Unknown'}
UPLOADED FILES: Error processing files
EXISTING DELIVERABLES: Error processing deliverables
SCOPE: Unknown`;
  }
};

/**
 * Assesses project scope based on requirements and file count
 * @param {string} requirements - Project requirements text
 * @param {number} fileCount - Number of uploaded files
 * @returns {string} - Scope assessment (simple/medium/complex)
 */
const assessProjectScope = (requirements, fileCount) => {
  const requirementsLength = requirements.length;
  const wordCount = requirements.split(/\s+/).length;
  
  // Scoring system
  let score = 0;
  
  // Requirements length scoring
  if (requirementsLength < 100) score += 1;
  else if (requirementsLength < 500) score += 2;
  else score += 3;
  
  // Word count scoring
  if (wordCount < 20) score += 1;
  else if (wordCount < 100) score += 2;
  else score += 3;
  
  // File count scoring
  if (fileCount === 0) score += 1;
  else if (fileCount < 3) score += 2;
  else score += 3;
  
  // Determine scope based on total score
  if (score <= 4) return 'simple';
  else if (score <= 7) return 'medium';
  else return 'complex';
};

/**
 * Formats completion date for display
 * @param {string} completionDate - Raw completion date
 * @returns {string} - Formatted date string
 */
const formatCompletionDate = (completionDate) => {
  if (!completionDate || completionDate === 'Not specified') {
    return 'Not specified';
  }
  
  try {
    // Try to parse and format the date
    const date = new Date(completionDate);
    if (isNaN(date.getTime())) {
      return completionDate; // Return as-is if not a valid date
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    return completionDate; // Return as-is if formatting fails
  }
};

/**
 * Truncates text to a specific word limit
 * @param {string} text - Text to truncate
 * @param {number} wordLimit - Maximum number of words
 * @returns {string} - Truncated text
 */
const truncateToWordLimit = (text, wordLimit) => {
  const words = text.split(/\s+/);
  
  if (words.length <= wordLimit) {
    return text;
  }
  
  const truncatedWords = words.slice(0, wordLimit);
  return truncatedWords.join(' ') + '...';
};

/**
 * Helper function to validate project data
 * @param {Object} projectData - Project data to validate
 * @returns {boolean} - Whether the data is valid
 */
export const validateProjectData = (projectData) => {
  if (!projectData || typeof projectData !== 'object') {
    return false;
  }
  
  // At minimum, we need a project name
  if (!projectData.name || typeof projectData.name !== 'string') {
    return false;
  }
  
  return true;
};

export default generateProjectSummary; 