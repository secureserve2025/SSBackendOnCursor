import React, { useState, useEffect, useRef } from 'react';
import { User, Briefcase, CreditCard, MessageSquare, CheckCircle, Clock, Shield, Edit3, Save, X, Plus, Upload, Building } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getCurrentUser, signOut, getClientProfile, updateClientProfile, getUserType } from '../lib/supabase';
import AddProjectForm from '../components/AddProjectForm';

interface ProfileData {
  fullName: string;
  email: string;
  mobileNumber: string;
  countryCode: string;
  companyName: string;
  panTanNumber: string;
  upiId: string;
  clientId: string;
}

interface FormErrors {
  fullName: string;
  email: string;
  mobileNumber: string;
  companyName: string;
  panTanNumber: string;
  upiId: string;
}

const ClientDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [isNewUser, setIsNewUser] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [profileData, setProfileData] = useState<ProfileData>({
    fullName: '',
    email: '',
    mobileNumber: '',
    countryCode: '+91',
    companyName: '',
    panTanNumber: '',
    upiId: '',
    clientId: ''
  });
  const [originalData, setOriginalData] = useState<ProfileData>({
    fullName: '',
    email: '',
    mobileNumber: '',
    countryCode: '+91',
    companyName: '',
    panTanNumber: '',
    upiId: '',
    clientId: ''
  });
  const [errors, setErrors] = useState<FormErrors>({
    fullName: '',
    email: '',
    mobileNumber: '',
    companyName: '',
    panTanNumber: '',
    upiId: ''
  });

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
    'Individual/Personal'
  ];
  const navigate = useNavigate();

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'add-project', label: 'New Project', icon: Plus },
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
          // Get user type and profile
          const { userType, profile } = await getUserType(user.id);
          
          if (userType === 'client' && profile) {
            // Load existing profile data
            setProfileData({
              fullName: profile.full_name || '',
              email: profile.email || user.email || '',
              mobileNumber: profile.mobile_number || '',
              countryCode: profile.country_code || '+91',
              companyName: profile.company_name || '',
              panTanNumber: profile.pan_tan_number || '',
              upiId: profile.upi_id || '',
              clientId: profile.client_id || ''
            });
            
            setOriginalData({
              fullName: profile.full_name || '',
              email: profile.email || user.email || '',
              mobileNumber: profile.mobile_number || '',
              countryCode: profile.country_code || '+91',
              companyName: profile.company_name || '',
              panTanNumber: profile.pan_tan_number || '',
              upiId: profile.upi_id || '',
              clientId: profile.client_id || ''
            });
            
            // Check if profile is complete
            setIsNewUser(!profile.profile_completed);
            
            if (profile.profile_completed) {
              setLastUpdated(new Date(profile.updated_at || Date.now()));
            }
          } else {
            // New user or wrong user type
          setProfileData(prev => ({
            ...prev,
            email: user.email || ''
          }));
          setOriginalData(prev => ({
            ...prev,
            email: user.email || ''
          }));
            setIsNewUser(true);
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
    const fields = ['fullName', 'mobileNumber', 'companyName', 'panTanNumber', 'upiId'];
    const completed = fields.filter(field => profileData[field as keyof ProfileData].trim() !== '').length;
    return Math.round((completed / fields.length) * 100);
  };

  // Generate unique client ID based on email
  const generateClientId = (email: string) => {
    const timestamp = Date.now().toString().slice(-6);
    const emailHash = email.split('@')[0].slice(0, 3).toUpperCase();
    return `C${timestamp}${emailHash}`;
  };

  const validateField = (field: keyof ProfileData, value: string): string => {
    switch (field) {
      case 'fullName':
        return value.trim().length < 2 ? 'Full name must be at least 2 characters long' : '';
      case 'email':
        if (!value.trim()) return 'Email is required';
        return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? 'Please enter a valid email address' : '';
      case 'mobileNumber':
        if (!value.trim()) return 'Mobile number is required';
        return !/^\d{10}$/.test(value.replace(/\D/g, '')) ? 'Please enter a valid 10-digit mobile number' : '';
      case 'companyName':
        return value.trim().length < 2 ? 'Company name must be at least 2 characters long' : '';
      case 'panTanNumber':
        if (!value.trim()) return 'PAN/TAN number is required';
        const cleanedPan = value.replace(/\s/g, '').toUpperCase();
        // Accept any 10-character alphanumeric string for PAN/TAN
        if (!/^[A-Z0-9]{10}$/.test(cleanedPan)) {
          return 'Please enter a valid 10-character PAN/TAN number (e.g., ABCDE1234F)';
        }
        return '';
      case 'upiId':
        return value.trim().length < 3 ? 'UPI ID must be at least 3 characters long' : '';
      default:
        return '';
    }
  };

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Check for changes
    const hasChanged = value !== originalData[field];
    setHasChanges(hasChanged || Object.keys(profileData).some(key => 
      key !== field && profileData[key as keyof ProfileData] !== originalData[key as keyof ProfileData]
    ));
  };

  const handleInputBlur = (field: keyof ProfileData, value: string) => {
    const error = validateField(field, value);
      setErrors(prev => ({ ...prev, [field]: error }));
  };

  const validateForm = () => {
    const newErrors: FormErrors = {
      fullName: validateField('fullName', profileData.fullName),
      email: validateField('email', profileData.email),
      mobileNumber: validateField('mobileNumber', profileData.mobileNumber),
      companyName: validateField('companyName', profileData.companyName),
      panTanNumber: validateField('panTanNumber', profileData.panTanNumber),
      upiId: validateField('upiId', profileData.upiId)
    };

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== '');
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      const { user } = await getCurrentUser();
      if (!user) {
        throw new Error('User not found');
      }

      console.log('Current user:', user);
      console.log('Profile data to save:', profileData);

      const profileUpdateData = {
        full_name: profileData.fullName,
        email: profileData.email || user.email || '', // Include email field
        mobile_number: profileData.mobileNumber,
        country_code: profileData.countryCode,
        company_name: profileData.companyName,
        pan_tan_number: profileData.panTanNumber.replace(/\s/g, '').toUpperCase(), // Remove spaces and convert to uppercase
        upi_id: profileData.upiId,
        profile_completed: true
      };

      console.log('Profile update data:', profileUpdateData);

      const { data, error } = await updateClientProfile(user.id, profileUpdateData);
      
      console.log('Update result:', { data, error });
      
      if (error) {
        console.error('Error updating profile:', error);
        alert(`Failed to save profile: ${error.message}`);
        return;
      }

      // Update original data
        setOriginalData({ ...profileData });
      setHasChanges(false);
      setIsEditing(false);
      setIsNewUser(false);
      setLastUpdated(new Date());
      
      alert('Profile saved successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert(`Failed to save profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setProfileData({ ...originalData });
    setErrors({
      fullName: '',
      email: '',
      mobileNumber: '',
      companyName: '',
      panTanNumber: '',
      upiId: ''
    });
    setHasChanges(false);
    setIsEditing(false);
  };

  const renderProfileContent = () => (
    <div className="space-y-6 sm:space-y-8">
      {/* Welcome Banner for New Users */}
      {isNewUser && (
        <div 
          className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-2xl p-4 sm:p-6"
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
                Please complete your profile information to start creating projects and hiring talented freelancers.
              </p>
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <div className="flex-1 sm:w-32 bg-gray-700 rounded-full h-2" role="progressbar" aria-valuenow={calculateCompletion()} aria-valuemin={0} aria-valuemax={100} aria-label="Profile completion progress">
                    <div 
                      className="bg-gradient-to-r from-purple-400 to-blue-400 h-2 rounded-full transition-all duration-500"
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
          <h2 className="text-xl sm:text-2xl font-bold text-white">Profile Information</h2>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 focus:bg-purple-700 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400 w-full sm:w-auto"
              aria-label="Edit profile information"
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

          {/* Full Name */}
          <div>
            <label htmlFor="full-name" className="block text-gray-300 text-sm font-semibold mb-2">
              Full Name *
            </label>
            <input
              id="full-name"
              name="fullName"
              type="text"
              value={profileData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              placeholder="Enter your full legal name"
              disabled={!isEditing}
              required
              aria-invalid={errors.fullName ? 'true' : 'false'}
              aria-describedby={errors.fullName ? 'full-name-error' : undefined}
              className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-colors bg-gray-700 text-white placeholder-gray-400 text-sm sm:text-base ${
                errors.fullName 
                  ? 'border-red-500 focus:border-red-400' 
                  : 'border-gray-600 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50'
              } ${!isEditing ? 'opacity-60 cursor-not-allowed' : ''}`}
            />
            {errors.fullName && (
              <p id="full-name-error" className="text-red-400 text-xs sm:text-sm mt-1" role="alert">
                {errors.fullName}
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

          {/* Company/Organization Name */}
          <div>
            <label htmlFor="company-name" className="block text-gray-300 text-sm font-semibold mb-2">
              Company/Organization Name *
            </label>
            <div className="relative">
              <input
                id="company-name"
                name="companyName"
                type="text"
                value={profileData.companyName}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
                placeholder="Enter company or organization name"
                disabled={!isEditing}
                required
                aria-invalid={errors.companyName ? 'true' : 'false'}
                aria-describedby={errors.companyName ? 'company-name-error' : undefined}
                className={`w-full px-4 py-3 pr-12 border-2 rounded-lg focus:outline-none transition-colors bg-gray-700 text-white placeholder-gray-400 text-sm sm:text-base ${
                  errors.companyName 
                    ? 'border-red-500 focus:border-red-400' 
                    : 'border-gray-600 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50'
                } ${!isEditing ? 'opacity-60 cursor-not-allowed' : ''}`}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <Building className="h-5 w-5 text-purple-400" aria-hidden="true" />
              </div>
            </div>
            {errors.companyName && (
              <p id="company-name-error" className="text-red-400 text-xs sm:text-sm mt-1" role="alert">
                {errors.companyName}
              </p>
            )}
          </div>

          {/* PAN/TAN Number */}
          <div>
            <label htmlFor="pan-tan-number" className="block text-gray-300 text-sm font-semibold mb-2">
              PAN/TAN Number *
            </label>
            <input
              id="pan-tan-number"
              name="panTanNumber"
              type="text"
              value={profileData.panTanNumber}
              onChange={(e) => handleInputChange('panTanNumber', e.target.value)}
              onBlur={(e) => handleInputBlur('panTanNumber', e.target.value)}
              placeholder="ABCDE1234F"
              disabled={!isEditing}
              maxLength={10}
              required
              aria-invalid={errors.panTanNumber ? 'true' : 'false'}
              aria-describedby={`pan-tan-help ${errors.panTanNumber ? 'pan-tan-error' : ''}`.trim()}
              className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-colors bg-gray-700 text-white placeholder-gray-400 text-sm sm:text-base ${
                errors.panTanNumber 
                  ? 'border-red-500 focus:border-red-400' 
                  : 'border-gray-600 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50'
              } ${!isEditing ? 'opacity-60 cursor-not-allowed' : ''}`}
            />
            <p id="pan-tan-help" className="text-gray-400 text-xs sm:text-sm mt-1">
              10-character alphanumeric identifier (e.g., ABCDE1234F)
            </p>
            {errors.panTanNumber && (
              <p id="pan-tan-error" className="text-red-400 text-xs sm:text-sm mt-1" role="alert">
                {errors.panTanNumber}
              </p>
            )}
          </div>
        </form>
          {/* UPI ID */}
          <div>
            <label htmlFor="upi-id" className="block text-gray-300 text-sm font-semibold mb-2">
              UPI ID *
            </label>
            <input
              id="upi-id"
              name="upiId"
              type="text"
              value={profileData.upiId}
              onChange={(e) => handleInputChange('upiId', e.target.value)}
              onBlur={(e) => handleInputBlur('upiId', e.target.value)}
              placeholder="yourname@paytm, 9876543210@ybl"
              disabled={!isEditing}
              required
              aria-invalid={errors.upiId ? 'true' : 'false'}
              aria-describedby={`upi-help ${errors.upiId ? 'upi-error' : ''}`.trim()}
              className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-colors bg-gray-700 text-white placeholder-gray-400 text-sm sm:text-base ${
                errors.upiId 
                  ? 'border-red-500 focus:border-red-400' 
                  : 'border-gray-600 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50'
              } ${!isEditing ? 'opacity-60 cursor-not-allowed' : ''}`}
            />
            <p id="upi-help" className="text-gray-400 text-xs sm:text-sm mt-1">
              Example: yourname@paytm, 9876543210@ybl
            </p>
            {errors.upiId && (
              <p id="upi-error" className="text-red-400 text-xs sm:text-sm mt-1" role="alert">
                {errors.upiId}
              </p>
            )}
          </div>

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
              disabled={!hasChanges || isLoading}
              type="button"
              aria-label="Save profile changes"
              className={`flex items-center justify-center space-x-2 px-6 py-3 rounded-lg transition-colors focus:outline-none focus:ring-2 ${
                hasChanges && !isLoading 
                  ? 'bg-purple-600 hover:bg-purple-700 focus:bg-purple-700 text-white focus:ring-purple-400' 
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed focus:ring-gray-400'
              }`}
            >
              {isLoading ? (
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
              <Save className="h-4 w-4" aria-hidden="true" />
              )}
              <span>{isLoading ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
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
              <div className="grid grid-cols-7 gap-4 p-4 text-sm font-semibold text-gray-300">
                <div className="text-left">Project ID</div>
                <div className="text-left">Project Name</div>
                <div className="text-left">Freelancer ID</div>
                <div className="text-center">Status</div>
                <div className="text-center">Deliverable List</div>
                <div className="text-center">Work Product</div>
                <div className="text-center">Verification Report</div>
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
              <div className="grid grid-cols-5 gap-4 p-4 text-sm font-semibold text-gray-300">
                <div className="text-left">Project ID</div>
                <div className="text-left">Project Name</div>
                <div className="text-left">Freelancer ID</div>
                <div className="text-right">Value (₹)</div>
                <div className="text-center">Value Status</div>
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
        return renderMessagesContent();
      default:
        return renderProfileContent();
    }
  };

  const renderMessagesContent = () => (
    <div className="space-y-6 sm:space-y-8">
      {/* Message Composition Form */}
      <div className="bg-gray-800 rounded-2xl p-4 sm:p-6 lg:p-8 border border-gray-700">
        <div className="mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Send Message</h2>
          <p className="text-sm sm:text-base text-gray-300">
            Communicate with freelancers about your projects
          </p>
        </div>

        <form className="space-y-6" noValidate>
          {/* Freelancer ID Selection */}
          <div>
            <label htmlFor="freelancer-select" className="block text-gray-300 text-sm font-semibold mb-2">
              Select Freelancer *
            </label>
            <select
              id="freelancer-select"
              className="w-full px-4 py-3 border-2 border-gray-600 rounded-lg focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50 bg-gray-700 text-white text-sm sm:text-base"
              required
            >
              <option value="">Choose a freelancer...</option>
              <option value="F123456789">John Smith (ID: F123456789)</option>
              <option value="F987654321">Sarah Johnson (ID: F987654321)</option>
              <option value="F456789123">Mike Chen (ID: F456789123)</option>
            </select>
          </div>

          {/* Project ID Selection */}
          <div>
            <label htmlFor="project-select" className="block text-gray-300 text-sm font-semibold mb-2">
              Select Project *
            </label>
            <select
              id="project-select"
              className="w-full px-4 py-3 border-2 border-gray-600 rounded-lg focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50 bg-gray-700 text-white text-sm sm:text-base"
              required
            >
              <option value="">Choose a project...</option>
              <option value="P67890">Corporate Video Production (ID: P67890)</option>
              <option value="P54321">Social Media Campaign (ID: P54321)</option>
              <option value="P98765">Product Demo Video (ID: P98765)</option>
            </select>
          </div>

          {/* Subject Category */}
          <div>
            <label htmlFor="subject-category" className="block text-gray-300 text-sm font-semibold mb-2">
              Subject Category *
            </label>
            <select
              id="subject-category"
              className="w-full px-4 py-3 border-2 border-gray-600 rounded-lg focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50 bg-gray-700 text-white text-sm sm:text-base"
              required
            >
              <option value="">Select category...</option>
              <option value="deliverable-checklist">Deliverable Checklist</option>
              <option value="work-verification">Work Verification</option>
              <option value="manual-revision">Invoking Manual Revision</option>
              <option value="work-approval">Work Approval</option>
            </select>
          </div>

          {/* Message Content */}
          <div>
            <label htmlFor="message-content" className="block text-gray-300 text-sm font-semibold mb-2">
              Message Content *
            </label>
            <textarea
              id="message-content"
              rows={6}
              placeholder="Type your message here..."
              maxLength={1000}
              className="w-full px-4 py-3 border-2 border-gray-600 rounded-lg focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50 bg-gray-700 text-white placeholder-gray-400 text-sm sm:text-base resize-none"
              required
            />
            <div className="flex justify-between items-center mt-1">
              <p className="text-gray-400 text-xs sm:text-sm">Maximum 1000 characters</p>
              <span className="text-xs sm:text-sm text-gray-400">0/1000</span>
            </div>
          </div>

          {/* File Attachments */}
          <div>
            <label className="block text-gray-300 text-sm font-semibold mb-2">
              File Attachments (Optional)
            </label>
            <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-gray-500 transition-colors">
              <Upload className="mx-auto h-8 w-8 text-gray-400 mb-4" />
              <p className="text-gray-300 font-medium mb-2">
                Drag and drop files here
              </p>
              <p className="text-sm text-gray-400 mb-4">or</p>
              <button
                type="button"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                Browse Files
              </button>
              <p className="text-xs text-gray-400 mt-4">
                Supported: PDF, DOC, DOCX, JPG, PNG, MP4, ZIP, etc. Max 10MB per file
              </p>
            </div>
          </div>

          {/* Send Button */}
          <div className="pt-6 border-t border-gray-700">
            <button
              type="submit"
              className="w-full flex items-center justify-center space-x-2 py-3 sm:py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold text-base sm:text-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              <MessageSquare className="h-5 w-5" />
              <span>Send Message</span>
            </button>
          </div>
        </form>
      </div>

      {/* Messages Thread */}
      <div className="bg-gray-800 rounded-2xl p-6 sm:p-8 border border-gray-700 text-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-700 rounded-full flex items-center justify-center">
            <MessageSquare className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg sm:text-xl font-semibold text-white">
              No messages yet
            </h3>
            <p className="text-sm sm:text-base text-gray-400 max-w-md">
              Start a conversation with a freelancer to discuss project details, deliverables, and approvals.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

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
                Welcome, {profileData.fullName || 'Client'}
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