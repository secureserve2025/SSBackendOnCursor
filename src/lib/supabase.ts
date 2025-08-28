import { createClient } from '@supabase/supabase-js'

import { getCurrentISTForDatabase, logWithIST } from './istUtils'



// Debug environment variables (only in development)

if (import.meta.env.DEV) {

  console.log('Environment variables check:')

  console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL)

  console.log('VITE_SUPABASE_ANON_KEY exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY)

  console.log('VITE_SUPABASE_ANON_KEY length:', import.meta.env.VITE_SUPABASE_ANON_KEY?.length)

  console.log('VITE_OPENAI_API_KEY exists:', !!import.meta.env.VITE_OPENAI_API_KEY)

  console.log('VITE_OPENAI_API_KEY length:', import.meta.env.VITE_OPENAI_API_KEY?.length)

  console.log('VITE_OPENAI_API_KEY starts with sk-:', import.meta.env.VITE_OPENAI_API_KEY?.startsWith('sk-'))

}



const supabaseUrl = import.meta.env.VITE_SUPABASE_URL

const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY



// Only throw error if we're not in development mode

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {

  console.warn('Missing Supabase environment variables. Using placeholder values for development.')

  console.warn('Available env vars:', Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')))

}



// Create a singleton Supabase client to prevent multiple instances

let supabaseInstance: ReturnType<typeof createClient> | null = null



export const supabase = (() => {

  if (!supabaseInstance) {

    if (!supabaseUrl || !supabaseAnonKey) {

      console.error('Supabase URL or Anon Key is missing. Cannot create client.')

      throw new Error('Supabase configuration is incomplete')

    }

    

    // Check if already initialized in browser

    if (typeof window !== 'undefined' && (window as any).__SUPABASE_CLIENT_INITIALIZED__) {

      console.warn('Supabase client already initialized, reusing existing instance')

    }

    

    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {

      auth: {

        autoRefreshToken: true,

        persistSession: true,

        detectSessionInUrl: true,

        flowType: 'pkce'

      }

    })

    

    // Mark as initialized

    if (typeof window !== 'undefined') {

      (window as any).__SUPABASE_CLIENT_INITIALIZED__ = true;

    }

  }

  return supabaseInstance

})()



// Initialize session and handle auth state

export const initializeAuth = async () => {

  try {

    // Get initial session

    const { data: { session }, error } = await supabase.auth.getSession()

    

    if (error) {

      console.warn('Error getting initial session:', error)

      return { session: null, error }

    }

    

    // Set up auth state listener

    supabase.auth.onAuthStateChange((event, session) => {

      console.log('Auth state changed:', event, session?.user?.id)

      

      if (event === 'TOKEN_REFRESHED') {

        console.log('Token refreshed successfully')

      } else if (event === 'SIGNED_OUT') {

        console.log('User signed out')

      }

    })

    

    return { session, error: null }

  } catch (err) {

    console.error('Error initializing auth:', err)

    return { session: null, error: err as Error }

  }

}



// Helper function to check OpenAI API key configuration

export const checkOpenAIConfiguration = () => {

  const isConfigured = !!openaiApiKey && openaiApiKey.startsWith('sk-') && openaiApiKey.length > 20;

  

  // Only show warnings in development

  if (import.meta.env.DEV) {

    if (!isConfigured) {

      console.warn('OpenAI API key not properly configured:');

      console.warn('- API key exists:', !!openaiApiKey);

      console.warn('- API key starts with sk-:', openaiApiKey?.startsWith('sk-'));

      console.warn('- API key length:', openaiApiKey?.length);

      console.warn('Please add VITE_OPENAI_API_KEY=sk-your_actual_key to your .env file');

    } else {

      console.log('✅ OpenAI API key is properly configured');

    }

  }

  

  return isConfigured;

}



// Safe email availability check (backward compatible)

export const checkEmailAvailability = async (email: string, userType: 'freelancer' | 'client') => {

  try {

    const functionName = userType === 'client' ? 'can_register_as_client' : 'can_register_as_freelancer';

    const { data, error } = await supabase.rpc(functionName, { email_to_check: email });

    

    if (error) {

      console.error('Error checking email availability:', error);

      return { canSignup: false, error: { message: 'Failed to check email availability' } };

    }

    

    const result = data[0];

    return { 

      canSignup: result.allowed, 

      error: result.allowed ? null : { message: result.reason }

    };

  } catch (err) {

    console.error('Exception in checkEmailAvailability:', err);

    return { canSignup: false, error: { message: 'Failed to check email availability' } };

  }

};



// Single-role signup function

export const signUp = async (email: string, password: string, userType: 'freelancer' | 'client') => {

  try {

    // Check if we have valid Supabase credentials from environment variables

    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {

      console.error('Supabase not configured. Environment variables missing.');

      return { 

        data: null, 

        error: { message: 'Supabase not configured. Please add your Supabase credentials to the .env file.' } 

      }

    }



    logWithIST('Attempting to sign up user:', { email, userType });

    

    // First, check if email can be used for this role

    const { canSignup, error: availabilityError } = await checkEmailAvailability(email, userType);

    

    if (!canSignup) {

      return { data: null, error: availabilityError };

    }

    

    // If email is available, create new user

    logWithIST('Creating new user:', email);

    const { data, error } = await supabase.auth.signUp({

      email,

      password,

      options: {

        data: {

          user_type: userType

        }

      }

    });



    if (error) {

      console.error('Signup error:', error);

      console.error('Error details:', {

        code: error.code,

        message: error.message,

        status: error.status,

        name: error.name

      });

      return { data: null, error };

    }



    if (data.user) {

      logWithIST('User created successfully:', data.user.id);

      logWithIST('User metadata:', data.user.user_metadata);

      

      // Check if profile was created automatically

      setTimeout(async () => {

        try {

          const { data: profile, error: profileError } = await supabase

            .from(userType === 'freelancer' ? 'freelancer_profiles' : 'client_profiles')

            .select('*')

            .eq('user_id', data.user!.id)

            .maybeSingle();

          

          if (profileError) {

            console.error('Error checking profile creation:', profileError);

          } else if (profile) {

            logWithIST('Profile created automatically:', profile);

          } else {

            logWithIST('No profile found, user will need to complete profile setup');

          }

        } catch (err) {

          console.error('Error checking profile creation:', err);

        }

      }, 1000);

    }

    

    return { data, error };

  } catch (err) {

    console.error('Exception in signUp:', err);

    return { data: null, error: { message: 'An unexpected error occurred during signup' } };

  }

};



export const signIn = async (email: string, password: string) => {

  try {

    const { data, error } = await supabase.auth.signInWithPassword({

      email,

      password

    });

    

    if (error) {

      console.error('Signin error:', error);

    } else if (data.user) {

      console.log('User signed in successfully:', data.user.id);

    }

    

    return { data, error };

  } catch (err) {

    console.error('Exception in signIn:', err);

    return { data: null, error: { message: 'An unexpected error occurred during signin' } };

  }

};



export const signOut = async () => {

  try {

    const { error } = await supabase.auth.signOut();

    if (error) {

      console.error('Signout error:', error);

    } else {

      console.log('User signed out successfully');

    }

    return { error };

  } catch (err) {

    console.error('Exception in signOut:', err);

    return { error: { message: 'An unexpected error occurred during signout' } };

  }

};



export const getCurrentUser = async () => {

  try {

    const { data: { user }, error } = await supabase.auth.getUser();

    

    // Suppress refresh token errors when no user is logged in

    if (error && error.message?.includes('Refresh Token Not Found')) {

      console.log('No active user session - this is normal for new visitors');

      return { user: null, error: null };

    }

    

    if (error) {

      console.error('Error getting current user:', error);

    } else if (user) {

      console.log('Current user found:', user.id);

    }

    

    return { user, error: error && !error.message?.includes('Refresh Token Not Found') ? error : null };

  } catch (err) {

    console.error('Exception in getCurrentUser:', err);

    return { user: null, error: { message: 'Failed to get current user' } };

  }

};



// Freelancer Profile Management Functions

export const getFreelancerProfile = async (userId: string) => {

  try {



    const { data, error } = await supabase

      .from('freelancer_profiles')

      .select('*')

      .eq('user_id', userId)

      .maybeSingle()

    

    if (error) {

      console.error('Error fetching freelancer profile:', error);

    }

    

    return { data, error }

  } catch (err) {

    console.error('Exception in getFreelancerProfile:', err);

    return { data: null, error: { message: 'Failed to fetch profile data' } }

  }

}



export const updateFreelancerProfile = async (userId: string, profileData: any) => {

  try {



    console.log('Updating freelancer profile for user:', userId);

    console.log('Profile data:', profileData);



    // First, check if profile exists

    const { data: existingProfile, error: checkError } = await supabase

      .from('freelancer_profiles')

      .select('*')

      .eq('user_id', userId)

      .maybeSingle();



    if (checkError) {

      console.error('Error checking existing profile:', checkError);

      return { data: null, error: checkError };

    }



    let result;

    if (existingProfile) {

      // Profile exists, update it

      console.log('Profile exists, updating...');

      const { data, error } = await supabase

        .from('freelancer_profiles')

        .update({

          ...profileData,

          profile_completed: true,

          updated_at: new Date().toISOString()

        })

        .eq('user_id', userId)

        .select()

        .single();

      

      result = { data, error };

    } else {

      // Profile doesn't exist, create it

      console.log('Profile does not exist, creating new profile...');

      const { data, error } = await supabase

        .from('freelancer_profiles')

        .insert({

          user_id: userId,

          freelancer_id: 'F' + Math.floor(Math.random() * 1000000000).toString().padStart(9, '0'),

          ...profileData,

          profile_completed: true

        })

        .select()

        .single();

      

      result = { data, error };

    }

    

    if (result.error) {

      console.error('Error updating/creating freelancer profile:', result.error);

    } else {

      console.log('Profile updated/created successfully:', result.data);

    }

    

    return result;

  } catch (err) {

    console.error('Exception in updateFreelancerProfile:', err);

    return { data: null, error: { message: 'Failed to update profile data' } }

  }

}



export const createFreelancerProfile = async (profileData: any) => {

  try {

    const { data, error } = await supabase

      .from('freelancer_profiles')

      .insert(profileData)

      .select()

      .single()

    

    if (error) {

      console.error('Error creating freelancer profile:', error);

    }

    

    return { data, error }

  } catch (err) {

    console.error('Exception in createFreelancerProfile:', err);

    return { data: null, error: { message: 'Failed to create profile data' } }

  }

}



// Client Profile Management Functions

export const getClientProfile = async (userId: string) => {

  try {

    const { data, error } = await supabase

      .from('client_profiles')

      .select('*')

      .eq('user_id', userId)

      .maybeSingle()

    

    if (error) {

      console.error('Error fetching client profile:', error);

    }

    

    return { data, error }

  } catch (err) {

    console.error('Exception in getClientProfile:', err);

    return { data: null, error: { message: 'Failed to fetch profile data' } }

  }

}



