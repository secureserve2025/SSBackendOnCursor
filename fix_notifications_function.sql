-- Test notifications functionality to see why AI Verified projects aren't showing up
-- This will help us diagnose the issue with the getClientNotifications function

-- 1. Check if there are any projects with "AI Verified" status
SELECT '=== PROJECTS WITH AI VERIFIED STATUS ===' as info;
SELECT 
  id,
  project_id as project_display_id,
  project_name,
  project_status_workflow,
  client_id,
  freelancer_id,
  created_at,
  updated_at
FROM projects 
WHERE project_status_workflow = 'AI Verified'
ORDER BY updated_at DESC;

-- 2. Check if there are any projects with "Under Manual Revision" status
SELECT '=== PROJECTS WITH UNDER MANUAL REVISION STATUS ===' as info;
SELECT 
  id,
  project_id as project_display_id,
  project_name,
  project_status_workflow,
  client_id,
  freelancer_id,
  created_at,
  updated_at
FROM projects 
WHERE project_status_workflow = 'Under Manual Revision'
ORDER BY updated_at DESC;

-- 3. Check verification reports for AI Verified projects
SELECT '=== VERIFICATION REPORTS FOR AI VERIFIED PROJECTS ===' as info;
SELECT 
  vr.id as verification_id,
  vr.project_id,
  vr.report_title,
  vr.verification_score,
  vr.verified_by,
  vr.created_at as report_created_at,
  p.project_id as project_display_id,
  p.project_name,
  p.project_status_workflow
FROM verification_reports vr
JOIN projects p ON vr.project_id = p.id
WHERE p.project_status_workflow = 'AI Verified'
ORDER BY vr.created_at DESC;

-- 4. Test the exact query that the getClientNotifications function should use
-- (This will help us see if the issue is in the database query or the JavaScript function)
SELECT '=== TESTING NOTIFICATIONS QUERY ===' as info;
SELECT 'This simulates what the getClientNotifications function should return:' as note;

-- Note: Replace 'YOUR_CLIENT_ID_HERE' with an actual client_id from your projects table
-- For now, we'll just show the structure
SELECT 
  'To test this properly, you need to run this query with an actual client_id' as instruction,
  'The query should be: SELECT * FROM projects WHERE client_id = ''actual_client_id'' AND project_status_workflow IN (''Under Manual Revision'', ''AI Verified'')' as query_example;

-- 5. Show sample client_ids to test with
SELECT '=== SAMPLE CLIENT IDS TO TEST WITH ===' as info;
SELECT DISTINCT 
  client_id,
  COUNT(*) as project_count
FROM projects 
WHERE project_status_workflow IN ('Under Manual Revision', 'AI Verified')
GROUP BY client_id
ORDER BY project_count DESC;
