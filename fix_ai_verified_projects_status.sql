-- Fix existing projects with "AI Verified" status
-- Since these projects don't have actual verification reports, we need to change their status

-- 1. First, let's see which projects currently have "AI Verified" status
SELECT '=== CURRENT PROJECTS WITH AI VERIFIED STATUS ===' as info;
SELECT 
  id,
  project_id as project_display_id,
  project_name,
  project_status_workflow,
  client_id,
  freelancer_id,
  updated_at
FROM projects 
WHERE project_status_workflow = 'AI Verified'
ORDER BY updated_at DESC;

-- 2. Check if these projects have any verification reports
SELECT '=== AI VERIFIED PROJECTS WITH VERIFICATION REPORTS ===' as info;
SELECT 
  p.id as project_id,
  p.project_id as project_display_id,
  p.project_name,
  p.project_status_workflow,
  COUNT(vr.id) as verification_report_count
FROM projects p
LEFT JOIN verification_reports vr ON p.id = vr.project_id
WHERE p.project_status_workflow = 'AI Verified'
GROUP BY p.id, p.project_id, p.project_name, p.project_status_workflow
ORDER BY p.updated_at DESC;

-- 3. Update projects with "AI Verified" status to "Production in Progress"
-- This makes sense because they were likely in production when the status was incorrectly changed
SELECT '=== UPDATING AI VERIFIED PROJECTS TO PRODUCTION IN PROGRESS ===' as info;

UPDATE projects 
SET 
  project_status_workflow = 'Production in Progress',
  updated_at = NOW()
WHERE project_status_workflow = 'AI Verified';

-- 4. Verify the changes
SELECT '=== VERIFICATION: PROJECTS AFTER UPDATE ===' as info;
SELECT 
  id,
  project_id as project_display_id,
  project_name,
  project_status_workflow,
  client_id,
  freelancer_id,
  updated_at
FROM projects 
WHERE project_status_workflow = 'Production in Progress'
ORDER BY updated_at DESC;

-- 5. Show summary of changes
SELECT '=== SUMMARY OF CHANGES ===' as info;
SELECT 
  'Projects updated from "AI Verified" to "Production in Progress"' as change_description,
  COUNT(*) as projects_updated
FROM projects 
WHERE project_status_workflow = 'Production in Progress' 
AND updated_at >= NOW() - INTERVAL '1 minute';

-- 6. Final status
SELECT '=== FINAL STATUS ===' as info;
SELECT 'All projects with "AI Verified" status have been updated to "Production in Progress"' as status;
SELECT 'These projects are now ready for proper AI verification when you click "Verify Work"' as note;
SELECT 'The verification reports table structure is now fixed and ready to accept new reports' as note;
