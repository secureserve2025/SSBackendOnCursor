-- Enforce Single Email Per Role System
-- This script ensures that one email can only be used for ONE role (either client OR freelancer, not both)

-- =============================================================================
-- PART 1: Create function to check email across both tables
-- =============================================================================

-- Function to check if email exists in any profile table
CREATE OR REPLACE FUNCTION check_email_exists_anywhere(email_to_check TEXT)
RETURNS TABLE(
    exists_in_clients BOOLEAN,
    exists_in_freelancers BOOLEAN,
    client_id TEXT,
    freelancer_id TEXT,
    user_role TEXT
) AS $$
DECLARE
    client_count INTEGER := 0;
    freelancer_count INTEGER := 0;
    found_client_id TEXT := NULL;
    found_freelancer_id TEXT := NULL;
    determined_role TEXT := NULL;
BEGIN
    -- Check in client_profiles
    SELECT COUNT(*), COALESCE(MAX(client_id), '') 
    INTO client_count, found_client_id
    FROM client_profiles 
    WHERE email = email_to_check;
    
    -- Check in freelancer_profiles  
    SELECT COUNT(*), COALESCE(MAX(freelancer_id), '')
    INTO freelancer_count, found_freelancer_id
    FROM freelancer_profiles 
    WHERE email = email_to_check;
    
    -- Determine role
    IF client_count > 0 AND freelancer_count > 0 THEN
        determined_role := 'DUPLICATE'; -- This should not happen with our constraints
    ELSIF client_count > 0 THEN
        determined_role := 'client';
    ELSIF freelancer_count > 0 THEN
        determined_role := 'freelancer';
    ELSE
        determined_role := 'none';
    END IF;
    
    RETURN QUERY SELECT 
        (client_count > 0)::BOOLEAN,
        (freelancer_count > 0)::BOOLEAN,
        found_client_id,
        found_freelancer_id,
        determined_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- PART 2: Create validation functions for signup
-- =============================================================================

-- Function to validate if email can be used for client signup
CREATE OR REPLACE FUNCTION can_signup_as_client(email_to_check TEXT)
RETURNS TABLE(
    can_signup BOOLEAN,
    error_message TEXT
) AS $$
DECLARE
    email_check RECORD;
BEGIN
    -- Check email status
    SELECT * INTO email_check FROM check_email_exists_anywhere(email_to_check);
    
    IF email_check.user_role = 'none' THEN
        -- Email not used, can signup as client
        RETURN QUERY SELECT TRUE, ''::TEXT;
    ELSIF email_check.user_role = 'client' THEN
        -- Email already used for client
        RETURN QUERY SELECT FALSE, 'This email is already registered as a client. Please sign in instead.'::TEXT;
    ELSIF email_check.user_role = 'freelancer' THEN
        -- Email already used for freelancer
        RETURN QUERY SELECT FALSE, 'This email is already registered as a freelancer. You cannot use the same email for a client account.'::TEXT;
    ELSE
        -- Duplicate or unknown state
        RETURN QUERY SELECT FALSE, 'Email validation error. Please contact support.'::TEXT;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate if email can be used for freelancer signup
CREATE OR REPLACE FUNCTION can_signup_as_freelancer(email_to_check TEXT)
RETURNS TABLE(
    can_signup BOOLEAN,
    error_message TEXT
) AS $$
DECLARE
    email_check RECORD;
BEGIN
    -- Check email status
    SELECT * INTO email_check FROM check_email_exists_anywhere(email_to_check);
    
    IF email_check.user_role = 'none' THEN
        -- Email not used, can signup as freelancer
        RETURN QUERY SELECT TRUE, ''::TEXT;
    ELSIF email_check.user_role = 'freelancer' THEN
        -- Email already used for freelancer
        RETURN QUERY SELECT FALSE, 'This email is already registered as a freelancer. Please sign in instead.'::TEXT;
    ELSIF email_check.user_role = 'client' THEN
        -- Email already used for client
        RETURN QUERY SELECT FALSE, 'This email is already registered as a client. You cannot use the same email for a freelancer account.'::TEXT;
    ELSE
        -- Duplicate or unknown state
        RETURN QUERY SELECT FALSE, 'Email validation error. Please contact support.'::TEXT;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- PART 3: Create constraints to prevent dual email usage at database level
-- =============================================================================

-- Function to check email uniqueness across both tables (for triggers)
CREATE OR REPLACE FUNCTION ensure_email_unique_across_tables()
RETURNS TRIGGER AS $$
DECLARE
    email_check RECORD;
    target_table TEXT;
    target_role TEXT;
BEGIN
    -- Determine which table triggered this
    target_table := TG_TABLE_NAME;
    
    IF target_table = 'client_profiles' THEN
        target_role := 'client';
    ELSIF target_table = 'freelancer_profiles' THEN
        target_role := 'freelancer';
    ELSE
        RAISE EXCEPTION 'Unknown table for email uniqueness check: %', target_table;
    END IF;
    
    -- Check if email exists anywhere
    SELECT * INTO email_check FROM check_email_exists_anywhere(NEW.email);
    
    -- For INSERT operations
    IF TG_OP = 'INSERT' THEN
        IF target_role = 'client' AND email_check.exists_in_freelancers THEN
            RAISE EXCEPTION 'Email % is already registered as a freelancer. Cannot create client account with same email.', NEW.email;
        ELSIF target_role = 'freelancer' AND email_check.exists_in_clients THEN
            RAISE EXCEPTION 'Email % is already registered as a client. Cannot create freelancer account with same email.', NEW.email;
        END IF;
    END IF;
    
    -- For UPDATE operations (changing email)
    IF TG_OP = 'UPDATE' AND OLD.email != NEW.email THEN
        IF target_role = 'client' AND email_check.exists_in_freelancers THEN
            RAISE EXCEPTION 'Email % is already registered as a freelancer. Cannot update client email to this address.', NEW.email;
        ELSIF target_role = 'freelancer' AND email_check.exists_in_clients THEN
            RAISE EXCEPTION 'Email % is already registered as a client. Cannot update freelancer email to this address.', NEW.email;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to enforce email uniqueness
