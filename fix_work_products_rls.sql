-- Fix RLS Policy for Work Products Upload
-- This script fixes the Row-Level Security policy that's preventing freelancers from uploading work products

-- 1. First, let's check the current state of the work_products table and its policies
SELECT 
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'work_products';

-- 2. Check existing policies on work_products table
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'work_products';

-- 3. Check the relationship between auth.uid() and freelancer_profiles
-- This will help us understand if there's a mismatch
SELECT 
    'Current auth.uid()' as info,
    auth.uid() as current_user_id;

-- 4. Check if the current user has a freelancer profile
SELECT 
    'Freelancer profile check' as info,
    fp.user_id,
    fp.freelancer_id,
    fp.full_name,
    fp.email
FROM freelancer_profiles fp
WHERE fp.user_id = auth.uid();

-- 5. Check if the current user has access to the project
SELECT 
    'Project access check' as info,
    p.id as project_id,
    p.project_name,
    p.client_id,
    p.freelancer_id,
    cp.user_id as client_user_id,
    fp.user_id as freelancer_user_id
FROM projects p
LEFT JOIN client_profiles cp ON p.client_id = cp.user_id
LEFT JOIN freelancer_profiles fp ON p.freelancer_id = fp.freelancer_id
WHERE p.id = 'd6951bf4-d1f6-430a-a997-3217097101ae';

-- 6. Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view work products for their projects" ON work_products;
DROP POLICY IF EXISTS "Users can upload work products for their projects" ON work_products;
DROP POLICY IF EXISTS "Users can update work products for their projects" ON work_products;

-- 7. Create corrected RLS policies for work_products
-- The issue is likely that we need to check both user_id and freelancer_id relationships

CREATE POLICY "Users can view work products for their projects" ON work_products
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects WHERE 
                client_id IN (SELECT user_id FROM client_profiles WHERE user_id = auth.uid())
                OR freelancer_id IN (SELECT freelancer_id FROM freelancer_profiles WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Users can upload work products for their projects" ON work_products
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT id FROM projects WHERE 
                client_id IN (SELECT user_id FROM client_profiles WHERE user_id = auth.uid())
                OR freelancer_id IN (SELECT freelancer_id FROM freelancer_profiles WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Users can update work products for their projects" ON work_products
    FOR UPDATE USING (
        project_id IN (
            SELECT id FROM projects WHERE 
                client_id IN (SELECT user_id FROM client_profiles WHERE user_id = auth.uid())
                OR freelancer_id IN (SELECT freelancer_id FROM freelancer_profiles WHERE user_id = auth.uid())
        )
    );

-- 8. Verify the policies were created correctly
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'work_products'
ORDER BY policyname;

-- 9. Test the policy by checking if the current user can access the specific project
SELECT 
    'Policy test for project' as info,
    p.id as project_id,
    p.project_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM projects WHERE 
                id = p.id AND (
                    client_id IN (SELECT user_id FROM client_profiles WHERE user_id = auth.uid())
                    OR freelancer_id IN (SELECT freelancer_id FROM freelancer_profiles WHERE user_id = auth.uid())
                )
        ) THEN 'ACCESS GRANTED'
        ELSE 'ACCESS DENIED'
    END as access_status
FROM projects p
WHERE p.id = 'd6951bf4-d1f6-430a-a997-3217097101ae';

-- 10. Additional check: Ensure the work_products table has RLS enabled
ALTER TABLE work_products ENABLE ROW LEVEL SECURITY;

-- 11. Final verification
SELECT 
    'RLS Status' as info,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'work_products';

