-- Fix RLS Policies for Freelancer ID Validation
-- This script adds a policy to allow public read access to freelancer_id for validation purposes

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own freelancer profile" ON freelancer_profiles;
DROP POLICY IF EXISTS "Users can update own freelancer profile" ON freelancer_profiles;
DROP POLICY IF EXISTS "Users can insert own freelancer profile" ON freelancer_profiles;

-- Create new policies that allow public read access for validation
CREATE POLICY "Public can view freelancer_id for validation" ON freelancer_profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own freelancer profile" ON freelancer_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own freelancer profile" ON freelancer_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Also fix client profiles policies
DROP POLICY IF EXISTS "Users can view own client profile" ON client_profiles;
DROP POLICY IF EXISTS "Users can update own client profile" ON client_profiles;
DROP POLICY IF EXISTS "Users can insert own client profile" ON client_profiles;

CREATE POLICY "Public can view client_id for validation" ON client_profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own client profile" ON client_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own client profile" ON client_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Test query to verify the fix works
-- SELECT freelancer_id, full_name FROM freelancer_profiles LIMIT 5; 