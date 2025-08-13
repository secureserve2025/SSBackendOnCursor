-- Fix freelancer validation function to handle both UUID and string formats
-- This script updates the validate_freelancer_complete function

-- 1. Drop the existing function
DROP FUNCTION IF EXISTS validate_freelancer_complete(VARCHAR);

-- 2. Create the updated function that can handle both formats
CREATE OR REPLACE FUNCTION validate_freelancer_complete(
    check_freelancer_id VARCHAR DEFAULT NULL,
    check_freelancer_uuid UUID DEFAULT NULL
)
RETURNS TABLE (
    freelancer_id VARCHAR,
    full_name VARCHAR,
    email VARCHAR,
    mobile_number VARCHAR,
    upi_id VARCHAR,
    aadhar_number VARCHAR,
    exists_in_db BOOLEAN,
    is_active BOOLEAN,
    profile_complete BOOLEAN,
    validation_message TEXT
) AS $$
DECLARE
    freelancer_record RECORD;
    missing_fields TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- Determine which parameter to use for lookup
    IF check_freelancer_uuid IS NOT NULL THEN
        -- Look up by UUID (new system)
        SELECT 
            fp.freelancer_id,
            fp.full_name,
            fp.email,
            fp.mobile_number,
            fp.upi_id,
            fp.aadhar_number,
            fp.is_active,
            fp.profile_completed
        INTO freelancer_record
        FROM freelancer_profiles fp
        WHERE fp.id = check_freelancer_uuid;
    ELSIF check_freelancer_id IS NOT NULL THEN
        -- Look up by freelancer_id (old system)
        SELECT 
            fp.freelancer_id,
            fp.full_name,
            fp.email,
            fp.mobile_number,
            fp.upi_id,
            fp.aadhar_number,
            fp.is_active,
            fp.profile_completed
        INTO freelancer_record
        FROM freelancer_profiles fp
        WHERE fp.freelancer_id = check_freelancer_id;
    ELSE
        -- No valid parameter provided
        RETURN QUERY SELECT 
            NULL::VARCHAR as freelancer_id,
            NULL::VARCHAR as full_name,
            NULL::VARCHAR as email,
            NULL::VARCHAR as mobile_number,
            NULL::VARCHAR as upi_id,
            NULL::VARCHAR as aadhar_number,
            FALSE as exists_in_db,
            FALSE as is_active,
            FALSE as profile_complete,
            'No freelancer ID or UUID provided'::TEXT as validation_message;
        RETURN;
    END IF;

    -- Check if freelancer exists
    IF freelancer_record IS NULL THEN
        RETURN QUERY SELECT 
            NULL::VARCHAR as freelancer_id,
            NULL::VARCHAR as full_name,
            NULL::VARCHAR as email,
            NULL::VARCHAR as mobile_number,
            NULL::VARCHAR as upi_id,
            NULL::VARCHAR as aadhar_number,
            FALSE as exists_in_db,
            FALSE as is_active,
            FALSE as profile_complete,
            'Freelancer not found'::TEXT as validation_message;
        RETURN;
    END IF;

    -- Check profile completeness
    IF freelancer_record.full_name IS NULL OR freelancer_record.full_name = '' THEN
        missing_fields := array_append(missing_fields, 'Full Name');
    END IF;
    
    IF freelancer_record.email IS NULL OR freelancer_record.email = '' THEN
        missing_fields := array_append(missing_fields, 'Email');
    END IF;
    
    IF freelancer_record.mobile_number IS NULL OR freelancer_record.mobile_number = '' THEN
        missing_fields := array_append(missing_fields, 'Mobile Number');
    END IF;
    
    IF freelancer_record.upi_id IS NULL OR freelancer_record.upi_id = '' THEN
        missing_fields := array_append(missing_fields, 'UPI ID');
    END IF;
    
    IF freelancer_record.aadhar_number IS NULL OR freelancer_record.aadhar_number = '' THEN
        missing_fields := array_append(missing_fields, 'Aadhar Number');
    END IF;

    -- Return the result
    RETURN QUERY SELECT 
        freelancer_record.freelancer_id,
        freelancer_record.full_name,
        freelancer_record.email,
        freelancer_record.mobile_number,
        freelancer_record.upi_id,
        freelancer_record.aadhar_number,
        TRUE as exists_in_db,
        COALESCE(freelancer_record.is_active, FALSE) as is_active,
        COALESCE(freelancer_record.profile_completed, FALSE) as profile_complete,
        CASE 
            WHEN array_length(missing_fields, 1) > 0 THEN 
                'Profile incomplete. Missing: ' || array_to_string(missing_fields, ', ')
            ELSE 
                'Profile is complete'
        END::TEXT as validation_message;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Test the function with both formats
-- Test with UUID format (replace with actual UUID from your database)
-- SELECT * FROM validate_freelancer_complete(check_freelancer_uuid := '480c4d90-d585-4469-b8d4-14dee52b507d'::UUID);

-- Test with string format
-- SELECT * FROM validate_freelancer_complete(check_freelancer_id := 'F278645820');

-- 4. Verify the function was created
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name = 'validate_freelancer_complete';
