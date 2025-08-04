import React, { useState, useEffect, useRef } from 'react';
import { User, Briefcase, CreditCard, MessageSquare, CheckCircle, Clock, Shield, Edit3, Save, X, Plus, Upload, Building, Eye, Play, FileText } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getCurrentUser, signOut, getClientProfile, updateClientProfile, getUserType, getClientProjectsWithDetails, updateProjectDeliverables, getClientProjectsForEscrow, createEscrowTransaction, getClientTransactions, updateProject, updateTransaction, deleteProject, getAllFreelancerIds, sendChecklistToFreelancer } from '../lib/supabase';
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

  // New state for projects
  const [projects, setProjects] = useState<any[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [selectedDeliverables, setSelectedDeliverables] = useState<any[]>([]);
  const [selectedVerificationReport, setSelectedVerificationReport] = useState<any>(null);
  const [showDeliverablesModal, setShowDeliverablesModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  
  // New state for editable deliverables
  const [editingDeliverables, setEditingDeliverables] = useState<string[]>([]);
  const [isEditingDeliverables, setIsEditingDeliverables] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [savingDeliverables, setSavingDeliverables] = useState(false);

  // New state for Fund Escrow functionality
  const [showFundEscrowModal, setShowFundEscrowModal] = useState(false);
  const [escrowProjects, setEscrowProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [escrowValue, setEscrowValue] = useState<string>('');
  const [isCreatingTransaction, setIsCreatingTransaction] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);

  // Project modification modal state
  const [showProjectModifyModal, setShowProjectModifyModal] = useState(false);
  const [selectedProjectForModify, setSelectedProjectForModify] = useState<any>(null);
  const [modifyFreelancerId, setModifyFreelancerId] = useState<string>('');
  const [modifyProjectValue, setModifyProjectValue] = useState<string>('');
  const [isModifying, setIsModifying] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [availableFreelancerIds, setAvailableFreelancerIds] = useState<string[]>([]);
  const [modifyErrors, setModifyErrors] = useState<{freelancerId: string; projectValue: string}>({
    freelancerId: '',
    projectValue: ''
  });

  // Checklist sending state
  const [currentProjectStatus, setCurrentProjectStatus] = useState<string>('');
  const [isSendingChecklist, setIsSendingChecklist] = useState(false);

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

  // Load projects when My Projects tab is active
  useEffect(() => {
    if (activeTab === 'projects') {
      loadProjects();
    }
  }, [activeTab]);

  // Load transactions when Transactions tab is active
  useEffect(() => {
    if (activeTab === 'transactions') {
      loadTransactions();
    }
  }, [activeTab]);

  const loadProjects = async () => {
    setProjectsLoading(true);
    try {
      const { user } = await getCurrentUser();
      if (user) {
        const { data, error } = await getClientProjectsWithDetails(user.id);
        if (error) {
          console.error('Error loading projects:', error);
        } else {
          setProjects(data || []);
        }
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setProjectsLoading(false);
    }
  };

  const loadTransactions = async () => {
    setTransactionsLoading(true);
    try {
      const { user } = await getCurrentUser();
      if (user) {
        const { data, error } = await getClientTransactions(user.id);
        if (error) {
          console.error('Error loading transactions:', error);
        } else {
          setTransactions(data || []);
        }
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setTransactionsLoading(false);
    }
  };

  const loadEscrowProjects = async () => {
    try {
      const { user } = await getCurrentUser();
      if (user) {
        const { data, error } = await getClientProjectsForEscrow(user.id);
        if (error) {
          console.error('Error loading escrow projects:', error);
        } else {
          setEscrowProjects(data || []);
        }
      }
    } catch (error) {
      console.error('Exception loading escrow projects:', error);
    }
  };

  const handleFundEscrowClick = async () => {
    await loadEscrowProjects();
    setShowFundEscrowModal(true);
  };

  const handleProjectSelect = (projectId: string) => {
    setSelectedProjectId(projectId);
    const project = escrowProjects.find(p => p.id === projectId);
    setSelectedProject(project);
  };

  const handleTransfer = async () => {
    if (!selectedProjectId || !escrowValue || parseFloat(escrowValue) <= 0) {
      alert('Please select a project and enter a valid amount.');
      return;
    }

    setIsCreatingTransaction(true);
    try {
      const { data, error } = await createEscrowTransaction({
        project_id: selectedProjectId,
        value: parseFloat(escrowValue)
      });

      if (error) {
        console.error('Error creating transaction:', error);
        alert('Failed to create transaction. Please try again.');
      } else {
        console.log('Transaction created successfully:', data);
        alert('Transaction created successfully!');
        setShowFundEscrowModal(false);
        setSelectedProjectId('');
        setSelectedProject(null);
        setEscrowValue('');
        await loadTransactions(); // Refresh transactions list
        await loadEscrowProjects(); // Refresh escrow projects list to remove funded project
      }
    } catch (error) {
      console.error('Exception creating transaction:', error);
      alert('Failed to create transaction. Please try again.');
    } finally {
      setIsCreatingTransaction(false);
    }
  };

  const handleDeliverablesClick = (deliverables: any[], projectStatus: string, projectId: string) => {
    setSelectedDeliverables(deliverables);
    setEditingProjectId(projectId);
    setCurrentProjectStatus(projectStatus);
    setShowDeliverablesModal(true);
    
    // Only enable editing for "Project Created" status (not "Freelancer OK Checklist")
    if (projectStatus === 'Project Created') {
      setIsEditingDeliverables(true);
      // If no deliverables exist, initialize with 3 empty rows
      if (!deliverables || deliverables.length === 0) {
        setEditingDeliverables(['', '', '']);
      } else {
        setEditingDeliverables(deliverables.map((d: any) => d.deliverable_text));
      }
    } else {
      setIsEditingDeliverables(false);
      setEditingDeliverables([]);
    }
  };

  const handleDeliverableEdit = (index: number, value: string) => {
    const newDeliverables = [...editingDeliverables];
    newDeliverables[index] = value;
    setEditingDeliverables(newDeliverables);
  };

  const addDeliverable = () => {
    setEditingDeliverables([...editingDeliverables, '']);
  };

  const removeDeliverable = (index: number) => {
    const newDeliverables = editingDeliverables.filter((_, i) => i !== index);
    setEditingDeliverables(newDeliverables);
  };

  const handleSaveDeliverables = async () => {
    if (!editingProjectId) return;

    // Filter out empty deliverables
    const validDeliverables = editingDeliverables.filter(d => d.trim() !== '');
    
    // Check minimum 3 deliverables requirement
    if (validDeliverables.length < 3) {
      alert('Please add at least 3 deliverables before saving.');
      return;
    }

    setSavingDeliverables(true);
    try {
      const { data, error } = await updateProjectDeliverables(editingProjectId, validDeliverables);
      
      if (error) {
        console.error('Error saving deliverables:', error);
        alert('Failed to save deliverables. Please try again.');
        return;
      }

      // Update the projects list with new deliverables
      setProjects(prevProjects => 
        prevProjects.map(project => 
          project.id === editingProjectId 
            ? { ...project, deliverables: data || [] }
            : project
        )
      );

      // Update selected deliverables for display
      setSelectedDeliverables(data || []);
      
      alert('Deliverables saved successfully!');
      setIsEditingDeliverables(false);
    } catch (error) {
      console.error('Exception saving deliverables:', error);
      alert('Failed to save deliverables. Please try again.');
    } finally {
      setSavingDeliverables(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingDeliverables(false);
    setEditingDeliverables([]);
    setEditingProjectId(null);
  };

  const handleWorkProductClick = (workProduct: any) => {
    if (workProduct && workProduct.file_path) {
      // Open video in new tab
      window.open(workProduct.file_path, '_blank');
    }
  };

  const handleVerificationReportClick = (report: any) => {
    setSelectedVerificationReport(report);
    setShowVerificationModal(true);
  };

  // Project modification functions
  const handleProjectClick = async (project: any) => {
    if (project.project_status_workflow === 'Project Created' || project.project_status_workflow === 'Freelancer OK Checklist') {
      setSelectedProjectForModify(project);
      setModifyFreelancerId(project.freelancer_id || '');
      setModifyProjectValue(project.transaction_value || '');
      setShowDeleteConfirm(false);
      setModifyErrors({ freelancerId: '', projectValue: '' });
      
      // Load available freelancer IDs only for "Project Created" status
      if (project.project_status_workflow === 'Project Created') {
        try {
          const { data: freelancerIds } = await getAllFreelancerIds();
          if (freelancerIds) {
            setAvailableFreelancerIds(freelancerIds);
          }
        } catch (error) {
          console.error('Error loading freelancer IDs:', error);
        }
      }
      
      setShowProjectModifyModal(true);
    }
  };

  const handleModifyClick = () => {
    setIsModifying(true);
  };

  const handleModifySave = async () => {
    if (!selectedProjectForModify) return;

    // Validate inputs
    const errors = { freelancerId: '', projectValue: '' };
    let hasErrors = false;

    if (!modifyFreelancerId.trim()) {
      errors.freelancerId = 'Freelancer ID is required';
      hasErrors = true;
    }

    if (!modifyProjectValue.trim()) {
      errors.projectValue = 'Project Value is required';
      hasErrors = true;
    } else {
      const value = parseFloat(modifyProjectValue);
      if (isNaN(value) || value < 100) {
        errors.projectValue = 'Project Value must be at least ₹100';
        hasErrors = true;
      }
    }

    if (hasErrors) {
      setModifyErrors(errors);
      return;
    }

    try {
      // Update project
      const { error: projectError } = await updateProject(selectedProjectForModify.id, {
        freelancer_id: modifyFreelancerId
      });

      if (projectError) {
        console.error('Error updating project:', projectError);
        alert('Failed to update project');
        return;
      }

      // Find and update the associated transaction
      const projectTransaction = transactions.find(t => t.project_id === selectedProjectForModify.id);
      if (projectTransaction) {
        const newValue = parseFloat(modifyProjectValue);
        const { error: transactionError } = await updateTransaction(projectTransaction.transaction_id, {
          transaction_value: newValue
        });

        if (transactionError) {
          console.error('Error updating transaction:', transactionError);
          alert('Project updated but transaction update failed');
          return;
        }
      }

      // Reload projects and transactions
      await loadProjects();
      await loadTransactions();
      
      setShowProjectModifyModal(false);
      setSelectedProjectForModify(null);
      setIsModifying(false);
      alert('Project updated successfully!');
    } catch (error) {
      console.error('Error updating project:', error);
      alert('Failed to update project');
    }
  };

  const handleModifyCancel = () => {
    setIsModifying(false);
    setModifyErrors({ freelancerId: '', projectValue: '' });
    if (selectedProjectForModify) {
      setModifyFreelancerId(selectedProjectForModify.freelancer_id || '');
      setModifyProjectValue(selectedProjectForModify.transaction_value || '');
    }
  };

  const handleDeleteConfirm = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteProject = async () => {
    if (!selectedProjectForModify) return;

    setIsDeleting(true);
    try {
      const { error } = await deleteProject(selectedProjectForModify.id);
      
      if (error) {
        console.error('Error deleting project:', error);
        alert('Failed to delete project');
        return;
      }

      // Reload projects and transactions
      await loadProjects();
      await loadTransactions();
      
      setShowProjectModifyModal(false);
      setSelectedProjectForModify(null);
      setShowDeleteConfirm(false);
      setIsDeleting(false);
      alert('Project deleted successfully!');
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Failed to delete project');
      setIsDeleting(false);
    }
  };

  const handleSendChecklistToFreelancer = async () => {
    if (!editingProjectId) return;

    setIsSendingChecklist(true);
    try {
      const { data, error } = await sendChecklistToFreelancer(editingProjectId);
      
      if (error) {
        console.error('Error sending checklist to freelancer:', error);
        alert('Failed to send checklist to freelancer. Please try again.');
        return;
      }

      // Handle the JSON response from the updated function
      if (data && data.success) {
        if (data.already_sent) {
          alert('Project is already visible to freelancer. No changes needed.');
        } else {
          alert('Checklist sent to freelancer successfully! The freelancer will now be able to see this project.');
        }
      } else {
        alert(data?.message || 'Failed to send checklist to freelancer. Please try again.');
        return;
      }
      
      // Close the modal
      setShowDeliverablesModal(false);
      setIsEditingDeliverables(false);
      setEditingDeliverables([]);
      setEditingProjectId(null);
      setCurrentProjectStatus('');
    } catch (error) {
      console.error('Exception sending checklist to freelancer:', error);
      alert('Failed to send checklist to freelancer. Please try again.');
    } finally {
      setIsSendingChecklist(false);
    }
  };

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
                <div className="text-left">Freelancer ID</div>
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
                        Your projects will appear here once you create them. 
                        Start by creating your first project.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-800 rounded-b-lg border-t border-gray-600">
                {projects.map((project, index) => (
                  <div key={project.id} className={`grid grid-cols-7 gap-4 p-4 text-sm ${index !== projects.length - 1 ? 'border-b border-gray-600' : ''}`}>
                    <div className="text-left">
                      {project.project_status_workflow === 'Project Created' || project.project_status_workflow === 'Freelancer OK\'d Checklist' ? (
                        <button
                          onClick={() => handleProjectClick(project)}
                          className="text-white font-medium hover:text-purple-400 transition-colors cursor-pointer underline"
                          title={project.project_status_workflow === 'Project Created' ? "Click to modify project details" : "Click to view project details (deletion only)"}
                        >
                          {project.project_id}
                        </button>
                      ) : (
                        <span className="text-white font-medium">{project.project_id}</span>
                      )}
                    </div>
                    <div className="text-left text-white">{project.project_name}</div>
                    <div className="text-left text-gray-300">{project.freelancer_id}</div>
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
                      <button
                        onClick={() => handleDeliverablesClick(project.deliverables || [], project.project_status_workflow, project.id)}
                        className="inline-flex items-center space-x-1 text-purple-400 hover:text-purple-300 transition-colors"
                      >
                        {project.project_status_workflow === 'Project Created' ? (
                          <>
                            <Edit3 className="h-4 w-4" />
                            <span className="text-xs">
                              {project.deliverables && project.deliverables.length > 0 
                                ? `Edit (${project.deliverables.length})` 
                                : 'Add Deliverables'
                              }
                            </span>
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4" />
                            <span className="text-xs">
                              {project.deliverables && project.deliverables.length > 0 
                                ? `View (${project.deliverables.length})` 
                                : 'No Deliverables'
                              }
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="text-center">
                      {project.work_products && project.work_products.length > 0 ? (
                        <button
                          onClick={() => handleWorkProductClick(project.work_products[0])}
                          className="inline-flex items-center space-x-1 text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          <Play className="h-4 w-4" />
                          <span className="text-xs">Play</span>
                        </button>
                      ) : (
                        <span className="text-gray-500 text-xs">-</span>
                      )}
                    </div>
                    <div className="text-center">
                      {project.verification_reports && project.verification_reports.length > 0 ? (
                        <button
                          onClick={() => handleVerificationReportClick(project.verification_reports[0])}
                          className="inline-flex items-center space-x-1 text-green-400 hover:text-green-300 transition-colors"
                        >
                          <FileText className="h-4 w-4" />
                          <span className="text-xs">View</span>
                        </button>
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
                <div className="flex items-center space-x-2">
                  {isEditingDeliverables && (
                    <>
                      <button
                        onClick={handleSaveDeliverables}
                        disabled={savingDeliverables || editingDeliverables.filter(d => d.trim() !== '').length < 3}
                        className="inline-flex items-center space-x-1 px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white text-xs rounded transition-colors"
                      >
                        <Save className="h-3 w-3" />
                        <span>{savingDeliverables ? 'Saving...' : 'Save'}</span>
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="inline-flex items-center space-x-1 px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded transition-colors"
                      >
                        <X className="h-3 w-3" />
                        <span>Cancel</span>
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => {
                      setShowDeliverablesModal(false);
                      setIsEditingDeliverables(false);
                      setEditingDeliverables([]);
                      setEditingProjectId(null);
                    }}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              {isEditingDeliverables ? (
                // Edit mode
                <div className="space-y-3">
                  {editingDeliverables.map((deliverable, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-gray-700 rounded-lg">
                      <div className="flex-shrink-0 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1 flex items-center space-x-2">
                        <input
                          type="text"
                          value={deliverable}
                          onChange={(e) => handleDeliverableEdit(index, e.target.value)}
                          className="flex-1 bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                          placeholder="Enter deliverable..."
                          maxLength={200}
                        />
                        <button
                          onClick={() => removeDeliverable(index)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {editingDeliverables.length < 15 && (
                    <button
                      onClick={addDeliverable}
                      className="w-full p-3 border-2 border-dashed border-gray-600 rounded-lg text-gray-400 hover:text-gray-300 hover:border-gray-500 transition-colors flex items-center justify-center space-x-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Deliverable</span>
                    </button>
                  )}
                  
                  <div className="text-xs text-gray-400 mt-2">
                    {editingDeliverables.length}/15 deliverables (max 200 characters each)
                  </div>
                  {editingDeliverables.filter(d => d.trim() !== '').length < 3 && (
                    <div className="text-xs text-red-400 mt-2">
                      ⚠️ Minimum 3 deliverables required
                    </div>
                  )}
                </div>
              ) : (
                // View mode
                <div className="space-y-3">
                  {selectedDeliverables && selectedDeliverables.length > 0 ? (
                    selectedDeliverables.map((deliverable, index) => (
                      <div key={deliverable.id} className="flex items-start space-x-3 p-3 bg-gray-700 rounded-lg">
                        <div className="flex-shrink-0 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                          {index + 1}
                        </div>
                        <p className="text-gray-300 text-sm">{deliverable.deliverable_text}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                        <FileText className="h-6 w-6 text-gray-400" />
                      </div>
                      <p className="text-gray-400 text-sm">No deliverables have been added yet.</p>
                      <p className="text-gray-500 text-xs mt-1">Deliverables will appear here once they are added.</p>
                    </div>
                  )}
                </div>
              )}


              

              
                              {/* Send Checklist to Freelancer Button - Show for "Project Created" or "Freelancer OK Checklist" status and not in editing mode */}
              {currentProjectStatus === 'Project Created' && (
                <div className="mt-6 pt-4 border-t border-gray-600">
                  <div className="text-center">
                    <p className="text-gray-300 text-sm mb-3">
                      Ready to send the Checklist to Freelancer? Click here
                    </p>
                    <button
                      onClick={handleSendChecklistToFreelancer}
                      disabled={isSendingChecklist}
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white text-sm rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400"
                    >
                      {isSendingChecklist ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          <span>Send Checklist to Freelancer</span>
                        </>
                      )}
                    </button>
                  </div>
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

      {/* Project Modification Modal */}
      {showProjectModifyModal && selectedProjectForModify && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">
                  {selectedProjectForModify.project_status_workflow === 'Freelancer OK Checklist' ? 'Project Details' : 'Modify Project'}
                </h3>
                <button
                  onClick={() => {
                    setShowProjectModifyModal(false);
                    setSelectedProjectForModify(null);
                    setIsModifying(false);
                    setShowDeleteConfirm(false);
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                {/* Project ID (read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Project ID
                  </label>
                  <input
                    type="text"
                    value={selectedProjectForModify.project_id}
                    disabled
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-400 text-sm cursor-not-allowed"
                  />
                </div>

                {/* Freelancer ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Freelancer ID
                  </label>
                  {isModifying && selectedProjectForModify.project_status_workflow !== 'Freelancer OK Checklist' ? (
                    <select
                      value={modifyFreelancerId}
                      onChange={(e) => setModifyFreelancerId(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                    >
                      <option value="">Select Freelancer ID</option>
                      {availableFreelancerIds.map((id) => (
                        <option key={id} value={id}>{id}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={modifyFreelancerId}
                      disabled
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-400 text-sm cursor-not-allowed"
                    />
                  )}
                  {modifyErrors.freelancerId && (
                    <p className="text-red-400 text-xs mt-1">{modifyErrors.freelancerId}</p>
                  )}
                </div>

                {/* Project Value */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Project Value (₹)
                  </label>
                  {isModifying && selectedProjectForModify.project_status_workflow !== 'Freelancer OK Checklist' ? (
                    <input
                      type="number"
                      value={modifyProjectValue}
                      onChange={(e) => setModifyProjectValue(e.target.value)}
                      min="100"
                      step="0.01"
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                      placeholder="Enter project value"
                    />
                  ) : (
                    <input
                      type="text"
                      value={`₹${modifyProjectValue}`}
                      disabled
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-400 text-sm cursor-not-allowed"
                    />
                  )}
                  {modifyErrors.projectValue && (
                    <p className="text-red-400 text-xs mt-1">{modifyErrors.projectValue}</p>
                  )}
                </div>

                {/* Action Buttons */}
                {selectedProjectForModify.project_status_workflow !== 'Freelancer OK Checklist' && (
                  <div className="flex flex-col sm:flex-row gap-2 pt-4">
                    {!isModifying ? (
                      <>
                        <button
                          onClick={handleModifyClick}
                          className="flex-1 inline-flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded transition-colors"
                        >
                          <Edit3 className="h-4 w-4" />
                          <span>Modify</span>
                        </button>
                        <button
                          onClick={handleModifySave}
                          disabled
                          className="flex-1 inline-flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-gray-400 text-sm rounded cursor-not-allowed"
                        >
                          <Save className="h-4 w-4" />
                          <span>Save</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={handleModifyCancel}
                          className="flex-1 inline-flex items-center justify-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-colors"
                        >
                          <X className="h-4 w-4" />
                          <span>Cancel</span>
                        </button>
                        <button
                          onClick={handleModifySave}
                          className="flex-1 inline-flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
                        >
                          <Save className="h-4 w-4" />
                          <span>Save</span>
                        </button>
                      </>
                    )}
                  </div>
                )}

                {/* Info message for Freelancer OK Checklist projects */}
                {selectedProjectForModify.project_status_workflow === 'Freelancer OK Checklist' && (
                  <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3 mt-4">
                    <p className="text-blue-300 text-sm">
                      This project has been approved by the freelancer. You can only delete the project at this stage.
                    </p>
                  </div>
                )}

                {/* Delete Section */}
                <div className="border-t border-gray-600 pt-4 mt-4">
                  <p className="text-sm text-gray-400 mb-3">
                    Would you like to delete the project? Click 'Yes' if you do.
                  </p>
                  
                  {!showDeleteConfirm ? (
                    <button
                      onClick={handleDeleteConfirm}
                      className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
                    >
                      <span>Yes</span>
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-red-400">
                        Are you sure? This action cannot be undone.
                      </p>
                      <button
                        onClick={handleDeleteProject}
                        disabled={isDeleting}
                        className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white text-sm rounded transition-colors"
                      >
                        {isDeleting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Deleting...</span>
                          </>
                        ) : (
                          <span>Delete Project</span>
                        )}
                      </button>
                    </div>
                  )}
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
              View your payment history and project transactions
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              disabled
              className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-600 text-gray-400 rounded-lg font-medium cursor-not-allowed opacity-50"
              aria-label="Fund Escrow (Disabled)"
              title="Fund Escrow is now automatically handled when creating projects"
            >
              <CreditCard className="h-4 w-4" aria-hidden="true" />
              <span>Fund Escrow (Disabled)</span>
            </button>
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
                <div className="text-center">Transaction Status</div>
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
                  <div key={transaction.transaction_id} className={`grid grid-cols-5 gap-4 p-4 text-sm ${index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750'}`}>
                    <div className="text-left text-white">{transaction.projects?.project_id || 'N/A'}</div>
                    <div className="text-left text-gray-300">{transaction.projects?.project_name || 'N/A'}</div>
                    <div className="text-left text-gray-300">{transaction.projects?.freelancer_id || 'N/A'}</div>
                    <div className="text-right text-white">₹{transaction.transaction_value?.toLocaleString() || '0'}</div>
                    <div className="text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        transaction.transaction_status === 'Project under Manual Review' ? 'bg-yellow-100 text-yellow-800' :
                        transaction.transaction_status === 'Fund Secured' ? 'bg-green-100 text-green-800' :
                        transaction.transaction_status === 'Successfully closed' ? 'bg-blue-100 text-blue-800' :
                        transaction.transaction_status === 'Chargeback' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {transaction.transaction_status}
                      </span>
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
                        Your payment history will appear here once you fund projects through escrow. 
                        All transactions are secure and processed through our escrow system.
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
            <div className="text-2xl font-bold text-red-400">
              ₹{transactions.reduce((sum, t) => sum + (t.transaction_value || 0), 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-300">Total Spent</div>
          </div>
          <div className="bg-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{transactions.length}</div>
            <div className="text-sm text-gray-300">Projects Funded</div>
          </div>
          <div className="bg-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-400">
              ₹{transactions.length > 0 ? (transactions.reduce((sum, t) => sum + (t.transaction_value || 0), 0) / transactions.length).toFixed(0) : '0'}
            </div>
            <div className="text-sm text-gray-300">Average Project Cost</div>
          </div>
        </div>
      </div>

      {/* Fund Escrow Modal */}
      {showFundEscrowModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Fund Escrow</h3>
              <button
                onClick={() => setShowFundEscrowModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Project ID Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Project ID *
                </label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => handleProjectSelect(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                  required
                >
                  <option value="">Select a project</option>
                  {escrowProjects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.project_id} - {project.project_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Project Name (Read-only) */}
              {selectedProject && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={selectedProject.project_name}
                    readOnly
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-300"
                  />
                </div>
              )}

              {/* Freelancer ID (Read-only) */}
              {selectedProject && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Freelancer ID
                  </label>
                  <input
                    type="text"
                    value={selectedProject.freelancer_id}
                    readOnly
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-300"
                  />
                </div>
              )}

              {/* Freelancer Name (Read-only) */}
              {selectedProject && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Freelancer Name
                  </label>
                  <input
                    type="text"
                    value={selectedProject.freelancer_profiles?.full_name || 'N/A'}
                    readOnly
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-300"
                  />
                </div>
              )}

              {/* Value Input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Value (₹) *
                </label>
                <input
                  type="number"
                  value={escrowValue}
                  onChange={(e) => setEscrowValue(e.target.value)}
                  placeholder="Enter amount (e.g., 5000.00)"
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                  required
                />
              </div>

              {/* Transfer Button */}
              <div className="pt-4">
                <button
                  onClick={handleTransfer}
                  disabled={!selectedProjectId || !escrowValue || isCreatingTransaction}
                  className={`w-full py-2 px-4 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400 ${
                    !selectedProjectId || !escrowValue || isCreatingTransaction
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {isCreatingTransaction ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Processing...</span>
                    </div>
                  ) : (
                    'Transfer'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
                Supported: PDF, DOC, DOCX. Max 5MB per file
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
    
    const acceptedFileTypes = '.pdf,.doc,.docx';
    
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
        'Optimized file format (PDF/DOC/DOCX)',
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