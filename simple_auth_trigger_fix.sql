-- Simple Auth Trigger Fix
-- This script creates the auth trigger without syntax errors

-- 1. Drop existing trigger if it exists
DROP TRIGGER IF EXISTS safe_auto_create_profile ON auth.users;

-- 2. Create the signup handler function
CREATE OR REPLACE FUNCTION safe_handle_new_user_signup()
RETURNS TRIGGER AS $$
DECLARE
    user_type_from_meta TEXT;
    new_client_id TEXT;
    new_freelancer_id TEXT;
    ist_timestamp TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get user type from metadata
    user_type_from_meta := NEW.raw_user_meta_data->>'user_type';
    ist_timestamp := NOW() AT TIME ZONE 'Asia/Kolkata';
    
    -- Only create profiles based on explicit user_type
    IF user_type_from_meta = 'client' THEN
        -- Generate client ID
        new_client_id := 'C' || LPAD(FLOOR(RANDOM() * 1000000000)::TEXT, 9, '0');
        
        -- Create client profile
        INSERT INTO client_profiles (
            user_id, client_id, email, full_name,
            mobile_number, created_at, updated_at
        ) VALUES (
            NEW.id, new_client_id, NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
            '0000000000', -- Placeholder
            ist_timestamp, ist_timestamp
        );
        
        RAISE NOTICE 'Created client profile with ID: %', new_client_id;
        
    ELSIF user_type_from_meta = 'freelancer' THEN
        -- Generate freelancer ID
        new_freelancer_id := 'F' || LPAD(FLOOR(RANDOM() * 1000000000)::TEXT, 9, '0');
        
        -- Create freelancer profile
        INSERT INTO freelancer_profiles (
            user_id, freelancer_id, email, full_name,
            mobile_number, created_at, updated_at
        ) VALUES (
            NEW.id, new_freelancer_id, NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
            '0000000000', -- Placeholder
            ist_timestamp, ist_timestamp
        );
        
        RAISE NOTICE 'Created freelancer profile with ID: %', new_freelancer_id;
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error in safe_handle_new_user_signup: %', SQLERRM;
        -- Don't fail the user creation, just log the error
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create the trigger
CREATE TRIGGER safe_auto_create_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION safe_handle_new_user_signup();

-- 4. Verify the trigger was created
SELECT '=== TRIGGER VERIFICATION ===' as section;
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'safe_auto_create_profile'
AND event_object_table = 'users'
AND event_object_schema = 'auth';

-- 5. Test that the function exists
SELECT '=== FUNCTION TEST ===' as section;
SELECT 'safe_handle_new_user_signup function exists' as status
WHERE EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_name = 'safe_handle_new_user_signup'
    AND routine_schema = 'public'
);

-- 6. Show all triggers on auth.users
SELECT '=== ALL AUTH TRIGGERS ===' as section;
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users'
AND event_object_schema = 'auth';
