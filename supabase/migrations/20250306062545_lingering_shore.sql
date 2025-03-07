/*
  # Create Test Results Schema

  1. New Tables
    - `test_results`
      - `id` (uuid, primary key)
      - `student_id` (uuid, references students)
      - `test_type` (cognitive_category)
      - `score` (numeric)
      - `detailed_results` (jsonb)
      - `completed_at` (timestamp)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on test_results table
    - Add policies for authenticated users
*/

-- Create test_results table
CREATE TABLE IF NOT EXISTS test_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  test_type cognitive_category NOT NULL,
  score numeric(5,2) NOT NULL CHECK (score >= 0 AND score <= 100),
  detailed_results jsonb NOT NULL DEFAULT '{}',
  completed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS test_results_student_id_idx ON test_results(student_id);
CREATE INDEX IF NOT EXISTS test_results_completed_at_idx ON test_results(completed_at DESC);

-- Enable Row Level Security
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DO $$ BEGIN
  CREATE POLICY "Users can read their own test results"
    ON test_results
    FOR SELECT
    TO authenticated
    USING (auth.uid() = student_id);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert their own test results"
    ON test_results
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = student_id);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update their own test results"
    ON test_results
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = student_id)
    WITH CHECK (auth.uid() = student_id);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create trigger for updating updated_at
DO $$ BEGIN
  CREATE TRIGGER update_test_results_updated_at
    BEFORE UPDATE ON test_results
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
