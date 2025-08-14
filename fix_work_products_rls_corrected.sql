-- Fix RLS Policy for Work Products Upload - CORRECTED VERSION
-- This script fixes the Row-Level Security policy that's preventing freelancers from uploading work products

-- 1. Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view work products for their projects" ON work_products;
DROP POLICY IF EXISTS "Users can upload work products for their projects" ON work_products;
DROP POLICY IF EXISTS "Users can update work products for their projects" ON work_products;

-- 2. Create corrected RLS policies for work_products
-- The issue was that projects.freelancer_id stores UUID (freelancer_profiles.id), not human-readable freelancer_id

CREATE POLICY "Users can view work products for their projects" ON work_products
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects WHERE 
                client_id IN (SELECT id FROM client_profiles WHERE user_id = auth.uid())
                OR freelancer_id IN (SELECT id FROM freelancer_profiles WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Users can upload work products for their projects" ON work_products
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT id FROM projects WHERE 
                client_id IN (SELECT id FROM client_profiles WHERE user_id = auth.uid())
                OR freelancer_id IN (SELECT id FROM freelancer_profiles WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Users can update work products for their projects" ON work_products
    FOR UPDATE USING (
        project_id IN (
            SELECT id FROM projects WHERE 
                client_id IN (SELECT id FROM client_profiles WHERE user_id = auth.uid())
                OR freelancer_id IN (SELECT id FROM freelancer_profiles WHERE user_id = auth.uid())
        )
    );

-- 3. Ensure RLS is enabled
ALTER TABLE work_products ENABLE ROW LEVEL SECURITY;

-- 4. Verify the policies were created correctly
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'work_products'
ORDER BY policyname;

-- 5. Test the policy by checking if the current user can access projects
SELECT 
    'Policy test for current user' as info,
    auth.uid() as current_user_id,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM projects WHERE 
                client_id IN (SELECT id FROM client_profiles WHERE user_id = auth.uid())
                OR freelancer_id IN (SELECT id FROM freelancer_profiles WHERE user_id = auth.uid())
        ) THEN 'ACCESS GRANTED'
        ELSE 'ACCESS DENIED'
    END as access_status;

-- 6. Show projects accessible to current user
SELECT 
    'Accessible projects' as info,
    p.id as project_id,
    p.project_name,
    p.project_status_workflow,
    CASE 
        WHEN p.client_id IN (SELECT id FROM client_profiles WHERE user_id = auth.uid()) THEN 'Client'
        WHEN p.freelancer_id IN (SELECT id FROM freelancer_profiles WHERE user_id = auth.uid()) THEN 'Freelancer'
        ELSE 'Unknown'
    END as user_role
FROM projects p
WHERE p.client_id IN (SELECT id FROM client_profiles WHERE user_id = auth.uid())
   OR p.freelancer_id IN (SELECT id FROM freelancer_profiles WHERE user_id = auth.uid());


