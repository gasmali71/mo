/*
  # Fix User Registration Trigger

  1. Changes
    - Drops existing user registration trigger and function
    - Creates improved registration trigger with proper error handling
    - Adds logging for registration events

  2. Security
    - Uses SECURITY DEFINER for proper permissions
    - Maintains RLS policies
*/

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user_registration();

-- Create improved user registration function
CREATE OR REPLACE FUNCTION handle_new_user_registration()
RETURNS trigger AS $$
DECLARE
  v_profile_id uuid;
  v_error_details jsonb;
BEGIN
  -- Log registration attempt
  INSERT INTO system_logs (component, status, details)
  VALUES ('auth', 'healthy', jsonb_build_object(
    'event', 'registration_attempt',
    'email', NEW.email,
    'timestamp', now()
  ));

  BEGIN
    -- Create user profile with proper error handling
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
    )
    RETURNING id INTO v_profile_id;

    -- Initialize usage limits for new user
    INSERT INTO public.usage_limits (
      user_id,
      feature,
      used_count,
      max_count,
      created_at
    ) VALUES (
      NEW.id,
      'test',
      0,
      CASE 
        WHEN NEW.raw_user_meta_data->>'plan_type' = 'premium' THEN -1
        WHEN NEW.raw_user_meta_data->>'plan_type' = 'basic' THEN 10
        ELSE 1
      END,
      NOW()
    );

    -- Log successful registration
    INSERT INTO system_logs (component, status, details)
    VALUES ('auth', 'healthy', jsonb_build_object(
      'event', 'registration_success',
      'user_id', NEW.id,
      'profile_id', v_profile_id,
      'timestamp', now()
    ));

    RETURN NEW;
  EXCEPTION WHEN others THEN
    -- Log error details
    v_error_details := jsonb_build_object(
      'event', 'registration_error',
      'error', SQLERRM,
      'email', NEW.email,
      'user_id', NEW.id,
      'timestamp', now()
    );

    INSERT INTO system_logs (component, status, details)
    VALUES ('auth', 'error', v_error_details);

    RAISE EXCEPTION 'Registration error: %', SQLERRM;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create new trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_registration();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_limits_user_id ON public.usage_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_component ON public.system_logs(component);
