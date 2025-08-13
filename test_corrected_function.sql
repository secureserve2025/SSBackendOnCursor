-- Test the corrected validation function
-- First, let's run the corrected function
DROP FUNCTION IF EXISTS validate_freelancer_complete(VARCHAR);

-- Create the corrected function
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
    missing_fields TEXT := '';
    validation_msg TEXT;
BEGIN
    -- Check if freelancer exists
    SELECT * INTO freelancer_record
    FROM freelancer_profiles fp
    WHERE fp.freelancer_id = check_freelancer_id;
    
    -- Return if freelancer doesn't exist
    IF NOT FOUND THEN
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
        RETURN;
    END IF;
    
    -- Check account status
    IF freelancer_record.account_status != 'active' THEN
        RETURN QUERY SELECT 
            true, -- exists_in_db
            false, -- is_active
            false, -- profile_complete
            freelancer_record.freelancer_id,
            freelancer_record.full_name,
            freelancer_record.email,
            freelancer_record.mobile_number,
            freelancer_record.upi_id,
            freelancer_record.aadhar_number,
            'Freelancer account is not active'::TEXT; -- validation_message
        RETURN;
    END IF;
    
    -- Check profile completeness
    IF freelancer_record.full_name IS NULL OR LENGTH(TRIM(freelancer_record.full_name)) = 0 THEN
        missing_fields := 'full_name';
    END IF;
    
    IF freelancer_record.email IS NULL OR LENGTH(TRIM(freelancer_record.email)) = 0 THEN
        IF missing_fields != '' THEN
            missing_fields := missing_fields || ', ';
        END IF;
        missing_fields := missing_fields || 'email';
    END IF;
    
    IF freelancer_record.mobile_number IS NULL OR LENGTH(TRIM(freelancer_record.mobile_number)) = 0 THEN
        IF missing_fields != '' THEN
            missing_fields := missing_fields || ', ';
        END IF;
        missing_fields := missing_fields || 'mobile_number';
    END IF;
    
    IF freelancer_record.upi_id IS NULL OR LENGTH(TRIM(freelancer_record.upi_id)) = 0 THEN
        IF missing_fields != '' THEN
            missing_fields := missing_fields || ', ';
        END IF;
        missing_fields := missing_fields || 'upi_id';
    END IF;
    
    IF freelancer_record.aadhar_number IS NULL OR LENGTH(TRIM(freelancer_record.aadhar_number)) = 0 THEN
        IF missing_fields != '' THEN
            missing_fields := missing_fields || ', ';
        END IF;
        missing_fields := missing_fields || 'aadhar_number';
    END IF;
    
    -- Build validation message
    IF missing_fields != '' THEN
        validation_msg := 'Incomplete profile. Missing: ' || missing_fields;
    ELSE
        validation_msg := 'Profile complete and active';
    END IF;
    
    -- Return validation result
    RETURN QUERY SELECT 
        true, -- exists_in_db
        true, -- is_active
        (missing_fields = '' AND freelancer_record.profile_completed = true), -- profile_complete
        freelancer_record.freelancer_id,
        freelancer_record.full_name,
        freelancer_record.email,
        freelancer_record.mobile_number,
        freelancer_record.upi_id,
        freelancer_record.aadhar_number,
        validation_msg::TEXT; -- validation_message
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Now test the function with the existing freelancer ID
SELECT 'Testing validate_freelancer_complete with F308208874:' as test_description;
SELECT * FROM validate_freelancer_complete('F308208874');

-- Also test with a non-existent ID
SELECT 'Testing with non-existent ID F999999999:' as test_description;
SELECT * FROM validate_freelancer_complete('F999999999');
