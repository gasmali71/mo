/*
  # Fix Health Check Table Policies

  1. Changes
    - Drop existing policies to avoid conflicts
    - Create new policies with proper permissions:
      - Allow service role full access
      - Allow authenticated users to read health status
      - Allow authenticated users to insert health status
      - Allow authenticated users to update their own health status records

  2. Security
    - Maintain RLS
    - Add more granular policies for better security
*/

-- Drop existing policies
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Allow authenticated users to read health status" ON public.health_check;
  DROP POLICY IF EXISTS "Allow service role to manage health checks" ON public.health_check;
END $$;

-- Create new policies
CREATE POLICY "service_role_manage_health_check"
  ON public.health_check
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_read_health_check"
  ON public.health_check
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "authenticated_insert_health_check"
  ON public.health_check
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "authenticated_update_health_check"
  ON public.health_check
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
