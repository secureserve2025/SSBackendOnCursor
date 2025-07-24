import React, { useState, useEffect, useRef } from 'react';
import { User, Briefcase, CreditCard, MessageSquare, CheckCircle, Clock, Shield, Edit3, Save, X, Plus, Upload } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getCurrentUser, signOut } from '../lib/supabase';
import AddProjectForm from '../components/AddProjectForm';

interface ProfileData {
  companyName: string;
  email: string;
  mobileNumber: string;
  countryCode: string;
  businessType: string;
}

const ClientDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState<ProfileData>({
    companyName: '',
    email: '',
    mobileNumber: '',
    countryCode: '',
    businessType: ''
  });
  const navigate = useNavigate();

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'add-project', label: 'Add Project', icon: Plus },
    { id: 'projects', label: 'My Projects', icon: Briefcase },
    { id: 'transactions', label: 'Transactions', icon: CreditCard },
    { id: 'messages', label: 'Messages', icon: MessageSquare }
  ];

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const user = await getCurrentUser();
        if (!user) {
          navigate('/login');
          return;
        }
        // Load profile data here
      } catch (error) {
        console.error('Error loading user data:', error);
        navigate('/login');
      }
    };

    loadUserData();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const renderProfileContent = () => {
    return (
      <div className="bg-gray-800 rounded-2xl p-6 sm:p-8 border border-gray-700">
        <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">Profile Information</h2>
        <p className="text-sm sm:text-base text-gray-400">Manage your profile settings and information.</p>
      </div>
    );
  };

  const renderMyProjectsContent = () => (
    <div className="space-y-6 sm:space-y-8">
      {/* Projects Header */}
      <div className="bg-gray-800 rounded-2xl p-4 sm:p-6 lg:p-8 border border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">My Projects</h2>
            <p className="text-sm sm:text-base text-gray-300">
              Manage and track your active and completed projects
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <Briefcase className="h-4 w-4" aria-hidden="true" />
              <span>0 Total Projects</span>
            </div>
            <button
              onClick={() => setActiveTab('add-project')}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 focus:bg-purple-700 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm"
              aria-label="Add new project"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">New Project</span>
            </button>
          </div>
        </div>

        {/* Projects Table */}
        <div className="overflow-x-auto">
          <div className="min-w-full">
            {/* Table Header */}
            <div className="bg-gray-700 rounded-t-lg">
              <div className="grid grid-cols-5 gap-4 p-4 text-sm font-semibold text-gray-300">
                <div className="text-left">Project ID</div>
                <div className="text-left">Project Name</div>
                <div className="text-left">Freelancer ID</div>
                <div className="text-center">Status</div>
                <div className="text-right">Value (₹)</div>
              </div>
            </div>

            {/* Table Body - Empty State */}
            <div className="bg-gray-800 rounded-b-lg border-t border-gray-600">
              <div className="p-8 sm:p-12 text-center">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-700 rounded-full flex items-center justify-center">
                    <Briefcase className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" aria-hidden="true" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg sm:text-xl font-semibold text-white">
                      No Projects Yet
                    </h3>
                    <p className="text-sm sm:text-base text-gray-400 max-w-md">
                      Start your first project by clicking the "New Project" button above. 
                      Connect with talented freelancers and bring your ideas to life.
                    </p>
                  </div>
                  <div className="pt-4">
                    <button
                      onClick={() => setActiveTab('add-project')}
                      className="inline-flex items-center space-x-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 focus:bg-purple-700 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400"
                      aria-label="Create your first project"
                    >
                      <Plus className="h-4 w-4" aria-hidden="true" />
                      <span>Create First Project</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Legend */}
        <div className="mt-6 p-4 bg-gray-700 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-300 mb-3">Project Status Legend:</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs sm:text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-300">Complete</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-gray-300">Active</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-gray-300">Manual Revision</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span className="text-gray-300">Approval Pending</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTransactionsContent = () => (
    <div className="space-y-6 sm:space-y-8">
      {/* Transactions Header */}
      <div className="bg-gray-800 rounded-2xl p-4 sm:p-6 lg:p-8 border border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Transaction History</h2>
            <p className="text-sm sm:text-base text-gray-300">
              View your payment history and project transactions
            </p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <CreditCard className="h-4 w-4" aria-hidden="true" />
            <span>₹0 Total Spent</span>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto">
          <div className="min-w-full">
            {/* Table Header */}
            <div className="bg-gray-700 rounded-t-lg">
              <div className="grid grid-cols-4 gap-4 p-4 text-sm font-semibold text-gray-300">
                <div className="text-left">Project ID</div>
                <div className="text-left">Project Name</div>
                <div className="text-left">Freelancer ID</div>
                <div className="text-right">Value Transferred (₹)</div>
              </div>
            </div>

            {/* Table Body - Empty State */}
            <div className="bg-gray-800 rounded-b-lg border-t border-gray-600">
              <div className="p-8 sm:p-12 text-center">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-700 rounded-full flex items-center justify-center">
                    <CreditCard className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" aria-hidden="true" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg sm:text-xl font-semibold text-white">
                      No Transactions Yet
                    </h3>
                    <p className="text-sm sm:text-base text-gray-400 max-w-md">
                      Your payment history will appear here once you complete projects and make payments. 
                      All transactions are secure and processed through our escrow system.
                    </p>
                  </div>
                  <div className="pt-4">
                    <button
                      onClick={() => setActiveTab('add-project')}
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 focus:bg-purple-700 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400"
                      aria-label="Create a new project"
                    >
                      <Plus className="h-4 w-4" aria-hidden="true" />
                      <span>Create Project</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction Summary */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-400">₹0</div>
            <div className="text-sm text-gray-300">Total Spent</div>
          </div>
          <div className="bg-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">0</div>
            <div className="text-sm text-gray-300">Projects Funded</div>
          </div>
          <div className="bg-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-400">₹0</div>
            <div className="text-sm text-gray-300">Average Project Cost</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return renderProfileContent();
      case 'add-project':
        return <AddProjectForm />;
      case 'projects':
        return renderMyProjectsContent();
      case 'transactions':
        return renderTransactionsContent();
      case 'messages':
        return (
          <div className="bg-gray-800 rounded-2xl p-6 sm:p-8 border border-gray-700 text-center">
            <MessageSquare className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" aria-hidden="true" />
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-2">Messages</h2>
            <p className="text-sm sm:text-base text-gray-400">Communicate with freelancers and manage conversations.</p>
          </div>
        );
      default:
        return renderProfileContent();
    }
  };

  const renderAddProjectContent = () => {
    const [projectData, setProjectData] = useState({
      category: 'Video Production',
      projectName: '',
      description: '',
      freelancerId: '',
      completionDate: '',
      files: [] as File[]
    });
    
    const [deliverables, setDeliverables] = useState([
      { id: 1, text: '' },
      { id: 2, text: '' },
      { id: 3, text: '' }
    ]);
    
    const [showDeliverables, setShowDeliverables] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
    const [errors, setErrors] = useState<{[key: string]: string}>({});
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const categoryOptions = [
      { value: 'Video Production', label: 'Video Production', enabled: true },
      { value: 'Content', label: 'Content', enabled: false },
      { value: 'UI/UX Design', label: 'UI/UX Design', enabled: false },
      { value: 'Gen AI', label: 'Gen AI', enabled: false }
    ];
    
    const acceptedFileTypes = '.pdf,.doc,.docx,.jpg,.jpeg,.png,.mp4,.mov,.avi,.mkv,.txt,.zip,.rar';
    
    // Get tomorrow's date for minimum date validation
    const getTomorrowDate = () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split('T')[0];
    };
    
    const handleInputChange = (field: string, value: string) => {
      setProjectData(prev => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: '' }));
      }
    };
    
    const handleDeliverableChange = (id: number, value: string) => {
      setDeliverables(prev => 
        prev.map(item => item.id === id ? { ...item, text: value } : item)
      );
    };
    
    const addDeliverable = () => {
      if (deliverables.length < 10) {
        const newId = Math.max(...deliverables.map(d => d.id)) + 1;
        setDeliverables(prev => [...prev, { id: newId, text: '' }]);
      }
    };
    
    const removeDeliverable = (id: number) => {
      if (deliverables.length > 1) {
        setDeliverables(prev => prev.filter(item => item.id !== id));
      }
    };
    
    const validateForm = () => {
      const newErrors: {[key: string]: string} = {};
      
      if (!projectData.projectName.trim()) {
        newErrors.projectName = 'Project name is required';
      }
      
      if (!projectData.description.trim()) {
        newErrors.description = 'Project description is required';
      } else if (projectData.description.trim().length < 50) {
        newErrors.description = 'Description must be at least 50 characters';
      }
      
      if (!projectData.freelancerId.trim()) {
        newErrors.freelancerId = 'Freelancer ID is required';
      } else if (!/^F\d{9}$/.test(projectData.freelancerId)) {
        newErrors.freelancerId = 'Invalid format. Use F followed by 9 digits (e.g., F123456789)';
      }
      
      if (!projectData.completionDate) {
        newErrors.completionDate = 'Completion date is required';
      } else {
        const selectedDate = new Date(projectData.completionDate);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        if (selectedDate < tomorrow) {
          newErrors.completionDate = 'Completion date must be at least tomorrow';
        }
      }
      
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };
    
    const handleDrag = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.type === 'dragenter' || e.type === 'dragover') {
        setDragActive(true);
      } else if (e.type === 'dragleave') {
        setDragActive(false);
      }
    };
    
    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      
      const files = Array.from(e.dataTransfer.files);
      handleFiles(files);
    };
    
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const files = Array.from(e.target.files);
        handleFiles(files);
      }
    };
    
    const handleFiles = (files: File[]) => {
      const validFiles = files.filter(file => {
        const extension = '.' + file.name.split('.').pop()?.toLowerCase();
        return acceptedFileTypes.includes(extension);
      });
      
      // Simulate upload progress
      validFiles.forEach(file => {
        const fileName = file.name;
        let progress = 0;
        const interval = setInterval(() => {
          progress += 10;
          setUploadProgress(prev => ({ ...prev, [fileName]: progress }));
          if (progress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              setUploadProgress(prev => {
                const newProgress = { ...prev };
                delete newProgress[fileName];
                return newProgress;
              });
            }, 1000);
          }
        }, 100);
      });
      
      setProjectData(prev => ({
        ...prev,
        files: [...prev.files, ...validFiles]
      }));
    };
    
    const removeFile = (index: number) => {
      setProjectData(prev => ({
        ...prev,
        files: prev.files.filter((_, i) => i !== index)
      }));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (validateForm()) {
        setShowDeliverables(true);
      }
    };
    
    const handleGenerateAI = () => {
      // Simulate AI generation
      const aiDeliverables = [
        'High-quality 1080p video resolution',
        'Professional color grading and correction',
        'Clear audio with noise reduction',
        'Smooth transitions and cuts',
        'Brand-consistent graphics and titles',
        'Optimized file format (MP4/MOV)',
        'Delivery within specified duration',
        'Source files and project backup'
      ];
      
      const newDeliverables = aiDeliverables.slice(0, 8).map((text, index) => ({
        id: index + 1,
        text
      }));
      
      setDeliverables(newDeliverables);
    };
    
    return (
      <div className="space-y-6 sm:space-y-8">
        <div className="bg-gray-800 rounded-2xl p-4 sm:p-6 lg:p-8 border border-gray-700">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-6 sm:mb-8">Create New Project</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8" noValidate>
            {/* Project Category */}
            <div>
              <label htmlFor="project-category" className="block text-gray-300 text-sm font-semibold mb-2">
                Project Category *
              </label>
              <div className="relative">
                <select
                  id="project-category"
                  value={projectData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-600 rounded-lg bg-gray-700 text-white focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50 text-sm sm:text-base"
                  required
                >
                  {categoryOptions.map((option) => (
                    <option 
                      key={option.value} 
                      value={option.value}
                      disabled={!option.enabled}
                      className={!option.enabled ? 'text-gray-500' : ''}
                    >
                      {option.label} {!option.enabled ? '(Enabled Soon)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-gray-400 text-xs sm:text-sm mt-1">
                Currently only Video Production projects are available. Other categories coming soon!
              </p>
            </div>
            
            {/* Project Name */}
            <div>
              <label htmlFor="project-name" className="block text-gray-300 text-sm font-semibold mb-2">
                Project Name *
              </label>
              <input
                id="project-name"
                type="text"
                value={projectData.projectName}
                onChange={(e) => handleInputChange('projectName', e.target.value)}
                placeholder="Enter a descriptive project name"
                className={`w-full px-4 py-3 border-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none transition-colors text-sm sm:text-base ${
                  errors.projectName 
                    ? 'border-red-500 focus:border-red-400' 
                    : 'border-gray-600 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50'
                }`}
                required
                aria-invalid={errors.projectName ? 'true' : 'false'}
                aria-describedby={errors.projectName ? 'project-name-error' : undefined}
              />
              {errors.projectName && (
                <p id="project-name-error" className="text-red-400 text-xs sm:text-sm mt-1" role="alert">
                  {errors.projectName}
                </p>
              )}
            </div>
            
            {/* Project Description */}
            <div>
              <label htmlFor="project-description" className="block text-gray-300 text-sm font-semibold mb-2">
                Project Requirement Description *
              </label>
              <textarea
                id="project-description"
                rows={6}
                value={projectData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Provide detailed requirements, expectations, style preferences, target audience, and any specific instructions..."
                className={`w-full px-4 py-3 border-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none transition-colors resize-none text-sm sm:text-base ${
                  errors.description 
                    ? 'border-red-500 focus:border-red-400' 
                    : 'border-gray-600 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50'
                }`}
                required
                aria-invalid={errors.description ? 'true' : 'false'}
                aria-describedby={`description-help ${errors.description ? 'description-error' : ''}`.trim()}
              />
              <div className="flex justify-between items-center mt-1">
                <p id="description-help" className="text-gray-400 text-xs sm:text-sm">
                  Minimum 50 characters required
                </p>
                <span className={`text-xs sm:text-sm ${
                  projectData.description.length < 50 ? 'text-red-400' : 'text-green-400'
                }`}>
                  {projectData.description.length}/50
                </span>
              </div>
              {errors.description && (
                <p id="description-error" className="text-red-400 text-xs sm:text-sm mt-1" role="alert">
                  {errors.description}
                </p>
              )}
            </div>
            
            <div className="flex justify-end">
              <button
                type="button"
                className="flex items-center justify-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 focus:bg-green-700 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-green-400"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Create Project</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900" role="main">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 sm:px-6 lg:px-8" role="banner">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link 
              to="/" 
              className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-purple-400 rounded-lg p-1"
              aria-label="SecureServe Home"
            >
              <Shield className="h-8 w-8 text-purple-400" />
              <span className="text-xl font-bold text-white">SecureServe</span>
            </Link>

            {/* User Menu */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <span className="text-gray-300 text-sm sm:text-base hidden sm:inline">
                Welcome, {profileData.companyName || 'Client'}
              </span>
              <button
                onClick={handleLogout}
                className="px-3 py-2 sm:px-4 bg-red-600 hover:bg-red-700 focus:bg-red-700 text-white rounded-lg transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                aria-label="Logout from dashboard"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8" role="main">
        {/* Tab Navigation */}
        <nav className="mb-6 sm:mb-8" role="navigation" aria-label="Dashboard navigation">
          <div className="border-b border-gray-700">
            <div className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-1 sm:space-x-2 py-3 sm:py-4 px-1 sm:px-2 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                      activeTab === tab.id
                        ? 'border-purple-400 text-purple-400'
                        : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                    }`}
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    aria-controls={`${tab.id}-panel`}
                    id={`${tab.id}-tab`}
                  >
                    <IconComponent className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Tab Content */}
        <div 
          role="tabpanel" 
          id={`${activeTab}-panel`} 
          aria-labelledby={`${activeTab}-tab`}
        >
          {renderTabContent()}
        </div>
      </main>
    </div>
  );
};

export default ClientDashboard;