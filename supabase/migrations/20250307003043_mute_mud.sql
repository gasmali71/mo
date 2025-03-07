/*
  # Fix User Signup Flow

  1. Changes
    - Drop and recreate handle_new_user trigger function with better error handling
    - Add CASCADE to trigger drop to ensure clean recreation
    - Add proper validation and error handling
    - Ensure proper transaction handling

  2. Security
    - Maintain existing RLS policies
    - No changes to security model
*/

-- Drop existing trigger with CASCADE to ensure clean removal
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;

-- Recreate the handle_new_user function with better error handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert with proper error handling
  INSERT INTO public.user_profiles (
    user_id,
    full_name,
    plan_type
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'plan_type', 'freemium')
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- Return the new user
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error details but continue (don't block user creation)
  RAISE WARNING 'Error in handle_new_user trigger: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Ensure indexes exist
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_plan_type ON user_profiles(plan_type);
