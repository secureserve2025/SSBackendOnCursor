-- Update Existing Transaction Fees
-- This script updates all existing transactions to have the correct fee calculations

-- First, let's see the current state of transactions
SELECT 
    transaction_id,
    project_id,
    transaction_value,
    fee_from_client,
    fee_from_freelancer,
    freelancer_amount,
    created_at
FROM transactions 
ORDER BY created_at DESC
LIMIT 10;

-- Update all existing transactions to recalculate fees
UPDATE transactions 
SET 
    fee_from_client = ROUND((transaction_value * 0.035)::NUMERIC, 2),
    fee_from_freelancer = ROUND((transaction_value * 0.035)::NUMERIC, 2),
    freelancer_amount = ROUND((transaction_value * 0.93)::NUMERIC, 2),
    updated_at = NOW()
WHERE transaction_value IS NOT NULL;

-- Verify the updates
SELECT 
    transaction_id,
    project_id,
    transaction_value,
    fee_from_client,
    fee_from_freelancer,
    freelancer_amount,
    ROUND((transaction_value * 0.035)::NUMERIC, 2) as expected_fee_from_client,
    ROUND((transaction_value * 0.035)::NUMERIC, 2) as expected_fee_from_freelancer,
    ROUND((transaction_value * 0.93)::NUMERIC, 2) as expected_freelancer_amount,
    updated_at
FROM transactions 
ORDER BY updated_at DESC
LIMIT 10;

-- Show summary of fee calculations
SELECT 
    COUNT(*) as total_transactions,
    SUM(transaction_value) as total_transaction_value,
    SUM(fee_from_client) as total_fee_from_client,
    SUM(fee_from_freelancer) as total_fee_from_freelancer,
    SUM(freelancer_amount) as total_freelancer_amount,
    ROUND(AVG(transaction_value), 2) as avg_transaction_value
FROM transactions 
WHERE transaction_value IS NOT NULL;