export const updateClientProfile = async (userId: string, profileData: any) => {

  try {

    console.log('Updating client profile for user:', userId);

    console.log('Profile data:', profileData);



    // First, check if profile exists

    const { data: existingProfile, error: checkError } = await supabase

      .from('client_profiles')

      .select('*')

      .eq('user_id', userId)

      .maybeSingle();



    if (checkError) {

      console.error('Error checking existing profile:', checkError);

      return { data: null, error: checkError };

    }



    let result;

    if (existingProfile) {

      // Profile exists, update it

      console.log('Profile exists, updating...');

      const { data, error } = await supabase

        .from('client_profiles')

        .update({

          ...profileData,

          profile_completed: true,

          updated_at: new Date().toISOString()

        })

        .eq('user_id', userId)

        .select()

        .single();

      

      result = { data, error };

    } else {

      // Profile doesn't exist, create it

      console.log('Profile does not exist, creating new profile...');

      const { data, error } = await supabase

        .from('client_profiles')

        .insert({

          user_id: userId,

          client_id: 'C' + Math.floor(Math.random() * 1000000000).toString().padStart(9, '0'),

          ...profileData,

          profile_completed: true

        })

        .select()

        .single();

      

      result = { data, error };

    }

    

    if (result.error) {

      console.error('Error updating/creating client profile:', result.error);

    } else {

      console.log('Profile updated/created successfully:', result.data);

    }

    

    return result;

  } catch (err) {

    console.error('Exception in updateClientProfile:', err);

    return { data: null, error: { message: 'Failed to update profile data' } }

  }

}



export const createClientProfile = async (profileData: any) => {

  const { data, error } = await supabase

    .from('client_profiles')

    .insert(profileData)

    .select()

    .single()

  return { data, error }

}



// Project Management Functions

export const getProjects = async (userId: string, userType: 'freelancer' | 'client') => {

  try {

    // First, get the profile ID (UUID) for the user

    let profileId: string;

    

    if (userType === 'freelancer') {

      const { data: freelancerProfile, error: freelancerError } = await supabase

        .from('freelancer_profiles')

        .select('id')

        .eq('user_id', userId)

        .single();

      

      if (freelancerError || !freelancerProfile) {

        console.error('Error fetching freelancer profile:', freelancerError);

        return { data: [], error: null };

      }

      profileId = freelancerProfile.id;

    } else {

      const { data: clientProfile, error: clientError } = await supabase

        .from('client_profiles')

        .select('id')

        .eq('user_id', userId)

        .single();

      

      if (clientError || !clientProfile) {

        console.error('Error fetching client profile:', clientError);

        return { data: [], error: null };

      }

      profileId = clientProfile.id;

    }

    

    let query;

    

    if (userType === 'freelancer') {

      query = supabase

        .from('projects')

        .select(`

          *,

          client_profiles (

            full_name,

            company_name,

            email

          )

        `)

        .eq('freelancer_id', profileId);  // Use profile ID (UUID)

    } else {

      query = supabase

        .from('projects')

        .select(`

          *,

          freelancer_profiles (

            full_name,

            email

          )

        `)

        .eq('client_id', profileId);  // Use profile ID (UUID)

    }

    

    const { data, error } = await query.order('created_at', { ascending: false });

    return { data, error };

  } catch (err) {

    console.error('Exception in getProjects:', err);

    return { data: null, error: { message: 'Failed to fetch projects' } }

  }

}



export const createProject = async (projectData: any, files?: File[], deliverables?: string[]) => {

  try {

    console.log('Creating project with data:', projectData);

    console.log('Files to upload:', files?.length || 0);

    console.log('Deliverables to save:', deliverables?.length || 0);



    // Start a transaction

    const { data: project, error: projectError } = await supabase

      .from('projects')

      .insert({

        ...projectData,

        project_status: 'Draft'

      })

      .select()

      .single();



    if (projectError) {

      console.error('Error creating project:', projectError);

      return { data: null, error: projectError };

    }



    console.log('Project created successfully:', project);



    // Upload files if provided

    if (files && files.length > 0) {

      const fileUploadPromises = files.map(async (file, index) => {

        try {

          // Validate file size (5MB max)

          if (file.size > 5 * 1024 * 1024) {

            throw new Error(`File ${file.name} exceeds 5MB limit`);

          }



          // Validate file type

          const allowedTypes = [

            'application/pdf',

            'application/msword',

            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',

            'image/jpeg',

            'image/png',

            'video/mp4'

          ];

          

          if (!allowedTypes.includes(file.type)) {

            throw new Error(`File type ${file.type} is not allowed`);

          }



          // Upload to Supabase Storage

          const filePath = `${projectData.client_id}/${project.id}/${file.name}`;

          const { data: uploadData, error: uploadError } = await supabase.storage

            .from('project-files')

            .upload(filePath, file);



          if (uploadError) {

            console.error('Error uploading file:', uploadError);

            throw uploadError;

          }



          // Get public URL

          const { data: urlData } = supabase.storage

            .from('project-files')

            .getPublicUrl(filePath);



          // Save file metadata to database

          const { error: fileError } = await supabase

            .from('project_files')

            .insert({

              project_id: project.id,

              file_name: file.name,

              file_path: filePath,

              file_size: file.size,

              file_type: file.type,

              storage_bucket: 'project-files'

            });



          if (fileError) {

            console.error('Error saving file metadata:', fileError);

            // Try to delete the uploaded file

            await supabase.storage.from('project-files').remove([filePath]);

            throw fileError;

          }



          return { success: true, file: file.name };

        } catch (error) {

          console.error(`Error processing file ${file.name}:`, error);

          return { success: false, file: file.name, error };

        }

      });



      const fileResults = await Promise.all(fileUploadPromises);

      const failedFiles = fileResults.filter(result => !result.success);

      

      if (failedFiles.length > 0) {

        console.warn('Some files failed to upload:', failedFiles);

      }

    }



    // Save deliverables if provided

    if (deliverables && deliverables.length > 0) {

      const deliverableData = deliverables.map((text, index) => ({

        project_id: project.id,

        deliverable_text: text,

        deliverable_order: index + 1

      }));



      const { error: deliverableError } = await supabase

        .from('deliverables')

        .insert(deliverableData);



      if (deliverableError) {

        console.error('Error saving deliverables:', deliverableError);

      }

    }



    return { data: project, error: null };

  } catch (err) {

    console.error('Exception in createProject:', err);

    return { data: null, error: { message: 'Failed to create project' } }

  }

}



export const updateProject = async (projectId: string, projectData: any) => {

  try {

    const { data, error } = await supabase

      .from('projects')

      .update({

        ...projectData,

        updated_at: new Date().toISOString()

      })

      .eq('id', projectId)

      .select()

      .single();



    if (error) {

      console.error('Error updating project:', error);

    }



    return { data, error };

  } catch (err) {

    console.error('Exception in updateProject:', err);

    return { data: null, error: { message: 'Failed to update project' } }

  }

}



export const getProjectWithDetails = async (projectId: string) => {

  try {

    const { data, error } = await supabase

      .rpc('get_project_with_details', { project_uuid: projectId });



    if (error) {

      console.error('Error fetching project details:', error);

    }



    return { data, error };

  } catch (err) {

    console.error('Exception in getProjectWithDetails:', err);

    return { data: null, error: { message: 'Failed to fetch project details' } }

  }

}



export const getProjectFiles = async (projectId: string) => {

  try {

    const { data, error } = await supabase

      .from('project_files')

      .select('*')

      .eq('project_id', projectId)

      .order('created_at', { ascending: true });



    if (error) {

      console.error('Error fetching project files:', error);

    }



    return { data, error };

  } catch (err) {

    console.error('Exception in getProjectFiles:', err);

    return { data: null, error: { message: 'Failed to fetch project files' } }

  }

}



export const getProjectDeliverables = async (projectId: string) => {

  try {

    const { data, error } = await supabase

      .from('deliverables')

      .select('*')

      .eq('project_id', projectId)

      .order('deliverable_order', { ascending: true });



    if (error) {

      console.error('Error fetching project deliverables:', error);

    }



    return { data, error };

  } catch (err) {

    console.error('Exception in getProjectDeliverables:', err);

    return { data: null, error: { message: 'Failed to fetch project deliverables' } }

  }

}



export const deleteProjectFile = async (fileId: string, filePath: string) => {

  try {

    // Delete from Supabase Storage

    const { error: storageError } = await supabase.storage

      .from('project-files')

      .remove([filePath]);



    if (storageError) {

      console.error('Error deleting file from storage:', storageError);

    }



    // Delete from database

    const { error: dbError } = await supabase

      .from('project_files')

      .delete()

      .eq('id', fileId);



    if (dbError) {

      console.error('Error deleting file from database:', dbError);

    }



    return { data: null, error: storageError || dbError };

  } catch (err) {

    console.error('Exception in deleteProjectFile:', err);

    return { data: null, error: { message: 'Failed to delete project file' } }

  }

}



// Enhanced freelancer ID validation with profile completion check

export const validateFreelancerId = async (freelancerId: string) => {

  try {

    console.log('🔍 Validating freelancer ID:', freelancerId);

    console.log('🔍 Supabase function call started at:', new Date().toISOString());



    // Check if it's a UUID format (new system) or string format (old system)

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(freelancerId);

    const isOldFormat = /^F\d{9}$/.test(freelancerId);

    

    if (!isUUID && !isOldFormat) {

      console.log('❌ Format validation failed for:', freelancerId);

      return { 

        data: null, 

        error: { message: 'Invalid freelancer ID format. Must be a valid UUID or F followed by 9 digits (e.g., F123456789)' } 

      };

    }



    console.log('✅ Format validation passed, calling RPC function...');

    

    // Use the safe comprehensive backend validation function

    // For UUID format, we need to handle it differently

    let rpcParams;

    if (isUUID) {

      // If it's a UUID, we need to validate by UUID instead of freelancer_id

      rpcParams = { check_freelancer_uuid: freelancerId };

    } else {

      // If it's the old format, use the original parameter

      rpcParams = { check_freelancer_id: freelancerId };

    }

    

    const { data, error } = await supabase.rpc('validate_freelancer_complete', rpcParams);

    

    console.log('🔍 RPC call completed at:', new Date().toISOString());

    console.log('🔍 RPC response:', { data, error });



    if (error) {

      console.error('❌ Error validating freelancer ID:', error);

      // Provide more specific error message based on the error type

      let errorMessage = 'Database error while validating freelancer ID';

      if (error.message?.includes('function') || error.message?.includes('validate_freelancer_complete')) {

        errorMessage = 'Freelancer validation function not available. Please contact support.';

      } else if (error.message?.includes('permission') || error.message?.includes('access')) {

        errorMessage = 'Access denied. Please try again or contact support.';

      }

      return { data: null, error: { message: errorMessage } };

    }



    if (!data || data.length === 0) {

      return { data: null, error: { message: 'Error validating freelancer ID' } };

    }



    const validationResult = data[0];

    

    console.log('🔍 Validation result details:', validationResult);

    console.log('🔍 exists_in_db value:', validationResult.exists_in_db);

    console.log('🔍 is_active value:', validationResult.is_active);

    console.log('🔍 profile_complete value:', validationResult.profile_complete);



    // Check if freelancer exists

    if (!validationResult.exists_in_db) {

      console.log('❌ No freelancer found with ID:', freelancerId);

      return { data: null, error: { message: 'Please enter a valid Freelancer ID. The entered ID does not exist.' } };

    }



    console.log('✅ Freelancer found:', validationResult.full_name);



    // Check account status

    if (!validationResult.is_active) {

      return { 

        data: null, 

        error: { message: 'Freelancer account is not active. Cannot assign projects to inactive accounts.' } 

      };

    }



    // Check profile completeness

    if (!validationResult.profile_complete) {

      return { 

        data: null, 

        error: { 

          message: validationResult.validation_message 

        } 

      };

    }



    // All validations passed

    console.log('✅ Freelancer validation successful');

    const freelancerData = {

      freelancer_id: validationResult.freelancer_id,

      full_name: validationResult.full_name,

      email: validationResult.email,

      mobile_number: validationResult.mobile_number,

      upi_id: validationResult.upi_id,

      aadhar_number: validationResult.aadhar_number,

      account_status: 'active',

      validation: {

        isValid: true,

        isProfileComplete: true,

        isAccountActive: true,

        validatedAt: getCurrentISTForDatabase()

      }

    };

    

    return { 

      data: freelancerData, 

      error: null 

    };



  } catch (err) {

    console.error('❌ Exception in validateFreelancerId:', err);

    return { data: null, error: { message: 'Failed to validate freelancer ID' } };

  }

}



