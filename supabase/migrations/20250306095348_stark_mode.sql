/*
  # Create subscriptions and usage limits tables

  1. New Tables
    - `subscriptions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `plan_type` (text)
      - `status` (text)
      - `start_date` (timestamptz)
      - `end_date` (timestamptz)
      - `stripe_subscription_id` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `usage_limits`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `feature` (text)
      - `used_count` (integer)
      - `max_count` (integer)
      - `reset_date` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
*/

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  plan_type text NOT NULL CHECK (plan_type IN ('free', 'basic', 'premium')),
  status text NOT NULL CHECK (status IN ('active', 'canceled', 'expired')),
  start_date timestamptz NOT NULL DEFAULT now(),
  end_date timestamptz,
  stripe_subscription_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create usage_limits table
CREATE TABLE IF NOT EXISTS usage_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  feature text NOT NULL,
  used_count integer NOT NULL DEFAULT 0,
  max_count integer NOT NULL,
  reset_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_limits ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can read own subscription" ON subscriptions;
  DROP POLICY IF EXISTS "Users can update own subscription" ON subscriptions;
  DROP POLICY IF EXISTS "Users can read own usage limits" ON usage_limits;
  DROP POLICY IF EXISTS "Users can update own usage limits" ON usage_limits;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

-- Create policies for subscriptions
CREATE POLICY "Users can read own subscription"
  ON subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
  ON subscriptions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policies for usage_limits
CREATE POLICY "Users can read own usage limits"
  ON usage_limits
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own usage limits"
  ON usage_limits
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create function to increment feature usage
CREATE OR REPLACE FUNCTION increment_feature_usage(p_feature text, p_user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE usage_limits
  SET used_count = used_count + 1,
      updated_at = now()
  WHERE user_id = p_user_id
    AND feature = p_feature;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
DROP TRIGGER IF EXISTS update_usage_limits_updated_at ON usage_limits;

-- Create triggers
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usage_limits_updated_at
  BEFORE UPDATE ON usage_limits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS subscriptions_status_idx ON subscriptions(status);
CREATE INDEX IF NOT EXISTS usage_limits_user_id_idx ON usage_limits(user_id);
CREATE INDEX IF NOT EXISTS usage_limits_feature_idx ON usage_limits(feature);
