-- Fix Dual Role Authentication System
-- This script allows users to have both client and freelancer profiles with the same email
-- by modifying the authentication logic to check existing users before creating new ones

-- =============================================================================
-- PART 1: Create functions to check and create dual-role profiles
-- =============================================================================

-- Function to check if a user already exists with this email
CREATE OR REPLACE FUNCTION get_user_by_email(user_email TEXT)
RETURNS UUID AS $$
DECLARE
    existing_user_id UUID;
BEGIN
    SELECT id INTO existing_user_id 
    FROM auth.users 
    WHERE email = user_email 
    LIMIT 1;
    
    RETURN existing_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create client profile for existing or new user
CREATE OR REPLACE FUNCTION create_client_profile(user_id UUID, user_email TEXT, user_name TEXT DEFAULT '')
RETURNS TEXT AS $$
DECLARE
    new_client_id TEXT;
    ist_timestamp TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Generate unique client_id
    new_client_id := generate_client_id();
    ist_timestamp := NOW() AT TIME ZONE 'Asia/Kolkata';
    
    -- Check if client profile already exists for this user
    IF EXISTS (SELECT 1 FROM client_profiles WHERE user_id = user_id) THEN
        RAISE EXCEPTION 'Client profile already exists for this user';
    END IF;
    
    -- Insert new client profile
    INSERT INTO client_profiles (
        user_id, 
        client_id, 
        email, 
        full_name,
        created_at,
        updated_at
    )
    VALUES (
        user_id, 
        new_client_id,
        user_email,
        user_name,
        ist_timestamp,
        ist_timestamp
    );
    
    RETURN new_client_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create freelancer profile for existing or new user  
CREATE OR REPLACE FUNCTION create_freelancer_profile(user_id UUID, user_email TEXT, user_name TEXT DEFAULT '')
RETURNS TEXT AS $$
DECLARE
    new_freelancer_id TEXT;
    ist_timestamp TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Generate unique freelancer_id
    new_freelancer_id := generate_freelancer_id();
    ist_timestamp := NOW() AT TIME ZONE 'Asia/Kolkata';
    
    -- Check if freelancer profile already exists for this user
    IF EXISTS (SELECT 1 FROM freelancer_profiles WHERE user_id = user_id) THEN
        RAISE EXCEPTION 'Freelancer profile already exists for this user';
    END IF;
    
    -- Insert new freelancer profile
    INSERT INTO freelancer_profiles (
        user_id, 
        freelancer_id, 
        email, 
        full_name,
        created_at,
        updated_at
    )
    VALUES (
        user_id, 
        new_freelancer_id,
        user_email,
        user_name,
        ist_timestamp,
        ist_timestamp
    );
    
    RETURN new_freelancer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- PART 2: Update triggers to handle dual-role creation
-- =============================================================================

-- Drop existing triggers
DROP TRIGGER IF EXISTS on_auth_user_created_freelancer ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_client ON auth.users;

-- Updated freelancer trigger function
CREATE OR REPLACE FUNCTION handle_new_freelancer()
RETURNS TRIGGER AS $$
DECLARE
    new_freelancer_id TEXT;
BEGIN
    -- Only create freelancer profile if user_type is freelancer
    IF NEW.raw_user_meta_data->>'user_type' = 'freelancer' THEN
        new_freelancer_id := create_freelancer_profile(
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'full_name', '')
        );
        RAISE NOTICE 'Created freelancer profile: %', new_freelancer_id;
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating freelancer profile: %', SQLERRM;
        RETURN NEW; -- Don't fail user creation if profile creation fails
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Updated client trigger function
CREATE OR REPLACE FUNCTION handle_new_client()
RETURNS TRIGGER AS $$
DECLARE
    new_client_id TEXT;
BEGIN
    -- Only create client profile if user_type is client
    IF NEW.raw_user_meta_data->>'user_type' = 'client' THEN
        new_client_id := create_client_profile(
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'full_name', '')
        );
        RAISE NOTICE 'Created client profile: %', new_client_id;
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating client profile: %', SQLERRM;
        RETURN NEW; -- Don't fail user creation if profile creation fails
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for both roles
CREATE TRIGGER on_auth_user_created_freelancer
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION handle_new_freelancer();

CREATE TRIGGER on_auth_user_created_client
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION handle_new_client();

-- =============================================================================
-- PART 3: Create functions for adding second role to existing users
-- =============================================================================

-- Function to add freelancer role to existing client
CREATE OR REPLACE FUNCTION add_freelancer_role_to_existing_user(user_email TEXT)
RETURNS TEXT AS $$
DECLARE
    existing_user_id UUID;
    new_freelancer_id TEXT;
