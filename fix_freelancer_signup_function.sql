-- Fix Freelancer Signup Function
-- This script creates the missing can_register_as_freelancer function

-- 1. First, create the email validation function
CREATE OR REPLACE FUNCTION is_valid_email_format(email_to_check TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Basic email format validation
    RETURN email_to_check ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$ LANGUAGE plpgsql;

-- 2. Create the email usage check function
CREATE OR REPLACE FUNCTION check_email_usage(email_to_check TEXT)
RETURNS TABLE(
    usage_status TEXT,
    used_as_client BOOLEAN,
    used_as_freelancer BOOLEAN
) AS $$
DECLARE
    client_count INTEGER;
    freelancer_count INTEGER;
BEGIN
    -- Count email usage in client_profiles
    SELECT COUNT(*) INTO client_count
    FROM client_profiles
    WHERE email = email_to_check;
    
    -- Count email usage in freelancer_profiles
    SELECT COUNT(*) INTO freelancer_count
    FROM freelancer_profiles
    WHERE email = email_to_check;
    
    -- Determine usage status
    IF client_count = 0 AND freelancer_count = 0 THEN
        RETURN QUERY SELECT 'AVAILABLE'::TEXT, FALSE::BOOLEAN, FALSE::BOOLEAN;
    ELSIF client_count > 0 AND freelancer_count = 0 THEN
        RETURN QUERY SELECT 'CLIENT_ONLY'::TEXT, TRUE::BOOLEAN, FALSE::BOOLEAN;
    ELSIF client_count = 0 AND freelancer_count > 0 THEN
        RETURN QUERY SELECT 'FREELANCER_ONLY'::TEXT, FALSE::BOOLEAN, TRUE::BOOLEAN;
    ELSE
        RETURN QUERY SELECT 'DUPLICATE'::TEXT, TRUE::BOOLEAN, TRUE::BOOLEAN;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create the freelancer registration check function
CREATE OR REPLACE FUNCTION can_register_as_freelancer(email_to_check TEXT)
RETURNS TABLE(
    allowed BOOLEAN,
    reason TEXT
) AS $$
DECLARE
    email_info RECORD;
BEGIN
    -- Validate email format first
    IF NOT is_valid_email_format(email_to_check) THEN
        RETURN QUERY SELECT FALSE, 'Invalid email format. Please enter a valid email address.'::TEXT;
        RETURN;
    END IF;
    
    -- Check email usage
    SELECT * INTO email_info FROM check_email_usage(email_to_check);
    
    CASE email_info.usage_status
        WHEN 'AVAILABLE' THEN
            RETURN QUERY SELECT TRUE, 'Email available for freelancer registration'::TEXT;
        WHEN 'FREELANCER_ONLY' THEN
            RETURN QUERY SELECT FALSE, 'This email is already registered as a freelancer. Please sign in instead.'::TEXT;
        WHEN 'CLIENT_ONLY' THEN
            RETURN QUERY SELECT FALSE, 'This email is already registered as a client. You cannot use the same email for a freelancer account.'::TEXT;
        WHEN 'DUPLICATE' THEN
            RETURN QUERY SELECT FALSE, 'Email usage error. Please contact support.'::TEXT;
        ELSE
            RETURN QUERY SELECT FALSE, 'Email validation error. Please try again.'::TEXT;
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create the client registration check function (for completeness)
CREATE OR REPLACE FUNCTION can_register_as_client(email_to_check TEXT)
RETURNS TABLE(
    allowed BOOLEAN,
    reason TEXT
) AS $$
DECLARE
    email_info RECORD;
BEGIN
    -- Validate email format first
    IF NOT is_valid_email_format(email_to_check) THEN
        RETURN QUERY SELECT FALSE, 'Invalid email format. Please enter a valid email address.'::TEXT;
        RETURN;
    END IF;
    
    -- Check email usage
    SELECT * INTO email_info FROM check_email_usage(email_to_check);
    
    CASE email_info.usage_status
        WHEN 'AVAILABLE' THEN
            RETURN QUERY SELECT TRUE, 'Email available for client registration'::TEXT;
        WHEN 'CLIENT_ONLY' THEN
            RETURN QUERY SELECT FALSE, 'This email is already registered as a client. Please sign in instead.'::TEXT;
        WHEN 'FREELANCER_ONLY' THEN
            RETURN QUERY SELECT FALSE, 'This email is already registered as a freelancer. You cannot use the same email for a client account.'::TEXT;
        WHEN 'DUPLICATE' THEN
            RETURN QUERY SELECT FALSE, 'Email usage error. Please contact support.'::TEXT;
        ELSE
            RETURN QUERY SELECT FALSE, 'Email validation error. Please try again.'::TEXT;
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Test the functions
SELECT '=== TESTING FUNCTIONS ===' as section;

-- Test email format validation
SELECT 'Email format test:' as test_name, is_valid_email_format('test@example.com') as is_valid;

-- Test email usage check
SELECT 'Email usage test:' as test_name, * FROM check_email_usage('test@example.com');

-- Test freelancer registration check
SELECT 'Freelancer registration test:' as test_name, * FROM can_register_as_freelancer('test@example.com');

-- Test client registration check
SELECT 'Client registration test:' as test_name, * FROM can_register_as_client('test@example.com');

-- 6. Verify functions exist
SELECT '=== VERIFICATION ===' as section;
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('can_register_as_freelancer', 'can_register_as_client', 'check_email_usage', 'is_valid_email_format')
ORDER BY routine_name;


