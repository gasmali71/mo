/*
  # Test Results Schema Implementation

  1. New Tables
    - test_results
      - id (uuid, primary key)
      - student_id (uuid, references students)
      - test_type (cognitive_category)
      - score (numeric, 0-100)
      - detailed_results (jsonb)
      - completed_at (timestamp)
      - created_at (timestamp)
      - updated_at (timestamp)

  2. Security
    - Enable RLS
    - Add policies for authenticated users to:
      - Insert their own test results
      - Read their own test results

  3. Indexes
    - student_id for faster lookups
    - completed_at for chronological sorting

  4. Triggers
    - Automatic updated_at timestamp
*/

-- Create enum type if it doesn't exist
DO $$ BEGIN
  CREATE TYPE cognitive_category AS ENUM (
    'Inhibition',
    'Flexibilité cognitive',
    'Contrôle émotionnel',
    'Initiative',
    'Mémoire de travail',
    'Planification et organisation',
    'Auto-régulation'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create test_results table
CREATE TABLE IF NOT EXISTS test_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  test_type cognitive_category NOT NULL,
  score numeric(5,2) NOT NULL CHECK (score >= 0 AND score <= 100),
  detailed_results jsonb NOT NULL DEFAULT '{}'::jsonb,
  completed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;

-- Create policies
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can insert their own test results" ON test_results;
  CREATE POLICY "Users can insert their own test results"
    ON test_results
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() IN (
      SELECT user_id FROM students WHERE id = student_id
    ));
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can read their own test results" ON test_results;
  CREATE POLICY "Users can read their own test results"
    ON test_results
    FOR SELECT
    TO authenticated
    USING (auth.uid() IN (
      SELECT user_id FROM students WHERE id = student_id
    ));
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS test_results_student_id_idx ON test_results(student_id);
CREATE INDEX IF NOT EXISTS test_results_completed_at_idx ON test_results(completed_at DESC);

-- Create or replace updated_at function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_test_results_updated_at ON test_results;
CREATE TRIGGER update_test_results_updated_at
  BEFORE UPDATE ON test_results
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