// Helper function to check freelancer profile completion

const checkFreelancerProfileCompletion = (profile: any) => {

  const requiredFields = [

    { field: 'full_name', value: profile.full_name, label: 'Full Name' },

    { field: 'email', value: profile.email, label: 'Email' },

    { field: 'mobile_number', value: profile.mobile_number, label: 'Mobile Number' },

    { field: 'upi_id', value: profile.upi_id, label: 'UPI ID' },

    { field: 'aadhar_number', value: profile.aadhar_number, label: 'Aadhar Number' }

  ];



  const missingFields: string[] = [];

  

  requiredFields.forEach(({ field, value, label }) => {

    if (!value || (typeof value === 'string' && value.trim() === '')) {

      missingFields.push(label);

    }

  });



  // Additional validation for specific fields

  if (profile.email && !isValidEmail(profile.email)) {

    missingFields.push('Valid Email');

  }



  if (profile.mobile_number && !isValidMobileNumber(profile.mobile_number)) {

    missingFields.push('Valid Mobile Number');

  }



  if (profile.upi_id && !isValidUPI(profile.upi_id)) {

    missingFields.push('Valid UPI ID');

  }



  if (profile.aadhar_number && !isValidAadhar(profile.aadhar_number)) {

    missingFields.push('Valid Aadhar Number');

  }



  return {

    isComplete: missingFields.length === 0,

    missingFields: missingFields,

    completionPercentage: Math.round(((requiredFields.length - missingFields.length) / requiredFields.length) * 100)

  };

}



// Validation helper functions

const isValidEmail = (email: string): boolean => {

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return emailRegex.test(email);

}



const isValidMobileNumber = (mobile: string): boolean => {

  // Indian mobile number validation (10 digits, starts with 6-9)

  const mobileRegex = /^[6-9]\d{9}$/;

  return mobileRegex.test(mobile.replace(/\D/g, ''));

}



const isValidUPI = (upi: string): boolean => {

  // Basic UPI ID validation (format: username@bank or mobile@bank)

  const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z][a-zA-Z0-9.\-_]{2,64}$/;

  return upiRegex.test(upi);

}



const isValidAadhar = (aadhar: string): boolean => {

  // Aadhar number validation (12 digits)

  const aadharRegex = /^\d{12}$/;

  return aadharRegex.test(aadhar.replace(/\D/g, ''));

}



// Transaction Management Functions

export const getTransactions = async (userId: string) => {

  const { data, error } = await supabase

    .from('transactions')

    .select(`

      *,

      projects!inner(

        project_name,

        client_profiles(user_id),

        freelancer_profiles(user_id)

      )

    `)

    .or(`projects.client_profiles.user_id.eq.${userId},projects.freelancer_profiles.user_id.eq.${userId}`)

    .order('created_at', { ascending: false })

  return { data, error }

}



export const createTransaction = async (transactionData: any) => {

  const { data, error } = await supabase

    .from('transactions')

    .insert(transactionData)

    .select()

    .single()

  return { data, error }

}



// Message Management Functions

export const getMessages = async (projectId: string) => {

  try {

    console.log('Fetching messages for project:', projectId);

    

    const { data, error } = await supabase

      .from('project_messages')

      .select('*')

      .eq('project_id', projectId)

      .order('created_at', { ascending: true });



    if (error) {

      console.error('Error fetching messages:', error);

      throw new Error(`Database error: ${error.message || 'Unknown database error'}`);

    }



    console.log('Messages fetched successfully:', data?.length || 0);

    return { data, error: null };

  } catch (error) {

    console.error('Exception in getMessages:', error);

    return { data: null, error: { message: 'Failed to fetch messages' } };

  }

}



export const getMessagesForProject = async (projectId: string) => {

  try {

    console.log('Fetching messages for project:', projectId);

    

    const { data, error } = await supabase

      .from('project_messages')

      .select('*')

      .eq('project_id', projectId)

      .order('created_at', { ascending: true });



    if (error) {

      console.error('Error fetching messages:', error);

      throw new Error(`Database error: ${error.message || 'Unknown database error'}`);

    }



    // Transform the data to match the expected interface

    const transformedData = data?.map(message => ({

      ...message,

      message_text: message.message // Transform 'message' to 'message_text' for frontend compatibility

    })) || [];



    console.log('Messages fetched successfully:', transformedData.length);

    return { data: transformedData, error: null };

  } catch (error) {

    console.error('Exception in getMessagesForProject:', error);

    return { data: null, error: { message: 'Failed to fetch messages' } };

  }

}



export const sendMessage = async (messageData: any) => {

  try {

    console.log('Sending message:', messageData);

    

    // Transform message_text to message for database compatibility

    const dbMessageData = {

      ...messageData,

      message: messageData.message_text,

      message_text: undefined // Remove the incorrect field

    };

    delete dbMessageData.message_text;

    

    const { data, error } = await supabase

      .from('project_messages')

      .insert(dbMessageData)

      .select('*')

      .single();



    if (error) {

      console.error('Error sending message:', error);

      throw new Error(`Database error: ${error.message || 'Unknown database error'}`);

    }



    console.log('Message sent successfully:', data);

    return { data, error: null };

  } catch (error) {

    console.error('Exception in sendMessage:', error);

    return { data: null, error: { message: 'Failed to send message' } };

  }

}



export const getProjectsForMessaging = async (userId: string, userType: 'client' | 'freelancer') => {

  try {

    console.log('🔍 Fetching projects for messaging:', { userId, userType });

    

    // Check if userId is already a UUID (profile ID) or user_id

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);

    

    let profileId: string;

    

    if (isUUID) {

      // If userId is already a UUID, assume it's the profile ID

      profileId = userId;

      console.log('✅ Using provided UUID as profile ID:', profileId);

    } else {

      // If userId is not a UUID, assume it's user_id and look up the profile

      if (userType === 'client') {

        const { data: clientProfile, error: clientError } = await supabase

          .from('client_profiles')

          .select('id')

          .eq('user_id', userId)

          .single();

        

        if (clientError || !clientProfile) {

          console.error('❌ Error fetching client profile:', clientError);

          return { data: [], error: null };

        }

        profileId = clientProfile.id;

        console.log('✅ Client profile found:', profileId);

      } else {

        const { data: freelancerProfile, error: freelancerError } = await supabase

          .from('freelancer_profiles')

          .select('id')

          .eq('user_id', userId)

          .single();

        

        if (freelancerError || !freelancerProfile) {

          console.error('❌ Error fetching freelancer profile:', freelancerError);

          return { data: [], error: null };

        }

        profileId = freelancerProfile.id;

        console.log('✅ Freelancer profile found:', profileId);

      }

    }

    

    // Get projects using the profile ID (UUID) with better error handling

    let projectsQuery;

    if (userType === 'client') {

      // Get projects where user is the client (exclude "Project Created" status)

      projectsQuery = supabase

        .from('projects')

        .select('*')

        .eq('client_id', profileId)

        .neq('project_status_workflow', 'Project Created')

        .order('updated_at', { ascending: false });

    } else {

      // Get projects where user is the freelancer (exclude "Project Created" status)

      projectsQuery = supabase

        .from('projects')

        .select('*')

        .eq('freelancer_id', profileId)

        .neq('project_status_workflow', 'Project Created')

        .order('updated_at', { ascending: false });

    }



    const { data: projectsData, error: projectsError } = await projectsQuery;



    if (projectsError) {

      console.error('❌ Error fetching projects for messaging:', projectsError);

      throw new Error(`Database error: ${projectsError.message || 'Unknown database error'}`);

    }



    console.log('📊 Projects fetched:', projectsData?.length || 0);

    console.log('📋 Project statuses:', (projectsData as any[])?.map((p: any) => p.project_status_workflow) || []);



    // Get profile details separately for each project with better error handling

    const projectsWithProfiles = await Promise.all(

      (projectsData || []).map(async (project) => {

        try {

          if (userType === 'client' && project.freelancer_id) {

            // Get freelancer details for client view

            const { data: freelancerData, error: freelancerError } = await supabase

              .from('freelancer_profiles')

              .select('full_name, freelancer_id')

              .eq('id', project.freelancer_id)

              .single();

            

            if (freelancerError) {

              console.warn('⚠️ Error fetching freelancer details for project:', project.id, freelancerError);

            }

            

            return {

              ...project,

              freelancer_profiles: freelancerData || null

            };

          } else if (userType === 'freelancer' && project.client_id) {

            // Get client details for freelancer view

            const { data: clientData, error: clientError } = await supabase

              .from('client_profiles')

              .select('full_name, client_id')

              .eq('id', project.client_id)

              .single();

            

            if (clientError) {

              console.warn('⚠️ Error fetching client details for project:', project.id, clientError);

            }

            

            return {

              ...project,

              client_profiles: clientData || null

            };

          }

          return project;

        } catch (error) {

          console.error('❌ Error processing project:', project.id, error);

          return project; // Return project without profile details if there's an error

        }

      })

    );



    console.log('✅ Projects for messaging fetched successfully:', projectsWithProfiles?.length || 0);

    return { data: projectsWithProfiles, error: null };

  } catch (error) {

    console.error('❌ Exception in getProjectsForMessaging:', error);

    return { data: null, error: { message: 'Failed to fetch projects for messaging' } };

  }

}



// Utility Functions

export const getUserType = async (userId: string) => {

  // Check if user is a freelancer

  const { data: freelancerProfile } = await getFreelancerProfile(userId);

  if (freelancerProfile) {

    return { userType: 'freelancer', profile: freelancerProfile };

  }

  

  // Check if user is a client

  const { data: clientProfile } = await getClientProfile(userId);

  if (clientProfile) {

    return { userType: 'client', profile: clientProfile };

  }

  

  return { userType: null, profile: null };

}



export const isProfileComplete = async (userId: string) => {

  const { userType, profile } = await getUserType(userId);

  

  if (!profile) return false;

  

  if (userType === 'freelancer') {

    return profile.profile_completed && 

           profile.full_name && 

           profile.mobile_number && 

           profile.upi_id && 

           profile.aadhar_number;

  } else if (userType === 'client') {

    return profile.profile_completed && 

           profile.full_name && 

           profile.mobile_number && 

           profile.company_name && 

           profile.pan_tan_number && 

           profile.upi_id;

  }

  

  return false;

}



// Get all freelancer IDs for testing

export const getAllFreelancerIds = async () => {

  try {

    console.log('🔍 Fetching all active freelancer IDs...');

    

    // Use the new database function to get only active freelancers with complete profiles

    const { data, error } = await supabase.rpc('get_all_active_freelancer_ids');



    if (error) {

      console.error('Error fetching freelancer IDs:', error);

      return { data: null, error };

    }



    console.log('✅ All active freelancer IDs:', data);

    return { data, error: null };

  } catch (err) {

    console.error('Exception in getAllFreelancerIds:', err);

    return { data: null, error: { message: 'Failed to fetch freelancer IDs' } }

  }

}



