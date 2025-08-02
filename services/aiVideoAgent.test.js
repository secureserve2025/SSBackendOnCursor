import aiVideoAgent, { startConversation, continueConversation, generateDeliverables } from './aiVideoAgent.js';

// Example usage of the AI Video Agent
const testAIVideoAgent = async () => {
  console.log('AI Video Agent Test');
  console.log('===================');
  
  try {
    // Initialize the AI agent
    aiVideoAgent.initialize();
    
    // Example project data
    const projectData = {
      name: 'Product Launch Video',
      requirements: 'Create a promotional video for our new mobile app that highlights key features and benefits',
      files: [],
      deliverables: [],
      freelancer_id: 'FL12345',
      completion_date: '2024-03-15'
    };

    // Example user query
    const userQuery = 'I need a video for my mobile app launch. Can you help me create deliverables?';
    
    console.log('\n1. Testing AI Agent with project context...');
    console.log('User Query:', userQuery);
    
    // Process the project with AI
    const response = await aiVideoAgent.processProject(projectData, userQuery);
    
    if (response.success) {
      console.log('\nAI Response:');
      console.log(response.response);
      console.log('\nUsage:', response.usage);
    } else {
      console.log('\nError:', response.error);
    }

    // Test conversation history
    console.log('\n2. Testing conversation history...');
    const history = aiVideoAgent.getHistory();
    console.log('Conversation History Length:', history.length);
    
    // Test clearing history
    console.log('\n3. Testing history clearing...');
    aiVideoAgent.clearHistory();
    console.log('History cleared. New length:', aiVideoAgent.getHistory().length);

    // Test new functions
    console.log('\n4. Testing startConversation...');
    const projectSummary = `PROJECT: Product Launch Video
REQUIREMENTS: Create a promotional video for our new mobile app that highlights key features and benefits
TIMELINE: Due March 15, 2024, assigned to freelancer FL12345
UPLOADED FILES: No files uploaded
EXISTING DELIVERABLES: None yet
SCOPE: medium`;

    const startResponse = await startConversation(projectSummary);
    if (startResponse.success) {
      console.log('Start Conversation Response:', startResponse.response);
    }

    console.log('\n5. Testing continueConversation...');
    const conversationHistory = [
      { role: 'user', content: 'I need a video for my mobile app launch' },
      { role: 'assistant', content: 'I understand you need a promotional video for your mobile app launch. Let me ask a few questions to better understand your requirements.' }
    ];
    
    const continueResponse = await continueConversation(conversationHistory, 'What specific features should we highlight?');
    if (continueResponse.success) {
      console.log('Continue Conversation Response:', continueResponse.response);
    }

    console.log('\n6. Testing generateDeliverables...');
    const fullHistory = [
      { role: 'user', content: 'I need a video for my mobile app launch' },
      { role: 'assistant', content: 'I understand you need a promotional video for your mobile app launch. Let me ask a few questions to better understand your requirements.' },
      { role: 'user', content: 'What specific features should we highlight?' },
      { role: 'assistant', content: 'Based on our conversation, here are the deliverables: 1. Create 60-second product demo video in 4K resolution, 2. Deliver final MP4 file under 100MB with H.264 codec' }
    ];
    
    const deliverablesResponse = await generateDeliverables(fullHistory);
    if (deliverablesResponse.success) {
      console.log('Generated Deliverables:', deliverablesResponse.deliverables);
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
};

// Example of how to use in a real application
const exampleUsage = () => {
  console.log('\nExample Usage in Application:');
  console.log('=============================');
  console.log(`
// 1. Import the AI agent
import aiVideoAgent from './services/aiVideoAgent.js';

// 2. Initialize the agent
aiVideoAgent.initialize();

// 3. Prepare project data
const projectData = {
  name: 'Your Video Project',
  requirements: 'Project requirements...',
  files: uploadedFiles,
  deliverables: existingDeliverables,
  freelancer_id: 'FL12345',
  completion_date: '2024-03-15'
};

// 4. Send message to AI
const response = await aiVideoAgent.processProject(projectData, userMessage);

// 5. Handle response
if (response.success) {
  console.log('AI Response:', response.response);
} else {
  console.error('Error:', response.error);
}
  `);
};

// Export for use in other files
export { testAIVideoAgent, exampleUsage }; 