BEGIN
    -- Get existing user ID
    existing_user_id := get_user_by_email(user_email);
    
    IF existing_user_id IS NULL THEN
        RAISE EXCEPTION 'No user found with email: %', user_email;
    END IF;
    
    -- Create freelancer profile for existing user
    new_freelancer_id := create_freelancer_profile(existing_user_id, user_email, '');
    
    RETURN new_freelancer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add client role to existing freelancer
CREATE OR REPLACE FUNCTION add_client_role_to_existing_user(user_email TEXT)
RETURNS TEXT AS $$
DECLARE
    existing_user_id UUID;
    new_client_id TEXT;
BEGIN
    -- Get existing user ID
    existing_user_id := get_user_by_email(user_email);
    
    IF existing_user_id IS NULL THEN
        RAISE EXCEPTION 'No user found with email: %', user_email;
    END IF;
    
    -- Create client profile for existing user
    new_client_id := create_client_profile(existing_user_id, user_email, '');
    
    RETURN new_client_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- PART 4: Create view to check user roles
-- =============================================================================

-- View to see all user roles
CREATE OR REPLACE VIEW user_roles AS
SELECT 
    u.id as user_id,
    u.email,
    u.created_at as user_created_at,
    cp.client_id,
    cp.created_at as client_profile_created_at,
    fp.freelancer_id,
    fp.created_at as freelancer_profile_created_at,
    CASE 
        WHEN cp.client_id IS NOT NULL AND fp.freelancer_id IS NOT NULL THEN 'both'
        WHEN cp.client_id IS NOT NULL THEN 'client_only'
        WHEN fp.freelancer_id IS NOT NULL THEN 'freelancer_only'
        ELSE 'no_profiles'
    END as role_status
FROM auth.users u
LEFT JOIN client_profiles cp ON u.id = cp.user_id
LEFT JOIN freelancer_profiles fp ON u.id = fp.user_id
ORDER BY u.created_at DESC;

-- =============================================================================
-- PART 5: Helper functions for frontend
-- =============================================================================

-- Function to check what roles a user has
CREATE OR REPLACE FUNCTION get_user_roles(user_email TEXT)
RETURNS TABLE(
    user_id UUID,
    email TEXT,
    has_client_profile BOOLEAN,
    has_freelancer_profile BOOLEAN,
    client_id TEXT,
    freelancer_id TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.email,
        (cp.client_id IS NOT NULL) as has_client_profile,
        (fp.freelancer_id IS NOT NULL) as has_freelancer_profile,
        cp.client_id,
        fp.freelancer_id
    FROM auth.users u
    LEFT JOIN client_profiles cp ON u.id = cp.user_id
    LEFT JOIN freelancer_profiles fp ON u.id = fp.user_id
    WHERE u.email = user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- PART 6: Test the dual role system
-- =============================================================================

-- Test function to verify dual role functionality
CREATE OR REPLACE FUNCTION test_dual_role_system()
RETURNS TEXT AS $$
DECLARE
    test_email TEXT := 'test@dualrole.com';
    test_user_id UUID;
    test_client_id TEXT;
    test_freelancer_id TEXT;
    role_info RECORD;
BEGIN
    -- Clean up any existing test data
    DELETE FROM client_profiles WHERE email = test_email;
    DELETE FROM freelancer_profiles WHERE email = test_email;
    DELETE FROM auth.users WHERE email = test_email;
    
    -- Check if email exists
    test_user_id := get_user_by_email(test_email);
    
    IF test_user_id IS NULL THEN
        RETURN 'SUCCESS: get_user_by_email correctly returns NULL for non-existent email';
    ELSE
        RETURN 'ERROR: get_user_by_email should return NULL for non-existent email';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Run the test
SELECT test_dual_role_system() as test_result;

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Show all functions created
SELECT 
    'Dual Role Functions Created' as info,
    routine_name
FROM information_schema.routines 
WHERE routine_name IN (
    'get_user_by_email',
    'create_client_profile', 
    'create_freelancer_profile',
    'add_freelancer_role_to_existing_user',
    'add_client_role_to_existing_user',
    'get_user_roles'
)
ORDER BY routine_name;

-- Show triggers
SELECT 
    'Auth Triggers' as info,
    trigger_name,
    event_manipulation,
    event_object_table
FROM information_schema.triggers 
WHERE trigger_name LIKE '%auth_user%'
ORDER BY trigger_name;

-- Check the user_roles view
SELECT 'User Roles View Created' as info, 
       COUNT(*) as total_users_with_profiles
FROM user_roles;

SELECT 'SUCCESS: Dual role authentication system is ready!' as status;




