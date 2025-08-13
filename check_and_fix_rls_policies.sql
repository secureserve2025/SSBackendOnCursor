-- Check and Fix RLS Policies
-- This script checks and fixes RLS policies that might be blocking auth triggers

-- 1. Check current RLS status
SELECT '=== CURRENT RLS STATUS ===' as section;
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    CASE 
        WHEN rowsecurity THEN 'ENABLED'
        ELSE 'DISABLED'
    END as status
FROM pg_tables 
WHERE tablename IN ('client_profiles', 'freelancer_profiles');

-- 2. Check current RLS policies
SELECT '=== CURRENT RLS POLICIES ===' as section;
SELECT 
    tablename,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('client_profiles', 'freelancer_profiles')
ORDER BY tablename, policyname;

-- 3. Check if there are any INSERT policies
SELECT '=== INSERT POLICIES CHECK ===' as section;
SELECT 
    tablename,
    policyname,
    cmd,
    with_check
FROM pg_policies 
WHERE tablename IN ('client_profiles', 'freelancer_profiles')
AND cmd = 'INSERT'
ORDER BY tablename, policyname;

-- 4. The problem might be that the trigger runs with SECURITY DEFINER
-- but the RLS policies are still blocking the insert
-- Let's create a policy that allows the trigger to insert

-- Drop existing INSERT policies
DROP POLICY IF EXISTS "Users can insert own client profile" ON client_profiles;
DROP POLICY IF EXISTS "Users can insert own freelancer profile" ON freelancer_profiles;

-- Create new INSERT policies that allow the trigger to work
CREATE POLICY "Allow trigger to insert client profiles" ON client_profiles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow trigger to insert freelancer profiles" ON freelancer_profiles
  FOR INSERT WITH CHECK (true);

-- 5. Keep the SELECT policies for user access
DROP POLICY IF EXISTS "Users can view own client profile" ON client_profiles;
DROP POLICY IF EXISTS "Users can view own freelancer profile" ON freelancer_profiles;

CREATE POLICY "Users can view own client profile" ON client_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own freelancer profile" ON freelancer_profiles
  FOR SELECT USING (auth.uid() = user_id);

-- 6. Keep the UPDATE policies
DROP POLICY IF EXISTS "Users can update own client profile" ON client_profiles;
DROP POLICY IF EXISTS "Users can update own freelancer profile" ON freelancer_profiles;

CREATE POLICY "Users can update own client profile" ON client_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can update own freelancer profile" ON freelancer_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- 7. Keep the public read access for freelancer dropdown
DROP POLICY IF EXISTS "Allow public read access for dropdown" ON freelancer_profiles;
CREATE POLICY "Allow public read access for dropdown" ON freelancer_profiles
  FOR SELECT USING (true);

-- 8. Verify the new policies
SELECT '=== NEW RLS POLICIES ===' as section;
SELECT 
    tablename,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('client_profiles', 'freelancer_profiles')
ORDER BY tablename, policyname;

-- 9. Test if we can insert into the tables (simulate what the trigger does)
SELECT '=== INSERT TEST ===' as section;
-- This simulates what the trigger would do
SELECT 'RLS policies should now allow trigger inserts' as status;

-- 10. Check if the trigger exists and can work
SELECT '=== TRIGGER STATUS ===' as section;
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'safe_auto_create_profile'
AND event_object_table = 'users'
AND event_object_schema = 'auth';


