/*
  # Update health check table policies
  
  1. Security
    - Add policy for authenticated users to read health status
    - Add policy for service role to manage health checks
*/

-- Update RLS policies for health_check table
DROP POLICY IF EXISTS "Allow authenticated users to read health status" ON public.health_check;
DROP POLICY IF EXISTS "Allow service role to manage health checks" ON public.health_check;

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
