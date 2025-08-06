import React, { useState, useEffect } from 'react';
import { User, Briefcase, CreditCard, MessageSquare, CheckCircle, Clock, Shield, Edit3, Save, X, Upload, Building, Eye, Play, FileText, Upload as UploadIcon, RefreshCw, Bell } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getCurrentUser, signOut, getFreelancerProfile, updateFreelancerProfile, getUserType, getFreelancerProjectsWithDetails, updateProjectStatusWorkflow, getFreelancerTransactions, uploadWorkProduct, getFreelancerNotifications } from '../lib/supabase';
import { accessVideo, generateVideoUrl, formatFileSize, formatDuration, handleVideoError } from '../lib/videoUtils';
import { uploadWorkProductWithReupload, canReuploadWorkProduct, getLatestWorkProduct } from '../lib/videoReuploadUtils';
import EmailService from '../emails/emailService';
import Notifications from '../components/Notifications';

interface ProfileData {
  fullName: string;
  email: string;
  mobileNumber: string;
  countryCode: string;
  upiId: string;
  aadharNumber: string;
  freelancerId: string;
}

const FreelancerDashboard: React.FC = () => {
  const navigate = useNavigate();
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
    upiId: '',
    aadharNumber: '',
    freelancerId: ''
  });
  const [originalData, setOriginalData] = useState<ProfileData>({
    fullName: '',
    email: '',
    mobileNumber: '',
    countryCode: '+91',
    upiId: '',
    aadharNumber: '',
    freelancerId: ''
  });
  const [errors, setErrors] = useState<Partial<ProfileData>>({});

  // New state for projects
  const [projects, setProjects] = useState<any[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [selectedDeliverables, setSelectedDeliverables] = useState<any[]>([]);
  const [selectedVerificationReport, setSelectedVerificationReport] = useState<any>(null);
  const [showDeliverablesModal, setShowDeliverablesModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [currentProjectStatus, setCurrentProjectStatus] = useState<string>('');
  const [currentProjectId, setCurrentProjectId] = useState<string>('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  
  // New state for transactions
  const [transactions, setTransactions] = useState<any[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  
  // Action Needed modal state
  const [showActionNeededModal, setShowActionNeededModal] = useState(false);
  const [selectedTransactionForAction, setSelectedTransactionForAction] = useState<any>(null);
  const [isUpdatingToProduction, setIsUpdatingToProduction] = useState(false);
  
  // Final Work Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedProjectForUpload, setSelectedProjectForUpload] = useState<any>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Video modal state
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedWorkProduct, setSelectedWorkProduct] = useState<any>(null);

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

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'projects', label: 'My Projects', icon: Briefcase },
    { id: 'transactions', label: 'Transactions', icon: CreditCard },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'notifications', label: 'Notifications', icon: Bell }
  ];



  // Load user data on component mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const { user } = await getCurrentUser();
        if (user) {
          // Get user type and profile
          const { userType, profile } = await getUserType(user.id);
          
          if (userType === 'freelancer' && profile) {
            // Format Aadhar number for display (add dashes)
            const formatAadharForDisplay = (aadhar: string) => {
              if (!aadhar) return '';
              const cleaned = aadhar.replace(/\D/g, '');
              if (cleaned.length === 12) {
                return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 8)}-${cleaned.slice(8, 12)}`;
              }
              return aadhar;
            };

            // Load existing profile data
            setProfileData({
              fullName: profile.full_name || '',
              email: profile.email || user.email || '',
              mobileNumber: profile.mobile_number || '',
              countryCode: profile.country_code || '+91',
              upiId: profile.upi_id || '',
              aadharNumber: formatAadharForDisplay(profile.aadhar_number || ''),
              freelancerId: profile.freelancer_id || ''
            });
            
            setOriginalData({
              fullName: profile.full_name || '',
              email: profile.email || user.email || '',
              mobileNumber: profile.mobile_number || '',
              countryCode: profile.country_code || '+91',
              upiId: profile.upi_id || '',
              aadharNumber: formatAadharForDisplay(profile.aadhar_number || ''),
              freelancerId: profile.freelancer_id || ''
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

  // Load projects for the freelancer
  const loadProjects = async () => {
    if (!profileData.freelancerId) return;
    
    setProjectsLoading(true);
    try {
      const { data, error } = await getFreelancerProjectsWithDetails(profileData.freelancerId);
      if (error) {
        console.error('Error loading projects:', error);
        return;
      }
      setProjects(data || []);
    } catch (error) {
      console.error('Exception loading projects:', error);
    } finally {
      setProjectsLoading(false);
    }
  };

  // Load projects when freelancer ID is available
  useEffect(() => {
    if (profileData.freelancerId) {
      loadProjects();
    }
  }, [profileData.freelancerId]);

  // Load transactions when transactions tab is active
  useEffect(() => {
    if (activeTab === 'transactions' && profileData.freelancerId) {
      loadTransactions();
    }
  }, [activeTab, profileData.freelancerId]);

  // Load transactions for the freelancer
  const loadTransactions = async () => {
    if (!profileData.freelancerId) return;
    
    setTransactionsLoading(true);
    try {
      const { data, error } = await getFreelancerTransactions(profileData.freelancerId);
      if (error) {
        console.error('Error loading transactions:', error);
        return;
      }
      setTransactions(data || []);
    } catch (error) {
      console.error('Exception loading transactions:', error);
    } finally {
      setTransactionsLoading(false);
    }
  };

  const handleDeliverablesClick = (deliverables: any[], projectStatus: string, projectId: string) => {
    setSelectedDeliverables(deliverables);
    setCurrentProjectStatus(projectStatus);
    setCurrentProjectId(projectId);
    setShowDeliverablesModal(true);
  };

  const handleWorkProductClick = async (workProduct: any) => {
    if (!workProduct || !workProduct.file_path) {
      console.error('No work product or file path found:', workProduct);
      alert('No video file found for this project.');
      return;
    }

    try {
      // Use production-ready video access function
      const result = await accessVideo(workProduct);
      
      if (result.success && result.url) {
        console.log('Video access successful:', result.url);
        
        // Try to open the video in a new tab
        const newWindow = window.open(result.url, '_blank');
        
        // If the window is blocked or fails to open, show an embedded video modal
        if (!newWindow || newWindow.closed) {
          console.log('Popup blocked, showing video modal instead');
          setSelectedWorkProduct(workProduct);
          setShowVideoModal(true);
        }
      } else {
        console.error('Video access failed:', result.error);
        
        // Show fallback modal with error message
        setSelectedWorkProduct({
          ...workProduct,
          error: result.error,
          fallbackUrl: result.fallbackUrl
        });
        setShowVideoModal(true);
      }
    } catch (error) {
      console.error('Error accessing video:', error);
      alert('Failed to access video. Please try again later.');
    }
  };

  const handleVerificationReportClick = (report: any) => {
    setSelectedVerificationReport(report);
    setShowVerificationModal(true);
  };



  const handleAgreeToDeliverables = async () => {
    if (!currentProjectId || (currentProjectStatus !== 'Assigned to Freelancer' && currentProjectStatus !== 'Checklist Signed off')) {
      console.log('Invalid project state:', { currentProjectId, currentProjectStatus });
      return;
    }

    setIsUpdatingStatus(true);
    try {
      // Find the current project to get all necessary data
      const currentProject = projects.find(project => project.id === currentProjectId);
      if (!currentProject) {
        throw new Error('Project not found');
      }

      console.log('Attempting to update project status:', {
        projectId: currentProjectId,
        currentStatus: currentProjectStatus,
        newStatus: 'Checklist Signed off',
        project: currentProject
      });

      // Update project status to "Checklist Signed off"
      const result = await updateProjectStatusWorkflow(currentProjectId, 'Checklist Signed off');
      console.log('Update result:', result);
      
      // Update the local projects state to reflect the change
      setProjects(prevProjects => 
        prevProjects.map(project => 
          project.id === currentProjectId 
            ? { ...project, project_status_workflow: 'Checklist Signed off' }
            : project
        )
      );

      // Send email notification to client
      try {
        const emailService = EmailService.getInstance();
        
        // Format deliverables for email
        const deliverablesList = currentProject.deliverables.map((deliverable: any) => 
          deliverable.deliverable_text
        );

        const emailData = {
          clientEmail: currentProject.client_profiles?.email || '',
          clientName: currentProject.client_profiles?.full_name || '',
          projectId: currentProject.project_id || currentProject.id,
          projectName: currentProject.project_name,
          freelancerId: currentProject.freelancer_id,
          freelancerName: profileData.fullName,
          projectRequirement: currentProject.project_requirement,
          deliverables: deliverablesList,
          completionDate: currentProject.desired_completion_date
        };

        console.log('📧 Sending freelancer OK\'d checklist notification to client:', emailData);

        const emailResult = await emailService.sendDeliverablesSignedOffNotification(emailData);
        
        if (emailResult.success) {
          console.log('✅ Email notification sent successfully to client');
        } else {
          console.error('❌ Failed to send email notification:', emailResult.error);
        }
      } catch (emailError) {
        console.error('❌ Error sending email notification:', emailError);
        // Don't fail the entire operation if email fails
      }

      // Reload transactions to reflect the status change
      await loadTransactions();
      
      // Close the modal
      setShowDeliverablesModal(false);
      setCurrentProjectStatus('');
      setCurrentProjectId('');
    } catch (error) {
      console.error('Error updating project status:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      alert(`Failed to update project status: ${error.message || 'Unknown error'}. Please try again.`);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Action Needed functions
  const handleActionNeededClick = (transaction: any) => {
    console.log('Action Needed clicked - Transaction object:', transaction);
    console.log('Project data:', transaction.projects);
    setSelectedTransactionForAction(transaction);
    setShowActionNeededModal(true);
  };

  const handleConfirmProduction = async () => {
    if (!selectedTransactionForAction) return;
    
    setIsUpdatingToProduction(true);
    try {
      console.log('Selected transaction for action:', selectedTransactionForAction);
      console.log('Transaction project_id:', selectedTransactionForAction.project_id);
      console.log('Project object:', selectedTransactionForAction.projects);
      
      const projectId = selectedTransactionForAction.project_id;
      if (!projectId) {
        alert('Error: Project ID not found. Please try again.');
        return;
      }
      
      console.log('Updating project to Production in Progress:', projectId);
      console.log('Project ID type:', typeof projectId);
      console.log('Project ID length:', projectId.length);
      
      // Update project status to "Production in Progress"
      const { data, error } = await updateProjectStatusWorkflow(
        projectId,
        'Production in Progress'
      );

      if (error) {
        console.error('Error updating project status:', error);
        alert(`Failed to update project status: ${error.message || 'Unknown error'}`);
        return;
      }

      console.log('Project status updated successfully:', data);
      alert('Project status updated to "Production in Progress". You can now proceed with final product creation.');
      
      // Close the modal first
      setShowActionNeededModal(false);
      setSelectedTransactionForAction(null);
      
      // Reload transactions and projects to reflect the status change
      // This will make the "Action Needed" button disappear since project status is no longer "Fund Secured"
      await loadTransactions();
      await loadProjects();
    } catch (error) {
      console.error('Error updating project status:', error);
      alert(`Failed to update project status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUpdatingToProduction(false);
    }
  };

  const handleCloseActionModal = () => {
    setShowActionNeededModal(false);
    setSelectedTransactionForAction(null);
  };

  // Final Work Upload functions
  const handleUploadClick = async (project: any) => {
    // Check if user is authenticated and is a freelancer
    const { user } = await getCurrentUser();
    if (!user) {
      alert('Please log in to upload work products.');
      return;
    }

    // Check if project status is "Production in Progress"
    if (project.project_status_workflow !== 'Production in Progress') {
      alert('Upload is only available for projects with "Production in Progress" status.');
      return;
    }

    // Check if user has permission to upload for this project
    const canUpload = await canReuploadWorkProduct(project.id, user.id);
    if (!canUpload) {
      alert('You do not have permission to upload work products for this project.');
      return;
    }

    // Check if project already has work products
    if (project.work_products && project.work_products.length > 0) {
      const confirmReplace = window.confirm(
        `This project already has ${project.work_products.length} uploaded work product(s).\n\nDo you want to upload a new file? This will replace the existing upload.`
      );
      if (!confirmReplace) return;
    }
    
    setSelectedProjectForUpload(project);
    setShowUploadModal(true);
  };

  const handleReuploadClick = async (project: any) => {
    // Check if user is authenticated and is a freelancer
    const { user } = await getCurrentUser();
    if (!user) {
      alert('Please log in to re-upload work products.');
      return;
    }

    // Check if project status is "Production in Progress"
    if (project.project_status_workflow !== 'Production in Progress') {
      alert('Re-upload is only available for projects with "Production in Progress" status.');
      return;
    }

    // Check if user has permission to re-upload for this project
    const canReupload = await canReuploadWorkProduct(project.id, user.id);
    if (!canReupload) {
      alert('You do not have permission to re-upload work products for this project.');
      return;
    }

    // Check if project has existing work products
    if (!project.work_products || project.work_products.length === 0) {
      alert('No existing work products found to re-upload.');
      return;
    }

    const confirmReupload = window.confirm(
      `This will replace the existing work product with a new file.\n\nAre you sure you want to re-upload?`
    );
    if (!confirmReupload) return;
    
    setSelectedProjectForUpload(project);
    setShowUploadModal(true);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (10MB limit)
      if (file.size > 50 * 1024 * 1024) {
        alert('File size must be less than 50MB. Please select a smaller file.');
        event.target.value = ''; // Clear the input
        return;
      }
      
      // Check if it's a video file
      if (!file.type.startsWith('video/')) {
        alert('Please select a video file (MP4, AVI, MOV, etc.).');
        event.target.value = ''; // Clear the input
        return;
      }
      
      // Check for supported video formats
      const supportedFormats = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm'];
      if (!supportedFormats.includes(file.type.toLowerCase())) {
        alert('Please select a supported video format (MP4, AVI, MOV, WMV, FLV, WebM).');
        event.target.value = ''; // Clear the input
        return;
      }
      
      console.log('Selected file:', file.name, 'Size:', (file.size / (1024 * 1024)).toFixed(2), 'MB', 'Type:', file.type);
      setUploadedFile(file);
    }
  };

  const handleUploadSubmit = async () => {
    if (!uploadedFile || !selectedProjectForUpload) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      console.log('Uploading final work for project:', selectedProjectForUpload.id);
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 200);
      
      // Check if this is a re-upload (project already has work products)
      const hasExisting = selectedProjectForUpload.work_products && selectedProjectForUpload.work_products.length > 0;
      
      let result;
      if (hasExisting) {
        // Use re-upload function with replaceExisting option
        result = await uploadWorkProductWithReupload(
          selectedProjectForUpload.id,
          uploadedFile,
          {
            duration: 0, // Will be extracted from video metadata
            resolution: 'Unknown',
            format: uploadedFile.name.split('.').pop()?.toUpperCase() || 'MP4'
          },
          {
            replaceExisting: true,
            keepHistory: true,
            updateStatus: false // IMPORTANT: Do not change project status
          }
        );
      } else {
        // Use regular upload function but ensure no status change
        const { data, error } = await uploadWorkProduct(
          selectedProjectForUpload.id,
          uploadedFile,
          {
            duration: 0, // Will be extracted from video metadata
            resolution: 'Unknown',
            format: uploadedFile.name.split('.').pop()?.toUpperCase() || 'MP4'
          },
          { updateStatus: false } // IMPORTANT: Do not change project status
        );
        
        if (error) {
          throw error;
        }
        
        result = {
          success: true,
          newWorkProduct: data,
          message: 'Work product uploaded successfully'
        };
      }

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!result.success) {
        console.error('Error uploading final work:', result.error);
        alert(`Failed to upload final work: ${result.error || 'Unknown error'}`);
        return;
      }

      console.log('Final work uploaded successfully:', result);
      
      // Show success message with more details
      const action = hasExisting ? 're-uploaded' : 'uploaded';
      alert(`Final work ${action} successfully!\n\nFile: ${uploadedFile.name}\nSize: ${(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB\n\nThe client will be able to view your uploaded work.\n\nNote: Project status remains unchanged as requested.`);
      
      // Reload projects to show the uploaded work
      await loadProjects();
      
      // Close the modal and reset state
      setShowUploadModal(false);
      setSelectedProjectForUpload(null);
      setUploadedFile(null);
      setUploadProgress(0);
    } catch (error) {
      console.error('Error uploading final work:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to upload final work:\n\n${errorMessage}\n\nPlease try again or contact support if the problem persists.`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleCloseUploadModal = () => {
    setShowUploadModal(false);
    setSelectedProjectForUpload(null);
    setUploadedFile(null);
    setUploadProgress(0);
  };

  // Calculate profile completion percentage
  const calculateCompletion = () => {
    const fields = ['fullName', 'mobileNumber', 'upiId', 'aadharNumber'];
    const completed = fields.filter(field => profileData[field as keyof ProfileData].trim() !== '').length;
    return Math.round((completed / fields.length) * 100);
  };

  // Generate unique freelancer ID based on email
  const generateFreelancerId = (email: string) => {
    const timestamp = Date.now().toString().slice(-6);
    const emailHash = email.split('@')[0].slice(0, 3).toUpperCase();
    return `F${timestamp}${emailHash}`;
  };

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Check for changes
    const hasChanged = value !== originalData[field];
    setHasChanges(hasChanged || Object.keys(profileData).some(key => 
      key !== field && profileData[key as keyof ProfileData] !== originalData[key as keyof ProfileData]
    ));
  };

  const formatAadhar = (value: string) => {
    // Remove all non-digits
    const cleaned = value.replace(/\D/g, '');
    // Format as XXXX-XXXX-XXXX
    const match = cleaned.match(/^(\d{0,4})(\d{0,4})(\d{0,4})$/);
    if (match) {
      const parts = [match[1], match[2], match[3]].filter(Boolean);
      return parts.join('-');
    }
    return cleaned;
  };

  const maskAadhar = (aadhar: string) => {
    if (!aadhar) return '';
    const parts = aadhar.split('-');
    if (parts.length === 3) {
      return `${parts[0]}-****-${parts[2]}`;
    }
    return aadhar;
  };

  const validateForm = () => {
    const newErrors: Partial<ProfileData> = {};

    if (!profileData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!profileData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!profileData.mobileNumber.trim()) {
      newErrors.mobileNumber = 'Mobile number is required';
    } else if (!/^\d{10}$/.test(profileData.mobileNumber.replace(/\D/g, ''))) {
      newErrors.mobileNumber = 'Please enter a valid 10-digit mobile number';
    }

    if (!profileData.upiId.trim()) {
      newErrors.upiId = 'UPI ID is required';
    }

    if (!profileData.aadharNumber.trim()) {
      newErrors.aadharNumber = 'Aadhar number is required';
    } else {
      // Remove all non-digits and check if it's exactly 12 digits
      const cleanedAadhar = profileData.aadharNumber.replace(/\D/g, '');
      if (cleanedAadhar.length !== 12) {
        newErrors.aadharNumber = 'Aadhar number must be exactly 12 digits (e.g., 1234-5678-9012)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
        upi_id: profileData.upiId,
        aadhar_number: profileData.aadharNumber.replace(/\D/g, ''), // Store only digits
        profile_completed: true
      };

      console.log('Profile update data:', profileUpdateData);

      const { data, error } = await updateFreelancerProfile(user.id, profileUpdateData);
      
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
    setErrors({});
    setHasChanges(false);
    setIsEditing(false);
  };

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
          className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 rounded-2xl p-4 sm:p-6"
          role="alert"
          aria-live="polite"
        >
          <div className="flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-4">
            <div className="flex-shrink-0">
              <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-cyan-400" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg sm:text-xl font-semibold text-white mb-2">
                Welcome to SecureServe! 🎉
              </h2>
              <p className="text-sm sm:text-base text-gray-300 mb-4">
                Please complete your profile information to get started with projects and receive secure payments.
              </p>
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <div className="flex-1 sm:w-32 bg-gray-700 rounded-full h-2" role="progressbar" aria-valuenow={calculateCompletion()} aria-valuemin={0} aria-valuemax={100} aria-label="Profile completion progress">
                    <div 
                      className="bg-gradient-to-r from-cyan-400 to-purple-400 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${calculateCompletion()}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-cyan-400 whitespace-nowrap">
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
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 focus:bg-cyan-700 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 w-full sm:w-auto"
              aria-label="Edit profile information"
            >
              <Edit3 className="h-4 w-4" aria-hidden="true" />
              <span>Edit Profile</span>
            </button>
          )}
        </div>

        <form className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8" noValidate>
          {/* Freelancer ID */}
          <div className="lg:col-span-2">
            <label htmlFor="freelancer-id" className="block text-gray-300 text-sm font-semibold mb-2">
              Freelancer ID
            </label>
            <div className="relative">
              <input
                id="freelancer-id"
                name="freelancerId"
                type="text"
                value={profileData.freelancerId || 'Will be assigned after profile completion'}
                disabled
                className="w-full px-4 py-3 pr-12 border-2 border-gray-600 rounded-lg bg-gray-600 text-gray-300 cursor-not-allowed opacity-60 text-sm sm:text-base"
                aria-describedby="freelancer-id-help"
                tabIndex={-1}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <Shield className="h-5 w-5 text-cyan-400" aria-hidden="true" />
              </div>
            </div>
            <p id="freelancer-id-help" className="text-gray-400 text-xs sm:text-sm mt-1">
              {profileData.freelancerId 
                ? 'Your unique freelancer identification number' 
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
                  : 'border-gray-600 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50'
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
                  'border-gray-600 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50'
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
                    : 'border-gray-600 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50'
                } ${!isEditing ? 'opacity-60 cursor-not-allowed' : ''}`}
              />
            </div>
            {errors.mobileNumber && (
              <p id="mobile-error" className="text-red-400 text-xs sm:text-sm mt-1" role="alert">
                {errors.mobileNumber}
              </p>
            )}
          </div>

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
              placeholder="yourname@paytm, 9876543210@ybl"
              disabled={!isEditing}
              required
              aria-invalid={errors.upiId ? 'true' : 'false'}
              aria-describedby={`upi-help ${errors.upiId ? 'upi-error' : ''}`.trim()}
              className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-colors bg-gray-700 text-white placeholder-gray-400 text-sm sm:text-base ${
                errors.upiId 
                  ? 'border-red-500 focus:border-red-400' 
                  : 'border-gray-600 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50'
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

          {/* Aadhar Card Number */}
          <div className="lg:col-span-2">
            <label htmlFor="aadhar-number" className="block text-gray-300 text-sm font-semibold mb-2">
              Aadhar Card Number *
            </label>
            <div className="relative">
              <input
                id="aadhar-number"
                name="aadharNumber"
                type="text"
                value={isEditing ? formatAadhar(profileData.aadharNumber) : maskAadhar(profileData.aadharNumber)}
                onChange={(e) => {
                  const numbers = e.target.value.replace(/\D/g, '');
                  const formatted = formatAadhar(numbers);
                  handleInputChange('aadharNumber', formatted);
                }}
                placeholder="xxxx-xxxx-xxxx"
                disabled={!isEditing}
                maxLength={14}
                required
                aria-invalid={errors.aadharNumber ? 'true' : 'false'}
                aria-describedby={`aadhar-help ${errors.aadharNumber ? 'aadhar-error' : ''}`.trim()}
                className={`w-full px-4 py-3 pr-12 border-2 rounded-lg focus:outline-none transition-colors bg-gray-700 text-white placeholder-gray-400 text-sm sm:text-base ${
                  errors.aadharNumber 
                    ? 'border-red-500 focus:border-red-400' 
                    : 'border-gray-600 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50'
                } ${!isEditing ? 'opacity-60 cursor-not-allowed' : ''}`}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <Shield className="h-5 w-5 text-green-400" aria-hidden="true" />
              </div>
            </div>
            <div className="flex items-center space-x-2 mt-1">
              <Shield className="h-4 w-4 text-green-400" aria-hidden="true" />
              <p id="aadhar-help" className="text-green-400 text-xs sm:text-sm">
                Your Aadhar details are encrypted and secure
              </p>
            </div>
            {errors.aadharNumber && (
              <p id="aadhar-error" className="text-red-400 text-xs sm:text-sm mt-1" role="alert">
                {errors.aadharNumber}
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
              disabled={!hasChanges || isLoading}
              type="button"
              aria-label="Save profile changes"
              className={`flex items-center justify-center space-x-2 px-6 py-3 rounded-lg transition-colors focus:outline-none focus:ring-2 ${
                hasChanges 
                  ? 'bg-cyan-600 hover:bg-cyan-700 focus:bg-cyan-700 text-white focus:ring-cyan-400' 
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed focus:ring-gray-400'
              }`}
            >
              {isLoading ? (
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <>
              <Save className="h-4 w-4" aria-hidden="true" />
              <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );

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
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <Briefcase className="h-4 w-4" aria-hidden="true" />
            <span>{projects.length} Total Projects</span>
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
                <div className="text-left">Client ID</div>
                <div className="text-center">Project Status</div>
                <div className="text-center">Deliverable Checklist</div>
                <div className="text-center">Final Work</div>
                <div className="text-center">Verification Report</div>
              </div>
            </div>

            {/* Table Body */}
            {projectsLoading ? (
              <div className="bg-gray-800 rounded-b-lg border-t border-gray-600">
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto"></div>
                  <p className="text-gray-400 mt-2">Loading projects...</p>
                </div>
              </div>
            ) : projects.length === 0 ? (
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
                        Your projects will appear here once clients start hiring you. 
                        Make sure your profile is complete to attract more clients.
                      </p>
                    </div>
                    <div className="pt-4">
                      <button
                        onClick={() => setActiveTab('profile')}
                        className="inline-flex items-center space-x-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 focus:bg-cyan-700 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400"
                        aria-label="Visit your profile"
                      >
                        <User className="h-4 w-4" aria-hidden="true" />
                        <span>Visit your Profile</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-800 rounded-b-lg border-t border-gray-600">
                {projects.map((project, index) => (
                  <div key={project.id} className={`grid grid-cols-7 gap-4 p-4 text-sm ${index !== projects.length - 1 ? 'border-b border-gray-600' : ''}`}>
                    <div className="text-left text-white font-medium">{project.project_id}</div>
                    <div className="text-left text-white">{project.project_name}</div>
                    <div className="text-left text-gray-300">{project.client_id}</div>
                    <div className="text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        project.project_status_workflow === 'Successfully Closed' ? 'bg-green-500/20 text-green-400' :
                        project.project_status_workflow === 'Production in Progress' ? 'bg-blue-500/20 text-blue-400' :
                        project.project_status_workflow === 'Under Manual Revision' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {project.project_status_workflow}
                      </span>
                    </div>
                    <div className="text-center">
                      {project.deliverables && project.deliverables.length > 0 ? (
                                                              <button
                                        onClick={() => handleDeliverablesClick(project.deliverables, project.project_status_workflow, project.id)}
                                        className="inline-flex items-center space-x-1 text-purple-400 hover:text-purple-300 transition-colors"
                                      >
                          <Eye className="h-4 w-4" />
                          <span className="text-xs">View ({project.deliverables.length})</span>
                        </button>
                      ) : (
                        <span className="text-gray-500 text-xs">-</span>
                      )}
                    </div>
                    <div className="text-center">
                      {project.work_products && project.work_products.length > 0 ? (
                        <div className="flex flex-col items-center space-y-1">
                          <button
                            onClick={() => handleWorkProductClick(project.work_products[0])}
                            className="inline-flex items-center space-x-1 text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            <Play className="h-4 w-4" />
                            <span className="text-xs">Play</span>
                          </button>
                          <span className="text-gray-400 text-xs">
                            {project.work_products.length === 1 ? '1st upload' : 
                             project.work_products.length === 2 ? '2nd upload' :
                             project.work_products.length === 3 ? '3rd upload' :
                             `${project.work_products.length}th upload`}
                          </span>
                          {/* Show re-upload button only for freelancers and "Production in Progress" status */}
                          {project.project_status_workflow === 'Production in Progress' && (
                            <button
                              onClick={() => handleReuploadClick(project)}
                              className="inline-flex items-center space-x-1 text-orange-400 hover:text-orange-300 transition-colors"
                              title="Re-upload work product"
                            >
                              <RefreshCw className="h-3 w-3" />
                              <span className="text-xs">Re-upload</span>
                            </button>
                          )}
                        </div>
                      ) : project.project_status_workflow === 'Production in Progress' ? (
                        <button
                          onClick={() => handleUploadClick(project)}
                          className="inline-flex items-center space-x-1 text-cyan-400 hover:text-cyan-300 transition-colors"
                        >
                          <UploadIcon className="h-4 w-4" />
                          <span className="text-xs">Upload</span>
                        </button>
                      ) : (
                        <span className="text-gray-500 text-xs">-</span>
                      )}
                    </div>
                    <div className="text-center">
                      {project.verification_reports && project.verification_reports.length > 0 ? (
                        <div className="flex flex-col items-center space-y-1">
                          <button
                            onClick={() => handleVerificationReportClick(project.verification_reports[0])}
                            className="inline-flex items-center space-x-1 text-green-400 hover:text-green-300 transition-colors"
                          >
                            <FileText className="h-4 w-4" />
                            <span className="text-xs">View</span>
                          </button>
                          <span className="text-xs font-medium text-green-400">
                            {project.verification_reports[0].verification_score}% Match
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-500 text-xs">-</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Deliverables Modal */}
      {showDeliverablesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-md w-full max-h-96 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Deliverable Checklist</h3>
                <button
                  onClick={() => setShowDeliverablesModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-3">
                {selectedDeliverables.map((deliverable, index) => (
                  <div key={deliverable.id} className="flex items-start space-x-3 p-3 bg-gray-700 rounded-lg">
                    <div className="flex-shrink-0 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                      {index + 1}
                    </div>
                    <p className="text-gray-300 text-sm">{deliverable.deliverable_text}</p>
                  </div>
                ))}
              </div>

              {/* Agree Button - Show if project status is "Assigned to Freelancer" or "Checklist Signed off" */}
              {(currentProjectStatus === 'Assigned to Freelancer' || currentProjectStatus === 'Checklist Signed off') && (
                <div className="mt-6 pt-4 border-t border-gray-600">
                  <button
                    onClick={handleAgreeToDeliverables}
                    disabled={isUpdatingStatus}
                    className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-green-400"
                  >
                    {isUpdatingStatus ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        <span>OK Checklist</span>
                      </>
                    )}
                  </button>
                  <p className="text-xs text-gray-400 mt-2 text-center">
                    By clicking "OK Checklist", you confirm that you have reviewed and accepted these deliverables.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Verification Report Modal */}
      {showVerificationModal && selectedVerificationReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Verification Report</h3>
                <button
                  onClick={() => setShowVerificationModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="text-white font-medium mb-2">{selectedVerificationReport.report_title}</h4>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <p className="text-gray-300 text-sm whitespace-pre-wrap">{selectedVerificationReport.report_content}</p>
                  </div>
                </div>
                {selectedVerificationReport.verification_score && (
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400 text-sm">Score:</span>
                    <span className="text-white font-medium">{(selectedVerificationReport.verification_score * 100).toFixed(1)}%</span>
                  </div>
                )}
                {selectedVerificationReport.verification_notes && (
                  <div>
                    <span className="text-gray-400 text-sm">Notes:</span>
                    <p className="text-gray-300 text-sm mt-1">{selectedVerificationReport.verification_notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video Modal */}
      {showVideoModal && selectedWorkProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Video Player</h3>
                <button
                  onClick={() => {
                    setShowVideoModal(false);
                    setSelectedWorkProduct(null);
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="text-white font-medium mb-2">{selectedWorkProduct.file_name}</h4>
                  <div className="bg-gray-700 rounded-lg p-4">
                                      <video 
                    controls 
                    className="w-full h-auto max-h-[60vh] rounded"
                    preload="metadata"
                    onError={(e) => {
                      console.error('Video loading error:', e);
                      alert('Failed to load video. Please check your internet connection and try again.');
                    }}
                  >
                    <source 
                      src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/work-products/${selectedWorkProduct.file_path}`} 
                      type={selectedWorkProduct.file_type} 
                    />
                    Your browser does not support the video tag.
                  </video>
                  </div>
                  <div className="mt-4 space-y-3">
                    <div className="text-sm text-gray-400">
                      <p>File Size: {(selectedWorkProduct.file_size / (1024 * 1024)).toFixed(2)} MB</p>
                      {selectedWorkProduct.video_duration && (
                        <p>Duration: {Math.floor(selectedWorkProduct.video_duration / 60)}:{(selectedWorkProduct.video_duration % 60).toString().padStart(2, '0')}</p>
                      )}
                      {selectedWorkProduct.video_resolution && (
                        <p>Resolution: {selectedWorkProduct.video_resolution}</p>
                      )}
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => {
                          const downloadUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/work-products/${selectedWorkProduct.file_path}`;
                          const link = document.createElement('a');
                          link.href = downloadUrl;
                          link.download = selectedWorkProduct.file_name;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                      >
                        Download Video
                      </button>
                      <button
                        onClick={() => {
                          const videoUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/work-products/${selectedWorkProduct.file_path}`;
                          window.open(videoUrl, '_blank');
                        }}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
                      >
                        Open in New Tab
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


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
              View your payment history and completed transactions
            </p>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto">
          <div className="min-w-full">
            {/* Table Header */}
            <div className="bg-gray-700 rounded-t-lg">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4 p-3 sm:p-4 text-xs sm:text-sm font-semibold text-gray-300">
                <div className="text-left">Project ID</div>
                <div className="text-left hidden sm:block">Project Name</div>
                <div className="text-left hidden lg:block">Client Name</div>
                <div className="text-right">Value (₹)</div>
                <div className="text-center">Status</div>
                <div className="text-center">Action</div>
              </div>
            </div>

            {/* Table Body */}
            {transactionsLoading ? (
              <div className="bg-gray-800 rounded-b-lg border-t border-gray-600">
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto"></div>
                  <p className="text-gray-400 mt-2">Loading transactions...</p>
                </div>
              </div>
            ) : transactions.length > 0 ? (
              <div className="bg-gray-800 rounded-b-lg border-t border-gray-600">
                {transactions.map((transaction, index) => (
                    <div key={transaction.transaction_id} className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4 p-3 sm:p-4 text-xs sm:text-sm ${index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750'}`}>
                      <div className="text-left text-white truncate">{transaction.projects?.project_id || 'N/A'}</div>
                      <div className="text-left text-gray-300 truncate hidden sm:block">{transaction.projects?.project_name || 'N/A'}</div>
                      <div className="text-left text-gray-300 truncate hidden lg:block">{transaction.projects?.client_profiles?.full_name || 'N/A'}</div>
                      <div className="text-right text-white">₹{transaction.freelancer_amount?.toLocaleString() || '0'}</div>
                      <div className="text-center">
                        <span className={`${
                          transaction.transaction_status === 'Project Active' ? 'text-blue-400' :
                          transaction.transaction_status === 'Fund Secured' ? 'text-green-400' :
                          transaction.transaction_status === 'Successfully closed' ? 'text-purple-400' :
                          'text-red-400'
                        } font-medium`}>
                          {transaction.transaction_status}
                        </span>
                      </div>
                      <div className="text-center">
                        {transaction.projects?.project_status_workflow === 'Fund Secured' && (
                          <button
                            onClick={() => handleActionNeededClick(transaction)}
                            className="px-2 sm:px-3 py-1 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-medium rounded transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-gray-800"
                          >
                            Action Needed
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
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
                        Your payment history will appear here once you complete projects and receive payments. 
                        All transactions are secure and processed instantly.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Transaction Summary */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-400">
              ₹{transactions
                .filter(t => t.transaction_status === 'Successfully closed')
                .reduce((sum, t) => sum + (t.freelancer_amount || 0), 0)
                .toLocaleString()}
            </div>
            <div className="text-sm text-gray-300">Total Earned</div>
          </div>
          <div className="bg-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">
              {transactions.filter(t => t.transaction_status === 'Successfully closed').length}
            </div>
            <div className="text-sm text-gray-300">Completed Projects</div>
          </div>
          <div className="bg-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-400">
              {(() => {
                const completedTransactions = transactions.filter(t => t.transaction_status === 'Successfully closed');
                return completedTransactions.length > 0 
                  ? (completedTransactions.reduce((sum, t) => sum + (t.freelancer_amount || 0), 0) / completedTransactions.length).toFixed(0)
                  : '0';
              })()}
            </div>
            <div className="text-sm text-gray-300">Average Project Value</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMessagesContent = () => {
    return (
      <div className="space-y-6 sm:space-y-8">
        <div className="bg-gray-800 rounded-2xl p-6 sm:p-8 border border-gray-700 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-700 rounded-full flex items-center justify-center">
              <MessageSquare className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" aria-hidden="true" />
            </div>
            <div className="space-y-4">
              <h3 className="text-lg sm:text-xl font-semibold text-white">
                Messages
              </h3>
              <p className="text-sm sm:text-base text-gray-400 max-w-md">
                Access the full messaging interface to communicate with project participants.
              </p>
              <button
                onClick={() => navigate('/messages')}
                className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 flex items-center space-x-2"
              >
                <MessageSquare className="h-5 w-5" />
                <span>Open Messages</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderNotificationsContent = () => {
    return (
      <div className="space-y-6 sm:space-y-8">
        <Notifications 
          userType="freelancer"
          userId={profileData.freelancerId}
          getNotifications={getFreelancerNotifications}
        />
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return renderProfileContent();
      case 'projects':
        return renderMyProjectsContent();
      case 'transactions':
        return renderTransactionsContent();
      case 'messages':
        return renderMessagesContent();
      case 'notifications':
        return renderNotificationsContent();
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
              className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-cyan-400 rounded-lg p-1"
              aria-label="SecureServe Home"
            >
              <Shield className="h-8 w-8 text-cyan-400" />
              <span className="text-xl font-bold text-white">SecureServe</span>
            </Link>

            {/* User Menu */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <span className="text-gray-300 text-sm sm:text-base hidden sm:inline">
                Welcome, {profileData.fullName || 'Freelancer'}
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
                    className={`flex items-center space-x-1 sm:space-x-2 py-3 sm:py-4 px-1 sm:px-2 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                      activeTab === tab.id
                        ? 'border-cyan-400 text-cyan-400'
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

      {/* Action Needed Modal */}
      {showActionNeededModal && selectedTransactionForAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-gray-800 rounded-lg max-w-sm sm:max-w-md w-full mx-4">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-white">Action Required</h3>
                <button
                  onClick={handleCloseActionModal}
                  className="text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 rounded"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-cyan-500/20 border border-cyan-500/30 rounded-lg p-3 sm:p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 bg-cyan-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-cyan-900" />
                    </div>
                    <div className="flex-1">
                      <p className="text-cyan-300 text-xs sm:text-sm font-medium mb-1">
                        Escrow funds are secured. Proceed with final product creation.
                      </p>
                      <p className="text-cyan-200 text-xs">
                        Project: {selectedTransactionForAction.projects?.project_name || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 sm:pt-4">
                  <button
                    onClick={handleConfirmProduction}
                    disabled={isUpdatingToProduction}
                    className="w-full inline-flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-gray-800"
                  >
                    {isUpdatingToProduction ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span className="text-sm">Updating...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm">Click here to Confirm</span>
                      </>
                    )}
                  </button>
                  <p className="text-xs text-gray-400 mt-2 text-center">
                    This will update the project status to "Production in Progress"
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Final Work Upload Modal */}
      {showUploadModal && selectedProjectForUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-gray-800 rounded-lg max-w-sm sm:max-w-md w-full mx-4">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-white">Upload Final Work</h3>
                <button
                  onClick={handleCloseUploadModal}
                  className="text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 rounded"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3 sm:p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <UploadIcon className="h-3 w-3 sm:h-4 sm:w-4 text-blue-900" />
                    </div>
                    <div className="flex-1">
                      <p className="text-blue-300 text-xs sm:text-sm font-medium mb-1">
                        Upload your final video work for client review
                      </p>
                      <p className="text-blue-200 text-xs">
                        Project: {selectedProjectForUpload.project_name || 'N/A'}
                      </p>
                      <p className="text-blue-200 text-xs">
                        Project ID: {selectedProjectForUpload.project_id || 'N/A'}
                      </p>
                      <p className="text-blue-200 text-xs mt-1">
                        File size limit: 50MB | Supported formats: MP4, AVI, MOV, WMV, FLV, WebM
                      </p>
                      <p className="text-blue-200 text-xs mt-1">
                        This will be saved to work_products storage with proper project mapping
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label htmlFor="video-upload" className="block text-sm font-medium text-gray-300 mb-2">
                      Select Video File
                    </label>
                    <input
                      type="file"
                      id="video-upload"
                      accept="video/*"
                      onChange={handleFileSelect}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400"
                    />
                  </div>

                  {uploadedFile && (
                    <div className="bg-gray-700 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <UploadIcon className="h-4 w-4 text-green-400" />
                        <span className="text-green-400 text-sm font-medium">
                          {uploadedFile.name}
                        </span>
                      </div>
                      <div className="text-gray-400 text-xs mt-2 space-y-1">
                        <p>Size: {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                        <p>Type: {uploadedFile.type}</p>
                        <p>Format: {uploadedFile.name.split('.').pop()?.toUpperCase() || 'Unknown'}</p>
                        <p className="text-green-300">✓ File ready for upload</p>
                      </div>
                    </div>
                  )}

                  {isUploading && (
                    <div className="bg-gray-700 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-400"></div>
                        <span className="text-cyan-400 text-sm">Uploading...</span>
                      </div>
                      <div className="w-full bg-gray-600 rounded-full h-2 mt-2">
                        <div 
                          className="bg-cyan-400 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-3 sm:pt-4">
                  <button
                    onClick={handleUploadSubmit}
                    disabled={!uploadedFile || isUploading}
                    className="w-full inline-flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-gray-800"
                  >
                    {isUploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span className="text-sm">Uploading...</span>
                      </>
                    ) : (
                      <>
                        <UploadIcon className="h-4 w-4" />
                        <span className="text-sm">Upload Final Work</span>
                      </>
                    )}
                  </button>
                  <p className="text-xs text-gray-400 mt-2 text-center">
                    The client will be able to view your uploaded work
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FreelancerDashboard;