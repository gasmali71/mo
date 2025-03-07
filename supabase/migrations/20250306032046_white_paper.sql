/*
  # Database Schema for Cognitive Assessment System

  1. Tables
    - students: Student information
    - guardians: Student guardian information
    - questions: Assessment questions
    - test_sessions: Test session tracking
    - test_responses: Student responses to questions

  2. Security
    - RLS enabled on all tables
    - Policies for user-specific access control
    - Cascading deletes for related records

  3. Data Validation
    - Check constraints for scores and status values
    - Default values for timestamps
    - Unique constraints where appropriate
*/

-- Create students table if it doesn't exist
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  full_name text NOT NULL,
  date_of_birth date NOT NULL,
  grade_level text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on students table
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Create guardians table if it doesn't exist
CREATE TABLE IF NOT EXISTS guardians (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  relationship text NOT NULL,
  email text,
  phone text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on guardians table
ALTER TABLE guardians ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  -- Create policy for guardians if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'guardians' 
    AND policyname = 'Users can read guardians of their students'
  ) THEN
    CREATE POLICY "Users can read guardians of their students"
      ON guardians
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM students
          WHERE students.id = guardians.student_id
          AND students.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'guardians' 
    AND policyname = 'Users can insert guardians for their students'
  ) THEN
    CREATE POLICY "Users can insert guardians for their students"
      ON guardians
      FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM students
          WHERE students.id = guardians.student_id
          AND students.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Create questions table if it doesn't exist
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL CHECK (
    category IN (
      'Inhibition',
      'Flexibilité cognitive',
      'Contrôle émotionnel',
      'Initiative',
      'Mémoire de travail',
      'Planification et organisation',
      'Auto-régulation'
    )
  ),
  question text NOT NULL,
  answers jsonb NOT NULL DEFAULT '[{"text": "Jamais", "score": 0.0}, {"text": "Parfois", "score": 1.0}, {"text": "Souvent", "score": 2.0}, {"text": "Très souvent", "score": 3.0}]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_question UNIQUE (question),
  CONSTRAINT answers_is_array CHECK (jsonb_typeof(answers) = 'array'),
  CONSTRAINT answers_not_empty CHECK (jsonb_array_length(answers) > 0)
);

-- Enable RLS on questions table
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  -- Create policies for questions if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'questions' 
    AND policyname = 'Allow authenticated users to read questions'
  ) THEN
    CREATE POLICY "Allow authenticated users to read questions"
      ON questions
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'questions' 
    AND policyname = 'Allow admin users to manage questions'
  ) THEN
    CREATE POLICY "Allow admin users to manage questions"
      ON questions
      FOR ALL
      TO authenticated
      USING (auth.jwt() ->> 'role' = 'admin');
  END IF;
END $$;

-- Create test_sessions table if it doesn't exist
CREATE TABLE IF NOT EXISTS test_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  evaluator_id uuid NOT NULL REFERENCES auth.users(id),
  start_time timestamptz DEFAULT now(),
  end_time timestamptz,
  status text NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT test_sessions_status_check CHECK (
    status = ANY (ARRAY['pending', 'in_progress', 'completed', 'cancelled'])
  )
);

-- Enable RLS on test_sessions table
ALTER TABLE test_sessions ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  -- Create policies for test_sessions if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'test_sessions' 
    AND policyname = 'Users can read their test sessions'
  ) THEN
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
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'test_sessions' 
    AND policyname = 'Users can insert test sessions'
  ) THEN
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
  END IF;
END $$;

-- Create test_responses table if it doesn't exist
CREATE TABLE IF NOT EXISTS test_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES test_sessions(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES questions(id),
  answer_score numeric(3,1) NOT NULL,
  response_time interval NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT test_responses_answer_score_check CHECK (
    answer_score >= 0 AND answer_score <= 3
  )
);

-- Enable RLS on test_responses table
ALTER TABLE test_responses ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  -- Create policies for test_responses if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'test_responses' 
    AND policyname = 'Users can read their test responses'
  ) THEN
    CREATE POLICY "Users can read their test responses"
      ON test_responses
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
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
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'test_responses' 
    AND policyname = 'Users can insert test responses'
  ) THEN
    CREATE POLICY "Users can insert test responses"
      ON test_responses
      FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
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
        )
      );
  END IF;
END $$;

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_students_updated_at'
  ) THEN
    CREATE TRIGGER update_students_updated_at
      BEFORE UPDATE ON students
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_questions_updated_at'
  ) THEN
    CREATE TRIGGER update_questions_updated_at
      BEFORE UPDATE ON questions
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
