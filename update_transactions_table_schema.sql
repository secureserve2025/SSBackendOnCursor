-- Update Transactions table to match current schema
-- This script updates the transactions table to use UUID project_id instead of VARCHAR

-- 1. First, let's check if we need to update the transactions table structure
-- The current transactions table might be using the old schema with VARCHAR project_id

-- 2. Create a backup of existing transactions data (if any)
-- Note: This is a safety measure - you may want to backup your data first

-- 3. Drop the existing transactions table and recreate with correct schema
DROP TABLE IF EXISTS transactions CASCADE;

-- 4. Create the updated transactions table with correct schema
CREATE TABLE transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    transaction_id BIGINT UNIQUE NOT NULL,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    transaction_value DECIMAL(10,2) NOT NULL,
    client_fee DECIMAL(10,2) NOT NULL,
    freelancer_fee DECIMAL(10,2) NOT NULL,
    freelancer_amount DECIMAL(10,2) NOT NULL,
    transaction_status VARCHAR(50) NOT NULL DEFAULT 'Project Created' 
    CHECK (transaction_status IN (
        'Project Created',
        'Project under Manual Review',
        'Fund Secured',
        'Successfully closed',
        'Chargeback'
    )),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create sequence for auto-incrementing transaction_id
CREATE SEQUENCE IF NOT EXISTS transaction_id_seq START 1000000001;

-- 6. Create function to auto-generate transaction_id
CREATE OR REPLACE FUNCTION generate_transaction_id()
RETURNS BIGINT AS $$
BEGIN
    RETURN nextval('transaction_id_seq');
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger to auto-assign transaction_id
CREATE OR REPLACE FUNCTION set_transaction_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.transaction_id IS NULL THEN
        NEW.transaction_id := generate_transaction_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_transaction_id_trigger
    BEFORE INSERT ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION set_transaction_id();

-- 8. Create function to calculate fees and amounts
CREATE OR REPLACE FUNCTION calculate_transaction_fees()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate fees based on transaction_value
    NEW.client_fee := ROUND(NEW.transaction_value * 0.035, 2); -- 3.5% of value
    NEW.freelancer_fee := ROUND(NEW.transaction_value * 0.035, 2); -- 3.5% of value
    NEW.freelancer_amount := ROUND(NEW.transaction_value * 0.93, 2); -- 93% of value
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Create trigger to auto-calculate fees
CREATE TRIGGER calculate_fees_trigger
    BEFORE INSERT OR UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION calculate_transaction_fees();

-- 10. Enable RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 11. Create RLS policies
-- Policy for clients to view their own transactions
CREATE POLICY "Clients can view their own transactions" ON transactions
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects 
            WHERE client_id = auth.uid()
        )
    );

-- Policy for clients to insert their own transactions
CREATE POLICY "Clients can insert their own transactions" ON transactions
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT id FROM projects 
            WHERE client_id = auth.uid()
        )
    );

-- Policy for clients to update their own transactions
CREATE POLICY "Clients can update their own transactions" ON transactions
    FOR UPDATE USING (
        project_id IN (
            SELECT id FROM projects 
            WHERE client_id = auth.uid()
        )
    );

-- 12. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_project_id ON transactions(project_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(transaction_status);
CREATE INDEX IF NOT EXISTS idx_transactions_transaction_id ON transactions(transaction_id);

-- 13. Add comments for documentation
COMMENT ON TABLE transactions IS 'Updated transactions table with UUID project_id and correct foreign key references';
COMMENT ON COLUMN transactions.project_id IS 'UUID reference to projects(id) with CASCADE DELETE';
COMMENT ON COLUMN transactions.transaction_status IS 'Status of the transaction with Project Created as default value';

-- 14. Verify the table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'transactions' 
ORDER BY ordinal_position;

-- 15. Verify the foreign key constraint
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'transactions'; 