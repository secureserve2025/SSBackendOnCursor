import React, { useState, useEffect } from 'react';
import { User, Briefcase, Plus, CreditCard, MessageSquare, CheckCircle, Clock, Shield, Edit3, Save, X, Building } from 'lucide-react';
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
        return (
          <div className="bg-gray-800 rounded-2xl p-6 sm:p-8 border border-gray-700 text-center">
            <Plus className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" aria-hidden="true" />
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-2">Add New Project</h2>
            <p className="text-sm sm:text-base text-gray-400">Create and post new projects to hire freelancers.</p>
          </div>
        );
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