// Add new functions for project workflow management

export const updateProjectStatusWorkflow = async (projectId: string, newStatus: string) => {

  try {

    console.log('Calling update_project_status_workflow with:', { projectId, newStatus });

    

    const { data, error } = await supabase

      .rpc('update_project_status_workflow', {

        project_uuid: projectId,

        new_status: newStatus

      });



    if (error) {

      console.error('Supabase RPC error updating project status:', error);

      throw new Error(`Database error: ${error.message || 'Unknown database error'}`);

    }



    console.log('Project status update successful:', data);

    return data;

  } catch (error) {

    console.error('Error updating project status workflow:', error);

    throw error;

  }

};



export const getProjectWithAllDetails = async (projectId: string) => {

  try {

    const { data, error } = await supabase

      .rpc('get_project_with_all_details', {

        project_uuid: projectId

      });



    if (error) {

      console.error('Error getting project with all details:', error);

      throw error;

    }



    return data;

  } catch (error) {

    console.error('Error getting project with all details:', error);

    throw error;

  }

};



// Work Products functions

export const uploadWorkProduct = async (projectId: string, file: File, metadata: any, options: { updateStatus?: boolean } = {}) => {

  try {

    const userId = (await supabase.auth.getUser()).data.user?.id;

    if (!userId) throw new Error('User not authenticated');



    // Validate file type

    if (!file.type.startsWith('video/')) {

      throw new Error('File must be a video file');

    }



    // Validate file size (50MB limit)

    const maxSize = 50 * 1024 * 1024; // 50MB

    if (file.size > maxSize) {

      throw new Error('File size must be less than 50MB');

    }



    const filePath = `${userId}/${projectId}/${file.name}`;

    

    // Upload file to storage

    const { data: uploadData, error: uploadError } = await supabase.storage

      .from('work-products')

      .upload(filePath, file, {

        cacheControl: '3600',

        upsert: false // Don't overwrite existing files

      });



    if (uploadError) {

      console.error('Error uploading work product:', uploadError);

      throw uploadError;

    }



    // Get file URL

    const { data: urlData } = supabase.storage

      .from('work-products')

      .getPublicUrl(filePath);



    // Extract video format from filename

    const videoFormat = file.name.split('.').pop()?.toUpperCase() || 'MP4';



    // Save metadata to database

    const { data: dbData, error: dbError } = await supabase

      .from('work_products')

      .insert({

        project_id: projectId,

        file_name: file.name,

        file_path: filePath,

        file_size: file.size,

        file_type: file.type,

        video_duration: metadata.duration || 0,

        video_resolution: metadata.resolution || 'Unknown',

        video_format: videoFormat,

        upload_status: 'Uploaded'

      })

      .select()

      .single();



    if (dbError) {

      console.error('Error saving work product metadata:', dbError);

      // If database insert fails, try to delete the uploaded file

      try {

        await supabase.storage.from('work-products').remove([filePath]);

      } catch (deleteError) {

        console.error('Error deleting uploaded file after database failure:', deleteError);

      }

      throw dbError;

    }



    // Update project status ONLY if explicitly requested (default: false)

    if (options.updateStatus === true) {

      try {

        await updateProjectStatusWorkflow(projectId, 'AI Verified');

      } catch (statusError) {

        console.warn('Failed to update project status after upload:', statusError);

        // Don't fail the upload if status update fails

      }

    } else {

      console.log('Project status update skipped as requested');

    }



    return { ...dbData, url: urlData.publicUrl };

  } catch (error) {

    console.error('Error uploading work product:', error);

    throw error;

  }

};



export const getWorkProducts = async (projectId: string) => {

  try {

    const { data, error } = await supabase

      .from('work_products')

      .select('*')

      .eq('project_id', projectId)

      .order('created_at', { ascending: false });



    if (error) {

      console.error('Error getting work products:', error);

      throw error;

    }



    return data;

  } catch (error) {

    console.error('Error getting work products:', error);

    throw error;

  }

};



// Verification Reports functions

export const createVerificationReport = async (projectId: string, reportData: any) => {

  try {

    const { data, error } = await supabase

      .from('verification_reports')

      .insert({

        project_id: projectId,

        report_title: reportData.title,

        report_content: reportData.content,

        report_type: reportData.type || 'AI Verification',

        verification_status: reportData.status || 'Pending',

        verified_by: reportData.verifiedBy,

        verification_score: reportData.score,

        verification_notes: reportData.notes

      })

      .select()

      .single();



    if (error) {

      console.error('Error creating verification report:', error);

      throw error;

    }



    // Send email notifications based on verification score

    if (reportData.score !== undefined && reportData.score !== null) {

      try {

        // Get project details for email with proper client and freelancer data

        const { data: projectData, error: projectError } = await supabase

          .from('projects')

          .select(`

            id,

            project_id,

            name,

            client_id,

            freelancer_id

          `)

          .eq('id', projectId)

          .single();



        if (projectError) {

          console.error('Error fetching project details for email:', projectError);

        } else if (projectData) {

          // Fetch client and freelancer details separately

          let clientEmail = '';

          let clientName = '';

          let freelancerEmail = '';

          let freelancerName = '';



          // Fetch client details

          if (projectData.client_id) {

            const { data: clientData, error: clientError } = await supabase

              .from('client_profiles')

              .select('email, full_name')

              .eq('id', projectData.client_id)

              .single();

            

            if (!clientError && clientData) {

              clientEmail = clientData.email || '';

              clientName = clientData.full_name || '';

            }

          }



          // Fetch freelancer details

          if (projectData.freelancer_id) {

            const { data: freelancerData, error: freelancerError } = await supabase

              .from('freelancer_profiles')

              .select('email, full_name')

              .eq('id', projectData.freelancer_id)

              .single();

            

            if (!freelancerError && freelancerData) {

              freelancerEmail = freelancerData.email || '';

              freelancerName = freelancerData.full_name || '';

            }

          }



          const emailService = (await import('../emails/emailService')).default.getInstance();

          const verificationScore = reportData.score;



          if (verificationScore >= 0.9) { // 90% or higher

            // Send AI verification success email

            console.log('📧 Sending AI verification success email for score:', verificationScore);

            const emailData = {

              freelancerEmail: freelancerEmail,

              freelancerName: freelancerName,

              clientEmail: clientEmail,

              clientName: clientName,

              projectId: projectData.project_id,

              projectName: projectData.name,

              verificationScore: verificationScore

            };



            const emailResult = await emailService.sendAIVerificationNotification(emailData);

            if (!emailResult.success) {

              console.error('❌ Failed to send AI verification email:', emailResult.error);

            } else {

              console.log('✅ AI verification email sent successfully');

            }

          } else {

            // Send manual revision email

            console.log('📧 Sending manual revision email for score:', verificationScore);

            const emailData = {

              freelancerEmail: freelancerEmail,

              freelancerName: freelancerName,

              clientEmail: clientEmail,

              clientName: clientName,

              projectId: projectData.project_id,

              projectName: projectData.name,

              verificationScore: verificationScore

            };



            const emailResult = await emailService.sendManualRevisionNotification(emailData);

            if (!emailResult.success) {

              console.error('❌ Failed to send manual revision email:', emailResult.error);

            } else {

              console.log('✅ Manual revision email sent successfully');

            }

          }

        }

      } catch (emailError) {

        console.error('❌ Error sending verification emails:', emailError);

        // Don't throw error here to avoid breaking the main verification process

      }

    }



    return data;

  } catch (error) {

    console.error('Error creating verification report:', error);

    throw error;

  }

};



export const getVerificationReports = async (projectId: string) => {

  try {

    const { data, error } = await supabase

      .from('verification_reports')

      .select('*')

      .eq('project_id', projectId)

      .order('created_at', { ascending: false });



    if (error) {

      console.error('Error getting verification reports:', error);

      throw error;

    }



    return data;

  } catch (error) {

    console.error('Error getting verification reports:', error);

    throw error;

  }

};



export const updateVerificationReport = async (reportId: string, updates: any) => {

  try {

    const { data, error } = await supabase

      .from('verification_reports')

      .update({

        ...updates,

        updated_at: new Date().toISOString()

      })

      .eq('id', reportId)

      .select()

      .single();



    if (error) {

      console.error('Error updating verification report:', error);

      throw error;

    }



    return data;

  } catch (error) {

    console.error('Error updating verification report:', error);

    throw error;

  }

};



export const getClientProjectsWithDetails = async (clientId: string) => {

  try {

    console.log('Fetching projects for client:', clientId);



    // Ensure we're using the UUID for database queries

    let actualClientId = clientId;

    

    // If the clientId is not a UUID (doesn't contain dashes), we need to get the UUID

    if (!clientId.includes('-')) {

      const { data: clientProfile, error: clientError } = await supabase

        .from('client_profiles')

        .select('id')

        .eq('client_id', clientId)

        .single();



      if (clientError) {

        console.error('Error fetching client profile:', clientError);

        return { data: null, error: clientError };

      }

      

      if (!clientProfile) {

        console.error('Client profile not found for client_id:', clientId);

        return { data: null, error: { message: 'Client profile not found' } };

      }

      

      actualClientId = clientProfile.id;

      console.log('Resolved client_id to UUID:', actualClientId);

    }



    // Try the new display function first, fallback to direct query if it doesn't exist

    let projects;

    let projectsError;



    // First try RPC function with the correct client_id

    const { data: rpcData, error: rpcError } = await supabase

      .rpc('get_client_projects_display', { client_uuid: actualClientId });



    if (rpcError) {

      console.log('RPC function not found, using direct query fallback');

      // Fallback to direct query - get projects first

      const { data: projectsData, error: directQueryError } = await supabase

        .from('projects')

        .select('*')

        .eq('client_id', actualClientId)

        .order('created_at', { ascending: false });

      

      if (directQueryError) {

        projects = null;

        projectsError = directQueryError;

      } else {

        // Get freelancer details separately for each project

        const projectsWithFreelancerDetails = await Promise.all(

          (projectsData || []).map(async (project) => {

            if (project.freelancer_id) {

              const { data: freelancerData } = await supabase

                .from('freelancer_profiles')

                .select('full_name, email, freelancer_id')

                .eq('id', project.freelancer_id)  // Use 'id' since projects.freelancer_id references freelancer_profiles.id (UUID)

                .single();

              

              return {

                ...project,

                freelancer_profiles: freelancerData || null,

                // Add human-readable freelancer ID for display

                freelancer_display_id: freelancerData?.freelancer_id || project.freelancer_id

              };

            }

            return {

              ...project,

              freelancer_profiles: null,

              freelancer_display_id: project.freelancer_id

            };

          })

        );

        projects = projectsWithFreelancerDetails;

        projectsError = null;

      }

    } else {

      projects = rpcData;

      projectsError = null;

    }



    if (projectsError) {

      console.error('Error fetching projects:', projectsError);

      return { data: null, error: projectsError };

    }



    console.log('Projects fetched:', projects);



    // For each project, get deliverables, work products, and verification reports

    const projectsWithDetails = await Promise.all(

      (projects || []).map(async (project) => {

        // Get deliverables

        const { data: deliverables } = await supabase

          .from('deliverables')

          .select('*')

          .eq('project_id', project.id)

          .order('deliverable_order', { ascending: true });



        // Get work products

        const { data: workProducts } = await supabase

          .from('work_products')

          .select('*')

          .eq('project_id', project.id)

          .order('created_at', { ascending: false });



        // Get verification reports

        const { data: verificationReports } = await supabase

          .from('verification_reports')

          .select('*')

          .eq('project_id', project.id)

          .order('created_at', { ascending: false });



        return {

          ...project,

          deliverables: deliverables || [],

          work_products: workProducts || [],

          verification_reports: verificationReports || []

        };

      })

    );



    console.log('Projects with details:', projectsWithDetails);

    return { data: projectsWithDetails, error: null };

  } catch (err) {

    console.error('Exception in getClientProjectsWithDetails:', err);

    return { data: null, error: { message: 'Failed to fetch projects with details' } }

  }

};



