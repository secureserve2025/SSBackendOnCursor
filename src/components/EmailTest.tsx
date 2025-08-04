import React, { useState } from 'react';
import EmailService, { ProjectNotificationData } from '../emails/emailService';

const EmailTest: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const testEmail = async () => {
    setIsLoading(true);
    setResult('');

    try {
      const testData: ProjectNotificationData = {
        freelancerEmail: 'test@example.com', // Replace with actual email for testing
        freelancerName: 'Test Freelancer',
        projectId: 'V1001',
        projectName: 'Test Video Project',
        clientId: 'test-client-id',
        clientName: 'Test Client',
        projectRequirement: 'This is a test project requirement to verify the email template works correctly with all the required fields including project description, deliverables, and completion date.',
        deliverables: [
          'Detailed project specification document in PDF format',
          'Project files and source materials',
          'Final edited version with client feedback incorporated',
          'Project documentation and usage instructions'
        ],
        completionDate: '2024-12-31'
      };

      const emailService = EmailService.getInstance();
      const emailResult = await emailService.sendProjectNotification(testData);

      if (emailResult.success) {
        setResult('✅ Email sent successfully! Check the console for details.');
      } else {
        setResult(`❌ Email failed: ${emailResult.error}`);
      }
    } catch (error) {
      setResult(`❌ Exception occurred: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-800 rounded-lg">
      <h2 className="text-xl font-bold text-white mb-4">Email System Test</h2>
      <p className="text-gray-300 mb-4">
        This component tests the email notification system. 
        Make sure to replace the test email with a real email address for actual testing.
      </p>
      
      <button
        onClick={testEmail}
        disabled={isLoading}
        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Sending...' : 'Test Email Notification'}
      </button>
      
      {result && (
        <div className="mt-4 p-3 bg-gray-700 rounded-lg">
          <p className="text-sm">{result}</p>
        </div>
      )}
      
      <div className="mt-4 text-xs text-gray-400">
        <p>Note: This test uses a placeholder email address.</p>
        <p>For real testing, update the email address in the testEmail function.</p>
      </div>
    </div>
  );
};

export default EmailTest; 