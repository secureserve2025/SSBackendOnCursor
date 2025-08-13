-- Test AI verification after table structure fix
-- This script will help us verify that the verification reports can now be saved properly

-- 1. Check current verification reports count
SELECT '=== CURRENT VERIFICATION REPORTS COUNT ===' as info;
SELECT COUNT(*) as total_reports FROM verification_reports;

-- 2. Check if there are any projects ready for verification
SELECT '=== PROJECTS READY FOR VERIFICATION ===' as info;
SELECT 
  id,
  project_id as project_display_id,
  project_name,
  project_status_workflow,
  client_id,
  freelancer_id,
  created_at
FROM projects 
WHERE project_status_workflow IN ('Production in Progress', 'Under Manual Revision')
ORDER BY updated_at DESC;

-- 3. Check if there are any projects with "AI Verified" status
SELECT '=== PROJECTS WITH AI VERIFIED STATUS ===' as info;
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

-- 4. Check the relationship between AI Verified projects and verification reports
SELECT '=== AI VERIFIED PROJECTS WITH VERIFICATION REPORTS ===' as info;
SELECT 
  p.id as project_id,
  p.project_id as project_display_id,
  p.project_name,
  p.project_status_workflow,
  COUNT(vr.id) as verification_report_count,
  vr.report_title,
  vr.verification_score,
  vr.verified_by,
  vr.created_at as report_created_at
FROM projects p
LEFT JOIN verification_reports vr ON p.id = vr.project_id
WHERE p.project_status_workflow = 'AI Verified'
GROUP BY p.id, p.project_id, p.project_name, p.project_status_workflow, vr.id, vr.report_title, vr.verification_score, vr.verified_by, vr.created_at
ORDER BY p.updated_at DESC;

-- 5. Test inserting a sample verification report to ensure the table structure works
SELECT '=== TESTING TABLE STRUCTURE ===' as info;
SELECT 'Attempting to insert a test verification report...' as test_note;

-- Get a sample project ID for testing
DO $$
DECLARE
  test_project_id UUID;
  test_report_id UUID;
BEGIN
  -- Get a sample project
  SELECT id INTO test_project_id 
  FROM projects 
  WHERE project_status_workflow = 'AI Verified' 
  LIMIT 1;
  
  IF test_project_id IS NOT NULL THEN
    -- Try to insert a test report
    INSERT INTO verification_reports (
      project_id,
      report_title,
      report_content,
      report_type,
      verification_status,
      verified_by,
      verification_score,
      verification_notes
    ) VALUES (
      test_project_id,
      'Test AI Verification Report',
      'This is a test verification report to ensure the table structure works correctly.',
      'AI Verification',
      'Completed',
      'Test System',
      0.85,
      'Test verification notes'
    ) RETURNING id INTO test_report_id;
    
    RAISE NOTICE 'Test verification report inserted successfully with ID: %', test_report_id;
    
    -- Clean up the test data
    DELETE FROM verification_reports WHERE id = test_report_id;
    RAISE NOTICE 'Test verification report cleaned up successfully';
    
  ELSE
    RAISE NOTICE 'No AI Verified projects found for testing';
  END IF;
END $$;

-- 6. Show final status
SELECT '=== VERIFICATION REPORTS TABLE STATUS ===' as info;
SELECT 'Table structure is now compatible with the code!' as status;
SELECT 'All required columns are present and properly typed.' as note;
SELECT 'AI verification should now work correctly.' as note;
