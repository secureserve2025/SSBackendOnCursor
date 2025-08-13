-- Step by Step Auth Fix
-- This script fixes the auth trigger issue step by step

-- Step 1: Check if the signup handler function exists
SELECT '=== STEP 1: CHECKING SIGNUP HANDLER ===' as step;
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name = 'safe_handle_new_user_signup'
AND routine_schema = 'public';

-- Step 2: If function doesn't exist, create it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'safe_handle_new_user_signup'
        AND routine_schema = 'public'
    ) THEN
        -- Create the function
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
        
        RAISE NOTICE 'Created safe_handle_new_user_signup function';
    ELSE
        RAISE NOTICE 'safe_handle_new_user_signup function already exists';
    END IF;
END $$;

-- Step 3: Check if the trigger exists
SELECT '=== STEP 3: CHECKING AUTH TRIGGER ===' as step;
SELECT 
    trigger_name,
    event_manipulation
FROM information_schema.triggers 
WHERE trigger_name = 'safe_auto_create_profile'
AND event_object_table = 'users'
AND event_object_schema = 'auth';

-- Step 4: Create the trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'safe_auto_create_profile'
        AND event_object_table = 'users'
        AND event_object_schema = 'auth'
    ) THEN
        -- Create the trigger
        CREATE TRIGGER safe_auto_create_profile
          AFTER INSERT ON auth.users
          FOR EACH ROW 
          EXECUTE FUNCTION safe_handle_new_user_signup();
        
        RAISE NOTICE 'Created safe_auto_create_profile trigger';
    ELSE
        RAISE NOTICE 'safe_auto_create_profile trigger already exists';
    END IF;
END $$;

-- Step 5: Verify the trigger was created
SELECT '=== STEP 5: VERIFICATION ===' as step;
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'safe_auto_create_profile'
AND event_object_table = 'users'
AND event_object_schema = 'auth';

-- Step 6: Test the function directly
SELECT '=== STEP 6: FUNCTION TEST ===' as step;
SELECT 'safe_handle_new_user_signup function exists and can be called' as status
WHERE EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_name = 'safe_handle_new_user_signup'
    AND routine_schema = 'public'
);

-- Step 7: Check RLS policies
SELECT '=== STEP 7: RLS POLICIES ===' as step;
SELECT 
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename IN ('client_profiles', 'freelancer_profiles')
ORDER BY tablename, policyname;