export const getFreelancerProjectsWithDetails = async (freelancerId: string) => {

  try {

    console.log('Fetching projects for freelancer:', freelancerId);



    // Ensure we're using the UUID for database queries

    let actualFreelancerId = freelancerId;

    

    console.log('Input freelancerId:', freelancerId, 'Type:', typeof freelancerId);

    

    // If the freelancerId is not a UUID (doesn't contain dashes), we need to get the UUID

    if (!freelancerId.includes('-')) {

      console.log('FreelancerId is not UUID format, looking up profile...');

      const { data: freelancerProfile, error: profileError } = await supabase

        .from('freelancer_profiles')

        .select('id')

        .eq('freelancer_id', freelancerId)

        .single();

      

      if (profileError) {

        console.error('Error fetching freelancer profile:', profileError);

        return { data: null, error: profileError };

      }

      

      if (!freelancerProfile) {

        console.error('Freelancer profile not found for freelancer_id:', freelancerId);

        return { data: null, error: { message: 'Freelancer profile not found' } };

      }

      

      actualFreelancerId = freelancerProfile.id;

      console.log('Resolved freelancer_id to UUID:', actualFreelancerId);

    } else {

      console.log('FreelancerId is already UUID format:', actualFreelancerId);

    }



    // Try the new display function first, fallback to direct query if it doesn't exist

    let projects;

    let projectsError;



    // Temporarily disable RPC function to use direct query with proper client ID resolution

    console.log('Using direct query for proper client ID resolution');

    // Direct query - get projects first (exclude "Project Created" status)

    const { data: projectsData, error: directQueryError } = await supabase

      .from('projects')

      .select('*')

      .eq('freelancer_id', actualFreelancerId)

      .neq('project_status_workflow', 'Project Created')

      .order('created_at', { ascending: false });

      

    if (directQueryError) {

      projects = null;

      projectsError = directQueryError;

    } else {

      // Get client details separately for each project

      const projectsWithClientDetails = await Promise.all(

        (projectsData || []).map(async (project) => {

          console.log('Processing project:', project.project_id, 'with client_id:', project.client_id);

          

          if (project.client_id) {

            console.log('Attempting to fetch client profile with ID:', project.client_id);

            

            // Try to fetch client profile with better error handling

            // First try with RPC function or different approach

            let clientData = null;

            let clientError = null;

            

            try {

              // Use RPC function to get client display ID safely

              const { data, error } = await supabase

                .rpc('get_client_display_id', { client_uuid: project.client_id });

              

              if (error) {

                console.log('RPC function failed, trying direct query...');

                // Fallback to direct query

                const { data: directData, error: directError } = await supabase

                  .from('client_profiles')

                  .select('full_name, email, client_id')

                  .eq('id', project.client_id)

                  .maybeSingle();

                

                clientData = directData;

                clientError = directError;

              } else {

                // RPC function succeeded

                clientData = data && data.length > 0 ? {

                  client_id: data[0].client_display_id,

                  full_name: data[0].client_name,

                  email: data[0].client_email

                } : null;

                clientError = null;

              }

            } catch (err) {

              console.error('Exception in client profile fetch:', err);

              clientError = err;

            }

            

            if (clientError) {

              console.error('Error fetching client data for project:', project.project_id, clientError);

            }

            

            console.log('Client data for project:', project.project_id, ':', clientData);

            

            const result = {

              ...project,

              client_profiles: clientData || null,

              // Add human-readable client ID for display

              client_display_id: clientData?.client_id || project.client_id

            };

            

            console.log('Final project data for:', project.project_id, 'client_display_id:', result.client_display_id);

            return result;

          }

          return {

            ...project,

            client_profiles: null,

            client_display_id: project.client_id

          };

        })

      );

      projects = projectsWithClientDetails;

      projectsError = null;

    }



    if (projectsError) {

      console.error('Error fetching projects:', projectsError);

      return { data: null, error: projectsError };

    }



    console.log('Projects fetched:', projects);



    // For each project, get deliverables, work products, and verification reports

    const projectsWithDetails = await Promise.all(

      (projects || []).map(async (project) => {

        // Get deliverables

        const { data: deliverables } = await supabase

          .from('deliverables')

          .select('*')

          .eq('project_id', project.id)

          .order('deliverable_order', { ascending: true });



        // Get work products

        const { data: workProducts } = await supabase

          .from('work_products')

          .select('*')

          .eq('project_id', project.id)

          .order('created_at', { ascending: false });



        // Get verification reports

        const { data: verificationReports } = await supabase

          .from('verification_reports')

          .select('*')

          .eq('project_id', project.id)

          .order('created_at', { ascending: false });



        return {

          ...project,

          deliverables: deliverables || [],

          work_products: workProducts || [],

          verification_reports: verificationReports || []

        };

      })

    );



    console.log('Projects with details:', projectsWithDetails);

    return { data: projectsWithDetails, error: null };

  } catch (err) {

    console.error('Exception in getFreelancerProjectsWithDetails:', err);

    return { data: null, error: { message: 'Failed to fetch projects with details' } }

  }

};



export const updateProjectDeliverables = async (projectId: string, deliverables: string[]) => {

  try {

    console.log('Updating deliverables for project:', projectId);

    console.log('New deliverables:', deliverables);



    // First, get existing deliverables to preserve their created_at timestamps

    const { data: existingDeliverables, error: fetchError } = await supabase

      .from('deliverables')

      .select('id, deliverable_text, created_at')

      .eq('project_id', projectId)

      .order('deliverable_order');



    if (fetchError) {

      console.error('Error fetching existing deliverables:', fetchError);

      return { data: null, error: fetchError };

    }



    // Delete existing deliverables for this project

    const { error: deleteError } = await supabase

      .from('deliverables')

      .delete()

      .eq('project_id', projectId);



    if (deleteError) {

      console.error('Error deleting existing deliverables:', deleteError);

      return { data: null, error: deleteError };

    }



    // If no new deliverables, return success

    if (!deliverables || deliverables.length === 0) {

      console.log('No deliverables to save');

      return { data: [], error: null };

    }



    // Prepare deliverable data, preserving created_at timestamps where possible

    const deliverableData = deliverables.map((text, index) => {

      const existingDeliverable = existingDeliverables?.find(d => d.deliverable_text === text);

      return {

        project_id: projectId,

        deliverable_text: text,

        deliverable_order: index + 1,

        created_at: existingDeliverable?.created_at || undefined, // Preserve original created_at if text matches

        updated_at: new Date().toISOString() // Set current timestamp for updated_at

      };

    });



    const { data, error } = await supabase

      .from('deliverables')

      .insert(deliverableData)

      .select();



    if (error) {

      console.error('Error saving new deliverables:', error);

      return { data: null, error };

    }



    console.log('Deliverables updated successfully:', data);

    return { data, error: null };

  } catch (err) {

    console.error('Exception in updateProjectDeliverables:', err);

    return { data: null, error: { message: 'Failed to update project deliverables' } }

  }

};



// Get projects with "Checklist Signed off" status for a specific client that haven't been funded yet

export const getClientProjectsForEscrow = async (clientId: string) => {

  try {

    console.log('Fetching projects for escrow funding for client:', clientId);



    // First, try to use the RPC function

    const { data: projects, error: rpcError } = await supabase

      .rpc('get_client_projects_for_escrow', { client_user_id: clientId });



    if (!rpcError && projects) {

      console.log('Projects fetched via RPC function:', projects);

      return { data: projects, error: null };

    }



    console.log('RPC function failed, using direct query fallback:', rpcError);



    // Fallback: Get client profile first to get the correct client_id

    console.log('Looking up client profile for user_id:', clientId);

    const { data: clientProfile, error: clientError } = await supabase

      .from('client_profiles')

      .select('id, client_id, full_name')

      .eq('user_id', clientId)

      .single();



    if (clientError) {

      console.error('Error fetching client profile:', clientError);

      return { data: null, error: clientError };

    }



    console.log('Client profile found:', clientProfile);



    // Get all projects with "Checklist Signed off" status for this client

    console.log('Querying projects for client_id:', clientProfile.id);

    const { data: projectsData, error: projectsError } = await supabase

      .from('projects')

      .select(`

        id,

        project_id,

        project_name,

        freelancer_id,

        project_status_workflow,

        created_at

      `)

      .eq('client_id', clientProfile.id)

      .eq('project_status_workflow', 'Checklist Signed off')

      .order('created_at', { ascending: false });



    if (projectsError) {

      console.error('Error fetching projects for escrow:', projectsError);

      return { data: null, error: projectsError };

    }



    console.log('Projects found for escrow:', projectsData);



    // Get freelancer details for each project

    const projectsWithDetails = [];

    for (const project of projectsData) {

      // Get freelancer details

      let freelancerDetails = null;

      if (project.freelancer_id) {

        console.log('Looking up freelancer with freelancer_id:', project.freelancer_id);

        

        // Check if freelancer_id is a UUID or human-readable ID

        if (project.freelancer_id.includes('-')) {

          // It's a UUID, look up by id

          const { data: freelancer, error: freelancerError } = await supabase

            .from('freelancer_profiles')

            .select('freelancer_id, full_name')

            .eq('id', project.freelancer_id)

            .single();



          if (!freelancerError) {

            freelancerDetails = freelancer;

          }

        } else {

          // It's a human-readable ID, look up by freelancer_id

          const { data: freelancer, error: freelancerError } = await supabase

            .from('freelancer_profiles')

            .select('freelancer_id, full_name')

            .eq('freelancer_id', project.freelancer_id)

            .single();



          if (!freelancerError) {

            freelancerDetails = freelancer;

          }

        }

      }



      // Check for existing "Fund Secured" transactions

      const { data: fundedTransactions, error: fundedError } = await supabase

        .from('transactions')

        .select('transaction_id, transaction_status')

        .eq('project_id', project.id)

        .eq('transaction_status', 'Fund Secured');



      if (fundedError) {

        console.error('Error checking funded transactions for project:', project.id, fundedError);

        continue;

      }



      // Only include projects that don't have "Fund Secured" transactions

      if (!fundedTransactions || fundedTransactions.length === 0) {

        // Get the transaction value for this project

        const { data: projectTransaction, error: transactionError } = await supabase

          .from('transactions')

          .select('transaction_value')

          .eq('project_id', project.id)

          .single();



        if (transactionError && transactionError.code !== 'PGRST116') { // PGRST116 = no rows returned

          console.error('Error fetching transaction value for project:', project.id, transactionError);

          continue;

        }



        // Add transaction value and freelancer details to project object

        const projectWithValue = {

          ...project,

          freelancer_id: freelancerDetails?.freelancer_id || null,

          freelancer_name: freelancerDetails?.full_name || null,

          transaction_value: projectTransaction?.transaction_value || 0

        };



        projectsWithDetails.push(projectWithValue);

      }

    }



    console.log('Projects for escrow funding (excluding already funded):', projectsWithDetails);

    return { data: projectsWithDetails, error: null };

  } catch (err) {

    console.error('Exception in getClientProjectsForEscrow:', err);

    return { data: null, error: { message: 'Failed to fetch projects for escrow funding' } }

  }

};



