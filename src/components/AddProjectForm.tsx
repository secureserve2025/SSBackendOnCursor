import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, X, Plus, Minus, Wand2, Calendar, User, FileText, Folder, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { validateFreelancerId, createProject, getAllFreelancerIds, getCurrentUser, getClientProfile, updateProjectDeliverables, createEscrowTransaction } from '../lib/supabase';
import EmailService, { ProjectNotificationData } from '../emails/emailService';
import AIDeliverableChat from './AIDeliverableChat';

interface FileUpload {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
}

interface FormData {
  projectId: string;
  category: string;
  projectName: string;
  freelancerId: string;
  completionDate: string;
  projectRequirement: string;
  projectValue: string;
  files: FileUpload[];
  deliverables: string[];
}

interface FormErrors {
  projectName: string;
  projectRequirement: string;
  freelancerId: string;
  completionDate: string;
  projectValue: string;
  deliverables: string;
}

const AddProjectForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    projectId: '',
    category: 'Video Production',
    projectName: '',
    freelancerId: '',
    completionDate: '',
    projectRequirement: '',
    projectValue: '',
    files: [],
    deliverables: ['', '', '', '']
  });

  const [errors, setErrors] = useState<FormErrors>({
    projectName: '',
    projectRequirement: '',
    freelancerId: '',
    completionDate: '',
    projectValue: '',
    deliverables: ''
  });

  const [showDeliverables, setShowDeliverables] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidatingFreelancer, setIsValidatingFreelancer] = useState(false);
  const [freelancerValidationStatus, setFreelancerValidationStatus] = useState<'idle' | 'validating' | 'success' | 'error'>('idle');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [currentClientId, setCurrentClientId] = useState<string>('');
  const [createdProjectId, setCreatedProjectId] = useState<string>('');
  
  // AI Chat state
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [aiSuccessMessage, setAiSuccessMessage] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  const categories = [
    { value: 'Video Production', label: 'Video Production', enabled: true },
    { value: 'Content Writing', label: 'Content Writing (will be enabled soon)', enabled: false },
    { value: 'UI/UX Design', label: 'UI/UX Design (will be enabled soon)', enabled: false },
    { value: 'Gen AI Services', label: 'Gen AI Services (will be enabled soon)', enabled: false }
  ];

  const allowedFileTypes = [
    '.pdf', '.doc', '.docx'
  ];

  const maxFileSize = 5 * 1024 * 1024; // 5MB per file

  // Load current user and client profile
  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const { user, error } = await getCurrentUser();
        if (error) {
          console.error('Error getting current user:', error);
          return;
        }
        
        if (user) {
          setCurrentUserId(user.id);
          
          // Get client profile
          const { data: clientProfile, error: profileError } = await getClientProfile(user.id);
          if (profileError) {
            console.error('Error getting client profile:', profileError);
            return;
          }
          
          if (clientProfile) {
            setCurrentClientId(clientProfile.client_id);
            console.log('Loaded client ID:', clientProfile.client_id);
          }
        }
      } catch (err) {
        console.error('Exception loading current user:', err);
      }
    };

    loadCurrentUser();
  }, []);

  // Get tomorrow's date in YYYY-MM-DD format
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  // Validate individual fields
  const validateField = (name: keyof FormErrors, value: string) => {
    switch (name) {
      case 'projectName':
        return value.trim().length < 3 ? 'Project name must be at least 3 characters long' : '';
      case 'projectRequirement':
        return value.trim().length < 10 ? 'Project requirement must be at least 10 characters long' : '';
      case 'freelancerId':
        const freelancerIdRegex = /^F\d{9}$/;
        if (!value.trim()) return 'Freelancer ID is required';
        return !freelancerIdRegex.test(value) ? 'Freelancer ID must be in format F123456789' : '';
      case 'completionDate':
        if (!value) return 'Completion date is required';
        const selectedDate = new Date(value);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        return selectedDate < tomorrow ? 'Completion date must be at least tomorrow' : '';
      case 'projectValue':
        if (!value) return 'Project value is required';
        const numValue = parseFloat(value);
        if (isNaN(numValue) || numValue <= 0) return 'Project value must be a positive number';
        if (numValue < 100) return 'Project value must be at least ₹100';
        return '';
      default:
        return '';
    }
  };

  // Handle input changes
  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Handle input blur (validation)
  const handleInputBlur = (field: keyof FormErrors, value: string) => {
    const error = validateField(field, value);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  // Format Freelancer ID input
  const handleFreelancerIdChange = (value: string) => {
    // Remove any non-digit characters except F at the beginning
    let formatted = value.replace(/[^F\d]/g, '');
    
    // Ensure it starts with F
    if (!formatted.startsWith('F')) {
      formatted = 'F' + formatted.replace(/F/g, '');
    }
    
    // Limit to F + 9 digits
    if (formatted.length > 10) {
      formatted = formatted.substring(0, 10);
    }
    
    handleInputChange('freelancerId', formatted);
  };

  // Validate freelancer ID exists in database
  const validateFreelancerIdExists = async (freelancerId: string) => {
    if (!freelancerId || freelancerId.length !== 10) return false;
    
    setIsValidatingFreelancer(true);
    setFreelancerValidationStatus('validating');
    try {
      console.log('Validating freelancer ID in form:', freelancerId);
      const { data, error } = await validateFreelancerId(freelancerId);
      setIsValidatingFreelancer(false);
      setFreelancerValidationStatus('idle'); // Reset status after validation
      
      console.log('Validation result:', { data, error });
      
      // Check if there's an error or no data returned
      if (error || !data) {
        console.log('Freelancer ID not found, setting error');
        const errorMessage = error?.message || 'Freelancer ID not found in database';
        setErrors(prev => ({ ...prev, freelancerId: errorMessage }));
        setFreelancerValidationStatus('error');
        return false;
      }
      
      console.log('Freelancer ID validated successfully');
      setErrors(prev => ({ ...prev, freelancerId: '' }));
      setFreelancerValidationStatus('success');
      return true;
    } catch (err) {
      console.error('Exception in validateFreelancerIdExists:', err);
      setIsValidatingFreelancer(false);
      setFreelancerValidationStatus('error');
      setErrors(prev => ({ ...prev, freelancerId: 'Error validating freelancer ID' }));
      return false;
    }
  };

  // File upload handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragOver(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    dragCounterRef.current = 0;
    
    const files = Array.from(e.dataTransfer.files);
    handleFileUpload(files);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFileUpload(files);
    }
  };

  const handleFileUpload = (files: File[]) => {
    const validFiles = files.filter(file => {
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      return allowedFileTypes.includes(extension) && file.size <= maxFileSize;
    });

    // Limit to maximum 1 file
    const filesToAdd = validFiles.slice(0, 1 - formData.files.length);

    filesToAdd.forEach(file => {
      const fileUpload: FileUpload = {
        id: Date.now() + Math.random().toString(),
        file,
        progress: 0,
        status: 'uploading'
      };

      setFormData(prev => ({
        ...prev,
        files: [...prev.files, fileUpload]
      }));

      // Simulate file upload progress
      const interval = setInterval(() => {
        setFormData(prev => ({
          ...prev,
          files: prev.files.map(f => 
            f.id === fileUpload.id 
              ? { ...f, progress: Math.min(f.progress + 10, 100) }
              : f
          )
        }));
      }, 200);

      setTimeout(() => {
        clearInterval(interval);
        setFormData(prev => ({
          ...prev,
          files: prev.files.map(f => 
            f.id === fileUpload.id 
              ? { ...f, progress: 100, status: 'completed' }
              : f
          )
        }));
      }, 2000);
    });
  };

  const removeFile = (fileId: string) => {
    setFormData(prev => ({
      ...prev,
      files: prev.files.filter(f => f.id !== fileId)
    }));
  };

  // Deliverables handlers
  const handleDeliverableChange = (index: number, value: string) => {
    const newDeliverables = [...formData.deliverables];
    newDeliverables[index] = value;
    setFormData(prev => ({ ...prev, deliverables: newDeliverables }));
  };

  const addDeliverable = () => {
    if (formData.deliverables.length < 15) {
      setFormData(prev => ({
        ...prev,
        deliverables: [...prev.deliverables, '']
      }));
    }
  };

  const removeDeliverable = (index: number) => {
    if (formData.deliverables.length > 1) {
      const newDeliverables = formData.deliverables.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, deliverables: newDeliverables }));
    }
  };

  const generateAIDeliverables = async () => {
    // Validate that we have the required project data
    if (!formData.projectName || !formData.projectRequirement || !formData.freelancerId || !formData.completionDate) {
      alert('Please complete all required project fields before generating AI deliverables.');
      return;
    }

    // Check if project has been created (we need the project ID)
    if (!createdProjectId) {
      alert('Please create the project first before generating AI deliverables.');
      return;
    }

    // Open the AI chat modal
    setIsAIChatOpen(true);
  };

  // Handle AI-generated deliverables
  const handleAIDeliverablesGenerated = (aiDeliverables: string[]) => {
    // Filter out empty deliverables from current form
    const existingDeliverables = formData.deliverables.filter(d => d.trim() !== '');
    
    // Merge existing deliverables with AI-generated ones
    let mergedDeliverables: string[];
    
    if (aiDeliverables.length > 15) {
      // If AI generates more than 15, replace all with AI deliverables
      mergedDeliverables = aiDeliverables.slice(0, 15);
    } else {
      // Merge existing with AI deliverables, ensuring we don't exceed 15
      const totalCount = existingDeliverables.length + aiDeliverables.length;
      if (totalCount <= 15) {
        mergedDeliverables = [...existingDeliverables, ...aiDeliverables];
      } else {
        // If we exceed 15, prioritize AI deliverables
        const aiCount = Math.min(aiDeliverables.length, 15);
        const existingCount = 15 - aiCount;
        mergedDeliverables = [
          ...existingDeliverables.slice(0, existingCount),
          ...aiDeliverables.slice(0, aiCount)
        ];
      }
    }

    // Update form data with merged deliverables
    setFormData(prev => ({
      ...prev,
      deliverables: mergedDeliverables
    }));

    // Show success message
    setAiSuccessMessage(`Successfully added ${aiDeliverables.length} AI-generated deliverables!`);
    
    // Clear success message after 5 seconds
    setTimeout(() => {
      setAiSuccessMessage('');
    }, 5000);

    console.log('AI Deliverables merged:', mergedDeliverables);
  };

  // Form validation
  const validateForm = () => {
    const newErrors: FormErrors = {
      projectName: validateField('projectName', formData.projectName),
      projectRequirement: validateField('projectRequirement', formData.projectRequirement),
      freelancerId: validateField('freelancerId', formData.freelancerId),
      completionDate: validateField('completionDate', formData.completionDate),
      projectValue: validateField('projectValue', formData.projectValue),
      deliverables: ''
    };

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== '');
  };

  const validateDeliverables = () => {
    const filledDeliverables = formData.deliverables.filter(d => d.trim() !== '');
    if (filledDeliverables.length < 3) {
      setErrors(prev => ({ ...prev, deliverables: 'Please provide at least 3 deliverables' }));
      return false;
    }
    setErrors(prev => ({ ...prev, deliverables: '' }));
    return true;
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Check if we have the current client ID
      if (!currentClientId) {
        alert('Unable to get your client profile. Please complete your profile first.');
        return;
      }

      // Prepare project data for database
      const projectData = {
        client_id: currentUserId, // Use the user ID, not client_id
        freelancer_id: formData.freelancerId,
        project_category: formData.category,
        project_name: formData.projectName,
        project_requirement: formData.projectRequirement,
        desired_completion_date: formData.completionDate
      };

      // Extract files (no deliverables yet)
      const files = formData.files.map(f => f.file);

      console.log('Creating project with data:', projectData);
      console.log('Files:', files);

      const { data, error } = await createProject(projectData, files, []); // Empty deliverables array
      
      if (error) {
        console.error('Error creating project:', error);
        alert('Failed to create project. Please try again.');
        setIsSubmitting(false);
        return;
      } else {
        console.log('Project created successfully:', data);
        setCreatedProjectId(data.id); // Store the project ID
        
        // Create transaction with project value
        console.log('🔍 AddProjectForm: Creating transaction with project value:', formData.projectValue);
        try {
          const { data: transactionData, error: transactionError } = await createEscrowTransaction({
            project_id: data.id,
            value: parseFloat(formData.projectValue)
          });
          
          if (transactionError) {
            console.error('❌ Transaction creation failed:', transactionError);
            alert('Project created but transaction creation failed. Please contact support.');
          } else {
            console.log('✅ Transaction created successfully:', transactionData);
          }
        } catch (transactionErr) {
          console.error('❌ Exception in transaction creation:', transactionErr);
          alert('Project created but transaction creation failed. Please contact support.');
        }
        
        // Send email notification to freelancer when project is created
        console.log('🔍 AddProjectForm: About to send project creation email notification');
        try {
          await sendProjectNotificationEmail({ project_id: data.id }, {
            project_name: formData.projectName,
            project_requirement: formData.projectRequirement,
            desired_completion_date: formData.completionDate
          });
        } catch (emailError) {
          console.error('❌ Project creation email notification failed:', emailError);
          // Don't fail the project creation if email fails
        }
        
        setShowDeliverables(true);
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error('Exception in project creation:', err);
      alert('Failed to create project. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleFinalSubmit = async () => {
    if (!validateDeliverables()) {
      return;
    }

    if (!createdProjectId) {
      alert('Project ID not found. Please try again.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Extract deliverables
      const deliverables = formData.deliverables.filter(d => d.trim() !== '');

      console.log('Adding deliverables to project:', createdProjectId);
      console.log('Deliverables:', deliverables);

      const { data, error } = await updateProjectDeliverables(createdProjectId, deliverables);
      
      if (error) {
        console.error('Error adding deliverables:', error);
        alert('Failed to add deliverables. Please try again.');
      } else {
        console.log('Deliverables added successfully:', data);
        
        alert(`Deliverables added successfully! Project ID: ${createdProjectId}`);
        // Reset form or redirect
        setFormData({
          projectId: '',
          category: 'Video Production',
          projectName: '',
          freelancerId: '',
          completionDate: '',
          projectRequirement: '',
          projectValue: '',
          files: [],
          deliverables: ['', '', '', '']
        });
        setCreatedProjectId('');
        setShowDeliverables(false);
      }
    } catch (err) {
      console.error('Exception in adding deliverables:', err);
      alert('Failed to add deliverables. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to send email notification to freelancer
  const sendProjectNotificationEmail = async (projectData: any, originalProjectData: any) => {
    console.log('🔍 AddProjectForm: Starting sendProjectNotificationEmail');
    try {
      // Get freelancer details from the database
      console.log('🔍 AddProjectForm: Fetching freelancer details for ID:', formData.freelancerId);
      const { data: freelancerProfile, error: freelancerError } = await validateFreelancerId(formData.freelancerId);
      
      if (freelancerError || !freelancerProfile) {
        console.error('❌ Could not fetch freelancer details for email:', freelancerError);
        return;
      }
      
      console.log('✅ AddProjectForm: Freelancer profile found:', freelancerProfile);

      // Get client profile details
      console.log('🔍 AddProjectForm: Fetching client profile for user ID:', currentUserId);
      const { data: clientProfile, error: clientError } = await getClientProfile(currentUserId);
      
      if (clientError || !clientProfile) {
        console.error('❌ Could not fetch client details for email:', clientError);
        return;
      }
      
      console.log('✅ AddProjectForm: Client profile found:', clientProfile);

      // Filter out empty deliverables
      const validDeliverables = formData.deliverables.filter(deliverable => deliverable.trim() !== '');
      console.log('🔍 AddProjectForm: Valid deliverables:', validDeliverables);

      // Check if freelancer email exists
      if (!freelancerProfile.email) {
        console.error('❌ Freelancer email is empty or undefined');
        console.log('🔍 Freelancer profile:', freelancerProfile);
        return;
      }

      const emailData: ProjectNotificationData = {
        freelancerEmail: freelancerProfile.email,
        freelancerName: freelancerProfile.full_name || 'Freelancer',
        projectId: projectData.project_id,
        projectName: originalProjectData.project_name,
        clientId: currentUserId,
        clientName: clientProfile.full_name || 'Client',
        projectRequirement: originalProjectData.project_requirement,
        deliverables: validDeliverables,
        completionDate: originalProjectData.desired_completion_date
      };
      
      console.log('🔍 AddProjectForm: Email data prepared:', emailData);
      console.log('🔍 AddProjectForm: Freelancer email:', freelancerProfile.email);

      const emailService = EmailService.getInstance();
      console.log('🔍 AddProjectForm: Calling email service...');
      const result = await emailService.sendProjectNotification(emailData);
      
      if (result.success) {
        console.log('✅ Email notification sent successfully to freelancer');
      } else {
        console.error('❌ Failed to send email notification:', result.error);
      }
    } catch (error) {
      console.error('❌ Exception in sendProjectNotificationEmail:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };



  if (showDeliverables) {
    return (
      <div className="space-y-4 sm:space-y-6 lg:space-y-8 px-2 sm:px-0">
        {/* Deliverables Section */}
        <div className="bg-gray-800 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 xl:p-8 border border-gray-700">
          <div className="mb-4 sm:mb-6 lg:mb-8">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-2">
              Project Deliverables Checklist
            </h2>
            <p className="text-xs sm:text-sm lg:text-base text-gray-300">
              Define what you expect to receive from the freelancer. Be specific and clear.
            </p>
          </div>

          <div className="space-y-3 sm:space-y-4 lg:space-y-6">
            {/* Deliverables List */}
            <div className="space-y-2 sm:space-y-3 lg:space-y-4">
              {formData.deliverables.map((deliverable, index) => (
                <div key={index} className="flex items-start space-x-2 sm:space-x-3 lg:space-x-4">
                  <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-xs sm:text-sm lg:text-base">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={deliverable}
                      onChange={(e) => handleDeliverableChange(index, e.target.value)}
                      placeholder={`Deliverable ${index + 1} (e.g., Detailed project specification document in PDF format)`}
                      className="w-full px-2 sm:px-3 lg:px-4 py-2 sm:py-3 border-2 border-gray-600 rounded-lg focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50 bg-gray-700 text-white placeholder-gray-400 text-xs sm:text-sm lg:text-base transition-colors"
                      aria-label={`Deliverable ${index + 1}`}
                    />
                  </div>
                  {formData.deliverables.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeDeliverable(index)}
                      className="flex-shrink-0 p-1 sm:p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
                      aria-label={`Remove deliverable ${index + 1}`}
                    >
                      <Minus className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add/Remove Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between space-y-2 sm:space-y-3 sm:space-y-0 sm:space-x-4 pt-3 sm:pt-4 border-t border-gray-700">
              <button
                type="button"
                onClick={addDeliverable}
                disabled={formData.deliverables.length >= 15}
                className={`flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 text-xs sm:text-sm lg:text-base ${
                  formData.deliverables.length >= 15
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed focus:ring-gray-400'
                    : 'bg-purple-600 hover:bg-purple-700 text-white focus:ring-purple-400'
                }`}
                aria-label="Add new deliverable"
              >
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
                <span>Add Deliverable ({formData.deliverables.length}/15)</span>
              </button>

              <button
                type="button"
                onClick={generateAIDeliverables}
                className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 text-xs sm:text-sm lg:text-base bg-cyan-600 hover:bg-cyan-700 text-white focus:ring-cyan-400"
                aria-label="Generate deliverables using AI"
              >
                <Wand2 className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
                <span>Generate Deliverables with AI</span>
              </button>
            </div>

            {/* Success Message */}
            {aiSuccessMessage && (
              <div className="flex items-center space-x-2 text-green-400 text-xs sm:text-sm lg:text-base">
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
                <span>{aiSuccessMessage}</span>
              </div>
            )}

            {/* Error Message */}
            {errors.deliverables && (
              <div className="flex items-center space-x-2 text-red-400 text-xs sm:text-sm lg:text-base">
                <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
                <span>{errors.deliverables}</span>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-4 sm:pt-6 border-t border-gray-700">
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className={`w-full flex items-center justify-center space-x-2 py-3 sm:py-4 rounded-lg font-semibold text-sm sm:text-base lg:text-lg transition-colors focus:outline-none focus:ring-2 ${
                  isSubmitting
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed focus:ring-gray-400'
                    : 'bg-purple-600 hover:bg-purple-700 text-white focus:ring-purple-400'
                }`}
                aria-label="Create project"
              >
                {isSubmitting ? (
                  <>
                    <Loader className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 animate-spin" />
                    <span>Adding Deliverables...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
                    <span>Add Deliverable Checklist</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* AI Chat Modal */}
        <AIDeliverableChat
          isOpen={isAIChatOpen}
          onClose={() => setIsAIChatOpen(false)}
          projectData={{
            id: createdProjectId,
            name: formData.projectName,
            requirements: formData.projectRequirement,
            files: formData.files.map(f => f.file),
            deliverables: formData.deliverables.filter(d => d.trim() !== ''),
            freelancer_id: formData.freelancerId,
            completion_date: formData.completionDate
          }}
          onDeliverablesGenerated={handleAIDeliverablesGenerated}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 px-2 sm:px-0">
      {/* Project Creation Form */}
      <div className="bg-gray-800 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 xl:p-8 border border-gray-700">
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-2">
            Create New Project
          </h2>
          <p className="text-xs sm:text-sm lg:text-base text-gray-300">
            Fill in the details below to start your new project with a freelancer.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 lg:space-y-8" noValidate>
          {/* Project ID (Read-only) */}
          <div>
            <label htmlFor="project-id" className="block text-gray-300 text-sm font-semibold mb-2">
              Project ID (Read-only)
            </label>
            <div className="relative">
              <input
                id="project-id"
                name="projectId"
                type="text"
                value={formData.projectId || 'Will be auto-generated'}
                onChange={(e) => handleInputChange('projectId', e.target.value)}
                className={`w-full px-3 sm:px-4 py-2 sm:py-3 border-2 rounded-lg focus:outline-none text-sm sm:text-base ${
                  formData.projectId 
                    ? 'border-gray-600 bg-gray-700 text-white' 
                    : 'border-gray-500 bg-gray-800 text-gray-400 cursor-not-allowed'
                }`}
                readOnly
                disabled={!formData.projectId}
                style={{ 
                  userSelect: formData.projectId ? 'text' : 'none',
                  WebkitUserSelect: formData.projectId ? 'text' : 'none',
                  MozUserSelect: formData.projectId ? 'text' : 'none',
                  msUserSelect: formData.projectId ? 'text' : 'none'
                }}
              />
              <div className="absolute inset-y-0 right-0 pr-2 sm:pr-3 flex items-center">
                <FileText className={`h-4 w-4 sm:h-5 sm:w-5 ${
                  formData.projectId ? 'text-purple-400' : 'text-gray-500'
                }`} />
              </div>
            </div>
            {!formData.projectId && (
              <p className="text-gray-500 text-xs sm:text-sm mt-1">
                Project ID will be automatically generated after form submission
              </p>
            )}
          </div>

          {/* Project Category */}
          <div>
            <label htmlFor="category" className="block text-gray-300 text-sm font-semibold mb-2">
              Project Category *
            </label>
            <div className="relative">
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-600 rounded-lg focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50 bg-gray-700 text-white text-sm sm:text-base appearance-none cursor-pointer"
                aria-describedby="category-help"
              >
                {categories.map((category) => (
                  <option 
                    key={category.value} 
                    value={category.value}
                    disabled={!category.enabled}
                  >
                    {category.label} {!category.enabled ? '(Enabled Soon)' : ''}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Folder className="h-5 w-5 text-purple-400" />
              </div>
            </div>
            <p id="category-help" className="text-gray-400 text-xs sm:text-sm mt-1">
              Currently, only Video Production projects are available. Other categories coming soon!
            </p>
          </div>

          {/* Project Details Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            {/* Project Name */}
            <div>
              <label htmlFor="project-name" className="block text-gray-300 text-sm font-semibold mb-2">
                Project Name *
              </label>
              <div className="relative">
                <input
                  id="project-name"
                  name="projectName"
                  type="text"
                  value={formData.projectName}
                  onChange={(e) => handleInputChange('projectName', e.target.value)}
                  onBlur={(e) => handleInputBlur('projectName', e.target.value)}
                  placeholder="Enter your project name"
                  required
                  maxLength={20}
                  aria-invalid={errors.projectName ? 'true' : 'false'}
                  aria-describedby={errors.projectName ? 'project-name-error' : undefined}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 pr-10 sm:pr-12 border-2 rounded-lg focus:outline-none transition-colors bg-gray-700 text-white placeholder-gray-400 text-sm sm:text-base ${
                    errors.projectName 
                      ? 'border-red-500 focus:border-red-400' 
                      : 'border-gray-600 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50'
                  }`}
                />
                <div className="absolute inset-y-0 right-0 pr-2 sm:pr-3 flex items-center">
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400" />
                </div>
              </div>
              {errors.projectName && (
                <p id="project-name-error" className="text-red-400 text-xs sm:text-sm mt-1 flex items-center" role="alert">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.projectName}
                </p>
              )}
            </div>

            {/* Freelancer ID */}
            <div>
              <label htmlFor="freelancer-id" className="block text-gray-300 text-sm font-semibold mb-2">
                Freelancer ID *
              </label>
              <div className="relative">
                <input
                  id="freelancer-id"
                  name="freelancerId"
                  type="text"
                  value={formData.freelancerId}
                  onChange={(e) => handleFreelancerIdChange(e.target.value)}
                  onBlur={(e) => {
                    handleInputBlur('freelancerId', e.target.value);
                    if (e.target.value.length === 10) {
                      validateFreelancerIdExists(e.target.value);
                    }
                  }}
                  placeholder="F123456789"
                  required
                  maxLength={10}
                  aria-invalid={errors.freelancerId ? 'true' : 'false'}
                  aria-describedby={`freelancer-id-help ${errors.freelancerId ? 'freelancer-id-error' : ''}`.trim()}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 pr-10 sm:pr-12 border-2 rounded-lg focus:outline-none transition-colors bg-gray-700 text-white placeholder-gray-400 text-sm sm:text-base ${
                    errors.freelancerId 
                      ? 'border-red-500 focus:border-red-400' 
                      : freelancerValidationStatus === 'success'
                      ? 'border-green-500 focus:border-green-400'
                      : freelancerValidationStatus === 'error'
                      ? 'border-red-500 focus:border-red-400'
                      : 'border-gray-600 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50'
                  }`}
                />
                <div className="absolute inset-y-0 right-0 pr-2 sm:pr-3 flex items-center">
                  {isValidatingFreelancer ? (
                    <Loader className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400 animate-spin" />
                  ) : freelancerValidationStatus === 'success' ? (
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-400" />
                  ) : freelancerValidationStatus === 'error' ? (
                    <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-400" />
                  ) : (
                    <User className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400" />
                  )}
                </div>
              </div>
              <p id="freelancer-id-help" className="text-gray-400 text-xs sm:text-sm mt-1">
                Format: F followed by 9 digits (e.g., F123456789)
              </p>
              {errors.freelancerId && (
                <p id="freelancer-id-error" className="text-red-400 text-xs sm:text-sm mt-1 flex items-center" role="alert">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.freelancerId}
                </p>
              )}
              

            </div>
          </div>

          {/* Project Requirement */}
          <div>
            <label htmlFor="project-requirement" className="block text-gray-300 text-sm font-semibold mb-2">
              Project Requirement *
            </label>
            <div className="relative">
              <textarea
                id="project-requirement"
                name="projectRequirement"
                rows={4}
                value={formData.projectRequirement}
                onChange={(e) => handleInputChange('projectRequirement', e.target.value)}
                onBlur={(e) => handleInputBlur('projectRequirement', e.target.value)}
                placeholder="Describe your project requirements in detail. Include style preferences, target audience, duration, specific elements needed, etc."
                required
                maxLength={200}
                aria-invalid={errors.projectRequirement ? 'true' : 'false'}
                aria-describedby={`project-requirement-help ${errors.projectRequirement ? 'project-requirement-error' : ''}`.trim()}
                className={`w-full px-3 sm:px-4 py-2 sm:py-3 border-2 rounded-lg focus:outline-none transition-colors bg-gray-700 text-white placeholder-gray-400 text-sm sm:text-base resize-none ${
                  errors.projectRequirement 
                    ? 'border-red-500 focus:border-red-400' 
                    : 'border-gray-600 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50'
                }`}
              />
            </div>
            <div className="flex items-center justify-between mt-1">
              <p id="project-requirement-help" className="text-gray-400 text-xs sm:text-sm">
                Minimum 10 characters required (max 200)
              </p>
              <span className={`text-xs sm:text-sm ${
                formData.projectRequirement.length >= 10 ? 'text-green-400' : 'text-gray-400'
              }`}>
                {formData.projectRequirement.length}/200
              </span>
            </div>
            {errors.projectRequirement && (
              <p id="project-requirement-error" className="text-red-400 text-xs sm:text-sm mt-1 flex items-center" role="alert">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.projectRequirement}
              </p>
            )}
          </div>

          {/* Project Value */}
          <div>
            <label htmlFor="project-value" className="block text-gray-300 text-sm font-semibold mb-2">
              Project Value (₹) *
            </label>
            <div className="relative">
              <input
                id="project-value"
                name="projectValue"
                type="number"
                value={formData.projectValue}
                onChange={(e) => handleInputChange('projectValue', e.target.value)}
                onBlur={(e) => handleInputBlur('projectValue', e.target.value)}
                placeholder="Enter project value in INR"
                min="1"
                step="0.01"
                required
                aria-invalid={errors.projectValue ? 'true' : 'false'}
                aria-describedby={`project-value-help ${errors.projectValue ? 'project-value-error' : ''}`.trim()}
                className={`w-full px-3 sm:px-4 py-2 sm:py-3 pr-10 sm:pr-12 border-2 rounded-lg focus:outline-none transition-colors bg-gray-700 text-white placeholder-gray-400 text-sm sm:text-base ${
                  errors.projectValue 
                    ? 'border-red-500 focus:border-red-400' 
                    : 'border-gray-600 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50'
                }`}
              />
              <div className="absolute inset-y-0 right-0 pr-2 sm:pr-3 flex items-center">
                <span className="text-purple-400 text-sm">₹</span>
              </div>
            </div>
            <p id="project-value-help" className="text-gray-400 text-xs sm:text-sm mt-1">
              Enter the total project value in Indian Rupees (INR)
            </p>
            {errors.projectValue && (
              <p id="project-value-error" className="text-red-400 text-xs sm:text-sm mt-1 flex items-center" role="alert">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.projectValue}
              </p>
            )}
          </div>

          {/* Completion Date */}
          <div>
            <label htmlFor="completion-date" className="block text-gray-300 text-sm font-semibold mb-2">
              Desired Completion Date *
            </label>
            <div className="relative">
                              <input
                  id="completion-date"
                  name="completionDate"
                  type="date"
                  value={formData.completionDate}
                  onChange={(e) => handleInputChange('completionDate', e.target.value)}
                  onBlur={(e) => handleInputBlur('completionDate', e.target.value)}
                  min={getTomorrowDate()}
                  required
                  aria-invalid={errors.completionDate ? 'true' : 'false'}
                  aria-describedby={`completion-date-help ${errors.completionDate ? 'completion-date-error' : ''}`.trim()}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 pr-10 sm:pr-12 border-2 rounded-lg focus:outline-none transition-colors bg-gray-700 text-white text-sm sm:text-base ${
                    errors.completionDate 
                      ? 'border-red-500 focus:border-red-400' 
                      : 'border-gray-600 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50'
                  }`}
                />
              <div className="absolute inset-y-0 right-0 pr-2 sm:pr-3 flex items-center">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400" />
              </div>
            </div>
            <p id="completion-date-help" className="text-gray-400 text-xs sm:text-sm mt-1">
              Minimum date: Tomorrow
            </p>
            {errors.completionDate && (
              <p id="completion-date-error" className="text-red-400 text-xs sm:text-sm mt-1 flex items-center" role="alert">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.completionDate}
              </p>
            )}
          </div>

          {/* File Upload Section */}
          <div>
            <label className="block text-gray-300 text-sm font-semibold mb-2">
              Project Files (Optional)
            </label>
            <div
              className={`relative border-2 border-dashed rounded-lg p-4 sm:p-6 lg:p-8 transition-all duration-300 ${
                isDragOver
                  ? 'border-purple-400 bg-purple-900/20'
                  : 'border-gray-600 hover:border-gray-500'
              }`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <div className="text-center">
                <Upload className={`mx-auto h-6 w-6 sm:h-8 sm:w-8 lg:h-12 lg:w-12 mb-3 sm:mb-4 transition-colors ${
                  isDragOver ? 'text-purple-400' : 'text-gray-400'
                }`} />
                <p className={`text-sm sm:text-base lg:text-lg font-medium mb-2 transition-colors ${
                  isDragOver ? 'text-purple-400' : 'text-gray-300'
                }`}>
                  {isDragOver ? 'Drop files here' : 'Drag and drop files here'}
                </p>
                <p className="text-xs sm:text-sm text-gray-400 mb-3 sm:mb-4">
                  or
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-2 sm:px-4 sm:py-2 lg:px-6 lg:py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400 text-xs sm:text-sm lg:text-base"
                >
                  Browse Files
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={allowedFileTypes.join(',')}
                  onChange={handleFileSelect}
                  className="hidden"
                  aria-label="Select file to upload"
                />
              </div>
              <p className="text-xs sm:text-sm text-gray-400 mt-3 sm:mt-4 text-center">
                Supported formats: PDF, DOC, DOCX. Max size: 5MB per file (max 1 file)
              </p>
            </div>

            {/* Uploaded Files List */}
            {formData.files.length > 0 && (
              <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-3">
                <h4 className="text-xs sm:text-sm font-medium text-gray-300">Uploaded Files:</h4>
                {formData.files.map((fileUpload) => (
                  <div key={fileUpload.id} className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 bg-gray-700 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-white truncate">
                        {fileUpload.file.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatFileSize(fileUpload.file.size)}
                      </p>
                      {fileUpload.status === 'uploading' && (
                        <div className="mt-1 sm:mt-2">
                          <div className="w-full bg-gray-600 rounded-full h-1 sm:h-2">
                            <div 
                              className="bg-purple-600 h-1 sm:h-2 rounded-full transition-all duration-300"
                              style={{ width: `${fileUpload.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      {fileUpload.status === 'completed' && (
                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-400" />
                      )}
                      <button
                        type="button"
                        onClick={() => removeFile(fileUpload.id)}
                        className="p-1 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
                        aria-label={`Remove ${fileUpload.file.name}`}
                      >
                        <X className="h-3 w-3 sm:h-4 sm:w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-4 sm:pt-6 border-t border-gray-700">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full flex items-center justify-center space-x-2 py-3 sm:py-4 rounded-lg font-semibold text-sm sm:text-base lg:text-lg transition-colors focus:outline-none focus:ring-2 ${
                isSubmitting
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed focus:ring-gray-400'
                  : 'bg-purple-600 hover:bg-purple-700 text-white focus:ring-purple-400'
              }`}
              aria-label="Continue to deliverables"
            >
              {isSubmitting ? (
                <>
                  <Loader className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
                  <span>Save and Continue to Deliverables</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProjectForm;