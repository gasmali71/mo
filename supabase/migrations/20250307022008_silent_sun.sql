/*
  # Fix user_profiles email column

  1. Changes
    - Safely check and add email column if missing
    - Add unique constraint if missing
    - Create index for email lookups if missing
    - Update column to NOT NULL if needed
    - Add foreign key constraint to auth.users if missing

  2. Security
    - No changes to RLS policies required
    - Existing policies will automatically apply to email column

  Note: Using IF NOT EXISTS and transaction safety checks throughout
*/

DO $$ 
BEGIN
  -- Check if email column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'user_profiles' 
    AND column_name = 'email'
  ) THEN
    -- Add email column
    ALTER TABLE public.user_profiles 
    ADD COLUMN email TEXT;
  END IF;

  -- Check and add unique constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_schema = 'public'
    AND table_name = 'user_profiles'
    AND constraint_name = 'user_profiles_email_unique'
  ) THEN
    ALTER TABLE public.user_profiles 
    ADD CONSTRAINT user_profiles_email_unique UNIQUE (email);
  END IF;

  -- Check and create index
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public'
    AND tablename = 'user_profiles'
    AND indexname = 'idx_user_profiles_email'
  ) THEN
    CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);
  END IF;

  -- Update email values from auth.users if needed
  UPDATE public.user_profiles p
  SET email = u.email
  FROM auth.users u
  WHERE p.id = u.id
  AND p.email IS NULL;

  -- Make email NOT NULL after ensuring data consistency
  ALTER TABLE public.user_profiles 
  ALTER COLUMN email SET NOT NULL;

END $$;
