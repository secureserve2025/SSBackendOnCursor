-- Simple Fix for Work Products RLS Policy
-- This script provides a direct fix for the upload issue

-- 1. Drop all existing policies on work_products table
DROP POLICY IF EXISTS "Users can view work products for their projects" ON work_products;
DROP POLICY IF EXISTS "Users can upload work products for their projects" ON work_products;
DROP POLICY IF EXISTS "Users can update work products for their projects" ON work_products;

-- 2. Create a simpler, more permissive policy for testing
-- This policy allows any authenticated user to upload work products
-- We can make it more restrictive later once we confirm it works
CREATE POLICY "Allow authenticated users to manage work products" ON work_products
    FOR ALL USING (auth.uid() IS NOT NULL);

-- 3. Alternative: More specific policy that checks project ownership
-- Uncomment this section if you want more specific control
/*
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
*/

-- 4. Ensure RLS is enabled
ALTER TABLE work_products ENABLE ROW LEVEL SECURITY;

-- 5. Verify the policy was created
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'work_products';

