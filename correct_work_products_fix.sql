-- Correct Fix for Work Products Upload Issue
-- Based on the actual database schema provided

-- ===========================================
-- PART 1: DIAGNOSTIC CHECKS
-- ===========================================

-- 1. Check current work_products table state
SELECT 
    'Work Products Table Status' as info,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'work_products';

-- 2. Check existing policies on work_products table
SELECT 
    'Current Work Products Policies' as info,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'work_products';

-- 3. Check current user authentication
SELECT 
    'Current User' as info,
    auth.uid() as current_user_id,
    CASE 
        WHEN auth.uid() IS NOT NULL THEN 'AUTHENTICATED'
        ELSE 'NOT AUTHENTICATED'
    END as auth_status;

-- 4. Check if current user has freelancer profile
SELECT 
    'Freelancer Profile Check' as info,
    fp.user_id,
    fp.freelancer_id,
    fp.full_name,
    fp.email
FROM freelancer_profiles fp
WHERE fp.user_id = auth.uid();

-- 5. Check if current user has client profile
SELECT 
    'Client Profile Check' as info,
    cp.user_id,
    cp.client_id,
    cp.full_name,
    cp.email
FROM client_profiles cp
WHERE cp.user_id = auth.uid();

-- ===========================================
-- PART 2: FIX DATABASE RLS POLICIES
-- ===========================================

-- 6. Drop existing policies to start fresh
DROP POLICY IF EXISTS "Users can view work products for their projects" ON work_products;
DROP POLICY IF EXISTS "Users can upload work products for their projects" ON work_products;
DROP POLICY IF EXISTS "Users can update work products for their projects" ON work_products;
DROP POLICY IF EXISTS "Allow authenticated users to manage work products" ON work_products;

-- 7. Create correct RLS policies based on actual schema
-- Policy for viewing work products
CREATE POLICY "Users can view work products for their projects" ON work_products
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects WHERE 
                -- Client can view work products for their projects
                client_id IN (SELECT client_id FROM client_profiles WHERE user_id = auth.uid())
                OR 
                -- Freelancer can view work products for projects they're assigned to
                freelancer_id IN (SELECT freelancer_id FROM freelancer_profiles WHERE user_id = auth.uid())
        )
    );

-- Policy for uploading work products (only freelancers can upload)
CREATE POLICY "Freelancers can upload work products for their projects" ON work_products
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT id FROM projects WHERE 
                -- Only freelancers can upload work products
                freelancer_id IN (SELECT freelancer_id FROM freelancer_profiles WHERE user_id = auth.uid())
        )
    );

-- Policy for updating work products (only freelancers can update their uploads)
CREATE POLICY "Freelancers can update their work products" ON work_products
    FOR UPDATE USING (
        project_id IN (
            SELECT id FROM projects WHERE 
                -- Only freelancers can update work products
                freelancer_id IN (SELECT freelancer_id FROM freelancer_profiles WHERE user_id = auth.uid())
        )
    );

-- 8. Ensure RLS is enabled
ALTER TABLE work_products ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- PART 3: FIX STORAGE POLICIES
-- ===========================================

-- 9. Create work-products bucket if it doesn't exist
INSERT INTO storage.buckets (name, public)
VALUES ('work-products', false)
ON CONFLICT (name) DO NOTHING;

-- 10. Drop existing storage policies
DROP POLICY IF EXISTS "Users can upload work products" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their work products" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their work products" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their work products" ON storage.objects;
DROP POLICY IF EXISTS "Freelancers can upload work products for their projects" ON storage.objects;
DROP POLICY IF EXISTS "Users can view work products for their projects" ON storage.objects;
DROP POLICY IF EXISTS "Freelancers can update their work products" ON storage.objects;
DROP POLICY IF EXISTS "Freelancers can delete their work products" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to manage work products files" ON storage.objects;

-- 11. Create secure storage policies for work-products bucket
-- Policy for uploading work products (freelancers can upload to their user folder)
CREATE POLICY "Freelancers can upload work products" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'work-products' AND
        -- Ensure the first folder in the path matches the user's ID
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- Policy for viewing work products (both clients and freelancers can view based on project access)
CREATE POLICY "Users can view work products for their projects" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'work-products' AND
        (
            -- Freelancers can view files in their own folder
            (storage.foldername(name))[1] = auth.uid()::text
            OR
            -- Users can view work products for projects they have access to
            EXISTS (
                SELECT 1 FROM projects p
                WHERE p.id::text = (storage.foldername(name))[2]
                AND (
                    p.client_id IN (SELECT client_id FROM client_profiles WHERE user_id = auth.uid())
                    OR p.freelancer_id IN (SELECT freelancer_id FROM freelancer_profiles WHERE user_id = auth.uid())
                )
            )
        )
    );

-- Policy for updating work products (only freelancers can update their uploads)
CREATE POLICY "Freelancers can update their work products" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'work-products' AND
        -- Only freelancers can update files in their own folder
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- Policy for deleting work products (only freelancers can delete their uploads)
CREATE POLICY "Freelancers can delete their work products" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'work-products' AND
        -- Only freelancers can delete files in their own folder
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- ===========================================
-- PART 4: VERIFICATION
-- ===========================================

-- 12. Verify database RLS policies
SELECT 
    'Database RLS Policies' as section,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'work_products'
ORDER BY policyname;

-- 13. Verify storage policies
SELECT 
    'Storage Policies' as section,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'objects' AND policyname LIKE '%work products%'
ORDER BY policyname;

-- 14. Check storage bucket
SELECT 
    'Storage Bucket' as section,
    name as bucket_name,
    public as is_public
FROM storage.buckets 
WHERE name = 'work-products';

-- 15. Test policy access for the specific project
SELECT 
    'Policy Test' as section,
    p.id as project_id,
    p.project_name,
    p.freelancer_id,
    fp.freelancer_id as profile_freelancer_id,
    fp.user_id as profile_user_id,
    auth.uid() as current_user_id,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM projects WHERE 
                id = p.id AND 
                freelancer_id IN (SELECT freelancer_id FROM freelancer_profiles WHERE user_id = auth.uid())
        ) THEN 'FREELANCER ACCESS GRANTED'
        WHEN EXISTS (
            SELECT 1 FROM projects WHERE 
                id = p.id AND 
                client_id IN (SELECT client_id FROM client_profiles WHERE user_id = auth.uid())
        ) THEN 'CLIENT ACCESS GRANTED'
        ELSE 'ACCESS DENIED'
    END as access_status
FROM projects p
LEFT JOIN freelancer_profiles fp ON p.freelancer_id = fp.freelancer_id
WHERE p.id = 'd6951bf4-d1f6-430a-a997-3217097101ae';

-- ===========================================
-- PART 5: FINAL STATUS
-- ===========================================

SELECT 'Work Products Upload Fix Applied Successfully' as status;
