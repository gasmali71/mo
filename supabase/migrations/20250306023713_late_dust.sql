/*
  # Create students and related tables

  1. New Tables
    - `students`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `full_name` (text)
      - `date_of_birth` (date)
      - `grade_level` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `guardians`
      - `id` (uuid, primary key)
      - `student_id` (uuid, references students)
      - `full_name` (text)
      - `relationship` (text)
      - `email` (text)
      - `phone` (text)
      - `created_at` (timestamp)

    - `test_sessions`
      - `id` (uuid, primary key)
      - `student_id` (uuid, references students)
      - `evaluator_id` (uuid, references auth.users)
      - `start_time` (timestamp)
      - `end_time` (timestamp)
      - `status` (text)
      - `created_at` (timestamp)

    - `test_responses`
      - `id` (uuid, primary key)
      - `session_id` (uuid, references test_sessions)
      - `question_id` (uuid, references questions)
      - `answer_score` (numeric)
      - `response_time` (interval)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  full_name text NOT NULL,
  date_of_birth date NOT NULL,
  grade_level text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own students"
  ON students
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own students"
  ON students
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own students"
  ON students
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create guardians table
CREATE TABLE IF NOT EXISTS guardians (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students ON DELETE CASCADE NOT NULL,
  full_name text NOT NULL,
  relationship text NOT NULL,
  email text,
  phone text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE guardians ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read guardians of their students"
  ON guardians
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM students
    WHERE students.id = guardians.student_id
    AND students.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert guardians for their students"
  ON guardians
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM students
    WHERE students.id = guardians.student_id
    AND students.user_id = auth.uid()
  ));

-- Create test_sessions table
CREATE TABLE IF NOT EXISTS test_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students ON DELETE CASCADE NOT NULL,
  evaluator_id uuid REFERENCES auth.users NOT NULL,
  start_time timestamptz DEFAULT now(),
  end_time timestamptz,
  status text NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE test_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their test sessions"
  ON test_sessions
  FOR SELECT
  TO authenticated
  USING (
    evaluator_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = test_sessions.student_id
      AND students.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert test sessions"
  ON test_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    evaluator_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = test_sessions.student_id
      AND students.user_id = auth.uid()
    )
  );

-- Create test_responses table
CREATE TABLE IF NOT EXISTS test_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES test_sessions ON DELETE CASCADE NOT NULL,
  question_id uuid REFERENCES questions NOT NULL,
  answer_score numeric(3,1) NOT NULL CHECK (answer_score >= 0 AND answer_score <= 3),
  response_time interval NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE test_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their test responses"
  ON test_responses
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM test_sessions
    WHERE test_sessions.id = test_responses.session_id
    AND (
      test_sessions.evaluator_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM students
        WHERE students.id = test_sessions.student_id
        AND students.user_id = auth.uid()
      )
    )
  ));

CREATE POLICY "Users can insert test responses"
  ON test_responses
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM test_sessions
    WHERE test_sessions.id = test_responses.session_id
    AND (
      test_sessions.evaluator_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM students
        WHERE students.id = test_sessions.student_id
        AND students.user_id = auth.uid()
      )
    )
  ));

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
