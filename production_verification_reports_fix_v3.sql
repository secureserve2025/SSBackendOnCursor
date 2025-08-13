-- Production-ready fix for verification_reports RLS policies (V3)
-- This fixes the UUID/VARCHAR casting issue based on the actual database structure
-- verification_reports.project_id is UUID, projects.client_id/freelancer_id are VARCHAR

-- 1. First, let's check the current state
SELECT '=== DIAGNOSTIC INFORMATION ===' as info;

-- Check current policies
SELECT 'Current RLS policies:' as info;
SELECT 
  policyname, 
  cmd, 
  qual 
FROM pg_policies 
WHERE tablename = 'verification_reports'
ORDER BY policyname;

-- 2. Clean up existing policies completely
SELECT '=== CLEANING UP EXISTING POLICIES ===' as info;
DROP POLICY IF EXISTS "Users can view verification reports for their projects" ON verification_reports;
DROP POLICY IF EXISTS "Users can create verification reports for their projects" ON verification_reports;
DROP POLICY IF EXISTS "Users can update verification reports for their projects" ON verification_reports;
DROP POLICY IF EXISTS "Users can delete verification reports for their projects" ON verification_reports;
DROP POLICY IF EXISTS "Enable read access for all users" ON verification_reports;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON verification_reports;
DROP POLICY IF EXISTS "Enable update for users based on project_id" ON verification_reports;
DROP POLICY IF EXISTS "Enable delete for users based on project_id" ON verification_reports;
DROP POLICY IF EXISTS "Authenticated users can view verification reports" ON verification_reports;
DROP POLICY IF EXISTS "Authenticated users can create verification reports" ON verification_reports;
DROP POLICY IF EXISTS "Authenticated users can update verification reports" ON verification_reports;
DROP POLICY IF EXISTS "Authenticated users can delete verification reports" ON verification_reports;

-- 3. Create correct policies based on actual database structure
SELECT '=== CREATING CORRECT POLICIES ===' as info;

-- Policy for viewing verification reports (SELECT)
CREATE POLICY "Users can view verification reports for their projects" ON verification_reports
  FOR SELECT USING (
    -- Check if user is authenticated
    auth.uid() IS NOT NULL
    AND
    -- Check if project_id exists and user has access to the project
    -- project_id is UUID, so we can directly compare with projects.id (also UUID)
    project_id IN (
      SELECT id FROM projects WHERE 
        -- User is the client of the project (client_id is VARCHAR)
        client_id IN (SELECT client_id FROM client_profiles WHERE user_id = auth.uid())
        OR 
        -- User is the freelancer of the project (freelancer_id is VARCHAR)
        freelancer_id IN (SELECT freelancer_id FROM freelancer_profiles WHERE user_id = auth.uid())
    )
  );

-- Policy for creating verification reports (INSERT) - This is the critical one
CREATE POLICY "Users can create verification reports for their projects" ON verification_reports
  FOR INSERT WITH CHECK (
    -- Check if user is authenticated
    auth.uid() IS NOT NULL
    AND
    -- Check if project_id is provided and user has access to the project
    project_id IS NOT NULL
    AND
    -- project_id is UUID, so we can directly compare with projects.id (also UUID)
    project_id IN (
      SELECT id FROM projects WHERE 
        -- User is the client of the project (client_id is VARCHAR)
        client_id IN (SELECT client_id FROM client_profiles WHERE user_id = auth.uid())
        OR 
        -- User is the freelancer of the project (freelancer_id is VARCHAR)
        freelancer_id IN (SELECT freelancer_id FROM freelancer_profiles WHERE user_id = auth.uid())
    )
  );

-- Policy for updating verification reports (UPDATE)
CREATE POLICY "Users can update verification reports for their projects" ON verification_reports
  FOR UPDATE USING (
    -- Check if user is authenticated
    auth.uid() IS NOT NULL
    AND
    -- Check if user has access to the project
    -- project_id is UUID, so we can directly compare with projects.id (also UUID)
    project_id IN (
      SELECT id FROM projects WHERE 
        -- User is the client of the project (client_id is VARCHAR)
        client_id IN (SELECT client_id FROM client_profiles WHERE user_id = auth.uid())
        OR 
        -- User is the freelancer of the project (freelancer_id is VARCHAR)
        freelancer_id IN (SELECT freelancer_id FROM freelancer_profiles WHERE user_id = auth.uid())
    )
  );

-- Policy for deleting verification reports (DELETE)
CREATE POLICY "Users can delete verification reports for their projects" ON verification_reports
  FOR DELETE USING (
    -- Check if user is authenticated
    auth.uid() IS NOT NULL
    AND
    -- Check if user has access to the project
    -- project_id is UUID, so we can directly compare with projects.id (also UUID)
    project_id IN (
      SELECT id FROM projects WHERE 
        -- User is the client of the project (client_id is VARCHAR)
        client_id IN (SELECT client_id FROM client_profiles WHERE user_id = auth.uid())
        OR 
        -- User is the freelancer of the project (freelancer_id is VARCHAR)
        freelancer_id IN (SELECT freelancer_id FROM freelancer_profiles WHERE user_id = auth.uid())
    )
  );

-- 4. Ensure RLS is enabled
SELECT '=== ENABLING RLS ===' as info;
ALTER TABLE verification_reports ENABLE ROW LEVEL SECURITY;

-- 5. Verify the fix
SELECT '=== VERIFICATION ===' as info;

-- Check that policies were created
SELECT 'New policies created:' as info;
SELECT 
  policyname, 
  cmd, 
  qual 
FROM pg_policies 
WHERE tablename = 'verification_reports'
ORDER BY policyname;

-- Check RLS is enabled
SELECT 'RLS status:' as info;
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'verification_reports';

-- 6. Test the policy logic (this will show if the current user has access to any projects)
SELECT '=== POLICY LOGIC TEST ===' as info;
SELECT 
  'Current user projects count' as test_type,
  COUNT(*) as count
FROM projects 
WHERE client_id IN (SELECT client_id FROM client_profiles WHERE user_id = auth.uid())
   OR freelancer_id IN (SELECT freelancer_id FROM freelancer_profiles WHERE user_id = auth.uid());

-- Show sample projects for debugging
SELECT 'Sample projects for current user:' as info;
SELECT 
  id,
  project_name,
  client_id,
  freelancer_id,
  project_status_workflow
FROM projects 
WHERE client_id IN (SELECT client_id FROM client_profiles WHERE user_id = auth.uid())
   OR freelancer_id IN (SELECT freelancer_id FROM freelancer_profiles WHERE user_id = auth.uid())
LIMIT 5;

-- 7. Check existing data
SELECT '=== EXISTING DATA CHECK ===' as info;
SELECT 'Existing verification reports count:' as info;
SELECT COUNT(*) as count FROM verification_reports;

-- 8. Test the relationship logic
SELECT '=== TESTING RELATIONSHIP LOGIC ===' as info;
-- This will show if there are any verification reports and their project relationships
SELECT 
  'Sample verification reports with project info:' as info,
  vr.id as verification_id,
  vr.project_id,
  p.project_name,
  p.client_id,
  p.freelancer_id
FROM verification_reports vr
LEFT JOIN projects p ON vr.project_id = p.id
LIMIT 3;

-- 9. Final status
SELECT '=== FIX COMPLETED ===' as info;
SELECT 'Verification reports RLS policies have been updated successfully with correct data type handling!' as status;
