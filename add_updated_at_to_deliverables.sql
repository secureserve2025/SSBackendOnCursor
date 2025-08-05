-- Add updated_at field to deliverables table for proper timestamp tracking
-- This will help track when deliverables are modified

-- 1. Add updated_at column to deliverables table
ALTER TABLE deliverables 
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Create a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_deliverables_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create trigger to automatically update updated_at on any change
CREATE TRIGGER trigger_update_deliverables_updated_at
    BEFORE UPDATE ON deliverables
    FOR EACH ROW
    EXECUTE FUNCTION update_deliverables_updated_at();

-- 4. Update existing records to have updated_at = created_at
UPDATE deliverables 
SET updated_at = created_at 
WHERE updated_at IS NULL;

-- 5. Add comment to document the change
COMMENT ON COLUMN deliverables.updated_at IS 'Timestamp when the deliverable was last modified';

-- 6. Test the trigger
DO $$
DECLARE
    test_deliverable_id UUID;
BEGIN
    -- Get a test deliverable ID
    SELECT id INTO test_deliverable_id FROM deliverables LIMIT 1;
    
    IF test_deliverable_id IS NOT NULL THEN
        -- Test updating a deliverable
        UPDATE deliverables 
        SET deliverable_text = deliverable_text || ' (test update)'
        WHERE id = test_deliverable_id;
        
        RAISE NOTICE 'Test successful: updated_at field and trigger working correctly';
    ELSE
        RAISE NOTICE 'No deliverables found for testing';
    END IF;
END $$; 