import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Plus, Minus, Wand2, Calendar, User, FileText, Folder, AlertCircle, CheckCircle, Loader } from 'lucide-react';

interface FileUpload {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
}

interface FormData {
  category: string;
  projectName: string;
  description: string;
  freelancerId: string;
  completionDate: string;
  files: FileUpload[];
  deliverables: string[];
}

interface FormErrors {
  projectName: string;
  description: string;
  freelancerId: string;
  completionDate: string;
  deliverables: string;
}

const AddProjectForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    category: 'Video Production',
    projectName: '',
    description: '',
    freelancerId: '',
    completionDate: '',
    files: [],
    deliverables: ['', '', '']
  });

  const [errors, setErrors] = useState<FormErrors>({
    projectName: '',
    description: '',
    freelancerId: '',
    completionDate: '',
    deliverables: ''
  });

  const [showDeliverables, setShowDeliverables] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  const categories = [
    { value: 'Video Production', label: 'Video Production', enabled: true },
    { value: 'Content', label: 'Content Writing', enabled: false },
    { value: 'UI/UX Design', label: 'UI/UX Design', enabled: false },
    { value: 'Gen AI', label: 'Gen AI Services', enabled: false }
  ];

  const allowedFileTypes = [
    '.pdf', '.doc', '.docx', '.txt', '.rtf',
    '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp',
    '.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm',
    '.mp3', '.wav', '.aac', '.flac',
    '.zip', '.rar', '.7z'
  ];

  const maxFileSize = 100 * 1024 * 1024; // 100MB

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
      case 'description':
        return value.trim().length < 50 ? 'Description must be at least 50 characters long' : '';
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

    validFiles.forEach(file => {
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
    if (formData.deliverables.length < 10) {
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
    setIsGeneratingAI(true);
    
    // Simulate AI generation
    setTimeout(() => {
      const aiDeliverables = [
        'High-quality 1080p video in MP4 format',
        'Professional color grading and audio mixing',
        'Custom intro/outro with brand elements',
        'Subtitles/captions in English',
        'Raw footage and project files',
        'Social media optimized versions (16:9, 1:1, 9:16)',
        'Thumbnail designs (3 variations)',
        'Video SEO optimization (title, description, tags)'
      ];
      
      setFormData(prev => ({ ...prev, deliverables: aiDeliverables }));
      setIsGeneratingAI(false);
    }, 2000);
  };

  // Form validation
  const validateForm = () => {
    const newErrors: FormErrors = {
      projectName: validateField('projectName', formData.projectName),
      description: validateField('description', formData.description),
      freelancerId: validateField('freelancerId', formData.freelancerId),
      completionDate: validateField('completionDate', formData.completionDate),
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
    
    // Simulate form submission
    setTimeout(() => {
      setShowDeliverables(true);
      setIsSubmitting(false);
    }, 1000);
  };

  const handleFinalSubmit = async () => {
    if (!validateDeliverables()) {
      return;
    }

    setIsSubmitting(true);
    
    // Simulate final submission
    setTimeout(() => {
      console.log('Project created:', formData);
      // Here you would typically send the data to your backend
      setIsSubmitting(false);
      // Reset form or redirect
    }, 2000);
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
      <div className="space-y-6 sm:space-y-8">
        {/* Deliverables Section */}
        <div className="bg-gray-800 rounded-2xl p-4 sm:p-6 lg:p-8 border border-gray-700">
          <div className="mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
              Project Deliverables Checklist
            </h2>
            <p className="text-sm sm:text-base text-gray-300">
              Define what you expect to receive from the freelancer. Be specific and clear.
            </p>
          </div>

          <div className="space-y-4 sm:space-y-6">
            {/* Deliverables List */}
            <div className="space-y-3 sm:space-y-4">
              {formData.deliverables.map((deliverable, index) => (
                <div key={index} className="flex items-start space-x-3 sm:space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm sm:text-base">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={deliverable}
                      onChange={(e) => handleDeliverableChange(index, e.target.value)}
                      placeholder={`Deliverable ${index + 1} (e.g., High-quality 1080p video in MP4 format)`}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-600 rounded-lg focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50 bg-gray-700 text-white placeholder-gray-400 text-sm sm:text-base transition-colors"
                      aria-label={`Deliverable ${index + 1}`}
                    />
                  </div>
                  {formData.deliverables.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeDeliverable(index)}
                      className="flex-shrink-0 p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
                      aria-label={`Remove deliverable ${index + 1}`}
                    >
                      <Minus className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add/Remove Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between space-y-3 sm:space-y-0 sm:space-x-4 pt-4 border-t border-gray-700">
              <button
                type="button"
                onClick={addDeliverable}
                disabled={formData.deliverables.length >= 10}
                className={`flex items-center justify-center space-x-2 px-4 py-2 sm:py-3 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 text-sm sm:text-base ${
                  formData.deliverables.length >= 10
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed focus:ring-gray-400'
                    : 'bg-purple-600 hover:bg-purple-700 text-white focus:ring-purple-400'
                }`}
                aria-label="Add new deliverable"
              >
                <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Add Deliverable ({formData.deliverables.length}/10)</span>
              </button>

              <button
                type="button"
                onClick={generateAIDeliverables}
                disabled={isGeneratingAI}
                className={`flex items-center justify-center space-x-2 px-4 py-2 sm:py-3 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 text-sm sm:text-base ${
                  isGeneratingAI
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed focus:ring-gray-400'
                    : 'bg-cyan-600 hover:bg-cyan-700 text-white focus:ring-cyan-400'
                }`}
                aria-label="Generate deliverables using AI"
              >
                {isGeneratingAI ? (
                  <Loader className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                ) : (
                  <Wand2 className="h-4 w-4 sm:h-5 sm:w-5" />
                )}
                <span>{isGeneratingAI ? 'Generating...' : 'Generate via AI Assistant'}</span>
              </button>
            </div>

            {/* Error Message */}
            {errors.deliverables && (
              <div className="flex items-center space-x-2 text-red-400 text-sm sm:text-base">
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>{errors.deliverables}</span>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-6 border-t border-gray-700">
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className={`w-full flex items-center justify-center space-x-2 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg transition-colors focus:outline-none focus:ring-2 ${
                  isSubmitting
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed focus:ring-gray-400'
                    : 'bg-purple-600 hover:bg-purple-700 text-white focus:ring-purple-400'
                }`}
                aria-label="Create project"
              >
                {isSubmitting ? (
                  <>
                    <Loader className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" />
                    <span>Creating Project...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                    <span>Create Project</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Project Creation Form */}
      <div className="bg-gray-800 rounded-2xl p-4 sm:p-6 lg:p-8 border border-gray-700">
        <div className="mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
            Create New Project
          </h2>
          <p className="text-sm sm:text-base text-gray-300">
            Fill in the details below to start your new project with a freelancer.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8" noValidate>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
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
                  aria-invalid={errors.projectName ? 'true' : 'false'}
                  aria-describedby={errors.projectName ? 'project-name-error' : undefined}
                  className={`w-full px-4 py-3 pr-12 border-2 rounded-lg focus:outline-none transition-colors bg-gray-700 text-white placeholder-gray-400 text-sm sm:text-base ${
                    errors.projectName 
                      ? 'border-red-500 focus:border-red-400' 
                      : 'border-gray-600 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50'
                  }`}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <FileText className="h-5 w-5 text-purple-400" />
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
                  onBlur={(e) => handleInputBlur('freelancerId', e.target.value)}
                  placeholder="F123456789"
                  required
                  maxLength={10}
                  aria-invalid={errors.freelancerId ? 'true' : 'false'}
                  aria-describedby={`freelancer-id-help ${errors.freelancerId ? 'freelancer-id-error' : ''}`.trim()}
                  className={`w-full px-4 py-3 pr-12 border-2 rounded-lg focus:outline-none transition-colors bg-gray-700 text-white placeholder-gray-400 text-sm sm:text-base ${
                    errors.freelancerId 
                      ? 'border-red-500 focus:border-red-400' 
                      : 'border-gray-600 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50'
                  }`}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <User className="h-5 w-5 text-purple-400" />
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

          {/* Project Description */}
          <div>
            <label htmlFor="description" className="block text-gray-300 text-sm font-semibold mb-2">
              Project Requirement Description *
            </label>
            <div className="relative">
              <textarea
                id="description"
                name="description"
                rows={6}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                onBlur={(e) => handleInputBlur('description', e.target.value)}
                placeholder="Describe your project requirements in detail. Include style preferences, target audience, duration, specific elements needed, etc."
                required
                aria-invalid={errors.description ? 'true' : 'false'}
                aria-describedby={`description-help ${errors.description ? 'description-error' : ''}`.trim()}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-colors bg-gray-700 text-white placeholder-gray-400 text-sm sm:text-base resize-none ${
                  errors.description 
                    ? 'border-red-500 focus:border-red-400' 
                    : 'border-gray-600 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50'
                }`}
              />
            </div>
            <div className="flex items-center justify-between mt-1">
              <p id="description-help" className="text-gray-400 text-xs sm:text-sm">
                Minimum 50 characters required
              </p>
              <span className={`text-xs sm:text-sm ${
                formData.description.length >= 50 ? 'text-green-400' : 'text-gray-400'
              }`}>
                {formData.description.length}/50
              </span>
            </div>
            {errors.description && (
              <p id="description-error" className="text-red-400 text-xs sm:text-sm mt-1 flex items-center" role="alert">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.description}
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
                className={`w-full px-4 py-3 pr-12 border-2 rounded-lg focus:outline-none transition-colors bg-gray-700 text-white text-sm sm:text-base ${
                  errors.completionDate 
                    ? 'border-red-500 focus:border-red-400' 
                    : 'border-gray-600 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50'
                }`}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <Calendar className="h-5 w-5 text-purple-400" />
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
              className={`relative border-2 border-dashed rounded-lg p-6 sm:p-8 transition-all duration-300 ${
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
                <Upload className={`mx-auto h-8 w-8 sm:h-12 sm:w-12 mb-4 transition-colors ${
                  isDragOver ? 'text-purple-400' : 'text-gray-400'
                }`} />
                <p className={`text-base sm:text-lg font-medium mb-2 transition-colors ${
                  isDragOver ? 'text-purple-400' : 'text-gray-300'
                }`}>
                  {isDragOver ? 'Drop files here' : 'Drag and drop files here'}
                </p>
                <p className="text-sm text-gray-400 mb-4">
                  or
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 sm:px-6 sm:py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm sm:text-base"
                >
                  Browse Files
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={allowedFileTypes.join(',')}
                  onChange={handleFileSelect}
                  className="hidden"
                  aria-label="Select files to upload"
                />
              </div>
              <p className="text-xs sm:text-sm text-gray-400 mt-4 text-center">
                Supported formats: PDF, DOC, DOCX, JPG, PNG, MP4, etc. Max size: 100MB per file
              </p>
            </div>

            {/* Uploaded Files List */}
            {formData.files.length > 0 && (
              <div className="mt-4 space-y-3">
                <h4 className="text-sm font-medium text-gray-300">Uploaded Files:</h4>
                {formData.files.map((fileUpload) => (
                  <div key={fileUpload.id} className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {fileUpload.file.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatFileSize(fileUpload.file.size)}
                      </p>
                      {fileUpload.status === 'uploading' && (
                        <div className="mt-2">
                          <div className="w-full bg-gray-600 rounded-full h-2">
                            <div 
                              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${fileUpload.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {fileUpload.status === 'completed' && (
                        <CheckCircle className="h-5 w-5 text-green-400" />
                      )}
                      <button
                        type="button"
                        onClick={() => removeFile(fileUpload.id)}
                        className="p-1 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
                        aria-label={`Remove ${fileUpload.file.name}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-6 border-t border-gray-700">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full flex items-center justify-center space-x-2 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg transition-colors focus:outline-none focus:ring-2 ${
                isSubmitting
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed focus:ring-gray-400'
                  : 'bg-purple-600 hover:bg-purple-700 text-white focus:ring-purple-400'
              }`}
              aria-label="Continue to deliverables"
            >
              {isSubmitting ? (
                <>
                  <Loader className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span>Continue to Deliverables</span>
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