-- Add "Project Created" status to transaction_status and set as default
-- This script updates the transactions table to include "Project Created" as a valid status and default value

-- 1. First, let's create a temporary function to safely update the CHECK constraint
CREATE OR REPLACE FUNCTION update_transaction_status_constraint()
RETURNS VOID AS $$
BEGIN
    -- Drop the existing CHECK constraint
    ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_transaction_status_check;
    
    -- Add the new CHECK constraint with the additional status
    ALTER TABLE transactions ADD CONSTRAINT transactions_transaction_status_check 
    CHECK (transaction_status IN (
        'Project Created',
        'Project under Manual Review', 
        'Fund Secured',
        'Successfully closed',
        'Chargeback'
    ));
    
    -- Update the default value for transaction_status
    ALTER TABLE transactions ALTER COLUMN transaction_status SET DEFAULT 'Project Created';
END;
$$ LANGUAGE plpgsql;

-- 2. Execute the function to update the constraint and default
SELECT update_transaction_status_constraint();

-- 3. Drop the temporary function
DROP FUNCTION update_transaction_status_constraint();

-- 4. Add comment to document the new default status
COMMENT ON COLUMN transactions.transaction_status IS 'Status of the transaction with Project Created as default value';

-- 5. Create a function to get all valid transaction statuses
CREATE OR REPLACE FUNCTION get_valid_transaction_statuses()
RETURNS TABLE(status_value VARCHAR(50)) AS $$
BEGIN
    RETURN QUERY
    SELECT unnest(ARRAY[
        'Project Created'::VARCHAR(50),
        'Project under Manual Review'::VARCHAR(50), 
        'Fund Secured'::VARCHAR(50),
        'Successfully closed'::VARCHAR(50),
        'Chargeback'::VARCHAR(50)
    ]);
END;
$$ LANGUAGE plpgsql;

-- 6. Add comment to the new function
COMMENT ON FUNCTION get_valid_transaction_statuses() IS 'Returns all valid transaction status values including Project Created as default';

-- 7. Verify the changes by checking the constraint and default
SELECT 
    column_name,
    column_default,
    is_nullable,
    data_type
FROM information_schema.columns 
WHERE table_name = 'transactions' 
AND column_name = 'transaction_status';

-- 8. Verify the constraint definition
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'transactions'::regclass 
AND conname = 'transactions_transaction_status_check'; 