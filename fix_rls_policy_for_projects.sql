-- Fix RLS Policy for Projects Table
-- This script fixes the RLS policy that's preventing project creation

-- 1. First, let's check the current RLS policies on the projects table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'projects'
ORDER BY policyname;

-- 2. Drop all existing RLS policies for projects table
DROP POLICY IF EXISTS "Users can view projects they're involved in" ON projects;
DROP POLICY IF EXISTS "Clients can create projects" ON projects;
DROP POLICY IF EXISTS "Users can update projects they own" ON projects;
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
DROP POLICY IF EXISTS "Clients can create their own projects" ON projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
DROP POLICY IF EXISTS "Clients can view own projects" ON projects;
DROP POLICY IF EXISTS "Clients can insert own projects" ON projects;
DROP POLICY IF EXISTS "Clients can update own projects" ON projects;
DROP POLICY IF EXISTS "Freelancers can view assigned projects" ON projects;

-- 3. Create the correct RLS policies for the current schema
-- Policy for viewing projects (clients and freelancers can view their projects)
CREATE POLICY "Users can view projects they're involved in" ON projects
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM client_profiles WHERE id = projects.client_id
      UNION
      SELECT user_id FROM freelancer_profiles WHERE id = projects.freelancer_id
    )
  );

-- Policy for creating projects (only clients can create projects)
CREATE POLICY "Clients can create projects" ON projects
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT user_id FROM client_profiles WHERE id = projects.client_id)
  );

-- Policy for updating projects (clients and freelancers can update their projects)
CREATE POLICY "Users can update projects they own" ON projects
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM client_profiles WHERE id = projects.client_id
      UNION
      SELECT user_id FROM freelancer_profiles WHERE id = projects.freelancer_id
    )
  );

-- 4. Test the RLS policy by checking if the current user can create a project
-- This will help us verify the policy is working correctly
SELECT 
    'Current User ID' as test_type,
    auth.uid() as current_user_id;

SELECT 
    'Client Profile Check' as test_type,
    id,
    user_id,
    client_id,
    email
FROM client_profiles 
WHERE user_id = auth.uid();

-- 5. Verify the policy allows the current user to create projects
SELECT 
    'RLS Policy Test' as test_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM client_profiles 
            WHERE user_id = auth.uid() 
            AND id = '5e5d114e-cc06-4850-9b03-64ae9cd0c4d4'::UUID
        ) THEN '✅ User can create project with this client_id'
        ELSE '❌ User cannot create project with this client_id'
    END as policy_test_result;









