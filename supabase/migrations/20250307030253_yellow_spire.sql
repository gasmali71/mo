/*
  # System Monitoring and User Registration Enhancement

  1. New Tables
    - system_logs: For tracking system events and errors
    - health_check: For system health monitoring

  2. Changes
    - Adds system monitoring tables with proper constraints
    - Updates user registration trigger with error handling
    - Adds appropriate indexes for monitoring tables

  3. Security
    - Enables RLS on new tables
    - Adds appropriate policies for service role and admin access
*/

-- Create system monitoring tables if they don't exist
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS system_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    component text NOT NULL,
    status text NOT NULL,
    details jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now(),
    CONSTRAINT valid_status CHECK (status IN ('healthy', 'degraded', 'error'))
  );
EXCEPTION
  WHEN duplicate_table THEN
    NULL;
END $$;

DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS health_check (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    status text NOT NULL,
    timestamp timestamptz DEFAULT now(),
    details jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );
EXCEPTION
  WHEN duplicate_table THEN
    NULL;
END $$;

-- Enable RLS
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_check ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ BEGIN
  DROP POLICY IF EXISTS "service_role_manage_system_logs" ON system_logs;
  DROP POLICY IF EXISTS "service_role_manage_health_check" ON health_check;
  DROP POLICY IF EXISTS "authenticated_read_system_logs" ON system_logs;
  DROP POLICY IF EXISTS "authenticated_read_health_check" ON health_check;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

-- Create new policies with unique names
DO $$ BEGIN
  CREATE POLICY "admin_read_system_logs_20250307"
    ON system_logs
    FOR SELECT
    TO authenticated
    USING (EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    ));
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "service_manage_system_logs_20250307"
    ON system_logs
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "auth_read_health_check_20250307"
    ON health_check
    FOR SELECT
    TO authenticated
    USING (true);
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "service_manage_health_check_20250307"
    ON health_check
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

-- Create updated user registration function
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
    'email', NEW.email
  ));

  BEGIN
    -- Create user profile
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

    -- Log successful registration
    INSERT INTO system_logs (component, status, details)
    VALUES ('auth', 'healthy', jsonb_build_object(
      'event', 'registration_success',
      'user_id', NEW.id,
      'profile_id', v_profile_id
    ));

    RETURN NEW;
  EXCEPTION WHEN others THEN
    -- Log error details
    v_error_details := jsonb_build_object(
      'event', 'registration_error',
      'error', SQLERRM,
      'email', NEW.email,
      'user_id', NEW.id
    );

    INSERT INTO system_logs (component, status, details)
    VALUES ('auth', 'error', v_error_details);

    RAISE EXCEPTION 'Registration error: %', SQLERRM;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create new trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_registration();

-- Create indexes for monitoring tables
CREATE INDEX IF NOT EXISTS idx_system_logs_component ON system_logs(component);
CREATE INDEX IF NOT EXISTS idx_system_logs_status ON system_logs(status);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_health_check_status ON health_check(status);
CREATE INDEX IF NOT EXISTS idx_health_check_timestamp ON health_check(timestamp);
