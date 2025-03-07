/*
  # Evaluation Schema Setup

  1. New Types
    - cognitive_category enum for categorizing questions
    
  2. New Tables
    - questions: Stores assessment questions with categories and answer options
    - evaluations: Records user responses to questions
    
  3. Security
    - RLS enabled on all tables
    - Policies for user access control
    - Admin-specific permissions
    
  4. Data Management
    - Automatic timestamp updates
    - Initial question set for inhibition assessment
*/

-- Create type for cognitive categories if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cognitive_category') THEN
    CREATE TYPE cognitive_category AS ENUM (
      'Inhibition',
      'Flexibilité cognitive',
      'Contrôle émotionnel',
      'Initiative',
      'Mémoire de travail',
      'Planification et organisation',
      'Auto-régulation'
    );
  END IF;
END $$;

-- Create questions table if it doesn't exist
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category cognitive_category NOT NULL,
  question text NOT NULL,
  answers jsonb NOT NULL DEFAULT '[
    {"text": "Jamais", "score": 0.0},
    {"text": "Parfois", "score": 1.0},
    {"text": "Souvent", "score": 2.0},
    {"text": "Très souvent", "score": 3.0}
  ]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT answers_is_array CHECK (jsonb_typeof(answers) = 'array'),
  CONSTRAINT answers_not_empty CHECK (jsonb_array_length(answers) > 0)
);

-- Create evaluations table if it doesn't exist
CREATE TABLE IF NOT EXISTS evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  question_id uuid NOT NULL REFERENCES questions(id),
  selected_score numeric(3,1) NOT NULL CHECK (selected_score >= 0 AND selected_score <= 3),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, question_id, created_at)
);

-- Enable RLS on tables
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

-- Create or replace function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for questions table
DO $$ 
BEGIN
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

-- Drop existing policies to avoid conflicts
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can insert their own evaluations" ON evaluations;
  DROP POLICY IF EXISTS "Users can read their own evaluations" ON evaluations;
  DROP POLICY IF EXISTS "Allow authenticated users to read questions" ON questions;
  DROP POLICY IF EXISTS "Allow admin users to manage questions" ON questions;
END $$;

-- Create policies
CREATE POLICY "Users can insert their own evaluations"
  ON evaluations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own evaluations"
  ON evaluations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to read questions"
  ON questions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow admin users to manage questions"
  ON questions
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- Insert initial questions if they don't exist
INSERT INTO questions (category, question)
SELECT v.category::cognitive_category, v.question
FROM (VALUES
  ('Inhibition'::cognitive_category, 'L''enfant a des difficultés à rester assis(e) lorsqu''il/elle doit se concentrer'),
  ('Inhibition'::cognitive_category, 'Il/elle parle sans attendre son tour'),
  ('Inhibition'::cognitive_category, 'Il/elle a du mal à attendre avant de parler ou d''agir'),
  ('Inhibition'::cognitive_category, 'Il/elle interrompt les conversations sans réfléchir'),
  ('Inhibition'::cognitive_category, 'Il/elle agit impulsivement sans considérer les conséquences'),
  ('Inhibition'::cognitive_category, 'Il/elle se lève à des moments inappropriés'),
  ('Inhibition'::cognitive_category, 'Il/elle réagit plus rapidement que les autres sans réflexion'),
  ('Inhibition'::cognitive_category, 'Il/elle parle à voix haute sans toujours en être conscient(e)'),
  ('Inhibition'::cognitive_category, 'Il/elle parle trop fort dans certaines situations'),
  ('Inhibition'::cognitive_category, 'Il/elle prend la parole à des moments inappropriés')
) AS v(category, question)
WHERE NOT EXISTS (
  SELECT 1 FROM questions q 
  WHERE q.question = v.question
);
