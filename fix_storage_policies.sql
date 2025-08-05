-- Fix storage policies for work-products bucket
-- This script updates the storage policies to allow proper access to work products

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can upload work products" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their work products" ON storage.objects;

-- Create new policies that allow proper access
-- Policy for uploading work products (freelancers can upload to their projects)
CREATE POLICY "Freelancers can upload work products for their projects" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'work-products' AND
        EXISTS (
            SELECT 1 FROM projects p
            JOIN freelancer_profiles fp ON p.freelancer_id = fp.freelancer_id
            WHERE fp.user_id = auth.uid()
            AND p.id::text = (storage.foldername(name))[2]
        )
    );

-- Policy for viewing work products (both clients and freelancers can view)
CREATE POLICY "Users can view work products for their projects" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'work-products' AND
        (
            -- Freelancers can view their own uploads
            (storage.foldername(name))[1] = auth.uid()::text
            OR
            -- Clients can view work products for their projects
            EXISTS (
                SELECT 1 FROM projects p
                JOIN client_profiles cp ON p.client_id = cp.user_id
                WHERE cp.user_id = auth.uid()
                AND p.id::text = (storage.foldername(name))[2]
            )
            OR
            -- Freelancers can view work products for projects they're assigned to
            EXISTS (
                SELECT 1 FROM projects p
                JOIN freelancer_profiles fp ON p.freelancer_id = fp.freelancer_id
                WHERE fp.user_id = auth.uid()
                AND p.id::text = (storage.foldername(name))[2]
            )
        )
    );

-- Policy for updating work products (freelancers can update their uploads)
CREATE POLICY "Freelancers can update their work products" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'work-products' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- Policy for deleting work products (freelancers can delete their uploads)
CREATE POLICY "Freelancers can delete their work products" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'work-products' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- Also fix verification reports policies
DROP POLICY IF EXISTS "Users can upload verification reports" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their verification reports" ON storage.objects;

-- Create new policies for verification reports
CREATE POLICY "Users can upload verification reports for their projects" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'verification-reports' AND
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id::text = (storage.foldername(name))[2]
            AND (
                p.client_id IN (SELECT user_id FROM client_profiles WHERE user_id = auth.uid())
                OR p.freelancer_id IN (SELECT freelancer_id FROM freelancer_profiles WHERE user_id = auth.uid())
            )
        )
    );

CREATE POLICY "Users can view verification reports for their projects" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'verification-reports' AND
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id::text = (storage.foldername(name))[2]
            AND (
                p.client_id IN (SELECT user_id FROM client_profiles WHERE user_id = auth.uid())
                OR p.freelancer_id IN (SELECT freelancer_id FROM freelancer_profiles WHERE user_id = auth.uid())
            )
        )
    );

-- Test the policies
SELECT 'Storage policies updated successfully' as status;

-- Verify the policies exist
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
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%work%' OR policyname LIKE '%verification%'; 