-- Check if project_requirement field length was increased to 500 characters
SELECT 
    column_name,
    data_type,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'projects' AND column_name = 'project_requirement';

