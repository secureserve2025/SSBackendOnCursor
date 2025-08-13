-- Function to get all active freelancer IDs for dropdown selection
-- This will return only active freelancers with complete profiles

CREATE OR REPLACE FUNCTION get_all_active_freelancer_ids()
RETURNS TABLE (
    freelancer_id VARCHAR,
    full_name VARCHAR,
    email VARCHAR,
    mobile_number VARCHAR
) AS $$
BEGIN
    RETURN QUERY 
    SELECT 
        fp.freelancer_id,
        fp.full_name,
        fp.email,
        fp.mobile_number
    FROM freelancer_profiles fp
    WHERE fp.account_status = 'active'
      AND fp.profile_completed = true
      AND fp.full_name IS NOT NULL 
      AND LENGTH(TRIM(fp.full_name)) > 0
      AND fp.email IS NOT NULL 
      AND LENGTH(TRIM(fp.email)) > 0
      AND fp.mobile_number IS NOT NULL 
      AND LENGTH(TRIM(fp.mobile_number)) > 0
      AND fp.upi_id IS NOT NULL 
      AND LENGTH(TRIM(fp.upi_id)) > 0
      AND fp.aadhar_number IS NOT NULL 
      AND LENGTH(TRIM(fp.aadhar_number)) > 0
    ORDER BY fp.full_name ASC;
END;
$$ LANGUAGE plpgsql;

-- Test the function
SELECT '=== TESTING GET ALL FREELANCER IDS ===' as test_header;
SELECT * FROM get_all_active_freelancer_ids();
