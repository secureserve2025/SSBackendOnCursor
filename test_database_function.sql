-- Test why the database function is returning empty results

-- Test 1: Check if the function exists
SELECT 'Test 1: Check if function exists' as test_name;
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name = 'get_all_active_freelancer_ids';

-- Test 2: Call the function directly
SELECT 'Test 2: Call function directly' as test_name;
SELECT * FROM get_all_active_freelancer_ids();

-- Test 3: Check the raw data in freelancer_profiles
SELECT 'Test 3: Check raw data' as test_name;
SELECT 
    freelancer_id,
    full_name,
    email,
    mobile_number,
    upi_id,
    aadhar_number,
    profile_completed,
    account_status
FROM freelancer_profiles 
WHERE freelancer_id = 'F308208874';

-- Test 4: Test the exact query from the function
SELECT 'Test 4: Test exact function query' as test_name;
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

-- Test 5: Check each condition separately
SELECT 'Test 5: Check conditions separately' as test_name;
SELECT 
    freelancer_id,
    account_status = 'active' as is_active,
    profile_completed = true as is_profile_completed,
    full_name IS NOT NULL AND LENGTH(TRIM(full_name)) > 0 as has_name,
    email IS NOT NULL AND LENGTH(TRIM(email)) > 0 as has_email,
    mobile_number IS NOT NULL AND LENGTH(TRIM(mobile_number)) > 0 as has_mobile,
    upi_id IS NOT NULL AND LENGTH(TRIM(upi_id)) > 0 as has_upi,
    aadhar_number IS NOT NULL AND LENGTH(TRIM(aadhar_number)) > 0 as has_aadhar
FROM freelancer_profiles 
WHERE freelancer_id = 'F308208874';


