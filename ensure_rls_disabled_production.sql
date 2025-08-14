-- =============================================================================
-- MVP PRODUCTION RLS DISABLE SCRIPT
-- This ensures RLS policies are disabled for MVP demo deployment
-- Run this once in Supabase SQL Editor before deploying to Vercel
-- =============================================================================

-- Disable RLS on all main application tables
ALTER TABLE freelancer_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE client_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE deliverables DISABLE ROW LEVEL SECURITY;
ALTER TABLE work_products DISABLE ROW LEVEL SECURITY;
ALTER TABLE verification_reports DISABLE ROW LEVEL SECURITY;

-- Note: storage.objects RLS is managed by Supabase automatically
-- We cannot directly disable it, but it should work with our app
-- The storage policies are handled differently in Supabase

-- Verify RLS is disabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname IN ('public', 'storage')
AND tablename IN (
    'freelancer_profiles', 'client_profiles', 'projects', 'transactions', 
    'messages', 'project_messages', 'deliverables', 'work_products', 
    'verification_reports'
)
ORDER BY schemaname, tablename;

-- Success message
SELECT 'RLS POLICIES DISABLED FOR MVP PRODUCTION' as status;
