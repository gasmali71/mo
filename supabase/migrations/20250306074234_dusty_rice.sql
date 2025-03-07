/*
  # Add session_id column to test_results table

  1. Changes
    - Add session_id column to test_results table if it doesn't exist
    - Create index on session_id column
    - Add foreign key constraint to test_sessions table

  2. Security
    - No changes to existing RLS policies
*/

-- Check if session_id column exists and add it if it doesn't
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'test_results' 
    AND column_name = 'session_id'
  ) THEN
    -- Add session_id column
    ALTER TABLE test_results 
    ADD COLUMN session_id UUID REFERENCES test_sessions(id);

    -- Create index on session_id
    CREATE INDEX test_results_session_id_idx ON test_results(session_id);
  END IF;
END $$;
