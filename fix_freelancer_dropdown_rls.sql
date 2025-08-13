-- Fix RLS Policies for Freelancer Dropdown
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

-- 3. Drop all existing policies
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

-- 5. Verify the policies were created
SELECT '=== NEW POLICIES ===' as section;
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'freelancer_profiles';

-- 6. Test public access
SELECT '=== TESTING PUBLIC ACCESS ===' as section;
SELECT 
    freelancer_id,
    full_name,
    email,
    account_status,
    profile_completed
FROM freelancer_profiles 
LIMIT 5;

-- 7. Test the function
SELECT '=== TESTING FUNCTION ===' as section;
SELECT * FROM get_all_active_freelancer_ids();

-- 8. Check if there are any active freelancers
SELECT '=== ACTIVE FREELANCERS COUNT ===' as section;
SELECT 
    COUNT(*) as total_freelancers,
    COUNT(CASE WHEN account_status = 'active' THEN 1 END) as active_freelancers,
    COUNT(CASE WHEN profile_completed = true THEN 1 END) as completed_profiles,
    COUNT(CASE WHEN account_status = 'active' AND profile_completed = true THEN 1 END) as active_completed_profiles
FROM freelancer_profiles;

-- 9. Show all freelancer profiles
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


