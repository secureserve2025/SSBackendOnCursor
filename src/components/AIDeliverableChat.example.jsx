import React, { useState } from 'react';
import AIDeliverableChat from './AIDeliverableChat';

// Example usage of AIDeliverableChat component
const ExampleUsage = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [projectData, setProjectData] = useState({
    id: 'project-123',
    name: 'Product Launch Video',
    requirements: 'Create a promotional video for our new mobile app that highlights key features and benefits',
    files: [],
    deliverables: [],
    freelancer_id: 'FL12345',
    completion_date: '2024-03-15'
  });
  const [finalDeliverables, setFinalDeliverables] = useState([]);

  const handleOpenChat = () => {
    setIsChatOpen(true);
  };

  const handleCloseChat = () => {
    setIsChatOpen(false);
  };

  const handleDeliverablesGenerated = (deliverables) => {
    setFinalDeliverables(deliverables);
    console.log('Final deliverables:', deliverables);
    // Here you can update your project state, save to database, etc.
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          AI Deliverable Chat Example
        </h1>

        {/* Project Information */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Project Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project Name
              </label>
              <p className="text-gray-900">{projectData.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Freelancer ID
              </label>
              <p className="text-gray-900">{projectData.freelancer_id}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Completion Date
              </label>
              <p className="text-gray-900">{projectData.completion_date}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Requirements
              </label>
              <p className="text-gray-900 text-sm">{projectData.requirements}</p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            AI Chat Interface
          </h2>
          <p className="text-gray-600 mb-4">
            Click the button below to start a conversation with our AI Video Specialist.
            The AI will help you create detailed, measurable deliverables for your video project.
          </p>
          <button
            onClick={handleOpenChat}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            Start AI Conversation
          </button>
        </div>

        {/* Final Deliverables Display */}
        {finalDeliverables.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Final Deliverables
            </h2>
            <div className="space-y-3">
              {finalDeliverables.map((deliverable, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1 text-gray-900">{deliverable}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Chat Modal */}
        <AIDeliverableChat
          isOpen={isChatOpen}
          onClose={handleCloseChat}
          projectData={projectData}
          onDeliverablesGenerated={handleDeliverablesGenerated}
        />
      </div>
    </div>
  );
};

export default ExampleUsage; 