// Create a new transaction

export const createEscrowTransaction = async (transactionData: {

  project_id: string;

  value: number;

}) => {

  try {

    console.log('Creating escrow transaction:', transactionData);



    // First, let's check if the project exists

    const { data: projectCheck, error: projectError } = await supabase

      .from('projects')

      .select('id, project_name, client_id')

      .eq('id', transactionData.project_id)

      .single();



    if (projectError) {

      console.error('Error checking project:', projectError);

      return { data: null, error: { message: 'Project not found or access denied' } };

    }



    console.log('Project found:', projectCheck);



    // Check if current user is the client for this project

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {

      console.error('No authenticated user');

      return { data: null, error: { message: 'User not authenticated' } };

    }



    console.log('Current user:', user.id);

    console.log('Project client_id:', projectCheck.client_id);



    const { data, error } = await supabase

      .from('transactions')

      .insert({

        project_id: transactionData.project_id,

        transaction_value: transactionData.value,

        transaction_status: 'Project Created'

      })

      .select()

      .single();



    if (error) {

      console.error('Error creating transaction:', error);

      console.error('Error details:', {

        code: error.code,

        message: error.message,

        details: error.details,

        hint: error.hint

      });

      return { data: null, error };

    }



    console.log('Transaction created successfully:', data);



    // Update project status to "Project Created" (transaction created but project still in initial state)

    const { error: projectUpdateError } = await supabase

      .from('projects')

      .update({ project_status_workflow: 'Project Created' })

      .eq('id', transactionData.project_id);



    if (projectUpdateError) {

      console.error('Error updating project status:', projectUpdateError);

      // Don't fail the transaction creation if project status update fails

      console.warn('Transaction created but project status update failed');

    } else {

      console.log('Project status updated to "Project Created"');

    }



    return { data, error: null };

  } catch (err) {

    console.error('Exception in createEscrowTransaction:', err);

    return { data: null, error: { message: 'Failed to create escrow transaction' } }

  }

};



// Fund escrow for a project

export const fundEscrow = async (projectId: string, transactionValue: number) => {

  try {

    console.log('Funding escrow for project:', projectId, 'with value:', transactionValue);



    // First, verify the project exists and has the correct status

    const { data: project, error: projectCheckError } = await supabase

      .from('projects')

      .select('id, project_status_workflow')

      .eq('id', projectId)

      .single();



    if (projectCheckError) {

      console.error('Error checking project:', projectCheckError);

      return { data: null, error: { message: 'Project not found' } };

    }



    if (project.project_status_workflow !== 'Checklist Signed off') {

      console.error('Project status is not "Checklist Signed off":', project.project_status_workflow);

      return { data: null, error: { message: 'Project is not ready for funding' } };

    }



    // Update project status to "Fund Secured"

    const { error: projectError } = await updateProjectStatusWorkflow(projectId, 'Fund Secured');

    

    if (projectError) {

      console.error('Error updating project status:', projectError);

      return { data: null, error: projectError };

    }



    // Create or update transaction with "Fund Secured" status

    const { data: existingTransaction, error: fetchError } = await supabase

      .from('transactions')

      .select('id, transaction_id')

      .eq('project_id', projectId)

      .single();



    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned

      console.error('Error fetching existing transaction:', fetchError);

      return { data: null, error: fetchError };

    }



    let transactionResult;

    if (existingTransaction) {

      // Update existing transaction

      const { data, error } = await supabase

        .from('transactions')

        .update({

          transaction_value: transactionValue,

          transaction_status: 'Fund Secured',

          updated_at: new Date().toISOString()

        })

        .eq('id', existingTransaction.id)

        .select()

        .single();



      if (error) {

        console.error('Error updating transaction:', error);

        return { data: null, error };

      }

      transactionResult = data;

    } else {

      // Create new transaction

      const { data, error } = await supabase

        .from('transactions')

        .insert({

          project_id: projectId,

          transaction_value: transactionValue,

          transaction_status: 'Fund Secured',

          transaction_type: 'escrow_funding'

        })

        .select()

        .single();



      if (error) {

        console.error('Error creating transaction:', error);

        return { data: null, error };

      }

      transactionResult = data;

    }



    console.log('Escrow funded successfully:', transactionResult);

    return { data: transactionResult, error: null };

  } catch (err) {

    console.error('Exception in fundEscrow:', err);

    return { data: null, error: { message: 'Failed to fund escrow' } }

  }

};



// Get client transactions with project details

export const getClientTransactions = async (clientId: string) => {

  try {

    console.log('Fetching transactions for client:', clientId);



    // Ensure we're using the UUID for database queries

    let actualClientId = clientId;

    

    // If the clientId is not a UUID (doesn't contain dashes), we need to get the UUID

    if (!clientId.includes('-')) {

      const { data: clientProfile, error: clientError } = await supabase

        .from('client_profiles')

        .select('id')

        .eq('client_id', clientId)

        .single();

      

      if (clientError) {

        console.error('Error fetching client profile:', clientError);

        return { data: null, error: clientError };

      }

      

      if (!clientProfile) {

        console.error('Client profile not found for client_id:', clientId);

        return { data: null, error: { message: 'Client profile not found' } };

      }

      

      actualClientId = clientProfile.id;

      console.log('Resolved client_id to UUID for transactions:', actualClientId);

    }



    // First, let's get all transactions for this client to debug

    const { data: allTransactions, error: allTransactionsError } = await supabase

      .from('transactions')

      .select(`

        *,

        projects(

          project_id,

          project_name,

          freelancer_id,

          project_status_workflow,

          client_id

        )

      `)

      .eq('projects.client_id', actualClientId)

      .order('created_at', { ascending: false });



    if (allTransactionsError) {

      console.error('Error fetching all transactions:', allTransactionsError);

      return { data: null, error: allTransactionsError };

    }



    console.log('All transactions for client:', allTransactions);



    // Now filter out the ones we don't want

    const filteredTransactions = allTransactions?.filter(transaction => {

      const projectStatus = transaction.projects?.project_status_workflow;

      const transactionStatus = transaction.transaction_status;

      console.log('Transaction:', transaction.transaction_id, 'Project status:', projectStatus, 'Transaction status:', transactionStatus);

      

      // Filter out transactions with unwanted project statuses

      const validProjectStatus = projectStatus && 

             projectStatus !== 'Project Created' && 

             projectStatus !== 'Assigned to Freelancer';

      

      // Also filter out transactions with "Project Created" transaction status

      const validTransactionStatus = transactionStatus !== 'Project Created';

      

      return validProjectStatus && validTransactionStatus;

    }) || [];



    console.log('Filtered transactions:', filteredTransactions);



    // Now get the full details for filtered transactions

    if (filteredTransactions.length > 0) {

      const transactionIds = filteredTransactions.map(t => t.id);

      

      const { data: detailedTransactions, error: detailedError } = await supabase

        .from('transactions')

        .select(`

          *,

          projects(

            project_id,

            project_name,

            freelancer_id,

            project_status_workflow,

            client_id

          )

        `)

        .in('id', transactionIds)

        .order('created_at', { ascending: false });



      if (detailedError) {

        console.error('Error fetching detailed transactions:', detailedError);

        return { data: null, error: detailedError };

      }



      console.log('Final client transactions:', detailedTransactions);

      

      // Now fetch human-readable freelancer IDs for each transaction

      const transactionsWithReadableIds = await Promise.all(

        (detailedTransactions || []).map(async (transaction) => {

          if (transaction.projects?.freelancer_id) {

            try {

              // Get the human-readable freelancer_id from freelancer_profiles

              const { data: freelancerProfile, error: freelancerError } = await supabase

                .from('freelancer_profiles')

                .select('freelancer_id')

                .eq('id', transaction.projects.freelancer_id)

                .single();

              

              if (!freelancerError && freelancerProfile) {

                return {

                  ...transaction,

                  projects: {

                    ...transaction.projects,

                    freelancer_id: freelancerProfile.freelancer_id // Replace UUID with human-readable ID

                  }

                };

              }

            } catch (err) {

              console.error('Error fetching freelancer profile for transaction:', err);

            }

          }

          return transaction;

        })

      );

      

      return { data: transactionsWithReadableIds, error: null };

    } else {

      console.log('No transactions found after filtering');

      return { data: [], error: null };

    }

  } catch (err) {

    console.error('Exception in getClientTransactions:', err);

    return { data: null, error: { message: 'Failed to fetch client transactions' } }

  }

};



// Get freelancer transactions with project details

export const getFreelancerTransactions = async (freelancerId: string) => {

  try {

    console.log('Fetching transactions for freelancer:', freelancerId);



    // Ensure we're using the UUID for database queries

    let actualFreelancerId = freelancerId;

    

    // If the freelancerId is not a UUID (doesn't contain dashes), we need to get the UUID

    if (!freelancerId.includes('-')) {

      const { data: freelancerProfile, error: profileError } = await supabase

        .from('freelancer_profiles')

        .select('id')

        .eq('freelancer_id', freelancerId)

        .single();

      

      if (profileError) {

        console.error('Error fetching freelancer profile:', profileError);

        return { data: null, error: profileError };

      }

      

      if (!freelancerProfile) {

        console.error('Freelancer profile not found for freelancer_id:', freelancerId);

        return { data: null, error: { message: 'Freelancer profile not found' } };

      }

      

      actualFreelancerId = freelancerProfile.id;

      console.log('Resolved freelancer_id to UUID for transactions:', actualFreelancerId);

    }



    // First, let's get all transactions for this freelancer to debug

          const { data: allTransactions, error: allTransactionsError } = await supabase

        .from('transactions')

        .select(`

          *,

          projects(

            project_id,

            project_name,

            client_id,

            project_status_workflow,

            freelancer_id

          )

        `)

        .eq('projects.freelancer_id', actualFreelancerId)

        .order('created_at', { ascending: false });



    if (allTransactionsError) {

      console.error('Error fetching all freelancer transactions:', allTransactionsError);

      return { data: null, error: allTransactionsError };

    }



    console.log('All transactions for freelancer:', allTransactions);



    // Now filter out the ones we don't want

    const filteredTransactions = allTransactions?.filter(transaction => {

      const projectStatus = transaction.projects?.project_status_workflow;

      const transactionStatus = transaction.transaction_status;

      console.log('Transaction:', transaction.transaction_id, 'Project status:', projectStatus, 'Transaction status:', transactionStatus);

      

      // Filter out transactions with unwanted project statuses

      const validProjectStatus = projectStatus && 

             projectStatus !== 'Project Created' && 

             projectStatus !== 'Assigned to Freelancer' &&

             projectStatus !== 'Checklist Signed off';

      

      // Also filter out transactions with "Project Created" transaction status

      const validTransactionStatus = transactionStatus !== 'Project Created';

      

      return validProjectStatus && validTransactionStatus;

    }) || [];



    console.log('Filtered freelancer transactions:', filteredTransactions);



    // Now get the full details for filtered transactions

    if (filteredTransactions.length > 0) {

      const transactionIds = filteredTransactions.map(t => t.id);

      

      const { data: detailedTransactions, error: detailedError } = await supabase

        .from('transactions')

        .select(`

          *,

          projects(

            project_id,

            project_name,

            client_id,

            project_status_workflow,

            freelancer_id

          )

        `)

        .in('id', transactionIds)

        .order('created_at', { ascending: false });



      if (detailedError) {

        console.error('Error fetching detailed freelancer transactions:', detailedError);

        return { data: null, error: detailedError };

      }



      console.log('Final freelancer transactions:', detailedTransactions);

      

      // Now fetch human-readable client IDs for each transaction

      const transactionsWithReadableIds = await Promise.all(

        (detailedTransactions || []).map(async (transaction) => {

          if (transaction.projects?.client_id) {

            try {

              // Get the human-readable client_id from client_profiles

              const { data: clientProfile, error: clientError } = await supabase

                .from('client_profiles')

                .select('client_id')

                .eq('id', transaction.projects.client_id)

                .single();

              

              if (!clientError && clientProfile) {

                return {

                  ...transaction,

                  projects: {

                    ...transaction.projects,

                    client_id: clientProfile.client_id // Replace UUID with human-readable ID

                  }

                };

              }

            } catch (err) {

              console.error('Error fetching client profile for transaction:', err);

            }

          }

          return transaction;

        })

      );

      

      return { data: transactionsWithReadableIds, error: null };

    } else {

      console.log('No freelancer transactions found after filtering');

      return { data: [], error: null };

    }

  } catch (err) {

    console.error('Exception in getFreelancerTransactions:', err);

    return { data: null, error: { message: 'Failed to fetch freelancer transactions' } }

  }

};



