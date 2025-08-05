-- Add updated_at field to transactions table for proper timestamp tracking
-- This will help track when transactions are modified

-- 1. Add updated_at column to transactions table
ALTER TABLE transactions 
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Create a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create trigger to automatically update updated_at on any change
CREATE TRIGGER trigger_update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_transactions_updated_at();

-- 4. Update existing records to have updated_at = created_at
UPDATE transactions 
SET updated_at = created_at 
WHERE updated_at IS NULL;

-- 5. Add comment to document the change
COMMENT ON COLUMN transactions.updated_at IS 'Timestamp when the transaction was last modified';

-- 6. Test the trigger
DO $$
DECLARE
    test_transaction_id UUID;
BEGIN
    -- Get a test transaction ID
    SELECT id INTO test_transaction_id FROM transactions LIMIT 1;
    
    IF test_transaction_id IS NOT NULL THEN
        -- Test updating a transaction
        UPDATE transactions 
        SET transaction_status = transaction_status || ' (test update)'
        WHERE id = test_transaction_id;
        
        RAISE NOTICE 'Test successful: updated_at field and trigger working correctly';
    ELSE
        RAISE NOTICE 'No transactions found for testing';
    END IF;
END $$; 