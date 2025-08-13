-- Fix verification_reports table structure to match code expectations
-- The code expects different field names than what currently exists

-- 1. First, let's see the current structure
SELECT '=== CURRENT TABLE STRUCTURE ===' as info;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'verification_reports' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Add missing columns that the code expects
-- The code in verifyProject.ts and the UI expect these fields:

-- Add report_title column
ALTER TABLE verification_reports 
ADD COLUMN IF NOT EXISTS report_title VARCHAR(255);

-- Add report_content column  
ALTER TABLE verification_reports 
ADD COLUMN IF NOT EXISTS report_content TEXT;

-- Add verification_score column
ALTER TABLE verification_reports 
ADD COLUMN IF NOT EXISTS verification_score DECIMAL(3,2);

-- Add report_type column
ALTER TABLE verification_reports 
ADD COLUMN IF NOT EXISTS report_type VARCHAR(50) DEFAULT 'AI Verification' 
CHECK (report_type IN ('AI Verification', 'Manual Review', 'Quality Check'));

-- Add file_path column
ALTER TABLE verification_reports 
ADD COLUMN IF NOT EXISTS file_path VARCHAR(500);

-- Add file_size column
ALTER TABLE verification_reports 
ADD COLUMN IF NOT EXISTS file_size BIGINT;

-- Add file_type column
ALTER TABLE verification_reports 
ADD COLUMN IF NOT EXISTS file_type VARCHAR(50);

-- Add storage_bucket column
ALTER TABLE verification_reports 
ADD COLUMN IF NOT EXISTS storage_bucket VARCHAR(100) DEFAULT 'verification-reports';

-- 3. Update the verification_status check constraint to match code expectations
-- The code expects: 'Pending', 'In Progress', 'Completed', 'Failed'
-- Current table has: 'pending' (lowercase)

-- First, drop the existing check constraint if it exists
ALTER TABLE verification_reports 
DROP CONSTRAINT IF EXISTS verification_reports_verification_status_check;

-- Add the correct check constraint
ALTER TABLE verification_reports 
ADD CONSTRAINT verification_reports_verification_status_check 
CHECK (verification_status IN ('Pending', 'In Progress', 'Completed', 'Failed'));

-- 4. Update verified_by to be VARCHAR instead of UUID to match code expectations
-- The code saves "Gemini Pro 2.5" as verified_by, which is a string, not UUID

-- First, create a backup of existing data
CREATE TABLE IF NOT EXISTS verification_reports_backup AS 
SELECT * FROM verification_reports;

-- Drop the existing verified_by column
ALTER TABLE verification_reports 
DROP COLUMN IF EXISTS verified_by;

-- Add the new verified_by column as VARCHAR
ALTER TABLE verification_reports 
ADD COLUMN verified_by VARCHAR(100);

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_verification_reports_project_id ON verification_reports(project_id);
CREATE INDEX IF NOT EXISTS idx_verification_reports_status ON verification_reports(verification_status);
CREATE INDEX IF NOT EXISTS idx_verification_reports_type ON verification_reports(report_type);

-- 6. Show the updated structure
SELECT '=== UPDATED TABLE STRUCTURE ===' as info;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'verification_reports' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 7. Verify the table is ready
SELECT '=== VERIFICATION REPORTS TABLE READY ===' as info;
SELECT 'Table structure updated to match code expectations!' as status;
SELECT 'Missing columns added: report_title, report_content, verification_score, etc.' as note;
SELECT 'verified_by changed from UUID to VARCHAR to match code expectations' as note;
SELECT 'Check constraints updated to match code expectations' as note;
