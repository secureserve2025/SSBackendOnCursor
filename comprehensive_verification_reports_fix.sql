-- Comprehensive fix for verification_reports RLS policies
-- This addresses the "new row violates row-level security policy" error for production deployment

-- 1. First, let's check the current state
SELECT 'Current RLS policies for verification_reports:' as info;
SELECT 
  policyname, 
  cmd, 
  qual 
FROM pg_policies 
WHERE tablename = 'verification_reports'
ORDER BY policyname;

-- 2. Check if the table exists and has RLS enabled
SELECT 'Table status:' as info;
SELECT 
  schemaname,
  tablename,
  rowsecurity,
  hasindexes,
  hasrules
FROM pg_tables 
WHERE tablename = 'verification_reports';

-- 3. Check table structure
SELECT 'Table structure:' as info;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'verification_reports' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view verification reports for their projects" ON verification_reports;
DROP POLICY IF EXISTS "Users can create verification reports for their projects" ON verification_reports;
DROP POLICY IF EXISTS "Users can update verification reports for their projects" ON verification_reports;
DROP POLICY IF EXISTS "Users can delete verification reports for their projects" ON verification_reports;

-- 5. Create comprehensive policies that handle all edge cases
-- Policy for viewing verification reports
CREATE POLICY "Users can view verification reports for their projects" ON verification_reports
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM projects WHERE 
        client_id IN (SELECT user_id FROM client_profiles WHERE user_id = auth.uid())
        OR freelancer_id IN (SELECT freelancer_id FROM freelancer_profiles WHERE user_id = auth.uid())
    )
  );

-- Policy for creating verification reports (this is the critical one)
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

-- Policy for deleting verification reports
CREATE POLICY "Users can delete verification reports for their projects" ON verification_reports
  FOR DELETE USING (
    project_id IN (
      SELECT id FROM projects WHERE 
        client_id IN (SELECT user_id FROM client_profiles WHERE user_id = auth.uid())
        OR freelancer_id IN (SELECT freelancer_id FROM freelancer_profiles WHERE user_id = auth.uid())
    )
  );

-- 6. Verify the policies were created
SELECT 'New RLS policies created:' as info;
SELECT 
  policyname, 
  cmd, 
  qual 
FROM pg_policies 
WHERE tablename = 'verification_reports'
ORDER BY policyname;

-- 7. Test the policy logic (this will show if the user has access to any projects)
SELECT 'Testing policy logic:' as info;
SELECT 
  'User projects count' as test_type,
  COUNT(*) as count
FROM projects 
WHERE client_id IN (SELECT user_id FROM client_profiles WHERE user_id = auth.uid())
   OR freelancer_id IN (SELECT freelancer_id FROM freelancer_profiles WHERE user_id = auth.uid());

-- 8. Show sample projects for debugging
SELECT 'Sample projects for current user:' as info;
SELECT 
  id,
  project_name,
  client_id,
  freelancer_id,
  project_status_workflow
FROM projects 
WHERE client_id IN (SELECT user_id FROM client_profiles WHERE user_id = auth.uid())
   OR freelancer_id IN (SELECT freelancer_id FROM freelancer_profiles WHERE user_id = auth.uid())
LIMIT 5;

-- 9. Check if there are any existing verification reports
SELECT 'Existing verification reports count:' as info;
SELECT COUNT(*) as count FROM verification_reports;

-- 10. Ensure RLS is enabled
ALTER TABLE verification_reports ENABLE ROW LEVEL SECURITY;

-- 11. Final verification
SELECT 'Final verification - RLS enabled:' as info;
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'verification_reports';