// Update transaction value and recalculate fees

export const updateTransaction = async (transactionId: string, transactionData: any) => {

  try {

    console.log('Updating transaction:', transactionId, transactionData);

    

    // First, let's check if the transaction exists

    const { data: existingTransaction, error: checkError } = await supabase

      .from('transactions')

      .select('*')

      .eq('transaction_id', transactionId);

    

    console.log('Existing transaction check:', existingTransaction, checkError);

    

    // Try with transaction_id first

    let { data, error } = await supabase

      .from('transactions')

      .update({

        ...transactionData,

        updated_at: new Date().toISOString()

      })

      .eq('transaction_id', transactionId)

      .select()

      .single();

    

    // If that fails, try with id field

    if (error && error.code === 'PGRST116') {

      console.log('Transaction not found with transaction_id, trying with id field');

      const { data: transactionCheck } = await supabase

        .from('transactions')

        .select('id')

        .eq('transaction_id', transactionId)

        .single();

      

      if (transactionCheck?.id) {

        const { data: updateData, error: updateError } = await supabase

          .from('transactions')

          .update({

            ...transactionData,

            updated_at: new Date().toISOString()

          })

          .eq('id', transactionCheck.id)

          .select()

          .single();

        

        data = updateData;

        error = updateError;

      }

    }



    if (error) {

      console.error('Error updating transaction:', error);

      return { data: null, error };

    }



    console.log('Transaction updated successfully:', data);

    return { data, error: null };

  } catch (err) {

    console.error('Exception in updateTransaction:', err);

    return { data: null, error: { message: 'Failed to update transaction' } }

  }

};



// Delete project and all related records

export const deleteProject = async (projectId: string) => {

  try {

    console.log('Deleting project and all related records:', projectId);



    // Call the RPC function to delete project and all related records

    const { data, error } = await supabase.rpc('delete_project_cascade', {

      project_uuid: projectId

    });



    if (error) {

      console.error('Error deleting project:', error);

      return { data: null, error };

    }



    // Check the response from the RPC function

    if (data && typeof data === 'object') {

      if (data.success === false) {

        console.error('Project deletion failed:', data.message);

        return { 

          data: null, 

          error: { message: data.message || 'Failed to delete project' } 

        };

      } else if (data.success === true) {

        console.log('Project deleted successfully:', data.message);

        return { data, error: null };

      }

    }



    console.log('Project deleted successfully');

    return { data, error: null };

  } catch (err) {

    console.error('Exception in deleteProject:', err);

    return { data: null, error: { message: 'Failed to delete project' } }

  }

};



// Send checklist to freelancer

export const sendChecklistToFreelancer = async (projectId: string) => {

  try {

    console.log('Sending checklist to freelancer for project:', projectId);



    const { data, error } = await supabase.rpc('send_checklist_to_freelancer', {

      project_uuid: projectId

    });



    if (error) {

      console.error('Error sending checklist to freelancer:', error);

      return { data: null, error };

    }



    console.log('Checklist sent to freelancer response:', data);

    return { data, error: null };

  } catch (err) {

    console.error('Exception in sendChecklistToFreelancer:', err);

    return { data: null, error: { message: 'Failed to send checklist to freelancer' } }

  }

};



// Get project status history

export const getProjectStatusHistory = async (projectId: string) => {

  try {

    console.log('Fetching status history for project:', projectId);



    const { data, error } = await supabase.rpc('get_project_status_history', {

      project_uuid: projectId

    });



    if (error) {

      console.error('Error fetching project status history:', error);

      return { data: null, error };

    }



    console.log('Project status history:', data);

    return { data, error: null };

  } catch (err) {

    console.error('Exception in getProjectStatusHistory:', err);

    return { data: null, error: { message: 'Failed to fetch project status history' } }

  }

};



// Get project status summary

export const getProjectStatusSummary = async (projectId: string) => {

  try {

    console.log('Fetching status summary for project:', projectId);



    const { data, error } = await supabase.rpc('get_project_status_summary', {

      project_uuid: projectId

    });



    if (error) {

      console.error('Error fetching project status summary:', error);

      return { data: null, error };

    }



    console.log('Project status summary:', data);

    return { data, error: null };

  } catch (err) {

    console.error('Exception in getProjectStatusSummary:', err);

    return { data: null, error: { message: 'Failed to fetch project status summary' } }

  }

};



// Manually log a project status change

export const logProjectStatusChange = async (

  projectId: string, 

  newStatus: string, 

  userId?: string, 

  userType: 'client' | 'freelancer' | 'system' = 'system',

  reason?: string

) => {

  try {

    console.log('Logging status change for project:', projectId, 'to:', newStatus);



    const { data, error } = await supabase.rpc('manual_log_project_status_change', {

      project_uuid: projectId,

      new_status: newStatus,

      user_id: userId || null,

      user_type: userType,

      reason: reason || null

    });



    if (error) {

      console.error('Error logging project status change:', error);

      return { data: null, error };

    }



    console.log('Status change logged successfully:', data);

    return { data, error: null };

  } catch (err) {

    console.error('Exception in logProjectStatusChange:', err);

    return { data: null, error: { message: 'Failed to log project status change' } }

  }

};



// Update project status with history tracking

export const updateProjectStatusWithHistory = async (

  projectId: string,

  newStatus: string,

  userId?: string,

  userType: 'client' | 'freelancer' | 'system' = 'system',

  reason?: string

) => {

  try {

    console.log('Updating project status with history tracking:', projectId, 'to:', newStatus);



    // First, update the project with user tracking info

    const { data: updateData, error: updateError } = await supabase

      .from('projects')

      .update({

        project_status_workflow: newStatus,

        updated_by_user_id: userId || null,

        updated_by_user_type: userType,

        status_change_reason: reason || null,

        updated_at: new Date().toISOString()

      })

      .eq('id', projectId)

      .select()

      .single();



    if (updateError) {

      console.error('Error updating project status:', updateError);

      return { data: null, error: updateError };

    }



    console.log('Project status updated successfully:', updateData);

    return { data: updateData, error: null };

  } catch (err) {

    console.error('Exception in updateProjectStatusWithHistory:', err);

    return { data: null, error: { message: 'Failed to update project status' } }

  }

};



// Fetch detailed project information

export const fetchProjectDetails = async (projectId: string) => {

  try {

    console.log('Fetching project details for project_id:', projectId);



    // Get project basic information

    const { data: projectData, error: projectError } = await supabase

      .from('projects')

      .select(`

        project_id,

        project_name,

        freelancer_id,

        desired_completion_date

      `)

      .eq('project_id', projectId)

      .single();



    if (projectError) {

      console.error('Error fetching project data:', projectError);

      throw projectError;

    }



    // Get latest work product (video upload/reupload)

    const { data: workProductData, error: workProductError } = await supabase

      .from('work_products')

      .select(`

        updated_at,

        file_path

      `)

      .eq('project_id', projectId)

      .order('updated_at', { ascending: false })

      .limit(1)

      .single();



    if (workProductError && workProductError.code !== 'PGRST116') {

      console.error('Error fetching work product data:', workProductError);

      throw workProductError;

    }



    // Get deliverables

    const { data: deliverablesData, error: deliverablesError } = await supabase

      .from('deliverables')

      .select(`

        deliverable_order,

        deliverable_text

      `)

      .eq('project_id', projectId)

      .order('deliverable_order', { ascending: true });



    if (deliverablesError) {

      console.error('Error fetching deliverables data:', deliverablesError);

      throw deliverablesError;

    }



    // Combine all data

    const projectDetails = {

      project_id: projectData.project_id,

      project_name: projectData.project_name,

      freelancer_id: projectData.freelancer_id,

      desired_completion_date: projectData.desired_completion_date,

      last_video_upload_date: workProductData?.updated_at || null,

      final_video_url: workProductData?.file_path || null,

      deliverables: deliverablesData || []

    };



    console.log('Project details fetched successfully:', projectDetails);

    return { data: projectDetails, error: null };

  } catch (err) {

    console.error('Exception in fetchProjectDetails:', err);

    return { data: null, error: err };

  }

};



// Save verification report to database

export const saveVerificationReport = async (projectId: string, aiResponse: any) => {

  try {

    console.log('Saving verification report for project:', projectId);



    const { data, error } = await supabase

      .from('verification_reports')

      .insert({

        project_id: projectId,

        report_title: "AI Verification Report",

        report_content: aiResponse.report_content,

        report_type: "auto-ai",

        verification_status: "completed",

        verified_by: "Gemini Pro 2.5",

        verification_score: aiResponse.verification_score,

        verification_notes: null,

        file_path: null,

        file_type: null,

        file_size: null,

        storage_bucket: null,

        created_at: new Date().toISOString(),

        updated_at: new Date().toISOString()

      })

      .select()

      .single();



    if (error) {

      console.error('Error saving verification report:', error);

      return { data: null, error };

    }



    console.log('Verification report saved successfully:', data);

    return { data, error: null };

  } catch (err) {

    console.error('Exception in saveVerificationReport:', err);

    return { data: null, error: err };

  }

};



// Notification functions for both client and freelancer dashboards

