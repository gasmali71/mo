/*
  # Add email column to user_profiles table

  1. Changes
    - Add email column to user_profiles table
    - Add unique constraint on email
    - Create index for email lookups

  2. Security
    - No changes to RLS policies required
    - Existing policies will automatically apply to new column

  Note: Using IF NOT EXISTS to prevent errors if column already exists
*/

DO $$ 
BEGIN
  -- Add email column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'email'
  ) THEN
    ALTER TABLE public.user_profiles 
    ADD COLUMN email TEXT;

    -- Add unique constraint
    ALTER TABLE public.user_profiles 
    ADD CONSTRAINT user_profiles_email_unique UNIQUE (email);

    -- Create index for email lookups if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE tablename = 'user_profiles' 
      AND indexname = 'idx_user_profiles_email'
    ) THEN
      CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);
    END IF;
  END IF;
END $$;
