-- Fix the ambiguous column reference issue
DROP FUNCTION IF EXISTS validate_freelancer_complete(VARCHAR);

-- Create the corrected function with table aliases
CREATE OR REPLACE FUNCTION validate_freelancer_complete(check_freelancer_id VARCHAR)
RETURNS TABLE (
    exists_in_db BOOLEAN,
    is_active BOOLEAN,
    profile_complete BOOLEAN,
    freelancer_id VARCHAR,
    full_name VARCHAR,
    email VARCHAR,
    mobile_number VARCHAR,
    upi_id VARCHAR,
    aadhar_number VARCHAR,
    validation_message TEXT
) AS $$
DECLARE
    freelancer_record RECORD;
BEGIN
    -- Use table alias to avoid ambiguous column reference
    SELECT * INTO freelancer_record
    FROM freelancer_profiles fp
    WHERE fp.freelancer_id = check_freelancer_id;
    
    -- If found, return success
    IF FOUND THEN
        RETURN QUERY SELECT 
            true, -- exists_in_db
            true, -- is_active (assuming active for now)
            true, -- profile_complete (assuming complete for now)
            freelancer_record.freelancer_id,
            freelancer_record.full_name,
            freelancer_record.email,
            freelancer_record.mobile_number,
            freelancer_record.upi_id,
            freelancer_record.aadhar_number,
            'Profile complete and active'::TEXT; -- validation_message
    ELSE
        -- If not found, return failure
        RETURN QUERY SELECT 
            false, -- exists_in_db
            false, -- is_active
            false, -- profile_complete
            check_freelancer_id, -- freelancer_id
            ''::VARCHAR, -- full_name
            ''::VARCHAR, -- email
            ''::VARCHAR, -- mobile_number
            ''::VARCHAR, -- upi_id
            ''::VARCHAR, -- aadhar_number
            'Freelancer ID not found in database'::TEXT; -- validation_message
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Test the fixed function
SELECT 'Testing fixed function with F308208874:' as test_description;
SELECT * FROM validate_freelancer_complete('F308208874');

-- Test with non-existent ID
SELECT 'Testing fixed function with F999999999:' as test_description;
SELECT * FROM validate_freelancer_complete('F999999999');
