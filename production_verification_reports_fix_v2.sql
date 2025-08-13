-- Production-ready fix for verification_reports RLS policies (V2)
-- This fixes the UUID/VARCHAR casting issue and addresses the "new row violates row-level security policy" error
-- and ensures it works properly in Vercel production deployment

-- 1. First, let's check the current state and identify issues
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

-- Check table structure and data types
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

-- Check projects table structure for comparison
SELECT 'Projects table structure:' as info;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND table_schema = 'public'
AND column_name IN ('id', 'client_id', 'freelancer_id')
ORDER BY ordinal_position;

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

-- 3. Create robust policies that handle UUID/VARCHAR casting properly
SELECT '=== CREATING NEW ROBUST POLICIES ===' as info;

-- Policy for viewing verification reports (SELECT)
CREATE POLICY "Users can view verification reports for their projects" ON verification_reports
  FOR SELECT USING (
    -- Check if user is authenticated
    auth.uid() IS NOT NULL
    AND
    -- Check if project_id exists and user has access to the project
    -- Cast project_id to UUID for comparison with projects.id
    project_id::UUID IN (
      SELECT id FROM projects WHERE 
        -- User is the client of the project
        client_id IN (SELECT user_id FROM client_profiles WHERE user_id = auth.uid())
        OR 
        -- User is the freelancer of the project
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
    -- Cast project_id to UUID for comparison with projects.id
    project_id::UUID IN (
      SELECT id FROM projects WHERE 
        -- User is the client of the project
        client_id IN (SELECT user_id FROM client_profiles WHERE user_id = auth.uid())
        OR 
        -- User is the freelancer of the project
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
    -- Cast project_id to UUID for comparison with projects.id
    project_id::UUID IN (
      SELECT id FROM projects WHERE 
        -- User is the client of the project
        client_id IN (SELECT user_id FROM client_profiles WHERE user_id = auth.uid())
        OR 
        -- User is the freelancer of the project
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
    -- Cast project_id to UUID for comparison with projects.id
    project_id::UUID IN (
      SELECT id FROM projects WHERE 
        -- User is the client of the project
        client_id IN (SELECT user_id FROM client_profiles WHERE user_id = auth.uid())
        OR 
        -- User is the freelancer of the project
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
WHERE client_id IN (SELECT user_id FROM client_profiles WHERE user_id = auth.uid())
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
WHERE client_id IN (SELECT user_id FROM client_profiles WHERE user_id = auth.uid())
   OR freelancer_id IN (SELECT freelancer_id FROM freelancer_profiles WHERE user_id = auth.uid())
LIMIT 5;

-- 7. Check existing data
SELECT '=== EXISTING DATA CHECK ===' as info;
SELECT 'Existing verification reports count:' as info;
SELECT COUNT(*) as count FROM verification_reports;

-- 8. Test the casting logic
SELECT '=== TESTING CASTING LOGIC ===' as info;
-- This will show if there are any verification reports and their project_id format
SELECT 
  'Sample verification reports:' as info,
  id,
  project_id,
  report_title
FROM verification_reports 
LIMIT 3;

-- 9. Final status
SELECT '=== FIX COMPLETED ===' as info;
SELECT 'Verification reports RLS policies have been updated successfully with proper UUID casting!' as status;
