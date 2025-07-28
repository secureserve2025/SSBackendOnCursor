-- Fix RLS Policies for Freelancer ID Validation
-- This script ensures that freelancer profiles can be read for validation purposes

-- 1. First, let's see what policies currently exist
SELECT 
  policyname, 
  cmd, 
  qual 
FROM pg_policies 
WHERE tablename = 'freelancer_profiles';

-- 2. Drop all existing policies
DROP POLICY IF EXISTS "Users can view own freelancer profile" ON freelancer_profiles;
DROP POLICY IF EXISTS "Users can update own freelancer profile" ON freelancer_profiles;
DROP POLICY IF EXISTS "Users can insert own freelancer profile" ON freelancer_profiles;
DROP POLICY IF EXISTS "Public can view freelancer_id for validation" ON freelancer_profiles;

-- 3. Create new policies that allow public read access for validation
-- This policy allows ANYONE to read freelancer_id, full_name, and email for validation
CREATE POLICY "Public can view freelancer_id for validation" ON freelancer_profiles
  FOR SELECT USING (true);

-- This policy allows users to update their own profile
CREATE POLICY "Users can update own freelancer profile" ON freelancer_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- This policy allows users to insert their own profile
CREATE POLICY "Users can insert own freelancer profile" ON freelancer_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Verify the policies were created
SELECT 
  policyname, 
  cmd, 
  qual 
FROM pg_policies 
WHERE tablename = 'freelancer_profiles';

-- 5. Test the public access
-- This should now work and return your real freelancer profile
SELECT freelancer_id, full_name, email 
FROM freelancer_profiles 
WHERE freelancer_id = 'F214000319';

-- 6. List all freelancer profiles (should show your real profile)
SELECT freelancer_id, full_name, email 
FROM freelancer_profiles 
ORDER BY created_at DESC;

-- 7. Test that the table is accessible
SELECT 'Table is accessible with public read access' as status 
WHERE EXISTS (SELECT 1 FROM freelancer_profiles LIMIT 1); 