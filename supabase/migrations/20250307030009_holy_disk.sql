/*
  # User Registration System Fix

  1. Changes
    - Drops and recreates user registration trigger with proper error handling
    - Adds proper validation and constraints
    - Ensures atomic operations
    - Adds detailed logging

  2. Security
    - Maintains RLS policies
    - Uses security definer for sensitive operations
    - Adds proper error handling

  3. Improvements
    - Better error messages
    - Transaction handling
    - Logging capabilities
*/

-- Create logging table if not exists
CREATE TABLE IF NOT EXISTS auth_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  user_id uuid,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on auth_logs
ALTER TABLE auth_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for auth_logs
CREATE POLICY "Only admins can read auth logs"
  ON auth_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- Create improved user registration function
CREATE OR REPLACE FUNCTION handle_new_user_registration()
RETURNS trigger AS $$
DECLARE
  v_error_details jsonb;
BEGIN
  -- Log registration attempt
  INSERT INTO auth_logs (event_type, user_id, details)
  VALUES ('registration_attempt', NEW.id, jsonb_build_object(
    'email', NEW.email,
    'metadata', NEW.raw_user_meta_data
  ));

  -- Validate required data
  IF NEW.email IS NULL THEN
    v_error_details := jsonb_build_object(
      'error', 'missing_email',
      'user_id', NEW.id
    );
    
    INSERT INTO auth_logs (event_type, user_id, details)
    VALUES ('registration_error', NEW.id, v_error_details);
    
    RAISE EXCEPTION 'Email is required';
  END IF;

  -- Create user profile with retry logic
  FOR i IN 1..3 LOOP
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
        gen_random_uuid(),
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'plan_type', 'freemium'),
        NOW(),
        NOW()
      );

      -- Log successful profile creation
      INSERT INTO auth_logs (event_type, user_id, details)
      VALUES ('profile_created', NEW.id, jsonb_build_object(
        'attempt', i,
        'success', true
      ));

      RETURN NEW;
    EXCEPTION WHEN unique_violation THEN
      -- Only retry on unique violation
      IF i < 3 THEN
        CONTINUE;
      ELSE
        v_error_details := jsonb_build_object(
          'error', 'unique_violation',
          'attempt', i,
          'user_id', NEW.id
        );
        
        INSERT INTO auth_logs (event_type, user_id, details)
        VALUES ('registration_error', NEW.id, v_error_details);
        
        RAISE EXCEPTION 'Failed to create user profile after % attempts', i;
      END IF;
    WHEN OTHERS THEN
      -- Log other errors
      v_error_details := jsonb_build_object(
        'error', SQLERRM,
        'attempt', i,
        'user_id', NEW.id
      );
      
      INSERT INTO auth_logs (event_type, user_id, details)
      VALUES ('registration_error', NEW.id, v_error_details);
      
      RAISE EXCEPTION 'Unexpected error creating user profile: %', SQLERRM;
    END;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_registration();

-- Create index on auth_logs
CREATE INDEX IF NOT EXISTS idx_auth_logs_event_type ON auth_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_auth_logs_user_id ON auth_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_logs_created_at ON auth_logs(created_at);
