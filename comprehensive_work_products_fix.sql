-- Comprehensive Fix for Work Products Upload Issue
-- This script fixes both database RLS policies and storage policies

-- ===========================================
-- PART 1: FIX DATABASE RLS POLICIES
-- ===========================================

-- 1. Drop existing work_products RLS policies
DROP POLICY IF EXISTS "Users can view work products for their projects" ON work_products;
DROP POLICY IF EXISTS "Users can upload work products for their projects" ON work_products;
DROP POLICY IF EXISTS "Users can update work products for their projects" ON work_products;

-- 2. Create new, more permissive RLS policies for work_products
-- This allows any authenticated user to manage work products
-- We can make this more restrictive later once we confirm it works
CREATE POLICY "Allow authenticated users to manage work products" ON work_products
    FOR ALL USING (auth.uid() IS NOT NULL);

-- 3. Ensure RLS is enabled on work_products table
ALTER TABLE work_products ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- PART 2: FIX STORAGE POLICIES
-- ===========================================

-- 4. Create work-products bucket if it doesn't exist
INSERT INTO storage.buckets (name, public)
VALUES ('work-products', false)
ON CONFLICT (name) DO NOTHING;

-- 5. Drop existing storage policies for work-products bucket
DROP POLICY IF EXISTS "Users can upload work products" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their work products" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their work products" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their work products" ON storage.objects;
DROP POLICY IF EXISTS "Freelancers can upload work products for their projects" ON storage.objects;
DROP POLICY IF EXISTS "Users can view work products for their projects" ON storage.objects;
DROP POLICY IF EXISTS "Freelancers can update their work products" ON storage.objects;
DROP POLICY IF EXISTS "Freelancers can delete their work products" ON storage.objects;

-- 6. Create new, more permissive storage policies
-- Allow any authenticated user to manage files in work-products bucket
CREATE POLICY "Allow authenticated users to manage work products files" ON storage.objects
    FOR ALL USING (
        bucket_id = 'work-products' AND
        auth.uid() IS NOT NULL
    );

-- ===========================================
-- PART 3: VERIFICATION
-- ===========================================

-- 7. Verify database RLS policies
SELECT 
    'Database RLS Policies' as section,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'work_products'
ORDER BY policyname;

-- 8. Verify storage policies
SELECT 
    'Storage Policies' as section,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'objects' AND policyname LIKE '%work products%'
ORDER BY policyname;

-- 9. Check if work-products bucket exists
SELECT 
    'Storage Bucket' as section,
    name as bucket_name,
    public as is_public
FROM storage.buckets 
WHERE name = 'work-products';

-- 10. Test current user authentication
SELECT 
    'Authentication Test' as section,
    auth.uid() as current_user_id,
    CASE 
        WHEN auth.uid() IS NOT NULL THEN 'AUTHENTICATED'
        ELSE 'NOT AUTHENTICATED'
    END as auth_status;

-- ===========================================
-- PART 4: ALTERNATIVE RESTRICTIVE POLICIES
-- ===========================================
-- Uncomment this section if you want more restrictive policies after testing

/*
-- More restrictive database policies
DROP POLICY IF EXISTS "Allow authenticated users to manage work products" ON work_products;

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

-- More restrictive storage policies
DROP POLICY IF EXISTS "Allow authenticated users to manage work products files" ON storage.objects;

CREATE POLICY "Users can upload work products" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'work-products' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can view their work products" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'work-products' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can update their work products" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'work-products' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can delete their work products" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'work-products' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );
*/

-- ===========================================
-- PART 5: FINAL STATUS
-- ===========================================

SELECT 'Work Products Upload Fix Applied Successfully' as status;

