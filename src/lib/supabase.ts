import { createClient } from '@supabase/supabase-js'

// Debug environment variables
console.log('Environment variables check:')
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL)
console.log('VITE_SUPABASE_ANON_KEY exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY)
console.log('VITE_SUPABASE_ANON_KEY length:', import.meta.env.VITE_SUPABASE_ANON_KEY?.length)

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder_key'

// Only throw error if we're not in development mode
if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn('Missing Supabase environment variables. Using placeholder values for development.')
  console.warn('Available env vars:', Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')))
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Auth helper functions
export const signUp = async (email: string, password: string, userType: 'freelancer' | 'client') => {
  try {
    // Check if we have valid Supabase credentials
    if (supabaseUrl === 'https://placeholder.supabase.co' || supabaseAnonKey === 'placeholder_key') {
      console.error('Supabase not configured. Using placeholder values.');
      return { 
        data: null, 
        error: { message: 'Supabase not configured. Please add your Supabase credentials to the .env file.' } 
      }
    }

    console.log('Attempting to sign up user:', { email, userType });
    console.log('Supabase URL:', supabaseUrl);
    console.log('Supabase Key (first 20 chars):', supabaseAnonKey.substring(0, 20) + '...');

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
      console.log('User created successfully:', data.user.id);
      console.log('User metadata:', data.user.user_metadata);
      
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
            console.log('Profile created automatically:', profile);
          } else {
            console.warn('No profile found after signup - trigger may have failed');
          }
        } catch (err) {
          console.error('Exception checking profile:', err);
        }
      }, 2000); // Wait 2 seconds for trigger to execute
    }

    return { data, error };
  } catch (err) {
    console.error('Exception in signUp:', err);
    return { 
      data: null, 
      error: { message: 'Database error saving new user. Please try again.' } 
    }
  }
}

