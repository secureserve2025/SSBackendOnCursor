-- Temporarily disable RLS on work_products table to fix upload issues
-- This is a quick fix to allow freelancers to upload work products

-- 1. Disable RLS on work_products table
ALTER TABLE work_products DISABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view work products for their projects" ON work_products;
DROP POLICY IF EXISTS "Users can upload work products for their projects" ON work_products;
DROP POLICY IF EXISTS "Users can update work products for their projects" ON work_products;

-- 3. Verify RLS is disabled
SELECT 
    'RLS Status' as info,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'work_products';

-- 4. Show that no policies exist
SELECT 
    'Policies' as info,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename = 'work_products';

-- Note: This is a temporary fix. RLS should be re-enabled with proper policies later
-- when the database relationships are fully consistent.


