/*
  # Fix User Registration and System Monitoring

  1. Changes
    - Creates system monitoring tables (health_check, system_logs)
    - Updates user registration trigger with proper error handling
    - Adds appropriate RLS policies and indexes
    - Ensures proper security and monitoring

  2. Security
    - Enables RLS on all tables
    - Adds policies for service role and admin access
    - Uses SECURITY DEFINER for trigger function
*/

-- Create system monitoring tables if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'system_logs') THEN
    CREATE TABLE system_logs (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      component text NOT NULL,
      status text NOT NULL,
      details jsonb DEFAULT '{}'::jsonb,
      created_at timestamptz DEFAULT now(),
      CONSTRAINT valid_status CHECK (status IN ('healthy', 'degraded', 'error'))
    );

    ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

    CREATE INDEX idx_system_logs_component ON system_logs(component);
    CREATE INDEX idx_system_logs_status ON system_logs(status);
    CREATE INDEX idx_system_logs_created_at ON system_logs(created_at);
  END IF;

  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'health_check') THEN
    CREATE TABLE health_check (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      status text NOT NULL,
      timestamp timestamptz DEFAULT now(),
      details jsonb DEFAULT '{}'::jsonb,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );

    ALTER TABLE health_check ENABLE ROW LEVEL SECURITY;

    CREATE INDEX idx_health_check_status ON health_check(status);
    CREATE INDEX idx_health_check_timestamp ON health_check(timestamp);
  END IF;
END $$;

-- Create RLS policies using DO block to handle existing policies
DO $$ 
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "admin_read_system_logs_20250307" ON system_logs;
  DROP POLICY IF EXISTS "service_manage_system_logs_20250307" ON system_logs;
  DROP POLICY IF EXISTS "auth_read_health_check_20250307" ON health_check;
  DROP POLICY IF EXISTS "service_manage_health_check_20250307" ON health_check;

  -- Create new policies
  CREATE POLICY "admin_read_system_logs_20250307"
    ON system_logs
    FOR SELECT
    TO authenticated
    USING (EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    ));

  CREATE POLICY "service_manage_system_logs_20250307"
    ON system_logs
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

  CREATE POLICY "auth_read_health_check_20250307"
    ON health_check
    FOR SELECT
    TO authenticated
    USING (true);

  CREATE POLICY "service_manage_health_check_20250307"
    ON health_check
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
END $$;

-- Create or replace the user registration function with improved error handling
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

-- Drop existing trigger if exists and create new one
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_registration();
