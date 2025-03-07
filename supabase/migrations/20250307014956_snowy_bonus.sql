/*
  # Create Health Check Table and Policies

  1. New Tables
    - `health_check`
      - `id` (uuid, primary key)
      - `status` (text)
      - `details` (jsonb)
      - `timestamp` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policy for authenticated users to read health status
    - Add policy for service role to manage health checks

  3. Changes
    - Added policy existence checks to prevent errors
    - Added function existence check for trigger
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
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'health_check' 
    AND policyname = 'Allow authenticated users to read health status'
  ) THEN
    DROP POLICY "Allow authenticated users to read health status" ON public.health_check;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'health_check' 
    AND policyname = 'Allow service role to manage health checks'
  ) THEN
    DROP POLICY "Allow service role to manage health checks" ON public.health_check;
  END IF;
END $$;

-- Create policies
CREATE POLICY "Allow authenticated users to read health status"
  ON public.health_check
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow service role to manage health checks"
  ON public.health_check
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create or replace the updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_health_check_updated_at'
  ) THEN
    DROP TRIGGER IF EXISTS update_health_check_updated_at ON public.health_check;
  END IF;
END $$;

-- Create trigger
CREATE TRIGGER update_health_check_updated_at
  BEFORE UPDATE ON public.health_check
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
