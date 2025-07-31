-- Create Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    transaction_id BIGINT PRIMARY KEY,
    project_id VARCHAR(10) NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    client_fee DECIMAL(10,2) NOT NULL,
    freelancer_fee DECIMAL(10,2) NOT NULL,
    freelancer_amount DECIMAL(10,2) NOT NULL,
    transaction_status VARCHAR(20) NOT NULL DEFAULT 'Project Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE
);

-- Create sequence for auto-incrementing transaction_id
CREATE SEQUENCE IF NOT EXISTS transaction_id_seq START 1000000001;

-- Create function to auto-generate transaction_id
CREATE OR REPLACE FUNCTION generate_transaction_id()
RETURNS BIGINT AS $$
BEGIN
    RETURN nextval('transaction_id_seq');
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-assign transaction_id
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

-- Create function to calculate fees and amounts
CREATE OR REPLACE FUNCTION calculate_transaction_fees()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate fees based on value
    NEW.client_fee := ROUND(NEW.value * 0.035, 2); -- 3.5% of value
    NEW.freelancer_fee := ROUND(NEW.value * 0.035, 2); -- 3.5% of value
    NEW.freelancer_amount := ROUND(NEW.value * 0.93, 2); -- 93% of value
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-calculate fees
CREATE TRIGGER calculate_fees_trigger
    BEFORE INSERT OR UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION calculate_transaction_fees();

-- Create RLS policies
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Policy for clients to view their own transactions
CREATE POLICY "Clients can view their own transactions" ON transactions
    FOR SELECT USING (
        project_id IN (
            SELECT project_id FROM projects 
            WHERE client_id = auth.uid()
        )
    );

-- Policy for clients to insert their own transactions
CREATE POLICY "Clients can insert their own transactions" ON transactions
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT project_id FROM projects 
            WHERE client_id = auth.uid()
        )
    );

-- Policy for clients to update their own transactions
CREATE POLICY "Clients can update their own transactions" ON transactions
    FOR UPDATE USING (
        project_id IN (
            SELECT project_id FROM projects 
            WHERE client_id = auth.uid()
        )
    );

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_project_id ON transactions(project_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(transaction_status); 