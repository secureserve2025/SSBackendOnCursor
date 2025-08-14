-- Fix Transaction Fees Trigger
-- This script creates a trigger to automatically update fee fields when transaction_value changes

-- First, let's check the current structure of the transactions table
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'transactions' 
ORDER BY ordinal_position;

-- Create a function to calculate and update the fee fields
CREATE OR REPLACE FUNCTION update_transaction_fees()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate fees based on the new transaction_value
    -- fee_from_client = 3.5% of transaction_value
    NEW.fee_from_client := ROUND((NEW.transaction_value * 0.035)::NUMERIC, 2);
    
    -- fee_from_freelancer = 3.5% of transaction_value  
    NEW.fee_from_freelancer := ROUND((NEW.transaction_value * 0.035)::NUMERIC, 2);
    
    -- freelancer_amount = 93% of transaction_value
    NEW.freelancer_amount := ROUND((NEW.transaction_value * 0.93)::NUMERIC, 2);
    
    -- Update the updated_at timestamp
    NEW.updated_at := NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger to automatically update fees when transaction_value changes
DROP TRIGGER IF EXISTS trigger_update_transaction_fees ON transactions;

CREATE TRIGGER trigger_update_transaction_fees
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    WHEN (OLD.transaction_value IS DISTINCT FROM NEW.transaction_value)
    EXECUTE FUNCTION update_transaction_fees();

-- Also create a trigger for INSERT to ensure fees are calculated when new transactions are created
DROP TRIGGER IF EXISTS trigger_insert_transaction_fees ON transactions;

CREATE TRIGGER trigger_insert_transaction_fees
    BEFORE INSERT ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_transaction_fees();

-- Test the trigger by updating an existing transaction
-- (This is just for testing - you can comment this out after running)
-- UPDATE transactions 
-- SET transaction_value = transaction_value 
-- WHERE transaction_id = (SELECT transaction_id FROM transactions LIMIT 1);

-- Verify the trigger was created
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'transactions'
ORDER BY trigger_name;

-- Show the function definition
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'update_transaction_fees';











