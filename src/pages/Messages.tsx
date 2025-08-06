import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, ChevronDown, ChevronRight, User, Clock, FileText, AlertCircle, Loader2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, getUserType, getMessagesForProject, sendMessage, getProjectsForMessaging, supabase } from '../lib/supabase';

interface Message {
  id: string;
  project_id: string;
  sender_id: string;
  sender_type: 'client' | 'freelancer';
  message_text: string;
  created_at: string;
  is_read: boolean;
  client_profiles?: {
    full_name: string;
    client_id: string;
  };
  freelancer_profiles?: {
    full_name: string;
    freelancer_id: string;
  };
}

interface Project {
  id: string;
  project_id: string;
  project_name: string;
  client_id: string;
  freelancer_id: string;
  project_status_workflow: string;
  created_at: string;
  updated_at: string;
  client_profiles?: {
    full_name: string;
    client_id: string;
  };
  freelancer_profiles?: {
    full_name: string;
    freelancer_id: string;
  };
  last_message?: {
    created_at: string;
    message_text: string;
  };
  unread_count?: number;
}

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  user_type: 'client' | 'freelancer';
}

const Messages: React.FC = () => {
  const navigate = useNavigate();
  
  // User and authentication state
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userType, setUserType] = useState<'client' | 'freelancer' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Projects and messages state
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);

  // UI state
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');
  
  // Enhanced error handling state
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [networkError, setNetworkError] = useState<string | null>(null);
  
  // Refs for real-time subscription
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const realtimeSubscription = useRef<any>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  // Load user data on component mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get current user
        const { user } = await getCurrentUser();
        if (!user) {
          console.log('No authenticated user found');
          navigate('/login/client');
          return;
        }

        setUser(user);
        setIsAuthenticated(true);

        // Get user type and profile
        const { userType, profile } = await getUserType(user.id);
        if (!userType || !profile) {
          console.error('Failed to get user type or profile');
          setError('Failed to load user profile');
          return;
        }

                 setUserType(userType);
         setUserProfile({
           id: profile.id,
           full_name: profile.full_name || 'Unknown User',
           email: profile.email || user.email,
           user_type: userType
         });

         // Clear any existing permission errors since user is now authenticated
         setPermissionError(null);

         // Load projects based on user type
         await loadProjects(userType, profile);

      } catch (error) {
        console.error('Error loading user data:', error);
        setError('Failed to load user data');
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [navigate]);

  // Set up real-time subscription for messages
  useEffect(() => {
    if (!selectedProject) return;

    // Clean up previous subscription
    if (realtimeSubscription.current) {
      supabase.removeChannel(realtimeSubscription.current);
    }

    // Set up new real-time subscription
    realtimeSubscription.current = supabase
      .channel(`messages:${selectedProject.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `project_id=eq.${selectedProject.id}`
        },
        (payload) => {
          console.log('New message received:', payload);
          setMessages(prev => [...prev, payload.new as Message]);
          
          // Increment new messages count if user is not at bottom
          if (!isAtBottom) {
            setNewMessagesCount(prev => prev + 1);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `project_id=eq.${selectedProject.id}`
        },
        (payload) => {
          console.log('Message updated:', payload);
          setMessages(prev => 
            prev.map(msg => 
              msg.id === payload.new.id ? payload.new as Message : msg
            )
          );
        }
      )
             .subscribe((status) => {
         console.log('Real-time subscription status:', status);
         if (status === 'SUBSCRIBED') {
           console.log('Successfully subscribed to messages');
           setConnectionStatus('connected');
           clearErrors(); // Clear any previous connection errors
         } else if (status === 'CHANNEL_ERROR') {
           console.error('Real-time subscription error');
           setConnectionStatus('disconnected');
           setNetworkError('Failed to connect to real-time updates. Messages may not update automatically.');
         } else if (status === 'TIMED_OUT') {
           console.error('Real-time subscription timed out');
           setConnectionStatus('disconnected');
           setNetworkError('Connection timed out. Please refresh the page to reconnect.');
         } else if (status === 'CLOSED') {
           console.log('Real-time subscription closed');
           setConnectionStatus('disconnected');
         }
       });

    return () => {
      if (realtimeSubscription.current) {
        supabase.removeChannel(realtimeSubscription.current);
      }
    };
  }, [selectedProject]);

  // Check if user is at bottom of messages
  const checkIfAtBottom = () => {
    if (!messagesContainerRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const threshold = 50; // pixels from bottom
    return scrollHeight - scrollTop - clientHeight < threshold;
  };

  // Handle scroll events
  const handleScroll = () => {
    setIsAtBottom(checkIfAtBottom());
  };

  // Auto-scroll to bottom when new messages arrive (only if user is at bottom)
  useEffect(() => {
    if (isAtBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isAtBottom]);

  // Reset new messages count when user scrolls to bottom
  useEffect(() => {
    if (isAtBottom) {
      setNewMessagesCount(0);
    }
  }, [isAtBottom]);

  // Scroll to bottom function
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setNewMessagesCount(0);
  };

  // Focus management for keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      // Close sidebar on mobile when Escape is pressed
      if (window.innerWidth < 1024 && !sidebarCollapsed) {
        setSidebarCollapsed(true);
      }
    }
  };

  // Validation functions
  const validateMessage = (message: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (!message.trim()) {
      errors.push('Message cannot be empty');
    }
    
    if (message.length > 200) {
      errors.push('Message must be 200 characters or less');
    }
    
    return { isValid: errors.length === 0, errors };
  };

  const validateProjectAccess = (project: Project): { hasAccess: boolean; error?: string } => {
    // If we're still loading user data, don't validate yet
    if (isLoading) {
      return { hasAccess: true };
    }

    // If user data is not available, but we have projects loaded, 
    // it means the user is authenticated (projects wouldn't load otherwise)
    if (!user || !userType || !userProfile) {
      // If we have projects, the user must be authenticated
      if (projects.length > 0) {
        return { hasAccess: true };
      }
      return { hasAccess: false, error: 'User not authenticated' };
    }

    // Since the projects are already filtered by the database query to only show
    // projects the user has access to, we can trust that the user has access
    // to any project returned by the query
    return { hasAccess: true };
  };

  const clearErrors = () => {
    setError(null);
    setValidationErrors({});
    setPermissionError(null);
    setNetworkError(null);
  };

  const retryOperation = async (operation: () => Promise<void>) => {
    try {
      clearErrors();
      await operation();
    } catch (error) {
      console.error('Retry operation failed:', error);
      setError('Operation failed. Please try again.');
    }
  };

  // Load projects based on user type
  const loadProjects = async (userType: 'client' | 'freelancer', profile: any) => {
    try {
      setProjectsLoading(true);
      clearErrors();

      // Validate user profile
      if (!profile) {
        throw new Error('User profile not found');
      }

      // For freelancers, use freelancer_id; for clients, use user_id
      let userId;
      if (userType === 'freelancer') {
        userId = profile.freelancer_id; // Use freelancer_id for freelancers
      } else {
        userId = profile.user_id; // Use user_id for clients
      }
      
      if (!userId) {
        throw new Error('User ID not found in profile');
      }

      // Use the new getProjectsForMessaging function
      const { data, error } = await getProjectsForMessaging(userId, userType);
      
      if (error) {
        console.error('Supabase error loading projects:', error);
        if (error.code === 'PGRST116') {
          throw new Error('Permission denied: You do not have access to view these projects');
        } else if (error.code === 'PGRST301') {
          throw new Error('Network error: Unable to connect to database');
        } else {
          throw new Error(`Database error: ${error.message}`);
        }
      }
      
             setProjects(data || []);
       
       // Clear permission errors if projects loaded successfully
       if (data && data.length > 0) {
         setPermissionError(null);
       }
       
       // Auto-select first project if available
       if (data && data.length > 0 && !selectedProject) {
         const firstProject = data[0];
         const accessValidation = validateProjectAccess(firstProject);
         
         if (!accessValidation.hasAccess) {
           // Only show error if we're not loading and user is actually not authenticated
           if (!isLoading && (!user || !userType || !userProfile)) {
             setPermissionError(accessValidation.error || 'Access denied');
             return;
           }
         }
         
         setSelectedProject(firstProject);
         await loadMessages(firstProject.id);
       }

    } catch (error: any) {
      console.error('Error loading projects:', error);
      
      if (error.message.includes('Permission denied')) {
        setPermissionError(error.message);
      } else if (error.message.includes('Network error')) {
        setNetworkError(error.message);
      } else if (error.message.includes('User profile not found')) {
        setError('Failed to load user profile. Please try logging in again.');
      } else {
        setError('Failed to load projects. Please try refreshing the page.');
      }
    } finally {
      setProjectsLoading(false);
    }
  };

  // Load messages for selected project
  const loadMessages = async (projectId: string) => {
    try {
      setMessagesLoading(true);
      clearErrors();

      // Validate project access before loading messages
      const project = projects.find(p => p.id === projectId);
      if (project) {
        const accessValidation = validateProjectAccess(project);
        if (!accessValidation.hasAccess) {
          setPermissionError(accessValidation.error || 'Access denied');
          return;
        }
      }

      const { data, error } = await getMessagesForProject(projectId);
      
      if (error) {
        console.error('Supabase error loading messages:', error);
        if (error.code === 'PGRST116') {
          throw new Error('Permission denied: You do not have access to view these messages');
        } else if (error.code === 'PGRST301') {
          throw new Error('Network error: Unable to connect to database');
        } else {
          throw new Error(`Database error: ${error.message}`);
        }
      }

      setMessages(data || []);

    } catch (error: any) {
      console.error('Error loading messages:', error);
      
      if (error.message.includes('Permission denied')) {
        setPermissionError(error.message);
      } else if (error.message.includes('Network error')) {
        setNetworkError(error.message);
      } else {
        setError('Failed to load messages. Please try refreshing the page.');
      }
    } finally {
      setMessagesLoading(false);
    }
  };

  // Handle project selection
  const handleProjectSelect = async (project: Project) => {
    try {
      clearErrors();
      
      // Validate project access
      const accessValidation = validateProjectAccess(project);
      if (!accessValidation.hasAccess) {
        setPermissionError(accessValidation.error || 'Access denied');
        return;
      }

      setSelectedProject(project);
      await loadMessages(project.id);
      
    } catch (error: any) {
      console.error('Error selecting project:', error);
      setError('Failed to select project. Please try again.');
    }
  };

  // Handle sending message
  const handleSendMessage = async () => {
    try {
      clearErrors();

      // Validate user and project
      if (!user || !userType) {
        setError('User not authenticated. Please log in again.');
        return;
      }

      if (!selectedProject) {
        setError('No project selected. Please select a project to send messages.');
        return;
      }

      // Validate project access
      const accessValidation = validateProjectAccess(selectedProject);
      if (!accessValidation.hasAccess) {
        setPermissionError(accessValidation.error || 'Access denied');
        return;
      }

      // Validate message content
      const messageValidation = validateMessage(newMessage);
      if (!messageValidation.isValid) {
        setValidationErrors({ message: messageValidation.errors.join(', ') });
        return;
      }

      setIsSending(true);

      const messageData = {
        project_id: selectedProject.id,
        sender_id: user.id,
        sender_type: userType,
        message_text: newMessage.trim(),
        is_read: false
      };

      const { data, error } = await sendMessage(messageData);
      
      if (error) {
        console.error('Supabase error sending message:', error);
        if (error.code === 'PGRST116') {
          throw new Error('Permission denied: You do not have access to send messages to this project');
        } else if (error.code === 'PGRST301') {
          throw new Error('Network error: Unable to connect to database');
        } else if (error.code === '23505') {
          throw new Error('Duplicate message detected. Please try again.');
        } else {
          throw new Error(`Database error: ${error.message}`);
        }
      }

      // Clear message input on success
      setNewMessage('');
      setValidationErrors({});

    } catch (error: any) {
      console.error('Error sending message:', error);
      
      if (error.message.includes('Permission denied')) {
        setPermissionError(error.message);
      } else if (error.message.includes('Network error')) {
        setNetworkError(error.message);
      } else if (error.message.includes('Duplicate message')) {
        setError('Message already sent. Please try again.');
      } else {
        setError('Failed to send message. Please try again.');
      }
    } finally {
      setIsSending(false);
    }
  };

  // Handle project accordion toggle
  const toggleProjectExpansion = (projectId: string) => {
    setExpandedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Project Created':
        return 'bg-blue-500';
      case 'Production in Progress':
        return 'bg-green-500';
      case 'Under Manual Revision':
        return 'bg-yellow-500';
      case 'AI Verified':
        return 'bg-cyan-500';
      case 'Completed':
        return 'bg-gray-500';
      default:
        return 'bg-gray-400';
    }
  };

  // Get status text
  const getStatusText = (status: string) => {
    return status.replace(/([A-Z])/g, ' $1').trim();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
                     <Loader2 className="h-8 w-8 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Loading messages...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-4" />
          <p className="text-gray-300 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
                         className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900" onKeyDown={handleKeyDown} tabIndex={-1}>
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <MessageSquare className="h-6 w-6 text-cyan-400" aria-hidden="true" />
            <div>
              <h1 className="text-xl font-bold text-white">Messages</h1>
              <p className="text-sm text-gray-400">
                {userType === 'client' ? 'Client' : 'Freelancer'} Dashboard
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-sm text-gray-400 hidden sm:block">
              {userProfile?.full_name} ({userType})
            </div>
            {/* Connection Status */}
            <div className="flex items-center space-x-2" role="status" aria-live="polite">
              <div 
                className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-green-500' :
                  connectionStatus === 'connecting' ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                aria-label={`Connection status: ${connectionStatus}`}
              ></div>
              <span className="text-xs text-gray-400 hidden sm:inline">
                {connectionStatus === 'connected' ? 'Live' :
                 connectionStatus === 'connecting' ? 'Connecting...' :
                 'Disconnected'}
              </span>
            </div>
            {/* Back to Dashboard Button */}
            <button
              onClick={() => navigate(userType === 'client' ? '/client/dashboard' : '/freelancer/dashboard')}
              className="px-3 py-2 text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              aria-label="Back to dashboard"
            >
              <ChevronRight className="h-4 w-4 rotate-180" aria-hidden="true" />
              <span>Back to Dashboard</span>
            </button>
            {/* Mobile sidebar toggle */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="lg:hidden p-2 rounded hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400"
              aria-label={`${sidebarCollapsed ? 'Show' : 'Hide'} sidebar`}
              aria-expanded={!sidebarCollapsed}
            >
              <ChevronRight className={`h-5 w-5 text-gray-400 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

             {/* Main Content */}
               <div className="flex h-[calc(100vh-80px)]">
          {/* Left Sidebar - Project Selection */}
          <div className={`${sidebarCollapsed ? 'w-16 lg:w-16' : 'w-80'} bg-gray-800 border-r border-gray-700 flex flex-col transition-all duration-300`}>
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className={`text-lg font-semibold text-white ${sidebarCollapsed ? 'hidden' : ''}`}>Projects</h2>
                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="p-1 rounded hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  aria-label={`${sidebarCollapsed ? 'Expand' : 'Collapse'} sidebar`}
                  aria-expanded={!sidebarCollapsed}
                >
                  {sidebarCollapsed ? (
                    <ChevronRight className="h-4 w-4 text-gray-400" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-400" aria-hidden="true" />
                  )}
                </button>
              </div>
              {!sidebarCollapsed && (
                <p className="text-sm text-gray-400 mt-2">
                  {projectsLoading ? 'Loading projects...' : `${projects.length} project${projects.length !== 1 ? 's' : ''}`}
                </p>
              )}
            </div>

           <div className="flex-1 overflow-y-auto">
                           {projectsLoading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-12 bg-gray-700 rounded-lg"></div>
                    </div>
                  ))}
                </div>
             ) : projects.length === 0 ? (
               <div className="p-4 text-center">
                 <FileText className="h-8 w-8 text-gray-500 mx-auto mb-2" />
                 <p className={`text-sm text-gray-400 ${sidebarCollapsed ? 'hidden' : ''}`}>No active projects</p>
               </div>
             ) : (
               <div className="p-2">
                 {projects.map((project) => (
                   <div key={project.id} className="mb-2">
                                           {/* Project Header */}
                      <button
                        onClick={() => toggleProjectExpansion(project.id)}
                        className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 ${
                          selectedProject?.id === project.id
                            ? 'bg-cyan-600 text-white'
                            : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                        }`}
                        aria-label={`${expandedProjects.has(project.id) ? 'Collapse' : 'Expand'} project ${project.project_name}`}
                        aria-expanded={expandedProjects.has(project.id)}
                      >
                       <div className="flex-1 min-w-0">
                         <div className="font-medium truncate">{project.project_name}</div>
                         {!sidebarCollapsed && (
                           <>
                             <div className="text-xs opacity-75 truncate">
                               ID: {project.project_id}
                             </div>
                             <div className="text-xs opacity-50 truncate">
                               {userType === 'client' 
                                 ? (project.freelancer_profiles?.full_name || 'Freelancer')
                                 : (project.client_profiles?.full_name || 'Client')
                               }
                             </div>
                           </>
                         )}
                       </div>
                       <div className="flex items-center space-x-2">
                         {/* Unread indicator */}
                         {project.unread_count && project.unread_count > 0 && (
                           <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></div>
                         )}
                         {expandedProjects.has(project.id) ? (
                           <ChevronDown className="h-4 w-4 flex-shrink-0" />
                         ) : (
                           <ChevronRight className="h-4 w-4 flex-shrink-0" />
                         )}
                       </div>
                     </button>

                     {/* Project Details (Expanded) */}
                     {expandedProjects.has(project.id) && !sidebarCollapsed && (
                       <div className="ml-4 mt-2 space-y-2 bg-gray-750 rounded-lg p-3">
                         {/* Status */}
                         <div className="flex items-center space-x-2">
                           <div className={`w-2 h-2 rounded-full ${getStatusColor(project.project_status_workflow)}`}></div>
                           <span className="text-xs text-gray-400">
                             {getStatusText(project.project_status_workflow)}
                           </span>
                         </div>

                         {/* Last Message */}
                         {project.last_message && (
                           <div className="text-xs text-gray-400">
                             <div className="font-medium">Last message:</div>
                             <div className="truncate">{project.last_message.message_text}</div>
                             <div className="text-gray-500">
                               {formatTimestamp(project.last_message.created_at)}
                             </div>
                           </div>
                         )}

                                                   {/* Action Button */}
                                                     <button
                             onClick={() => handleProjectSelect(project)}
                             className={`w-full text-left px-3 py-2 rounded text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 ${
                               selectedProject?.id === project.id
                                 ? 'bg-cyan-500 text-white'
                                 : 'text-gray-400 hover:text-white hover:bg-gray-600'
                             }`}
                            aria-label={`View messages for project ${project.project_name}`}
                          >
                            View Messages
                          </button>
                       </div>
                     )}
                   </div>
                 ))}
               </div>
             )}
           </div>
         </div>

                 {/* Right Content - Message Thread */}
         <div className="flex-1 flex flex-col bg-gray-900" role="main" aria-label="Message thread">
           {/* Error Banners */}
           {(permissionError || networkError) && (
             <div className="bg-red-900/50 border border-red-700 p-4">
               <div className="flex items-center space-x-2">
                 <AlertCircle className="h-5 w-5 text-red-400" />
                 <div className="flex-1">
                   <p className="text-red-300 font-medium">
                     {permissionError || networkError}
                   </p>
                   <p className="text-red-400 text-sm mt-1">
                     Please try refreshing the page or contact support if the issue persists.
                   </p>
                 </div>
                 <div className="flex items-center space-x-2">
                   <button
                     onClick={() => retryOperation(() => loadProjects(userType!, userProfile!))}
                     className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
                     aria-label="Retry operation"
                   >
                     Retry
                   </button>
                   <button
                     onClick={clearErrors}
                     className="text-red-400 hover:text-red-300 transition-colors"
                     aria-label="Dismiss error"
                   >
                     <X className="h-4 w-4" />
                   </button>
                 </div>
               </div>
             </div>
           )}
          {selectedProject ? (
            <>
              {/* Project Header */}
              <div className="bg-gray-800 border-b border-gray-700 px-4 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-white">{selectedProject.project_name}</h2>
                    <p className="text-sm text-gray-400">
                      Project ID: {selectedProject.project_id} • Status: {selectedProject.project_status_workflow}
                    </p>
                  </div>
                  <div className="text-xs text-gray-500">
                    {userType === 'client' ? 'Client' : 'Freelancer'}
                  </div>
                </div>
              </div>

                                                             {/* Messages Area */}
                <div 
                  ref={messagesContainerRef}
                  onScroll={handleScroll}
                  className="flex-1 overflow-y-auto p-4 space-y-4 relative"
                >
                                     {/* New Messages Indicator */}
                   {newMessagesCount > 0 && (
                     <div className="absolute top-4 right-4 z-10">
                                           <button
                      onClick={scrollToBottom}
                      className="bg-cyan-600 hover:bg-cyan-700 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-lg flex items-center space-x-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                      aria-label={`Scroll to ${newMessagesCount} new message${newMessagesCount !== 1 ? 's' : ''}`}
                    >
                         <span>{newMessagesCount} new message{newMessagesCount !== 1 ? 's' : ''}</span>
                         <ChevronDown className="h-4 w-4" aria-hidden="true" />
                       </button>
                     </div>
                   )}
                  
                  {messagesLoading ? (
                   <div className="space-y-4">
                     {[1, 2, 3].map((i) => (
                       <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                         <div className="animate-pulse">
                                                       <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              i % 2 === 0 ? 'bg-cyan-600' : 'bg-gray-700'
                            }`}>
                             <div className="h-3 bg-gray-400 rounded mb-2"></div>
                             <div className="h-4 bg-gray-400 rounded"></div>
                           </div>
                         </div>
                       </div>
                     ))}
                   </div>
                 ) : messages.length === 0 ? (
                   <div className="flex items-center justify-center h-full">
                     <div className="text-center">
                       <MessageSquare className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                       <p className="text-gray-400">No messages yet</p>
                       <p className="text-sm text-gray-500 mt-1">Start the conversation!</p>
                     </div>
                   </div>
                 ) : (
                   <>
                     {messages.map((message) => (
                       <div
                         key={message.id}
                         className={`flex ${message.sender_type === userType ? 'justify-end' : 'justify-start'}`}
                       >
                                                   <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow-sm ${
                              message.sender_type === userType
                                ? 'bg-cyan-600 text-white'
                                : 'bg-gray-700 text-gray-300'
                            }`}
                          >
                                                       <div className="flex items-center space-x-2 mb-1">
                              <User className="h-3 w-3" aria-hidden="true" />
                              <span className="text-xs opacity-75">
                                {message.sender_type === 'client' 
                                  ? (message.client_profiles?.full_name || 'Client')
                                  : (message.freelancer_profiles?.full_name || 'Freelancer')
                                }
                              </span>
                              <Clock className="h-3 w-3" aria-hidden="true" />
                              <span className="text-xs opacity-75" aria-label={`Message sent ${formatTimestamp(message.created_at)}`}>
                                {formatTimestamp(message.created_at)}
                              </span>
                            </div>
                           <p className="text-sm whitespace-pre-wrap break-words">{message.message_text}</p>
                                                       {message.sender_type === userType && (
                              <div className="flex justify-end mt-1">
                                <span className="text-xs opacity-50" aria-label={message.is_read ? 'Message read' : 'Message sent'}>
                                  {message.is_read ? '✓ Read' : '✓ Sent'}
                                </span>
                              </div>
                            )}
                         </div>
                       </div>
                     ))}
                     {/* Auto-scroll anchor */}
                     <div ref={messagesEndRef} />
                   </>
                 )}
               </div>

              {/* Message Input */}
              <div className="bg-gray-800 border-t border-gray-700 p-4">
                <div className="flex space-x-3">
                                     <textarea
                     value={newMessage}
                     onChange={(e) => setNewMessage(e.target.value)}
                     onKeyPress={(e) => {
                       if (e.key === 'Enter' && !e.shiftKey) {
                         e.preventDefault();
                         handleSendMessage();
                       }
                     }}
                     placeholder="Type your message..."
                                           className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 resize-none focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50"
                     rows={2}
                     maxLength={200}
                     aria-label="Message input"
                     aria-describedby="message-help"
                   />
                                       <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || isSending}
                      className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                      aria-label="Send message"
                    >
                    {isSending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                                         <span className="hidden sm:inline">Send</span>
                   </button>
                 </div>
                 <div className="flex justify-between items-center mt-2">
                   <div className="flex-1">
                     <p id="message-help" className="text-xs text-gray-400">
                       Press Enter to send, Shift+Enter for new line
                     </p>
                     {validationErrors.message && (
                       <p className="text-xs text-red-400 mt-1">
                         {validationErrors.message}
                       </p>
                     )}
                   </div>
                   <span className="text-xs text-gray-400" aria-live="polite">
                     {newMessage.length}/200
                   </span>
                 </div>
              </div>
            </>
                     ) : (
                           <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  {permissionError ? (
                    <>
                      <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                      <p className="text-red-400 font-medium">Access Denied</p>
                      <p className="text-sm text-red-300 mt-2">
                        {permissionError}
                      </p>
                    </>
                  ) : (
                    <>
                      <MessageSquare className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                      <p className="text-gray-400">Select a project to start messaging</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Choose a project from the sidebar to view and send messages
                      </p>
                    </>
                  )}
                </div>
              </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default Messages; 