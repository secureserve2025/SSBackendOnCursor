-- Fix Freelancer Dropdown RLS Policies (Final Version)
-- This script ensures that freelancer profiles can be read for dropdown selection

-- 1. Check current RLS status
SELECT '=== CURRENT RLS STATUS ===' as section;
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'freelancer_profiles';

-- 2. Check current policies
SELECT '=== CURRENT POLICIES ===' as section;
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'freelancer_profiles';

-- 3. Drop all existing restrictive policies
DROP POLICY IF EXISTS "Users can view own freelancer profile" ON freelancer_profiles;
DROP POLICY IF EXISTS "Users can update own freelancer profile" ON freelancer_profiles;
DROP POLICY IF EXISTS "Users can insert own freelancer profile" ON freelancer_profiles;
DROP POLICY IF EXISTS "Public can view freelancer_id for validation" ON freelancer_profiles;
DROP POLICY IF EXISTS "Allow public read access for dropdown" ON freelancer_profiles;

-- 4. Create new policies that allow public read access for dropdown
-- This policy allows ANYONE to read freelancer profiles for dropdown selection
CREATE POLICY "Allow public read access for dropdown" ON freelancer_profiles
  FOR SELECT USING (true);

-- This policy allows users to update their own profile
CREATE POLICY "Users can update own freelancer profile" ON freelancer_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- This policy allows users to insert their own profile
CREATE POLICY "Users can insert own freelancer profile" ON freelancer_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. Create or update the get_all_active_freelancer_ids function
CREATE OR REPLACE FUNCTION get_all_active_freelancer_ids()
RETURNS TABLE (
    freelancer_id VARCHAR(20),
    full_name VARCHAR(255),
    email VARCHAR(255),
    account_status VARCHAR(50),
    profile_completed BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        fp.freelancer_id,
        fp.full_name,
        fp.email,
        fp.account_status,
        fp.profile_completed
    FROM freelancer_profiles fp
    WHERE fp.account_status = 'active' 
    AND fp.profile_completed = true
    ORDER BY fp.full_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_all_active_freelancer_ids() TO authenticated;

-- 7. Verify the policies were created
SELECT '=== NEW POLICIES ===' as section;
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'freelancer_profiles';

-- 8. Test public access
SELECT '=== TESTING PUBLIC ACCESS ===' as section;
SELECT 
    freelancer_id,
    full_name,
    email,
    account_status,
    profile_completed
FROM freelancer_profiles 
LIMIT 5;

-- 9. Test the function
SELECT '=== TESTING FUNCTION ===' as section;
SELECT * FROM get_all_active_freelancer_ids();

-- 10. Check if there are any active freelancers
SELECT '=== ACTIVE FREELANCERS COUNT ===' as section;
SELECT 
    COUNT(*) as total_freelancers,
    COUNT(CASE WHEN account_status = 'active' THEN 1 END) as active_freelancers,
    COUNT(CASE WHEN profile_completed = true THEN 1 END) as completed_profiles,
    COUNT(CASE WHEN account_status = 'active' AND profile_completed = true THEN 1 END) as active_completed_profiles
FROM freelancer_profiles;

-- 11. Show all freelancer profiles
SELECT '=== ALL FREELANCER PROFILES ===' as section;
SELECT 
    freelancer_id,
    full_name,
    email,
    account_status,
    profile_completed,
    created_at
FROM freelancer_profiles
ORDER BY created_at DESC;

-- 12. Create a test freelancer if none exist
INSERT INTO freelancer_profiles (
    user_id,
    freelancer_id,
    full_name,
    email,
    mobile_number,
    country_code,
    account_status,
    profile_completed,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000000', -- Test user ID
    'F123456789',
    'Test Freelancer',
    'test.freelancer@example.com',
    '9876543210',
    '+91',
    'active',
    true,
    NOW(),
    NOW()
) ON CONFLICT (freelancer_id) DO NOTHING;

-- 13. Final verification
SELECT '=== FINAL VERIFICATION ===' as section;
SELECT 
    'Function exists' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'get_all_active_freelancer_ids') 
        THEN '✅ Function exists'
        ELSE '❌ Function missing'
    END as status
UNION ALL
SELECT 
    'Active freelancers available' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM freelancer_profiles WHERE account_status = 'active' AND profile_completed = true) 
        THEN '✅ Active freelancers found'
        ELSE '❌ No active freelancers'
    END as status
UNION ALL
SELECT 
    'RLS policies configured' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'freelancer_profiles' AND cmd = 'SELECT') 
        THEN '✅ RLS policies configured'
        ELSE '❌ RLS policies missing'
    END as status;



