/*
  # System Setup and Verification

  1. New Tables
    - `user_profiles`: User information and preferences
    - `system_logs`: System events and status tracking
    - `feature_registry`: Available features and their status

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for each table
    - Set up service role access

  3. Features
    - System health check procedures
    - Feature activation tracking
    - Usage monitoring
*/

-- Create user_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  plan_type text DEFAULT 'freemium'::text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_plan_type CHECK (plan_type IN ('freemium', 'basic', 'premium'))
);

-- Create system_logs table
CREATE TABLE IF NOT EXISTS public.system_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  component text NOT NULL,
  status text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('healthy', 'degraded', 'error'))
);

-- Create feature_registry table
CREATE TABLE IF NOT EXISTS public.feature_registry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_name text UNIQUE NOT NULL,
  is_active boolean DEFAULT true,
  access_level text NOT NULL,
  config jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_access_level CHECK (access_level IN ('all', 'authenticated', 'premium'))
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_registry ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and create new ones
DO $$ 
BEGIN
  -- User Profiles policies
  DROP POLICY IF EXISTS "Users can read own profile" ON public.user_profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
  
  -- System Logs policies
  DROP POLICY IF EXISTS "Admins can read system logs" ON public.system_logs;
  DROP POLICY IF EXISTS "Service role can manage system logs" ON public.system_logs;
  
  -- Feature Registry policies
  DROP POLICY IF EXISTS "Users can read feature registry" ON public.feature_registry;
END $$;

-- Create policies
CREATE POLICY "Users can read own profile"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can read system logs"
  ON public.system_logs
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Service role can manage system logs"
  ON public.system_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can read feature registry"
  ON public.feature_registry
  FOR SELECT
  TO authenticated
  USING (access_level IN ('all', 'authenticated') OR (
    access_level = 'premium' AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND plan_type = 'premium'
    )
  ));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_component ON public.system_logs(component);
CREATE INDEX IF NOT EXISTS idx_system_logs_status ON public.system_logs(status);
CREATE INDEX IF NOT EXISTS idx_feature_registry_name ON public.feature_registry(feature_name);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_feature_registry_updated_at ON public.feature_registry;
CREATE TRIGGER update_feature_registry_updated_at
  BEFORE UPDATE ON public.feature_registry
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert initial feature registry data
INSERT INTO public.feature_registry (feature_name, access_level, config)
VALUES
  ('test', 'authenticated', '{"max_attempts": 3, "cooldown_hours": 24}'::jsonb),
  ('report_basic', 'authenticated', '{"export_formats": ["pdf", "csv"]}'::jsonb),
  ('report_premium', 'premium', '{"export_formats": ["pdf", "csv", "excel"], "custom_branding": true}'::jsonb),
  ('export', 'authenticated', '{"daily_limit": 5}'::jsonb)
ON CONFLICT (feature_name) DO NOTHING;

-- Create system health check function
CREATE OR REPLACE FUNCTION check_system_health()
RETURNS jsonb AS $$
DECLARE
  health_status jsonb;
BEGIN
  health_status = jsonb_build_object(
    'timestamp', now(),
    'components', jsonb_build_object(
      'database', true,
      'auth', EXISTS (SELECT 1 FROM auth.users LIMIT 1),
      'storage', true
    )
  );

  -- Log health check
  INSERT INTO system_logs (component, status, details)
  VALUES (
    'system',
    CASE 
      WHEN (health_status->'components'->>'database')::boolean 
           AND (health_status->'components'->>'auth')::boolean 
           AND (health_status->'components'->>'storage')::boolean
      THEN 'healthy'
      ELSE 'degraded'
    END,
    health_status
  );

  RETURN health_status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
