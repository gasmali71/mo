/*
  # Test Results Integration Schema

  1. New Tables
    - `test_results`
      - `id` (uuid, primary key)
      - `student_id` (uuid, foreign key)
      - `test_type` (cognitive_category)
      - `score` (numeric)
      - `detailed_results` (jsonb)
      - `completed_at` (timestamp)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS
    - Policies for student and evaluator access
*/

-- Create test results table
CREATE TABLE IF NOT EXISTS test_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  test_type cognitive_category NOT NULL,
  score numeric(5,2) NOT NULL CHECK (score >= 0 AND score <= 100),
  detailed_results jsonb NOT NULL DEFAULT '{}',
  completed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX test_results_student_id_idx ON test_results(student_id);
CREATE INDEX test_results_completed_at_idx ON test_results(completed_at DESC);

-- Add trigger for updating updated_at
CREATE TRIGGER update_test_results_updated_at
  BEFORE UPDATE ON test_results
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read their own test results"
  ON test_results
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = test_results.student_id
      AND students.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert test results for their students"
  ON test_results
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = test_results.student_id
      AND students.user_id = auth.uid()
    )
  );