DROP TRIGGER IF EXISTS ensure_client_email_unique ON client_profiles;
CREATE TRIGGER ensure_client_email_unique
    BEFORE INSERT OR UPDATE ON client_profiles
    FOR EACH ROW
    EXECUTE FUNCTION ensure_email_unique_across_tables();

DROP TRIGGER IF EXISTS ensure_freelancer_email_unique ON freelancer_profiles;
CREATE TRIGGER ensure_freelancer_email_unique
    BEFORE INSERT OR UPDATE ON freelancer_profiles
    FOR EACH ROW
    EXECUTE FUNCTION ensure_email_unique_across_tables();

-- =============================================================================
-- PART 4: Update profile creation functions (remove dual role logic)
-- =============================================================================

-- Clean freelancer creation function
CREATE OR REPLACE FUNCTION handle_new_freelancer()
RETURNS TRIGGER AS $$
DECLARE
    new_freelancer_id TEXT;
    ist_timestamp TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Only create freelancer profile if user_type is freelancer
    IF NEW.raw_user_meta_data->>'user_type' = 'freelancer' THEN
        -- Generate unique freelancer_id
        new_freelancer_id := generate_freelancer_id();
        ist_timestamp := NOW() AT TIME ZONE 'Asia/Kolkata';
        
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
            NEW.id, 
            new_freelancer_id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
            ist_timestamp,
            ist_timestamp
        );
        
        RAISE NOTICE 'Created freelancer profile: %', new_freelancer_id;
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error creating freelancer profile: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Clean client creation function
CREATE OR REPLACE FUNCTION handle_new_client()
RETURNS TRIGGER AS $$
DECLARE
    new_client_id TEXT;
    ist_timestamp TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Only create client profile if user_type is client
    IF NEW.raw_user_meta_data->>'user_type' = 'client' THEN
        -- Generate unique client_id
        new_client_id := generate_client_id();
        ist_timestamp := NOW() AT TIME ZONE 'Asia/Kolkata';
        
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
            NEW.id, 
            new_client_id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
            ist_timestamp,
            ist_timestamp
        );
        
        RAISE NOTICE 'Created client profile: %', new_client_id;
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error creating client profile: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate triggers
DROP TRIGGER IF EXISTS on_auth_user_created_freelancer ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_client ON auth.users;

CREATE TRIGGER on_auth_user_created_freelancer
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION handle_new_freelancer();

CREATE TRIGGER on_auth_user_created_client
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION handle_new_client();

-- =============================================================================
-- PART 5: Create view to monitor email usage
-- =============================================================================

-- View to see all email usage across tables
CREATE OR REPLACE VIEW email_usage_summary AS
SELECT 
    COALESCE(c.email, f.email) as email,
    c.client_id,
    c.full_name as client_name,
    c.created_at as client_created_at,
    f.freelancer_id,
    f.full_name as freelancer_name,
    f.created_at as freelancer_created_at,
    CASE 
        WHEN c.email IS NOT NULL AND f.email IS NOT NULL THEN 'DUPLICATE_EMAIL'
        WHEN c.email IS NOT NULL THEN 'CLIENT_ONLY'
        WHEN f.email IS NOT NULL THEN 'FREELANCER_ONLY'
        ELSE 'NO_PROFILE'
    END as email_status
FROM client_profiles c
FULL OUTER JOIN freelancer_profiles f ON c.email = f.email
ORDER BY COALESCE(c.created_at, f.created_at) DESC;

-- =============================================================================
-- PART 6: Clean up any existing duplicate emails (if any)
-- =============================================================================

-- Function to identify and report duplicate emails
CREATE OR REPLACE FUNCTION find_duplicate_emails()
RETURNS TABLE(
    email TEXT,
    client_id TEXT,
    freelancer_id TEXT,
    issue_description TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(c.email, f.email) as email,
        c.client_id,
        f.freelancer_id,
        'Email exists in both client and freelancer tables' as issue_description
    FROM client_profiles c
    INNER JOIN freelancer_profiles f ON c.email = f.email;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Test email validation functions
SELECT 'Testing email validation functions' as test_section;

-- Test case 1: New email
SELECT 'Test 1: New email' as test_case, * FROM can_signup_as_client('new@test.com');
SELECT 'Test 1: New email' as test_case, * FROM can_signup_as_freelancer('new@test.com');

-- Show all functions created
SELECT 
    'Single Email Role Functions Created' as info,
    routine_name
FROM information_schema.routines 
WHERE routine_name IN (
    'check_email_exists_anywhere',
    'can_signup_as_client', 
    'can_signup_as_freelancer',
    'ensure_email_unique_across_tables',
    'find_duplicate_emails'
)
ORDER BY routine_name;

-- Show triggers
SELECT 
    'Email Uniqueness Triggers' as info,
    trigger_name,
    event_manipulation,
    event_object_table
FROM information_schema.triggers 
WHERE trigger_name LIKE '%email_unique%'
ORDER BY trigger_name;

-- Check for any existing duplicate emails
SELECT 'Checking for existing duplicate emails' as check_section;
SELECT * FROM find_duplicate_emails();

-- Show email usage summary
SELECT 'Current email usage summary' as summary_section;
SELECT * FROM email_usage_summary LIMIT 10;

SELECT 'SUCCESS: Single email per role system is enforced!' as status;