export const signIn = async (email: string, password: string) => {
  // Check if we have valid Supabase credentials
  if (supabaseUrl === 'https://placeholder.supabase.co' || supabaseAnonKey === 'placeholder_key') {
    return { 
      data: null, 
      error: { message: 'Supabase not configured. Please add your Supabase credentials to the .env file.' } 
    }
  }
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

// Freelancer Profile Management Functions
export const getFreelancerProfile = async (userId: string) => {
  try {
    // Check if we have valid Supabase credentials
    if (supabaseUrl === 'https://placeholder.supabase.co' || supabaseAnonKey === 'placeholder_key') {
      console.error('Supabase not configured. Using placeholder values.');
      return { 
        data: null, 
        error: { message: 'Supabase not configured. Please add your Supabase credentials to the .env file.' } 
      }
    }

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
    // Check if we have valid Supabase credentials
    if (supabaseUrl === 'https://placeholder.supabase.co' || supabaseAnonKey === 'placeholder_key') {
      console.error('Supabase not configured. Using placeholder values.');
      return { 
        data: null, 
        error: { message: 'Supabase not configured. Please add your Supabase credentials to the .env file.' } 
      }
    }

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
    // Check if we have valid Supabase credentials
    if (supabaseUrl === 'https://placeholder.supabase.co' || supabaseAnonKey === 'placeholder_key') {
      console.error('Supabase not configured. Using placeholder values.');
      return { 
        data: null, 
        error: { message: 'Supabase not configured. Please add your Supabase credentials to the .env file.' } 
      }
    }

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
    // Check if we have valid Supabase credentials
    if (supabaseUrl === 'https://placeholder.supabase.co' || supabaseAnonKey === 'placeholder_key') {
      console.error('Supabase not configured. Using placeholder values.');
      return { 
        data: null, 
        error: { message: 'Supabase not configured. Please add your Supabase credentials to the .env file.' } 
      }
    }

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
    // Check if we have valid Supabase credentials
    if (supabaseUrl === 'https://placeholder.supabase.co' || supabaseAnonKey === 'placeholder_key') {
      console.error('Supabase not configured. Using placeholder values.');
      return { 
        data: null, 
        error: { message: 'Supabase not configured. Please add your Supabase credentials to the .env file.' } 
      }
    }

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
    // Check if we have valid Supabase credentials
    if (supabaseUrl === 'https://placeholder.supabase.co' || supabaseAnonKey === 'placeholder_key') {
      console.error('Supabase not configured. Using placeholder values.');
      return { 
        data: null, 
        error: { message: 'Supabase not configured. Please add your Supabase credentials to the .env file.' } 
      }
    }

    let query;
    
    if (userType === 'freelancer') {
      query = supabase
        .from('projects')
        .select(`
          *,
          client_profiles!projects_client_id_fkey (
            full_name,
            company_name,
            email
          )
        `)
        .eq('freelancer_id', userId);
    } else {
      query = supabase
        .from('projects')
        .select(`
          *,
          freelancer_profiles!projects_freelancer_id_fkey (
            full_name,
            email
          )
        `)
        .eq('client_id', userId);
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
    // Check if we have valid Supabase credentials
    if (supabaseUrl === 'https://placeholder.supabase.co' || supabaseAnonKey === 'placeholder_key') {
      console.error('Supabase not configured. Using placeholder values.');
      return { 
        data: null, 
        error: { message: 'Supabase not configured. Please add your Supabase credentials to the .env file.' } 
      }
    }

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
          // Validate file size (10MB max)
          if (file.size > 10 * 1024 * 1024) {
            throw new Error(`File ${file.name} exceeds 10MB limit`);
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
    // Check if we have valid Supabase credentials
    if (supabaseUrl === 'https://placeholder.supabase.co' || supabaseAnonKey === 'placeholder_key') {
      console.error('Supabase not configured. Using placeholder values.');
      return { 
        data: null, 
        error: { message: 'Supabase not configured. Please add your Supabase credentials to the .env file.' } 
      }
    }

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
    // Check if we have valid Supabase credentials
    if (supabaseUrl === 'https://placeholder.supabase.co' || supabaseAnonKey === 'placeholder_key') {
      console.error('Supabase not configured. Using placeholder values.');
      return { 
        data: null, 
        error: { message: 'Supabase not configured. Please add your Supabase credentials to the .env file.' } 
      }
    }

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
    // Check if we have valid Supabase credentials
    if (supabaseUrl === 'https://placeholder.supabase.co' || supabaseAnonKey === 'placeholder_key') {
      console.error('Supabase not configured. Using placeholder values.');
      return { 
        data: null, 
        error: { message: 'Supabase not configured. Please add your Supabase credentials to the .env file.' } 
      }
    }

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
    // Check if we have valid Supabase credentials
    if (supabaseUrl === 'https://placeholder.supabase.co' || supabaseAnonKey === 'placeholder_key') {
      console.error('Supabase not configured. Using placeholder values.');
      return { 
        data: null, 
        error: { message: 'Supabase not configured. Please add your Supabase credentials to the .env file.' } 
      }
    }

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
    // Check if we have valid Supabase credentials
    if (supabaseUrl === 'https://placeholder.supabase.co' || supabaseAnonKey === 'placeholder_key') {
      console.error('Supabase not configured. Using placeholder values.');
      return { 
        data: null, 
        error: { message: 'Supabase not configured. Please add your Supabase credentials to the .env file.' } 
      }
    }

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

// Validate freelancer ID exists in database
export const validateFreelancerId = async (freelancerId: string) => {
  try {
    // Check if we have valid Supabase credentials
    if (supabaseUrl === 'https://placeholder.supabase.co' || supabaseAnonKey === 'placeholder_key') {
      console.error('Supabase not configured. Using placeholder values.');
      return { 
        data: null, 
        error: { message: 'Supabase not configured. Please add your Supabase credentials to the .env file.' } 
      }
    }

    console.log('Validating freelancer ID:', freelancerId);
    console.log('Supabase URL:', supabaseUrl);
    console.log('Supabase Key (first 20 chars):', supabaseAnonKey.substring(0, 20) + '...');

    // First, let's check if the table exists and get some basic info
    console.log('Testing table access...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('freelancer_profiles')
      .select('freelancer_id')
      .limit(1);

    if (tableError) {
      console.error('Error accessing freelancer_profiles table:', tableError);
      console.error('Table error details:', {
        code: tableError.code,
        message: tableError.message,
        details: tableError.details,
        hint: tableError.hint
      });
      return { data: null, error: tableError };
    }

    console.log('Table access successful, checking for freelancer ID...');

    // Now check for the specific freelancer ID
    const { data, error } = await supabase
      .from('freelancer_profiles')
      .select('freelancer_id, full_name, email')
      .eq('freelancer_id', freelancerId)
      .maybeSingle();

    if (error) {
      console.error('Error validating freelancer ID:', error);
      console.error('Validation error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      return { data: null, error };
    }

    console.log('Freelancer validation result:', data);
    
    if (!data) {
      console.log('No freelancer found with ID:', freelancerId);
      
      // Let's also check what freelancer IDs exist in the database
      const { data: allFreelancers, error: listError } = await supabase
        .from('freelancer_profiles')
        .select('freelancer_id, full_name')
        .limit(10);
      
      if (listError) {
        console.error('Error listing freelancers:', listError);
      } else {
        console.log('Available freelancer IDs:', allFreelancers);
      }
      
      return { data: null, error: { message: 'Freelancer ID not found' } };
    }

    return { data, error: null };
  } catch (err) {
    console.error('Exception in validateFreelancerId:', err);
    return { data: null, error: { message: 'Failed to validate freelancer ID' } }
  }
}

// Transaction Management Functions
export const getTransactions = async (userId: string) => {
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      projects!inner(
        project_name,
        client_profiles!projects_client_id_fkey(user_id),
        freelancer_profiles!projects_freelancer_id_fkey(user_id)
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
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })
  return { data, error }
}

export const sendMessage = async (messageData: any) => {
  const { data, error } = await supabase
    .from('messages')
    .insert(messageData)
    .select()
    .single()
  return { data, error }
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
    // Check if we have valid Supabase credentials
    if (supabaseUrl === 'https://placeholder.supabase.co' || supabaseAnonKey === 'placeholder_key') {
      console.error('Supabase not configured. Using placeholder values.');
      return { 
        data: null, 
        error: { message: 'Supabase not configured. Please add your Supabase credentials to the .env file.' } 
      }
    }

    const { data, error } = await supabase
      .from('freelancer_profiles')
      .select('freelancer_id, full_name, email')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching freelancer IDs:', error);
      return { data: null, error };
    }

    console.log('All freelancer IDs:', data);
    return { data, error: null };
  } catch (err) {
    console.error('Exception in getAllFreelancerIds:', err);
    return { data: null, error: { message: 'Failed to fetch freelancer IDs' } }
  }
}

// Add new functions for project workflow management
export const updateProjectStatusWorkflow = async (projectId: string, newStatus: string) => {
  try {
    const { data, error } = await supabase
      .rpc('update_project_status_workflow', {
        project_uuid: projectId,
        new_status: newStatus
      });

    if (error) {
      console.error('Error updating project status:', error);
      throw error;
    }

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
export const uploadWorkProduct = async (projectId: string, file: File, metadata: any) => {
  try {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) throw new Error('User not authenticated');

    const filePath = `${userId}/${projectId}/${file.name}`;
    
    // Upload file to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('work-products')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Error uploading work product:', uploadError);
      throw uploadError;
    }

    // Get file URL
    const { data: urlData } = supabase.storage
      .from('work-products')
      .getPublicUrl(filePath);

    // Save metadata to database
    const { data: dbData, error: dbError } = await supabase
      .from('work_products')
      .insert({
        project_id: projectId,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: file.type,
        video_duration: metadata.duration,
        video_resolution: metadata.resolution,
        video_format: metadata.format,
        upload_status: 'Uploaded'
      })
      .select()
      .single();

    if (dbError) {
      console.error('Error saving work product metadata:', dbError);
      throw dbError;
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
    // Check if we have valid Supabase credentials
    if (supabaseUrl === 'https://placeholder.supabase.co' || supabaseAnonKey === 'placeholder_key') {
      console.error('Supabase not configured. Using placeholder values.');
      return { 
        data: null, 
        error: { message: 'Supabase not configured. Please add your Supabase credentials to the .env file.' } 
      }
    }

    console.log('Fetching projects for client:', clientId);

    // Get projects with freelancer info
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select(`
        *,
        freelancer_profiles!projects_freelancer_id_fkey (
          full_name,
          email
        )
      `)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (projectsError) {
      console.error('Error fetching projects:', projectsError);
      return { data: null, error: projectsError };
    }

    console.log('Projects fetched:', projects);

    // For each project, get deliverables, work products, and verification reports
    const projectsWithDetails = await Promise.all(
      projects.map(async (project) => {
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