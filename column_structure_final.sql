-- =============================================================================
-- COLUMN STRUCTURE ANALYSIS - SINGLE RESULT SET
-- =============================================================================
-- This script shows all table structures in one result set
-- =============================================================================

-- Get all column information for all tables in one query
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN (
    'client_profiles', 
    'freelancer_profiles', 
    'projects', 
    'work_products', 
    'verification_reports', 
    'deliverables', 
    'project_messages', 
    'transactions'
)
ORDER BY table_name, ordinal_position;



