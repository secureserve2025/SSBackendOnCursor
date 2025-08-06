import React, { useState, useEffect } from 'react';
import { Bell, ChevronDown, ChevronUp, Clock, User, FileText, MessageSquare, AlertCircle } from 'lucide-react';

interface NotificationProject {
  id: string;
  project_id: string;
  project_name: string;
  project_status_workflow: string;
  created_at: string;
  updated_at: string;
  freelancer_profiles?: {
    full_name: string;
    email: string;
    updated_at: string;
  };
  client_profiles?: {
    client_id: string;
    full_name: string;
    email: string;
    company_name: string;
    updated_at: string;
  };
  last_work_product_upload?: string;
  last_work_product_view?: string;
  last_message_timestamp?: string;
  verification_report?: {
    verification_score: number;
    created_at: string;
  };
}

interface NotificationsProps {
  userType: 'client' | 'freelancer';
  userId: string;
  getNotifications: (userId: string) => Promise<{ data: NotificationProject[] | null; error: any }>;
}

const Notifications: React.FC<NotificationsProps> = ({ userType, userId, getNotifications }) => {
  const [notifications, setNotifications] = useState<NotificationProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<{
    underManualRevision: boolean;
    aiVerified: boolean;
  }>({
    underManualRevision: false,
    aiVerified: false
  });

  useEffect(() => {
    loadNotifications();
  }, [userId]);

  const loadNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await getNotifications(userId);
      if (error) {
        setError(error.message || 'Failed to load notifications');
      } else {
        setNotifications(data || []);
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: 'underManualRevision' | 'aiVerified') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getActionDueText = (project: NotificationProject): string => {
    if (project.project_status_workflow !== 'AI Verified' || !project.verification_report) {
      return '';
    }

    const verificationDate = new Date(project.verification_report.created_at);
    const now = new Date();
    const hours24 = new Date(verificationDate.getTime() + 24 * 60 * 60 * 1000);
    const hours72 = new Date(verificationDate.getTime() + 72 * 60 * 60 * 1000);
    const score = project.verification_report.verification_score || 0;

    if (score > 0.9 && now < hours24) {
      return `Fund transfer to ${userType === 'client' ? 'Freelancer' : 'Freelancer'} due on ${hours24.toLocaleString()}`;
    } else if (now < hours72) {
      return `Fund transfer on hold. ${userType === 'client' ? 'Freelancer' : 'Freelancer'} resubmission due on ${hours72.toLocaleString()}`;
    } else {
      return 'Fund ready to chargeback';
    }
  };

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  const getUnderManualRevisionProjects = () => {
    return notifications.filter(project => project.project_status_workflow === 'Under Manual Revision');
  };

  const getAIVerifiedProjects = () => {
    return notifications.filter(project => project.project_status_workflow === 'AI Verified');
  };

  const renderProjectCard = (project: NotificationProject, isAIVerified: boolean = false) => {
    const otherParty = userType === 'client' ? project.freelancer_profiles : project.client_profiles;
    const lastActivity = userType === 'client' 
      ? project.last_work_product_upload 
      : project.last_work_product_view;

    return (
      <div key={project.id} className="bg-gray-800 rounded-lg p-4 mb-3 border border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Project Info */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-medium text-gray-300">Project ID:</span>
              <span className="text-sm text-white">{project.project_id}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-300">Project Name:</span>
              <span className="text-sm text-white">{project.project_name}</span>
            </div>
          </div>

          {/* Other Party Info */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-green-400" />
              <span className="text-sm font-medium text-gray-300">
                {userType === 'client' ? 'Freelancer ID:' : 'Client ID:'}
              </span>
              <span className="text-sm text-white">
                {userType === 'client' ? project.freelancer_id : otherParty?.client_id}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-300">Last Activity:</span>
              <span className="text-sm text-white">
                {formatDate(otherParty?.updated_at)}
              </span>
            </div>
          </div>

          {/* Activity Info */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-yellow-400" />
              <span className="text-sm font-medium text-gray-300">
                {userType === 'client' ? 'Last Upload:' : 'Last View:'}
              </span>
              <span className="text-sm text-white">
                {formatDate(lastActivity)}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4 text-purple-400" />
              <span className="text-sm font-medium text-gray-300">Last Message:</span>
              <span className="text-sm text-white">
                {formatDate(project.last_message_timestamp)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Due for AI Verified projects */}
        {isAIVerified && (
          <div className="mt-4 p-3 bg-gray-700 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-orange-400" />
              <span className="text-sm font-medium text-gray-300">Action Due:</span>
              <span className="text-sm text-orange-400 font-medium">
                {getActionDueText(project)}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <span className="text-red-400">Error: {error}</span>
        </div>
      </div>
    );
  }

  const underManualRevisionProjects = getUnderManualRevisionProjects();
  const aiVerifiedProjects = getAIVerifiedProjects();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Bell className="h-6 w-6 text-blue-400" />
        <h2 className="text-xl font-bold text-white">Notifications</h2>
      </div>

      {/* Under Manual Revision Section */}
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <button
          onClick={() => toggleSection('underManualRevision')}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-700 transition-colors rounded-lg"
        >
          <div className="flex items-center space-x-3">
            <AlertCircle className="h-5 w-5 text-orange-400" />
            <span className="text-lg font-semibold text-white">Under Manual Revision</span>
            <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
              {underManualRevisionProjects.length}
            </span>
          </div>
          {expandedSections.underManualRevision ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </button>
        
        {expandedSections.underManualRevision && (
          <div className="px-4 pb-4">
            {underManualRevisionProjects.length === 0 ? (
              <p className="text-gray-400 text-sm py-4">No projects under manual revision</p>
            ) : (
              <div className="space-y-3">
                {underManualRevisionProjects.map(project => renderProjectCard(project))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* AI Verified Section */}
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <button
          onClick={() => toggleSection('aiVerified')}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-700 transition-colors rounded-lg"
        >
          <div className="flex items-center space-x-3">
            <AlertCircle className="h-5 w-5 text-green-400" />
            <span className="text-lg font-semibold text-white">AI Verified</span>
            <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
              {aiVerifiedProjects.length}
            </span>
          </div>
          {expandedSections.aiVerified ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </button>
        
        {expandedSections.aiVerified && (
          <div className="px-4 pb-4">
            {aiVerifiedProjects.length === 0 ? (
              <p className="text-gray-400 text-sm py-4">No AI verified projects</p>
            ) : (
              <div className="space-y-3">
                {aiVerifiedProjects.map(project => renderProjectCard(project, true))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Empty State */}
      {notifications.length === 0 && (
        <div className="text-center py-12">
          <Bell className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">No notifications at this time</p>
          <p className="text-gray-500 text-sm mt-2">
            You'll see notifications here when projects require your attention
          </p>
        </div>
      )}
    </div>
  );
};

export default Notifications; 