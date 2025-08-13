-- Step 6: Check table structure for trigger
-- This checks if the tables have the right columns for the trigger to insert

SELECT '=== TABLE STRUCTURE FOR TRIGGER ===' as section;
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('client_profiles', 'freelancer_profiles')
AND column_name IN ('user_id', 'email', 'full_name', 'mobile_number', 'created_at', 'updated_at')
ORDER BY table_name, column_name;
