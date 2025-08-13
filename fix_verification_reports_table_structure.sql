-- Check and fix verification_reports table structure
-- The code expects certain fields that might not exist in the current table

-- 1. First, let's see what the current table structure looks like
SELECT '=== CURRENT VERIFICATION REPORTS TABLE STRUCTURE ===' as info;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'verification_reports' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check what fields the code expects vs what exists
-- Based on the code, it expects these fields:
-- - report_title
-- - report_content  
-- - verification_score
-- - verification_status
-- - verified_by

-- 3. Check if we need to add missing columns
-- The code in verifyProject.ts saves these fields:
-- - project_id
-- - report_title: "AI Verification Report"
-- - report_content: aiResponse.report_content
-- - verified_by: "Gemini Pro 2.5"
-- - verification_score: aiResponse.verification_score

-- 4. Let's see what's actually in the table
SELECT '=== SAMPLE VERIFICATION REPORTS DATA ===' as info;
SELECT * FROM verification_reports LIMIT 3;

-- 5. Check if the table structure matches what the code expects
-- If not, we'll need to add the missing columns
