import { generateProjectSummary, validateProjectData } from './projectSummary.js';

// Example usage of the project summary generator
const testProjectSummary = async () => {
  console.log('Project Summary Generator Test');
  console.log('==============================');
  
  // Example project data
  const sampleProjectData = {
    name: 'E-commerce Website Development',
    requirements: 'Create a responsive e-commerce website with user authentication, product catalog, shopping cart, and payment integration. The site should support multiple payment methods and have an admin dashboard for inventory management.',
    files: [], // Would contain actual file objects in real usage
    deliverables: [
      { deliverable_text: 'Wireframe designs' },
      { deliverable_text: 'Frontend development' },
      { deliverable_text: 'Backend API development' }
    ],
    freelancer_id: 'FL12345',
    completion_date: '2024-03-15'
  };

  // Example with minimal data
  const minimalProjectData = {
    name: 'Simple Logo Design',
    requirements: 'Create a logo for a tech startup',
    files: [],
    deliverables: [],
    freelancer_id: 'FL67890',
    completion_date: '2024-02-28'
  };

  // Example with missing data
  const incompleteProjectData = {
    name: 'Project with Missing Info',
    requirements: 'Some requirements here',
    // Missing other fields
  };

  try {
    console.log('\n1. Testing with complete project data:');
    const summary1 = await generateProjectSummary(sampleProjectData);
    console.log(summary1);

    console.log('\n2. Testing with minimal project data:');
    const summary2 = await generateProjectSummary(minimalProjectData);
    console.log(summary2);

    console.log('\n3. Testing with incomplete project data:');
    const summary3 = await generateProjectSummary(incompleteProjectData);
    console.log(summary3);

    console.log('\n4. Testing data validation:');
    console.log('Complete data valid:', validateProjectData(sampleProjectData));
    console.log('Minimal data valid:', validateProjectData(minimalProjectData));
    console.log('Incomplete data valid:', validateProjectData(incompleteProjectData));
    console.log('Null data valid:', validateProjectData(null));

  } catch (error) {
    console.error('Test failed:', error);
  }
};

// Example of how to use in a real application
const exampleUsage = () => {
  console.log('\nExample Usage in Application:');
  console.log('=============================');
  console.log(`
// 1. Import the function
import { generateProjectSummary } from './utils/projectSummary.js';

// 2. Prepare project data
const projectData = {
  name: 'Your Project Name',
  requirements: 'Project requirements text...',
  files: fileInput.files, // From file input
  deliverables: existingDeliverables, // From database
  freelancer_id: 'FL12345',
  completion_date: '2024-03-15'
};

// 3. Generate summary
const summary = await generateProjectSummary(projectData);

// 4. Use the summary (e.g., send to AI agent)
console.log(summary);
  `);
};

// Export for use in other files
export { testProjectSummary, exampleUsage }; 