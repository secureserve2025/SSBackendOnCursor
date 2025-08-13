-- Check verification reports data to see what's actually stored
-- This will help us understand why the reports aren't showing up

-- 1. Check if there are any verification reports
SELECT '=== VERIFICATION REPORTS COUNT ===' as info;
SELECT COUNT(*) as total_reports FROM verification_reports;

-- 2. Show all verification reports with project details
SELECT '=== ALL VERIFICATION REPORTS ===' as info;
SELECT 
  vr.id as verification_id,
  vr.project_id,
  vr.report_title,
  vr.report_content,
  vr.verification_status,
  vr.verification_score,
  vr.verified_by,
  vr.created_at,
  p.project_name,
  p.project_id as project_display_id,
  p.project_status_workflow
FROM verification_reports vr
LEFT JOIN projects p ON vr.project_id = p.id
ORDER BY vr.created_at DESC;

-- 3. Check the structure of verification_reports table
SELECT '=== VERIFICATION REPORTS TABLE STRUCTURE ===' as info;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'verification_reports' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Check if there are any projects with "AI Verified" status
SELECT '=== PROJECTS WITH AI VERIFIED STATUS ===' as info;
SELECT 
  id,
  project_id as project_display_id,
  project_name,
  project_status_workflow,
  client_id,
  freelancer_id
FROM projects 
WHERE project_status_workflow = 'AI Verified'
ORDER BY updated_at DESC;

-- 5. Check the relationship between projects and verification reports
SELECT '=== PROJECTS WITH VERIFICATION REPORTS ===' as info;
SELECT 
  p.id as project_id,
  p.project_id as project_display_id,
  p.project_name,
  p.project_status_workflow,
  COUNT(vr.id) as verification_report_count
FROM projects p
LEFT JOIN verification_reports vr ON p.id = vr.project_id
GROUP BY p.id, p.project_id, p.project_name, p.project_status_workflow
HAVING COUNT(vr.id) > 0
ORDER BY p.updated_at DESC;

-- 6. Check for any recent verification reports (last 24 hours)
SELECT '=== RECENT VERIFICATION REPORTS (LAST 24 HOURS) ===' as info;
SELECT 
  vr.id as verification_id,
  vr.project_id,
  vr.report_title,
  vr.verification_score,
  vr.created_at,
  p.project_name,
  p.project_id as project_display_id
FROM verification_reports vr
LEFT JOIN projects p ON vr.project_id = p.id
WHERE vr.created_at >= NOW() - INTERVAL '24 hours'
ORDER BY vr.created_at DESC;
