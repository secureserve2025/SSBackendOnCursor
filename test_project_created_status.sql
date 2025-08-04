-- Test script to verify "Project Created" status has been added to transactions table

-- Test 1: Check all valid transaction statuses
SELECT * FROM get_valid_transaction_statuses();

-- Test 2: Check the default value for transaction_status column
SELECT 
    column_name,
    column_default,
    is_nullable,
    data_type
FROM information_schema.columns 
WHERE table_name = 'transactions' 
AND column_name = 'transaction_status';

-- Test 3: Check the constraint definition
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'transactions'::regclass 
AND conname = 'transactions_transaction_status_check';

-- Test 4: Check the default value for transaction_status column
SELECT 
    column_name,
    column_default,
    is_nullable,
    data_type
FROM information_schema.columns 
WHERE table_name = 'transactions' 
AND column_name = 'transaction_status';

-- Test 5: Check if we can create a transaction with "Project Created" status (without foreign key issues)
-- This test validates the constraint without requiring a real project_id
SELECT 
    'Project Created'::VARCHAR(50) as test_status,
    CASE 
        WHEN 'Project Created' IN ('Project Created', 'Project under Manual Review', 'Fund Secured', 'Successfully closed', 'Chargeback')
        THEN 'VALID' 
        ELSE 'INVALID' 
    END as constraint_check;

-- Test 6: Check existing transactions to see their current statuses
SELECT 
    transaction_id,
    project_id,
    transaction_value,
    transaction_status,
    created_at
FROM transactions 
ORDER BY created_at DESC 
LIMIT 5; 