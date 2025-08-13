-- Debug the validation function step by step
-- Let's test each part of the function separately

-- 1. First, let's verify the freelancer exists
SELECT 'Step 1: Direct query to check if freelancer exists' as debug_step;
SELECT 
    freelancer_id,
    full_name,
    email,
    account_status,
    profile_completed,
    mobile_number,
    upi_id,
    aadhar_number
FROM freelancer_profiles 
WHERE freelancer_id = 'F308208874';

-- 2. Test the function with explicit debugging
SELECT 'Step 2: Testing function with F308208874' as debug_step;
SELECT * FROM validate_freelancer_complete('F308208874');

-- 3. Let's create a simpler test function to debug
DROP FUNCTION IF EXISTS debug_freelancer_lookup(VARCHAR);

CREATE OR REPLACE FUNCTION debug_freelancer_lookup(check_freelancer_id VARCHAR)
RETURNS TABLE (
    found_record BOOLEAN,
    freelancer_id VARCHAR,
    full_name VARCHAR,
    account_status VARCHAR,
    profile_completed BOOLEAN
) AS $$
DECLARE
    freelancer_record RECORD;
BEGIN
    -- Try to find the freelancer
    SELECT * INTO freelancer_record
    FROM freelancer_profiles fp
    WHERE fp.freelancer_id = check_freelancer_id;
    
    -- Check if found
    IF FOUND THEN
        RETURN QUERY SELECT 
            true,
            freelancer_record.freelancer_id,
            freelancer_record.full_name,
            freelancer_record.account_status,
            freelancer_record.profile_completed;
    ELSE
        RETURN QUERY SELECT 
            false,
            check_freelancer_id,
            ''::VARCHAR,
            ''::VARCHAR,
            false;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 4. Test the debug function
SELECT 'Step 3: Testing debug function' as debug_step;
SELECT * FROM debug_freelancer_lookup('F308208874');

-- 5. Test with a different approach - direct function call
SELECT 'Step 4: Direct function call test' as debug_step;
SELECT 
    'F308208874' as input_id,
    (SELECT COUNT(*) FROM freelancer_profiles WHERE freelancer_id = 'F308208874') as count_found,
    (SELECT freelancer_id FROM freelancer_profiles WHERE freelancer_id = 'F308208874' LIMIT 1) as found_id;
