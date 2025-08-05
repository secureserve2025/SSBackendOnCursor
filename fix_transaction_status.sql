-- Fix transaction status for funded transactions
-- This will update transactions that have project status "Fund Secured" but transaction status "Project Created"

-- First, let's see what transactions need to be updated
SELECT 
    t.id,
    t.transaction_id,
    t.transaction_status,
    t.transaction_value,
    p.project_status_workflow,
    p.project_id
FROM transactions t
JOIN projects p ON t.project_id = p.id
WHERE p.project_status_workflow = 'Fund Secured' 
AND t.transaction_status = 'Project Created';

-- Update transactions that have project status "Fund Secured" but transaction status "Project Created"
UPDATE transactions 
SET transaction_status = 'Fund Secured',
    updated_at = NOW()
WHERE id IN (
    SELECT t.id
    FROM transactions t
    JOIN projects p ON t.project_id = p.id
    WHERE p.project_status_workflow = 'Fund Secured' 
    AND t.transaction_status = 'Project Created'
);

-- Verify the update
SELECT 
    t.id,
    t.transaction_id,
    t.transaction_status,
    t.transaction_value,
    p.project_status_workflow,
    p.project_id
FROM transactions t
JOIN projects p ON t.project_id = p.id
WHERE p.project_status_workflow = 'Fund Secured'; 