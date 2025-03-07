/*
  # Table de vérification de l'état du système
  
  1. Nouvelle Table
    - `health_check`
      - `id` (uuid, primary key)
      - `status` (text)
      - `timestamp` (timestamptz)
      - `details` (jsonb)
  
  2. Sécurité
    - Enable RLS
    - Add policy for authenticated users to read
    - Add policy for service role to manage
*/

-- Create health check table
CREATE TABLE IF NOT EXISTS public.health_check (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL,
  timestamp timestamptz DEFAULT now(),
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.health_check ENABLE ROW LEVEL SECURITY;

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

-- Create updated_at trigger
CREATE TRIGGER update_health_check_updated_at
  BEFORE UPDATE ON public.health_check
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
