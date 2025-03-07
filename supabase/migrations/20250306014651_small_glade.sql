/*
  # Insert New Question

  1. Changes
    - Add a new question for the Inhibition category
    
  2. Notes
    - Uses ON CONFLICT to handle potential duplicates
    - Maintains data integrity with existing unique constraint
*/

INSERT INTO questions (category, question)
VALUES (
  'Inhibition',
  'J''ai du mal à rester assis calmement lorsque je dois me concentrer.'
)
ON CONFLICT (question) DO NOTHING;
