-- Fix Auth Signup Trigger
-- This script creates the missing auth trigger and related functions for user signup

-- 1. Create ID generation functions
CREATE OR REPLACE FUNCTION safe_generate_client_id()
RETURNS TEXT AS $$
DECLARE
    new_id TEXT;
    counter INTEGER := 0;
BEGIN
    LOOP
        -- Generate client ID: C + 9 random digits
        new_id := 'C' || LPAD(FLOOR(RANDOM() * 1000000000)::TEXT, 9, '0');
        
        -- Check if ID already exists
        IF NOT EXISTS (SELECT 1 FROM client_profiles WHERE client_id = new_id) THEN
            RETURN new_id;
        END IF;
        
        counter := counter + 1;
        IF counter > 10 THEN
            RAISE EXCEPTION 'Unable to generate unique client ID after 10 attempts';
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION safe_generate_freelancer_id()
RETURNS TEXT AS $$
DECLARE
    new_id TEXT;
    counter INTEGER := 0;
BEGIN
    LOOP
        -- Generate freelancer ID: F + 9 random digits
        new_id := 'F' || LPAD(FLOOR(RANDOM() * 1000000000)::TEXT, 9, '0');
        
        -- Check if ID already exists
        IF NOT EXISTS (SELECT 1 FROM freelancer_profiles WHERE freelancer_id = new_id) THEN
            RETURN new_id;
        END IF;
        
        counter := counter + 1;
        IF counter > 10 THEN
            RAISE EXCEPTION 'Unable to generate unique freelancer ID after 10 attempts';
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 2. Create the user signup handler function
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
        new_client_id := safe_generate_client_id();
        
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
        new_freelancer_id := safe_generate_freelancer_id();
        
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

-- 3. Create the auth trigger
DROP TRIGGER IF EXISTS safe_auto_create_profile ON auth.users;
CREATE TRIGGER safe_auto_create_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION safe_handle_new_user_signup();

-- 4. Create RLS policies for profile tables (if they don't exist)
-- Client profiles RLS
DROP POLICY IF EXISTS "Users can view own client profile" ON client_profiles;
DROP POLICY IF EXISTS "Users can update own client profile" ON client_profiles;
DROP POLICY IF EXISTS "Users can insert own client profile" ON client_profiles;

CREATE POLICY "Users can view own client profile" ON client_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own client profile" ON client_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own client profile" ON client_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Freelancer profiles RLS (keep the public read access for dropdown)
DROP POLICY IF EXISTS "Users can view own freelancer profile" ON freelancer_profiles;
DROP POLICY IF EXISTS "Users can update own freelancer profile" ON freelancer_profiles;
DROP POLICY IF EXISTS "Users can insert own freelancer profile" ON freelancer_profiles;

CREATE POLICY "Users can view own freelancer profile" ON freelancer_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own freelancer profile" ON freelancer_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own freelancer profile" ON freelancer_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Keep the public read access for dropdown (from previous fix)
DROP POLICY IF EXISTS "Allow public read access for dropdown" ON freelancer_profiles;
CREATE POLICY "Allow public read access for dropdown" ON freelancer_profiles
  FOR SELECT USING (true);

-- 5. Test the functions
SELECT '=== TESTING FUNCTIONS ===' as section;

-- Test ID generation
SELECT 'Client ID generation:' as test_name, safe_generate_client_id() as client_id;
SELECT 'Freelancer ID generation:' as test_name, safe_generate_freelancer_id() as freelancer_id;

-- 6. Verify trigger exists
SELECT '=== VERIFICATION ===' as section;
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'safe_auto_create_profile'
AND event_object_table = 'users'
AND event_object_schema = 'auth';

-- 7. Check RLS policies
SELECT '=== RLS POLICIES ===' as section;
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename IN ('client_profiles', 'freelancer_profiles')
ORDER BY tablename, policyname;


