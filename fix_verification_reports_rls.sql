-- Fix RLS Policies for verification_reports table
-- This script ensures that users can create verification reports for their projects

-- 1. First, let's see what policies currently exist
SELECT 
  policyname, 
  cmd, 
  qual 
FROM pg_policies 
WHERE tablename = 'verification_reports';

-- 2. Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view verification reports for their projects" ON verification_reports;
DROP POLICY IF EXISTS "Users can create verification reports for their projects" ON verification_reports;
DROP POLICY IF EXISTS "Users can update verification reports for their projects" ON verification_reports;

-- 3. Create new policies that properly handle the user relationships
-- Policy for viewing verification reports
CREATE POLICY "Users can view verification reports for their projects" ON verification_reports
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM projects WHERE 
        client_id IN (SELECT user_id FROM client_profiles WHERE user_id = auth.uid())
        OR freelancer_id IN (SELECT freelancer_id FROM freelancer_profiles WHERE user_id = auth.uid())
    )
  );

-- Policy for creating verification reports (this is the one causing the issue)
CREATE POLICY "Users can create verification reports for their projects" ON verification_reports
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE 
        client_id IN (SELECT user_id FROM client_profiles WHERE user_id = auth.uid())
        OR freelancer_id IN (SELECT freelancer_id FROM freelancer_profiles WHERE user_id = auth.uid())
    )
  );

-- Policy for updating verification reports
CREATE POLICY "Users can update verification reports for their projects" ON verification_reports
  FOR UPDATE USING (
    project_id IN (
      SELECT id FROM projects WHERE 
        client_id IN (SELECT user_id FROM client_profiles WHERE user_id = auth.uid())
        OR freelancer_id IN (SELECT freelancer_id FROM freelancer_profiles WHERE user_id = auth.uid())
    )
  );

-- 4. Verify the policies were created
SELECT 
  policyname, 
  cmd, 
  qual 
FROM pg_policies 
WHERE tablename = 'verification_reports'
ORDER BY policyname;

-- 5. Test the policies by checking if a user can access their projects
-- This will help verify the policy logic
SELECT 
  'Current user projects' as test_type,
  COUNT(*) as project_count
FROM projects 
WHERE client_id IN (SELECT user_id FROM client_profiles WHERE user_id = auth.uid())
   OR freelancer_id IN (SELECT freelancer_id FROM freelancer_profiles WHERE user_id = auth.uid());

-- 6. Show the verification_reports table structure for reference
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'verification_reports' 
AND table_schema = 'public'
ORDER BY ordinal_position;
