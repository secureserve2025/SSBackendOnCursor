import React, { useState, useEffect, useRef } from 'react';
import { User, Briefcase, Plus, CreditCard, MessageSquare, CheckCircle, Clock, Shield, Edit3, Save, X, Building, Upload, ChevronDown, Zap } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getCurrentUser, signOut } from '../lib/supabase';

interface ProfileData {
  companyName: string;
  email: string;
  mobileNumber: string;
  countryCode: string;
  businessType: string;
  gstNumber: string;
  clientId: string;
}

const ClientDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [isNewUser, setIsNewUser] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [profileData, setProfileData] = useState<ProfileData>({
    companyName: '',
    email: '',
    mobileNumber: '',
    countryCode: '+91',
    businessType: '',
    gstNumber: '',
    clientId: ''
  });
  const [originalData, setOriginalData] = useState<ProfileData>({
    companyName: '',
    email: '',
    mobileNumber: '',
    countryCode: '+91',
    businessType: '',
    gstNumber: '',
    clientId: ''
  });
  const [errors, setErrors] = useState<Partial<ProfileData>>({});

  const countryCodes = [
    { code: '+91', country: 'India', flag: '🇮🇳' },
    { code: '+1', country: 'USA', flag: '🇺🇸' },
    { code: '+44', country: 'UK', flag: '🇬🇧' },
    { code: '+86', country: 'China', flag: '🇨🇳' },
    { code: '+81', country: 'Japan', flag: '🇯🇵' },
    { code: '+49', country: 'Germany', flag: '🇩🇪' },
    { code: '+33', country: 'France', flag: '🇫🇷' },
    { code: '+61', country: 'Australia', flag: '🇦🇺' }
  ];

  const businessTypes = [
    'Startup',
    'Small Business',
    'Medium Enterprise',
    'Large Corporation',
    'Non-Profit',
    'Government',
    'Educational Institution',
    'Healthcare',
    'Technology',
    'E-commerce',
    'Consulting',
    'Other'
  ];

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'add-project', label: 'Add New Project', icon: Plus },
    { id: 'projects', label: 'My Projects', icon: Briefcase },
    { id: 'transactions', label: 'Transactions', icon: CreditCard },
    { id: 'messages', label: 'Messages', icon: MessageSquare }
  ];

  // Load user data on component mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const { user } = await getCurrentUser();
        if (user) {
          setProfileData(prev => ({
            ...prev,
            email: user.email || ''
          }));
          setOriginalData(prev => ({
            ...prev,
            email: user.email || ''
          }));
          
          // Simulate checking if user has completed profile
          const hasCompletedProfile = user.user_metadata?.profile_completed;
          setIsNewUser(!hasCompletedProfile);
          
          if (hasCompletedProfile) {
            setLastUpdated(new Date(user.updated_at || Date.now()));
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    loadUserData();
  }, []);

  // Calculate profile completion percentage
  const calculateCompletion = () => {
    const fields = ['companyName', 'mobileNumber', 'businessType', 'gstNumber'];
    const completed = fields.filter(field => profileData[field as keyof ProfileData].trim() !== '').length;
    return Math.round((completed / fields.length) * 100);
  };

  // Generate unique client ID based on email
  const generateClientId = (email: string) => {
    // Create a hash from email for consistency
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
      const char = email.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Convert to positive number and ensure 9 digits
    const positiveHash = Math.abs(hash);
    const nineDigitId = String(positiveHash).padStart(9, '0').slice(0, 9);
    return `C${nineDigitId}`;
  };

  // Handle input changes
  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Format GST number
  const formatGST = (value: string) => {
    const alphanumeric = value.replace(/[^A-Z0-9]/g, '').toUpperCase();
    return alphanumeric.slice(0, 15);
  };

  // Validate form fields
  const validateForm = () => {
    const newErrors: Partial<ProfileData> = {};

    if (!profileData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }

    if (!profileData.mobileNumber.trim()) {
      newErrors.mobileNumber = 'Mobile number is required';
    } else if (!/^\d{10}$/.test(profileData.mobileNumber)) {
      newErrors.mobileNumber = 'Please enter a valid 10-digit mobile number';
    }

    if (!profileData.businessType.trim()) {
      newErrors.businessType = 'Business type is required';
    }

    if (profileData.gstNumber.trim() && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(profileData.gstNumber)) {
      newErrors.gstNumber = 'Please enter a valid GST number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle save changes
  const handleSave = () => {
    if (validateForm()) {
      // Generate client ID if profile is being completed for the first time
      if (!profileData.clientId && profileData.email) {
        const newClientId = generateClientId(profileData.email);
        setProfileData(prev => ({ ...prev, clientId: newClientId }));
        setOriginalData({ ...profileData, clientId: newClientId });
      } else {
        setOriginalData({ ...profileData });
      }
      setHasChanges(false);
      setIsEditing(false);
      setLastUpdated(new Date());
      setIsNewUser(false);
      // Here you would typically save to Supabase
      console.log('Saving profile data:', profileData);
    }
  };

  // Handle cancel changes
  const handleCancel = () => {
    setProfileData({ ...originalData });
    setHasChanges(false);
    setIsEditing(false);
    setErrors({});
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const renderProfileContent = () => (
    <div className="space-y-6 sm:space-y-8">
      {/* Welcome Banner for New Users */}
      {isNewUser && (
        <div 
          className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-2xl p-4 sm:p-6"
          role="alert"
          aria-live="polite"
        >
          <div className="flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-4">
            <div className="flex-shrink-0">
              <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-purple-400" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg sm:text-xl font-semibold text-white mb-2">
                Welcome to SecureServe! 🎉
              </h2>
              <p className="text-sm sm:text-base text-gray-300 mb-4">
                Please complete your business profile to start posting projects and hiring top freelancers.
              </p>
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <div className="flex-1 sm:w-32 bg-gray-700 rounded-full h-2" role="progressbar" aria-valuenow={calculateCompletion()} aria-valuemin={0} aria-valuemax={100} aria-label="Profile completion progress">
                    <div 
                      className="bg-gradient-to-r from-purple-400 to-pink-400 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${calculateCompletion()}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-purple-400 whitespace-nowrap">
                    {calculateCompletion()}% Complete
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Last Updated Info for Returning Users */}
      {!isNewUser && lastUpdated && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-gray-800 rounded-lg p-4 border border-gray-700 space-y-2 sm:space-y-0">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" aria-hidden="true" />
            <span className="text-sm sm:text-base text-gray-300">
              Last updated: {lastUpdated.toLocaleDateString()} at {lastUpdated.toLocaleTimeString()}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-400" aria-hidden="true" />
            <span className="text-sm sm:text-base text-green-400 font-medium">Profile Complete</span>
          </div>
        </div>
      )}

      {/* Profile Form */}
      <div className="bg-gray-800 rounded-2xl p-4 sm:p-6 lg:p-8 border border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 space-y-4 sm:space-y-0">
          <h2 className="text-xl sm:text-2xl font-bold text-white">Business Profile</h2>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 focus:bg-purple-700 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400 w-full sm:w-auto"
              aria-label="Edit business profile information"
            >
              <Edit3 className="h-4 w-4" aria-hidden="true" />
              <span>Edit Profile</span>
            </button>
          )}
        </div>

        <form className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8" noValidate>
          {/* Client ID */}
          <div className="lg:col-span-2">
            <label htmlFor="client-id" className="block text-gray-300 text-sm font-semibold mb-2">
              Client ID
            </label>
            <div className="relative">
              <input
                id="client-id"
                name="clientId"
                type="text"
                value={profileData.clientId || 'Will be assigned after profile completion'}
                disabled
                className="w-full px-4 py-3 pr-12 border-2 border-gray-600 rounded-lg bg-gray-600 text-gray-300 cursor-not-allowed opacity-60 text-sm sm:text-base"
                aria-describedby="client-id-help"
                tabIndex={-1}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <Shield className="h-5 w-5 text-purple-400" aria-hidden="true" />
              </div>
            </div>
            <p id="client-id-help" className="text-gray-400 text-xs sm:text-sm mt-1">
              {profileData.clientId 
                ? 'Your unique client identification number' 
                : 'ID will be automatically generated when you complete your profile'
              }
            </p>
          </div>

          {/* Company Name */}
          <div>
            <label htmlFor="company-name" className="block text-gray-300 text-sm font-semibold mb-2">
              Company Name *
            </label>
            <input
              id="company-name"
              name="companyName"
              type="text"
              value={profileData.companyName}
              onChange={(e) => handleInputChange('companyName', e.target.value)}
              placeholder="Enter your company name"
              disabled={!isEditing}
              required
              aria-invalid={errors.companyName ? 'true' : 'false'}
              aria-describedby={errors.companyName ? 'company-name-error' : undefined}
              className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-colors bg-gray-700 text-white placeholder-gray-400 text-sm sm:text-base ${
                errors.companyName 
                  ? 'border-red-500 focus:border-red-400' 
                  : 'border-gray-600 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50'
              } ${!isEditing ? 'opacity-60 cursor-not-allowed' : ''}`}
            />
            {errors.companyName && (
              <p id="company-name-error" className="text-red-400 text-xs sm:text-sm mt-1" role="alert">
                {errors.companyName}
              </p>
            )}
          </div>

          {/* Email Address (Read-only) */}
          <div>
            <label htmlFor="email" className="block text-gray-300 text-sm font-semibold mb-2">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={profileData.email}
              disabled
              className="w-full px-4 py-3 border-2 border-gray-600 rounded-lg bg-gray-600 text-gray-300 cursor-not-allowed opacity-60 text-sm sm:text-base"
              aria-describedby="email-help"
              tabIndex={-1}
            />
            <p id="email-help" className="text-gray-400 text-xs sm:text-sm mt-1">Email cannot be changed</p>
          </div>

          {/* Mobile Number */}
          <div>
            <label htmlFor="mobile-number" className="block text-gray-300 text-sm font-semibold mb-2">
              Mobile Number *
            </label>
            <div className="flex space-x-2">
              <select
                id="country-code"
                name="countryCode"
                value={profileData.countryCode}
                onChange={(e) => handleInputChange('countryCode', e.target.value)}
                disabled={!isEditing}
                aria-label="Country code"
                className={`px-2 sm:px-3 py-3 border-2 rounded-lg focus:outline-none transition-colors bg-gray-700 text-white text-sm sm:text-base ${
                  'border-gray-600 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50'
                } ${!isEditing ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                {countryCodes.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.flag} {country.code}
                  </option>
                ))}
              </select>
              <input
                id="mobile-number"
                name="mobileNumber"
                type="tel"
                value={profileData.mobileNumber}
                onChange={(e) => handleInputChange('mobileNumber', e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="Enter 10-digit mobile number"
                disabled={!isEditing}
                required
                maxLength={10}
                aria-invalid={errors.mobileNumber ? 'true' : 'false'}
                aria-describedby={errors.mobileNumber ? 'mobile-error' : undefined}
                className={`flex-1 px-4 py-3 border-2 rounded-lg focus:outline-none transition-colors bg-gray-700 text-white placeholder-gray-400 text-sm sm:text-base ${
                  errors.mobileNumber 
                    ? 'border-red-500 focus:border-red-400' 
                    : 'border-gray-600 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50'
                } ${!isEditing ? 'opacity-60 cursor-not-allowed' : ''}`}
              />
            </div>
            {errors.mobileNumber && (
              <p id="mobile-error" className="text-red-400 text-xs sm:text-sm mt-1" role="alert">
                {errors.mobileNumber}
              </p>
            )}
          </div>

          {/* Business Type */}
          <div>
            <label htmlFor="business-type" className="block text-gray-300 text-sm font-semibold mb-2">
              Business Type *
            </label>
            <select
              id="business-type"
              name="businessType"
              value={profileData.businessType}
              onChange={(e) => handleInputChange('businessType', e.target.value)}
              disabled={!isEditing}
              required
              aria-invalid={errors.businessType ? 'true' : 'false'}
              aria-describedby={errors.businessType ? 'business-type-error' : undefined}
              className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-colors bg-gray-700 text-white text-sm sm:text-base ${
                errors.businessType 
                  ? 'border-red-500 focus:border-red-400' 
                  : 'border-gray-600 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50'
              } ${!isEditing ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <option value="">Select business type</option>
              {businessTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            {errors.businessType && (
              <p id="business-type-error" className="text-red-400 text-xs sm:text-sm mt-1" role="alert">
                {errors.businessType}
              </p>
            )}
          </div>

          {/* GST Number */}
          <div className="lg:col-span-2">
            <label htmlFor="gst-number" className="block text-gray-300 text-sm font-semibold mb-2">
              GST Number (Optional)
            </label>
            <div className="relative">
              <input
                id="gst-number"
                name="gstNumber"
                type="text"
                value={profileData.gstNumber}
                onChange={(e) => handleInputChange('gstNumber', formatGST(e.target.value))}
                placeholder="22AAAAA0000A1Z5"
                disabled={!isEditing}
                maxLength={15}
                aria-invalid={errors.gstNumber ? 'true' : 'false'}
                aria-describedby={`gst-help ${errors.gstNumber ? 'gst-error' : ''}`.trim()}
                className={`w-full px-4 py-3 pr-12 border-2 rounded-lg focus:outline-none transition-colors bg-gray-700 text-white placeholder-gray-400 text-sm sm:text-base ${
                  errors.gstNumber 
                    ? 'border-red-500 focus:border-red-400' 
                    : 'border-gray-600 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50'
                } ${!isEditing ? 'opacity-60 cursor-not-allowed' : ''}`}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <Building className="h-5 w-5 text-purple-400" aria-hidden="true" />
              </div>
            </div>
            <p id="gst-help" className="text-gray-400 text-xs sm:text-sm mt-1">
              15-character GST identification number (optional for tax purposes)
            </p>
            {errors.gstNumber && (
              <p id="gst-error" className="text-red-400 text-xs sm:text-sm mt-1" role="alert">
                {errors.gstNumber}
              </p>
            )}
          </div>
        </form>

        {/* Action Buttons */}
        {isEditing && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end space-y-3 sm:space-y-0 sm:space-x-4 mt-6 sm:mt-8 pt-6 border-t border-gray-700">
            <button
              onClick={handleCancel}
              className="flex items-center justify-center space-x-2 px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 focus:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
              type="button"
              aria-label="Cancel profile changes"
            >
              <X className="h-4 w-4" aria-hidden="true" />
              <span>Cancel</span>
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              type="button"
              aria-label="Save profile changes"
              className={`flex items-center justify-center space-x-2 px-6 py-3 rounded-lg transition-colors focus:outline-none focus:ring-2 ${
                hasChanges 
                  ? 'bg-purple-600 hover:bg-purple-700 focus:bg-purple-700 text-white focus:ring-purple-400' 
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed focus:ring-gray-400'
              }`}
            >
              <Save className="h-4 w-4" aria-hidden="true" />
              <span>Save Changes</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return renderProfileContent();
      case 'add-project':
        return renderAddProjectContent();
      case 'projects':
        return (
          <div className="bg-gray-800 rounded-2xl p-6 sm:p-8 border border-gray-700 text-center">
            <Briefcase className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" aria-hidden="true" />
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-2">My Projects</h2>
            <p className="text-sm sm:text-base text-gray-400">Manage your active and completed projects.</p>
          </div>
        );
      case 'transactions':
        return (
          <div className="bg-gray-800 rounded-2xl p-6 sm:p-8 border border-gray-700 text-center">
            <CreditCard className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" aria-hidden="true" />
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-2">Transactions</h2>
            <p className="text-sm sm:text-base text-gray-400">View your payment history and transaction details.</p>
          </div>
        );
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
                  projectData.description.length >= 50 ? 'text-green-400' : 'text-gray-400'
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
            
            {/* Freelancer ID and Completion Date Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              {/* Freelancer ID */}
              <div>
                <label htmlFor="freelancer-id" className="block text-gray-300 text-sm font-semibold mb-2">
                  Freelancer ID *
                </label>
                <input
                  id="freelancer-id"
                  type="text"
                  value={projectData.freelancerId}
                  onChange={(e) => handleInputChange('freelancerId', e.target.value.toUpperCase())}
                  placeholder="F123456789"
                  className={`w-full px-4 py-3 border-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none transition-colors text-sm sm:text-base ${
                    errors.freelancerId 
                      ? 'border-red-500 focus:border-red-400' 
                      : 'border-gray-600 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50'
                  }`}
                  required
                  maxLength={10}
                  aria-invalid={errors.freelancerId ? 'true' : 'false'}
                  aria-describedby={`freelancer-id-help ${errors.freelancerId ? 'freelancer-id-error' : ''}`.trim()}
                />
                <p id="freelancer-id-help" className="text-gray-400 text-xs sm:text-sm mt-1">
                  Format: F followed by 9 digits (e.g., F123456789)
                </p>
                {errors.freelancerId && (
                  <p id="freelancer-id-error" className="text-red-400 text-xs sm:text-sm mt-1" role="alert">
                    {errors.freelancerId}
                  </p>
                )}
              </div>
              
              {/* Completion Date */}
              <div>
                <label htmlFor="completion-date" className="block text-gray-300 text-sm font-semibold mb-2">
                  Desired Completion Date *
                </label>
                <input
                  id="completion-date"
                  type="date"
                  value={projectData.completionDate}
                  onChange={(e) => handleInputChange('completionDate', e.target.value)}
                  min={getTomorrowDate()}
                  className={`w-full px-4 py-3 border-2 rounded-lg bg-gray-700 text-white focus:outline-none transition-colors text-sm sm:text-base ${
                    errors.completionDate 
                      ? 'border-red-500 focus:border-red-400' 
                      : 'border-gray-600 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50'
                  }`}
                  required
                  aria-invalid={errors.completionDate ? 'true' : 'false'}
                  aria-describedby={`completion-date-help ${errors.completionDate ? 'completion-date-error' : ''}`.trim()}
                />
                <p id="completion-date-help" className="text-gray-400 text-xs sm:text-sm mt-1">
                  Minimum date: Tomorrow
                </p>
                {errors.completionDate && (
                  <p id="completion-date-error" className="text-red-400 text-xs sm:text-sm mt-1" role="alert">
                    {errors.completionDate}
                  </p>
                )}
              </div>
            </div>
            
            {/* File Upload Section */}
            <div>
              <label className="block text-gray-300 text-sm font-semibold mb-2">
                Upload Project Files
              </label>
              <div
                className={`relative border-2 border-dashed rounded-lg p-6 sm:p-8 transition-all duration-300 ${
                  dragActive 
                    ? 'border-purple-400 bg-purple-900/20' 
                    : 'border-gray-600 hover:border-gray-500'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={acceptedFileTypes}
                  onChange={handleFileSelect}
                  className="hidden"
                  aria-label="Upload project files"
                />
                
                <div className="text-center">
                  <Upload className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-300 text-sm sm:text-base mb-2">
                    Drag and drop files here, or{' '}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-purple-400 hover:text-purple-300 font-medium underline focus:outline-none focus:ring-2 focus:ring-purple-400 rounded"
                    >
                      browse
                    </button>
                  </p>
                  <p className="text-gray-400 text-xs sm:text-sm">
                    Supported formats: PDF, DOC, DOCX, JPG, PNG, MP4, MOV, AVI, MKV, TXT, ZIP, RAR
                  </p>
                </div>
              </div>
              
              {/* Uploaded Files List */}
              {projectData.files.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h4 className="text-gray-300 text-sm font-medium">Uploaded Files:</h4>
                  {projectData.files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-700 rounded-lg p-3">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="flex-shrink-0">
                          <CheckCircle className="h-5 w-5 text-green-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm truncate">{file.name}</p>
                          <p className="text-gray-400 text-xs">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="flex-shrink-0 text-red-400 hover:text-red-300 p-1 focus:outline-none focus:ring-2 focus:ring-red-400 rounded"
                        aria-label={`Remove ${file.name}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Upload Progress */}
              {Object.keys(uploadProgress).length > 0 && (
                <div className="mt-4 space-y-2">
                  {Object.entries(uploadProgress).map(([fileName, progress]) => (
                    <div key={fileName} className="bg-gray-700 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white text-sm truncate">{fileName}</span>
                        <span className="text-purple-400 text-sm">{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-600 rounded-full h-2">
                        <div 
                          className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Submit Button */}
            {!showDeliverables && (
              <div className="flex justify-end pt-6 border-t border-gray-700">
                <button
                  type="submit"
                  className="flex items-center space-x-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 focus:bg-purple-700 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400"
                >
                  <span>Continue to Deliverables</span>
                  <ChevronDown className="h-4 w-4 rotate-[-90deg]" />
                </button>
              </div>
            )}
          </form>
        </div>
        
        {/* Deliverables Section */}
        {showDeliverables && (
          <div className="bg-gray-800 rounded-2xl p-4 sm:p-6 lg:p-8 border border-gray-700">
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-6">Project Deliverables Checklist</h3>
            <p className="text-gray-300 text-sm sm:text-base mb-6">
              Define specific deliverables that the freelancer must provide. This checklist will be used for AI verification.
            </p>
            
            <div className="space-y-4 mb-6">
              {deliverables.map((deliverable, index) => (
                <div key={deliverable.id} className="flex items-center space-x-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <input
                    type="text"
                    value={deliverable.text}
                    onChange={(e) => handleDeliverableChange(deliverable.id, e.target.value)}
                    placeholder={`Deliverable ${index + 1} (e.g., High-quality 1080p video resolution)`}
                    className="flex-1 px-4 py-3 border-2 border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50 text-sm sm:text-base"
                    aria-label={`Deliverable ${index + 1}`}
                  />
                  {deliverables.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeDeliverable(deliverable.id)}
                      className="flex-shrink-0 text-red-400 hover:text-red-300 p-2 focus:outline-none focus:ring-2 focus:ring-red-400 rounded"
                      aria-label={`Remove deliverable ${index + 1}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between space-y-4 sm:space-y-0 sm:space-x-4 mb-8">
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                {deliverables.length < 10 && (
                  <button
                    type="button"
                    onClick={addDeliverable}
                    className="flex items-center justify-center space-x-2 px-4 py-2 border border-purple-500 text-purple-400 rounded-lg hover:bg-purple-900/20 focus:bg-purple-900/20 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Deliverable</span>
                  </button>
                )}
                <span className="text-gray-400 text-sm self-center">
                  {deliverables.length}/10 deliverables
                </span>
              </div>
              
              <button
                type="button"
                onClick={handleGenerateAI}
                className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-400 transform hover:scale-105"
              >
                <Zap className="h-4 w-4" />
                <span>Generate via AI Assistant</span>
              </button>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-gray-700">
              <button
                type="button"
                onClick={() => setShowDeliverables(false)}
                className="flex items-center justify-center space-x-2 px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 focus:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                <span>Back to Project Details</span>
              </button>
              <button
                type="button"
                className="flex items-center justify-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 focus:bg-green-700 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-green-400"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Create Project</span>
              </button>
            </div>
          </div>
        )}
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