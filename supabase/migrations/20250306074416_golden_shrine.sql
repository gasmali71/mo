/*
  # Create test_results table

  1. New Tables
    - `test_results`
      - `id` (uuid, primary key)
      - `student_id` (uuid, references students)
      - `test_type` (cognitive_category)
      - `score` (numeric(5,2))
      - `detailed_results` (jsonb)
      - `completed_at` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on test_results table
    - Add policies for authenticated users to:
      - Read their own test results
      - Insert their own test results

  3. Indexes
    - On student_id for faster lookups
    - On completed_at for chronological sorting
*/

-- Drop existing objects if they exist
DO $$ 
BEGIN
  -- Drop policies if they exist
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'test_results' 
    AND policyname IN ('Users can read their own test results', 'Users can insert their own test results')
  ) THEN
    DROP POLICY IF EXISTS "Users can read their own test results" ON test_results;
    DROP POLICY IF EXISTS "Users can insert their own test results" ON test_results;
  END IF;

  -- Drop table if it exists
  DROP TABLE IF EXISTS test_results;
END $$;

-- Create test_results table
CREATE TABLE test_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  test_type cognitive_category NOT NULL,
  score numeric(5,2) NOT NULL CHECK (score >= 0 AND score <= 100),
  detailed_results jsonb NOT NULL DEFAULT '{}',
  completed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read their own test results"
  ON test_results
  FOR SELECT
  TO authenticated
  USING (auth.uid() = student_id);

CREATE POLICY "Users can insert their own test results"
  ON test_results
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = student_id);

-- Create updated_at trigger
CREATE TRIGGER update_test_results_updated_at
  BEFORE UPDATE ON test_results
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX test_results_student_id_idx ON test_results(student_id);
CREATE INDEX test_results_completed_at_idx ON test_results(completed_at DESC);
