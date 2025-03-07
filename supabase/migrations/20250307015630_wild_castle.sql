/*
  # Health Check System Setup

  1. Tables
    - `health_check`: Stores system health status and metrics
      - `id` (uuid, primary key)
      - `status` (text, not null)
      - `details` (jsonb)
      - `timestamp` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on health_check table
    - Add policies for:
      - Authenticated users to read health status
      - Service role to manage health checks
      - Authenticated users to insert health checks

  3. Triggers
    - Add updated_at trigger
*/

-- Create health check table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.health_check (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  timestamp timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.health_check ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "authenticated_read_health_check" ON public.health_check;
  DROP POLICY IF EXISTS "service_role_manage_health_check" ON public.health_check;
  DROP POLICY IF EXISTS "authenticated_insert_health_check" ON public.health_check;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

-- Create new policies
CREATE POLICY "authenticated_read_health_check"
  ON public.health_check
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "service_role_manage_health_check"
  ON public.health_check
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_insert_health_check"
  ON public.health_check
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create or replace updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_health_check_updated_at ON public.health_check;

-- Create trigger
CREATE TRIGGER update_health_check_updated_at
  BEFORE UPDATE ON public.health_check
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert initial health check record
INSERT INTO public.health_check (status, details)
VALUES (
  'healthy',
  jsonb_build_object(
    'auth', true,
    'database', true,
    'storage', true
  )
) ON CONFLICT DO NOTHING;
