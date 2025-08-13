-- Fix Freelancer ID Mapping Issue
-- This script fixes the issue where the projects table expects UUID freelancer IDs
-- but the frontend is sending string freelancer IDs

-- 1. First, let's check the current projects table structure
SELECT 
  'Projects Table Structure' as test_type,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'projects' 
  AND column_name IN ('client_id', 'freelancer_id')
ORDER BY column_name;

-- 2. Check the current freelancer_profiles table structure
SELECT 
  'Freelancer Profiles Structure' as test_type,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'freelancer_profiles' 
  AND column_name IN ('id', 'freelancer_id')
ORDER BY column_name;

-- 3. Drop the existing function first (to allow return type change)
DROP FUNCTION IF EXISTS get_all_active_freelancer_ids();

-- 4. Create the updated function with new return type
CREATE OR REPLACE FUNCTION get_all_active_freelancer_ids()
RETURNS TABLE (
    freelancer_id VARCHAR,  -- Keep this for backward compatibility
    full_name VARCHAR,
    email VARCHAR,
    mobile_number VARCHAR,
    id UUID  -- Add the UUID id field
) AS $$
BEGIN
    RETURN QUERY 
    SELECT 
        fp.freelancer_id,
        fp.full_name,
        fp.email,
        fp.mobile_number,
        fp.id  -- Return the UUID id
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

-- 5. Test the updated function
SELECT '=== TESTING UPDATED GET ALL FREELANCER IDS ===' as test_header;
SELECT * FROM get_all_active_freelancer_ids();

-- 6. Create a helper function to get freelancer UUID by string ID
CREATE OR REPLACE FUNCTION get_freelancer_uuid_by_string_id(freelancer_string_id VARCHAR)
RETURNS UUID AS $$
DECLARE
    freelancer_uuid UUID;
BEGIN
    SELECT id INTO freelancer_uuid
    FROM freelancer_profiles
    WHERE freelancer_id = freelancer_string_id;
    
    RETURN freelancer_uuid;
END;
$$ LANGUAGE plpgsql;

-- 7. Test the helper function
SELECT 
  'Testing helper function' as test_type,
  freelancer_id,
  get_freelancer_uuid_by_string_id(freelancer_id) as uuid_id
FROM freelancer_profiles 
WHERE account_status = 'active' 
LIMIT 3;

-- 8. Verify the RLS policies work with UUID freelancer IDs
SELECT 
  'RLS Policy Check' as test_type,
  policyname,
  cmd,
  permissive
FROM pg_policies 
WHERE tablename = 'projects' 
  AND policyname LIKE '%freelancer%';
