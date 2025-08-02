// Test file for AI Chat API Endpoint
// This file demonstrates how to use the ai-chat endpoint

const testAIChatAPI = async () => {
  console.log('AI Chat API Test');
  console.log('================');
  
  const baseUrl = 'https://your-project.supabase.co/functions/v1/ai-chat';
  const headers = {
    'Authorization': 'Bearer your-supabase-anon-key',
    'Content-Type': 'application/json'
  };

  // Example project data
  const projectData = {
    name: 'Product Launch Video',
    requirements: 'Create a promotional video for our new mobile app that highlights key features and benefits',
    files: [],
    deliverables: [],
    freelancer_id: 'FL12345',
    completion_date: '2024-03-15'
  };

  try {
    // Test 1: Start conversation
    console.log('\n1. Testing START action...');
    const startResponse = await fetch(baseUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        action: 'start',
        projectId: 'test-project-uuid',
        projectData: projectData
      })
    });

    const startResult = await startResponse.json();
    console.log('Start Response:', startResult);

    // Test 2: Continue conversation
    console.log('\n2. Testing CONTINUE action...');
    const continueResponse = await fetch(baseUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        action: 'continue',
        projectId: 'test-project-uuid',
        userMessage: 'What specific features should we highlight in the video?'
      })
    });

    const continueResult = await continueResponse.json();
    console.log('Continue Response:', continueResult);

    // Test 3: Generate deliverables
    console.log('\n3. Testing GENERATE action...');
    const generateResponse = await fetch(baseUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        action: 'generate',
        projectId: 'test-project-uuid'
      })
    });

    const generateResult = await generateResponse.json();
    console.log('Generate Response:', generateResult);

    // Test 4: Accept deliverables
    console.log('\n4. Testing ACCEPT action...');
    const acceptResponse = await fetch(baseUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        action: 'accept',
        projectId: 'test-project-uuid',
        deliverables: [
          'Create 60-second product demo video in 4K resolution',
          'Deliver final MP4 file under 100MB with H.264 codec',
          'Provide storyboard with 8-12 frames showing key scenes'
        ]
      })
    });

    const acceptResult = await acceptResponse.json();
    console.log('Accept Response:', acceptResult);

  } catch (error) {
    console.error('Test failed:', error);
  }
};

// Example usage in frontend
const exampleFrontendUsage = () => {
  console.log('\nFrontend Usage Example:');
  console.log('========================');
  console.log(`
// Import Supabase client
import { supabase } from '../lib/supabase';

// Start AI conversation
const startAIConversation = async (projectId, projectData) => {
  const { data, error } = await supabase.functions.invoke('ai-chat', {
    body: {
      action: 'start',
      projectId: projectId,
      projectData: projectData
    }
  });
  
  if (error) {
    console.error('Error starting conversation:', error);
    return null;
  }
  
  return data;
};

// Continue conversation
const continueAIConversation = async (projectId, userMessage) => {
  const { data, error } = await supabase.functions.invoke('ai-chat', {
    body: {
      action: 'continue',
      projectId: projectId,
      userMessage: userMessage
    }
  });
  
  if (error) {
    console.error('Error continuing conversation:', error);
    return null;
  }
  
  return data;
};

// Generate deliverables
const generateDeliverables = async (projectId) => {
  const { data, error } = await supabase.functions.invoke('ai-chat', {
    body: {
      action: 'generate',
      projectId: projectId
    }
  });
  
  if (error) {
    console.error('Error generating deliverables:', error);
    return null;
  }
  
  return data;
};

// Accept deliverables
const acceptDeliverables = async (projectId, deliverables) => {
  const { data, error } = await supabase.functions.invoke('ai-chat', {
    body: {
      action: 'accept',
      projectId: projectId,
      deliverables: deliverables
    }
  });
  
  if (error) {
    console.error('Error accepting deliverables:', error);
    return null;
  }
  
  return data;
};
  `);
};

// Export for use in other files
export { testAIChatAPI, exampleFrontendUsage }; 