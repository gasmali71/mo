/*
  # Database Verification and Fixes

  1. Verification
    - Check auth.users table structure
    - Verify user_profiles table and constraints
    - Validate triggers and functions
    - Check foreign key relationships

  2. Security
    - Verify RLS policies
    - Ensure proper role permissions
    - Add missing security policies if needed

  3. Fixes
    - Add any missing columns
    - Correct data types and constraints
    - Update triggers for proper user creation flow
*/

-- First, verify and fix auth.users table
DO $$
BEGIN
  -- Verify email column in auth.users
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'auth' 
    AND table_name = 'users' 
    AND column_name = 'email'
  ) THEN
    RAISE EXCEPTION 'Critical error: email column missing in auth.users';
  END IF;

  -- Verify id column in auth.users
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'auth' 
    AND table_name = 'users' 
    AND column_name = 'id'
  ) THEN
    RAISE EXCEPTION 'Critical error: id column missing in auth.users';
  END IF;
END $$;

-- Verify and fix user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  plan_type text NOT NULL DEFAULT 'freemium',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_plan_type CHECK (plan_type IN ('freemium', 'basic', 'premium')),
  CONSTRAINT user_profiles_email_unique UNIQUE (email)
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Safely recreate the user registration function
CREATE OR REPLACE FUNCTION handle_new_user_registration()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id,
    user_id,
    full_name,
    email,
    plan_type,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'plan_type', 'freemium'),
    NOW(),
    NOW()
  ) ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Safely recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_registration();

-- Safely recreate policies
DO $$
BEGIN
  -- Drop existing policies
  DROP POLICY IF EXISTS "Users can read own profile" ON public.user_profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
  
  -- Create new policies
  CREATE POLICY "Users can read own profile"
    ON public.user_profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

  CREATE POLICY "Users can update own profile"
    ON public.user_profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
END $$;

-- Create or update indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_plan_type ON public.user_profiles(plan_type);

-- Verify foreign key relationship
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
    AND table_name = 'user_profiles'
    AND constraint_type = 'FOREIGN KEY'
    AND constraint_name = 'user_profiles_user_id_fkey'
  ) THEN
    ALTER TABLE public.user_profiles
    ADD CONSTRAINT user_profiles_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;
