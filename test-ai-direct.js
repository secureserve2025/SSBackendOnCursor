// Simple test for direct AI agent usage
// This can be run in the browser console

import { startConversation } from './services/aiVideoAgent.js';
import { generateProjectSummary } from './utils/projectSummary.js';

// Test data
const testProjectData = {
  name: 'Test Video Project',
  requirements: 'Create a 60-second promotional video for our new product',
  files: [],
  deliverables: [],
  freelancer_id: 'test-freelancer-123',
  completion_date: '2024-12-31'
};

// Test function
async function testAIDirect() {
  try {
    console.log('Testing direct AI agent...');
    console.log('Project data:', testProjectData);
    
    // Generate project summary
    const projectSummary = await generateProjectSummary(testProjectData);
    console.log('Project summary:', projectSummary);
    
    // Start conversation
    const response = await startConversation(projectSummary);
    console.log('AI response:', response);
    
    if (response.success) {
      console.log('✅ Direct AI test successful!');
      console.log('AI response:', response.response);
    } else {
      console.log('❌ Direct AI test failed:', response.error);
    }
  } catch (error) {
    console.error('❌ Direct AI test error:', error);
  }
}

// Export for browser console testing
window.testAIDirect = testAIDirect;
console.log('Test function available: testAIDirect()'); 