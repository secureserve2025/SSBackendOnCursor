import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder_key'

// Only throw error if we're not in development mode
if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn('Missing Supabase environment variables. Using placeholder values for development.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Auth helper functions
export const signUp = async (email: string, password: string, userType: 'freelancer' | 'client') => {
  // Check if we have valid Supabase credentials
  if (supabaseUrl === 'https://placeholder.supabase.co' || supabaseAnonKey === 'placeholder_key') {
    return { 
      data: null, 
      error: { message: 'Supabase not configured. Please add your Supabase credentials to the .env file.' } 
    }
  }
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        user_type: userType
      }
    }
  })
  return { data, error }
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
}

export const createProject = async (projectData: any) => {
  const { data, error } = await supabase
    .from('projects')
    .insert(projectData)
    .select()
    .single()
  return { data, error }
}

export const updateProject = async (projectId: string, projectData: any) => {
  const { data, error } = await supabase
    .from('projects')
    .update({
      ...projectData,
      updated_at: new Date().toISOString()
    })
    .eq('id', projectId)
    .select()
    .single()
  return { data, error }
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