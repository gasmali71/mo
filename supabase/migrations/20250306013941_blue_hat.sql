/*
  # Add Unique Constraint to Questions Table

  1. Changes
    - Add a unique constraint to the question column in the questions table
    
  2. Notes
    - This ensures no duplicate questions can be added
    - Safe operation as we already have unique values
*/

-- Add unique constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'unique_question'
    AND table_name = 'questions'
  ) THEN
    ALTER TABLE questions ADD CONSTRAINT unique_question UNIQUE (question);
  END IF;
END $$;