export const getClientNotifications = async (userId: string) => {

  try {

    console.log('Fetching notifications for client user:', userId);



    // First, get the client profile to get the profile ID (UUID)

    const { data: clientProfile, error: clientError } = await supabase

      .from('client_profiles')

      .select('id')

      .eq('user_id', userId)

      .single();



    if (clientError) {

      console.error('Error fetching client profile:', clientError);

      return { data: null, error: clientError };

    }



    if (!clientProfile) {

      console.log('No client profile found for user:', userId);

      return { data: [], error: null };

    }



    console.log('Found client profile with id:', clientProfile.id);



    // Get projects with specific statuses using the client profile ID (UUID)

    // projects.client_id references client_profiles.id (UUID), not user_id

    const { data: projectsData, error: projectsError } = await supabase

      .from('projects')

      .select('*')

      .eq('client_id', clientProfile.id)  // Use client profile ID (UUID)

      .in('project_status_workflow', ['Under Manual Revision', 'AI Verified'])

      .order('created_at', { ascending: false });



    if (projectsError) {

      console.error('Error fetching projects:', projectsError);

      return { data: null, error: projectsError };

    }



    if (!projectsData || projectsData.length === 0) {

      console.log('No projects found for client notifications');

      return { data: [], error: null };

    }



    // Get freelancer profiles for these projects

    const freelancerIds = projectsData.map(p => p.freelancer_id).filter(Boolean);

    let freelancerProfiles = [];

    

    if (freelancerIds.length > 0) {

      const { data: freelancers, error: freelancerError } = await supabase

        .from('freelancer_profiles')

        .select('id, freelancer_id, full_name, email, updated_at')

        .in('id', freelancerIds);  // Use 'id' since projects.freelancer_id references freelancer_profiles.id (UUID)

      

      if (freelancerError) {

        console.error('Error fetching freelancer profiles:', freelancerError);

      } else {

        freelancerProfiles = freelancers || [];

      }

    }



    // For each project, get additional details and attach freelancer profile

    const notificationsWithDetails = await Promise.all(

      projectsData.map(async (project) => {

        // Find the corresponding freelancer profile

        const freelancerProfile = freelancerProfiles.find(fp => fp.id === project.freelancer_id);



        // Get latest work product upload

        const { data: workProduct } = await supabase

          .from('work_products')

          .select('updated_at')

          .eq('project_id', project.id)

          .order('updated_at', { ascending: false })

          .limit(1)

          .single();



        // Get latest message (handle case where messages table might not exist)

        let latestMessage = null;

        try {

          const { data: messageData } = await supabase

            .from('project_messages')

            .select('created_at')

            .eq('project_id', project.id)

            .order('created_at', { ascending: false })

            .limit(1)

            .single();

          latestMessage = messageData;

        } catch (error) {

          console.log('No messages found for project or project_messages table not accessible:', project.id);

        }



        // Get verification report for AI Verified projects

        let verificationReport = null;

        if (project.project_status_workflow === 'AI Verified') {

          const { data: report } = await supabase

            .from('verification_reports')

            .select('*')

            .eq('project_id', project.id)

            .order('created_at', { ascending: false })

            .limit(1)

            .single();

          verificationReport = report;

        }



        return {

          ...project,

          freelancer_profiles: freelancerProfile || null,

          last_work_product_upload: workProduct?.updated_at || null,

          last_message_timestamp: latestMessage?.created_at || null,

          verification_report: verificationReport

        };

      })

    );



    console.log('Client notifications fetched:', notificationsWithDetails);

    console.log('Total notifications found:', notificationsWithDetails.length);

    console.log('AI Verified projects:', notificationsWithDetails.filter(p => p.project_status_workflow === 'AI Verified').length);

    console.log('Under Manual Revision projects:', notificationsWithDetails.filter(p => p.project_status_workflow === 'Under Manual Revision').length);

    return { data: notificationsWithDetails, error: null };

  } catch (err) {

    console.error('Exception in getClientNotifications:', err);

    return { data: null, error: { message: 'Failed to fetch client notifications' } };

  }

};



export const getFreelancerNotifications = async (freelancerId: string) => {

  try {

    console.log('Fetching notifications for freelancer:', freelancerId);



    // Determine if freelancerId is a UUID, custom freelancer_id, or user_id

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(freelancerId);

    const isCustomFreelancerId = /^F\d{9}$/.test(freelancerId);

    

    let actualFreelancerId: string;

    

    if (isUUID) {

      // If it's a UUID, it could be either a profile ID or user_id

      // First, try to use it as a profile ID

      const { data: directProfile, error: directError } = await supabase

        .from('freelancer_profiles')

        .select('id')

        .eq('id', freelancerId)

        .maybeSingle();

      

      if (directProfile) {

        console.log('Using freelancerId directly as profile ID:', freelancerId);

        actualFreelancerId = freelancerId;

      } else {

        // Try to find freelancer profile by user_id

        const { data: freelancerProfile, error: freelancerError } = await supabase

          .from('freelancer_profiles')

          .select('id')

          .eq('user_id', freelancerId)

          .maybeSingle();



        if (freelancerError) {

          console.error('Error fetching freelancer profile:', freelancerError);

          return { data: null, error: freelancerError };

        }



        if (!freelancerProfile) {

          console.log('No freelancer profile found for user:', freelancerId);

          return { data: [], error: null };

        }



        console.log('Found freelancer profile with id:', freelancerProfile.id);

        actualFreelancerId = freelancerProfile.id;

      }

    } else if (isCustomFreelancerId) {

      // If it's a custom freelancer_id (like F308208874), find the profile by freelancer_id

      const { data: freelancerProfile, error: freelancerError } = await supabase

        .from('freelancer_profiles')

        .select('id')

        .eq('freelancer_id', freelancerId)

        .maybeSingle();



      if (freelancerError) {

        console.error('Error fetching freelancer profile by custom ID:', freelancerError);

        return { data: null, error: freelancerError };

      }



      if (!freelancerProfile) {

        console.log('No freelancer profile found for custom ID:', freelancerId);

        return { data: [], error: null };

      }



      console.log('Found freelancer profile with id:', freelancerProfile.id);

      actualFreelancerId = freelancerProfile.id;

    } else {

      // Assume it's a user_id and try to find the profile

      const { data: freelancerProfile, error: freelancerError } = await supabase

        .from('freelancer_profiles')

        .select('id')

        .eq('user_id', freelancerId)

        .maybeSingle();



      if (freelancerError) {

        console.error('Error fetching freelancer profile:', freelancerError);

        return { data: null, error: freelancerError };

      }



      if (!freelancerProfile) {

        console.log('No freelancer profile found for user:', freelancerId);

        return { data: [], error: null };

      }



      console.log('Found freelancer profile with id:', freelancerProfile.id);

      actualFreelancerId = freelancerProfile.id;

    }



    // Get projects with specific statuses using the freelancer profile ID (UUID)

    // projects.freelancer_id references freelancer_profiles.id (UUID)

    const { data: projectsData, error: projectsError } = await supabase

      .from('projects')

      .select('*')

      .eq('freelancer_id', actualFreelancerId)  // Use the correct freelancer profile ID (UUID)

      .in('project_status_workflow', ['Under Manual Revision', 'AI Verified'])

      .order('created_at', { ascending: false });



    if (projectsError) {

      console.error('Error fetching projects:', projectsError);

      return { data: null, error: projectsError };

    }



    if (!projectsData || projectsData.length === 0) {

      console.log('No projects found for freelancer notifications');

      return { data: [], error: null };

    }



    // Get client profiles for these projects

    const clientIds = projectsData.map(p => p.client_id).filter(Boolean);

    let clientProfiles = [];

    

    if (clientIds.length > 0) {

      const { data: clients, error: clientError } = await supabase

        .from('client_profiles')

        .select('id, user_id, client_id, full_name, email, company_name, updated_at')

        .in('id', clientIds);  // Use 'id' since projects.client_id references client_profiles.id (UUID)

      

      if (clientError) {

        console.error('Error fetching client profiles:', clientError);

      } else {

        clientProfiles = clients || [];

      }

    }



    // For each project, get additional details and attach client profile

    const notificationsWithDetails = await Promise.all(

      projectsData.map(async (project) => {  // Fix: use projectsData instead of projects

        // Find the corresponding client profile

        const clientProfile = clientProfiles.find(cp => cp.id === project.client_id);



        // Get latest work product view by client

        const { data: workProduct } = await supabase

          .from('work_products')

          .select('updated_at')

          .eq('project_id', project.id)

          .order('updated_at', { ascending: false })

          .limit(1)

          .single();



        // Get latest message (handle case where messages table might not exist)

        let latestMessage = null;

        try {

          const { data: messageData } = await supabase

            .from('project_messages')

            .select('created_at')

            .eq('project_id', project.id)

            .order('created_at', { ascending: false })

            .limit(1)

            .single();

          latestMessage = messageData;

        } catch (error) {

          console.log('No messages found for project or project_messages table not accessible:', project.id);

        }



        // Get verification report for AI Verified projects

        let verificationReport = null;

        if (project.project_status_workflow === 'AI Verified') {

          const { data: report } = await supabase

            .from('verification_reports')

            .select('*')

            .eq('project_id', project.id)

            .order('created_at', { ascending: false })

            .limit(1)

            .single();

          verificationReport = report;

        }



        return {

          ...project,

          client_profiles: clientProfile || null,

          last_work_product_view: workProduct?.updated_at || null,

          last_message_timestamp: latestMessage?.created_at || null,

          verification_report: verificationReport

        };

      })

    );



    console.log('Freelancer notifications fetched:', notificationsWithDetails);

    console.log('Total notifications found:', notificationsWithDetails.length);

    console.log('AI Verified projects:', notificationsWithDetails.filter(p => p.project_status_workflow === 'AI Verified').length);

    console.log('Under Manual Revision projects:', notificationsWithDetails.filter(p => p.project_status_workflow === 'Under Manual Revision').length);

    return { data: notificationsWithDetails, error: null };

  } catch (err) {

    console.error('Exception in getFreelancerNotifications:', err);

    return { data: null, error: { message: 'Failed to fetch freelancer notifications' } };

  }

};

// Send project assignment email notification
const sendProjectAssignmentEmail = async (projectData: any) => {
  try {
    console.log('🔍 Sending project assignment email for project:', projectData.id);
    
    // Get freelancer details
    const { data: freelancerProfile, error: freelancerError } = await supabase
      .from('freelancer_profiles')
      .select('*')
      .eq('id', projectData.freelancer_id)
      .single();
    
    if (freelancerError || !freelancerProfile) {
      console.error('❌ Could not fetch freelancer details for email:', freelancerError);
      return;
    }
    
    // Get client details
    const { data: clientProfile, error: clientError } = await supabase
      .from('client_profiles')
      .select('*')
      .eq('id', projectData.client_id)
      .single();
    
    if (clientError || !clientProfile) {
      console.error('❌ Could not fetch client details for email:', clientError);
      return;
    }
    
    // Get project deliverables
    const { data: deliverables, error: deliverablesError } = await supabase
      .from('deliverables')
      .select('deliverable_text')
      .eq('project_id', projectData.id)
      .order('deliverable_order');
    
    if (deliverablesError) {
      console.error('❌ Could not fetch deliverables for email:', deliverablesError);
    }
    
    const validDeliverables = deliverables?.map(d => d.deliverable_text).filter(Boolean) || [];
    
    // Prepare email data with human-readable IDs
    const emailData = {
      freelancerEmail: freelancerProfile.email,
      freelancerName: freelancerProfile.full_name || 'Freelancer',
      projectId: projectData.project_id || 'V' + projectData.id.slice(0, 4), // Use human-readable project ID
      projectName: projectData.project_name,
      clientId: clientProfile.client_id || 'C' + clientProfile.id.slice(0, 9), // Use human-readable client ID
      clientName: clientProfile.full_name || 'Client',
      projectRequirement: projectData.project_requirement,
      deliverables: validDeliverables,
      completionDate: projectData.desired_completion_date
    };
    
    console.log('🔍 Project assignment email data prepared:', emailData);
    
    // Send email using EmailService
    const { EmailService } = await import('../emails/emailService');
    const emailService = EmailService.getInstance();
    const result = await emailService.sendProjectNotification(emailData);
    
    if (result.success) {
      console.log('✅ Project assignment email sent successfully to freelancer');
    } else {
      console.error('❌ Failed to send project assignment email:', result.error);
    }
  } catch (error) {
    console.error('❌ Exception in sendProjectAssignmentEmail:', error);
  }
};