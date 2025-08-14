-- Temporary fix: Disable RLS on storage.objects to test upload
-- This will help us identify if storage policies are the issue

-- 1. Check current RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'storage' AND tablename = 'objects';

-- 2. Temporarily disable RLS on storage.objects
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- 3. Verify RLS is disabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'storage' AND tablename = 'objects';

-- 4. Test if we can now upload files
-- (This will be tested when you try uploading again)

-- NOTE: This is a temporary fix for testing only
-- We'll re-enable RLS and fix the policies properly once we confirm this works

