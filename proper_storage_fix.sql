-- Proper Storage Fix for Work Products
-- This script identifies and fixes the specific storage policy issue

-- 1. First, let's see what storage policies currently exist
SELECT 
    'Current storage policies' as info,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'storage'
ORDER BY policyname;

-- 2. Check if work-products bucket exists and its configuration
SELECT 
    'work-products bucket configuration' as info,
    name as bucket_name,
    public as is_public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE name = 'work-products';

-- 3. Check if there are any policies specifically blocking work-products uploads
SELECT 
    'Policies affecting work-products' as info,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'storage'
AND (
    policyname LIKE '%work%' 
    OR policyname LIKE '%product%'
    OR qual LIKE '%work%'
    OR with_check LIKE '%work%'
)
ORDER BY policyname;

-- 4. Check if there are any restrictive policies that might be blocking uploads
SELECT 
    'Restrictive storage policies' as info,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'storage'
AND (
    qual LIKE '%auth.uid%' 
    OR qual LIKE '%owner%'
    OR with_check LIKE '%auth.uid%'
    OR with_check LIKE '%owner%'
)
ORDER BY policyname;

-- 5. Now let's create the proper fix - a policy that allows freelancers to upload work products
-- This policy checks that the user is a freelancer and the project belongs to them
CREATE POLICY "Freelancers can upload work products for their projects" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'work-products' 
        AND auth.role() = 'authenticated'
        AND EXISTS (
            SELECT 1 FROM work_products wp
            JOIN projects p ON wp.project_id = p.id
            JOIN freelancer_profiles fp ON p.freelancer_id = fp.id
            WHERE fp.user_id = auth.uid()
            AND wp.file_path = name
        )
    );

-- 6. Create a policy for viewing work products
CREATE POLICY "Users can view work products for their projects" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'work-products' 
        AND auth.role() = 'authenticated'
        AND (
            -- Freelancers can view their own work products
            EXISTS (
                SELECT 1 FROM work_products wp
                JOIN projects p ON wp.project_id = p.id
                JOIN freelancer_profiles fp ON p.freelancer_id = fp.id
                WHERE fp.user_id = auth.uid()
                AND wp.file_path = name
            )
            OR
            -- Clients can view work products for their projects
            EXISTS (
                SELECT 1 FROM work_products wp
                JOIN projects p ON wp.project_id = p.id
                JOIN client_profiles cp ON p.client_id = cp.id
                WHERE cp.user_id = auth.uid()
                AND wp.file_path = name
            )
        )
    );

-- 7. Create a policy for updating work products
CREATE POLICY "Freelancers can update work products for their projects" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'work-products' 
        AND auth.role() = 'authenticated'
        AND EXISTS (
            SELECT 1 FROM work_products wp
            JOIN projects p ON wp.project_id = p.id
            JOIN freelancer_profiles fp ON p.freelancer_id = fp.id
            WHERE fp.user_id = auth.uid()
            AND wp.file_path = name
        )
    );

-- 8. Create a policy for deleting work products
CREATE POLICY "Freelancers can delete work products for their projects" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'work-products' 
        AND auth.role() = 'authenticated'
        AND EXISTS (
            SELECT 1 FROM work_products wp
            JOIN projects p ON wp.project_id = p.id
            JOIN freelancer_profiles fp ON p.freelancer_id = fp.id
            WHERE fp.user_id = auth.uid()
            AND wp.file_path = name
        )
    );

-- 9. Verify the new policies were created
SELECT 
    'New work-products policies' as info,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'storage'
AND policyname LIKE '%work%'
ORDER BY policyname;

-- 10. Test the policy logic
SELECT 
    'Policy test for current user' as info,
    auth.uid() as current_user_id,
    CASE
        WHEN EXISTS (
            SELECT 1 FROM freelancer_profiles 
            WHERE user_id = auth.uid()
        ) THEN 'User is a freelancer'
        WHEN EXISTS (
            SELECT 1 FROM client_profiles 
            WHERE user_id = auth.uid()
        ) THEN 'User is a client'
        ELSE 'User type unknown'
    END as user_type;


