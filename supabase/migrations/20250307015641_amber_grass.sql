/*
  # Usage Limits System Setup

  1. Tables
    - `usage_limits`: Tracks feature usage and limits
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `feature` (text)
      - `used_count` (integer)
      - `max_count` (integer)
      - `reset_date` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for:
      - Users to read own limits
      - Users to update own limits
      - Service role to manage all limits

  3. Constraints
    - Feature name validation
    - Used count must be non-negative
*/

-- Create usage_limits table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.usage_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  feature text NOT NULL,
  used_count integer DEFAULT 0,
  max_count integer NOT NULL,
  reset_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_feature_name CHECK (
    feature = ANY (ARRAY['test', 'report_basic', 'report_premium', 'export'])
  ),
  CONSTRAINT valid_used_count CHECK (used_count >= 0)
);

-- Enable RLS
ALTER TABLE public.usage_limits ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can read own limits" ON public.usage_limits;
  DROP POLICY IF EXISTS "Users can update own limits" ON public.usage_limits;
  DROP POLICY IF EXISTS "Service role can manage limits" ON public.usage_limits;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

-- Create new policies
CREATE POLICY "Users can read own limits"
  ON public.usage_limits
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own limits"
  ON public.usage_limits
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Service role can manage limits"
  ON public.usage_limits
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create or replace increment_feature_usage function
CREATE OR REPLACE FUNCTION increment_feature_usage(p_feature text)
RETURNS void AS $$
BEGIN
  INSERT INTO public.usage_limits (user_id, feature, used_count, max_count)
  VALUES (auth.uid(), p_feature, 1, 
    CASE p_feature
      WHEN 'test' THEN 1
      WHEN 'report_basic' THEN 5
      WHEN 'report_premium' THEN -1
      WHEN 'export' THEN 10
    END
  )
  ON CONFLICT (user_id, feature)
  DO UPDATE SET 
    used_count = usage_limits.used_count + 1,
    updated_at = now()
  WHERE usage_limits.user_id = auth.uid() 
    AND usage_limits.feature = p_feature;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create updated_at trigger
DROP TRIGGER IF EXISTS update_usage_limits_updated_at ON public.usage_limits;

CREATE TRIGGER update_usage_limits_updated_at
  BEFORE UPDATE ON public.usage_limits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_usage_limits_user_id ON public.usage_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_limits_feature ON public.usage_limits(feature);
