/*
  # Client Authentication System Setup

  1. New Tables
    - `clients`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `full_name` (text)
      - `email` (text, unique)
      - `plan_type` (text with check constraint)
      - `subscription_start` (timestamptz)
      - `subscription_end` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `trial_count` (integer)

  2. Security
    - Enable RLS on clients table
    - Add policies for:
      - Users can read own profile
      - Users can update own profile
      - Admin users have full access
    
  3. Triggers
    - Auto-create client profile on user signup
    - Update updated_at timestamp
    - Manage trial period
*/

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can view own profile" ON clients;
  DROP POLICY IF EXISTS "Users can update own profile" ON clients;
  DROP POLICY IF EXISTS "Admin full access on clients" ON clients;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  plan_type text NOT NULL DEFAULT 'freemium',
  subscription_start timestamptz DEFAULT now(),
  subscription_end timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  trial_count integer DEFAULT 0,
  CONSTRAINT valid_plan_type CHECK (plan_type IN ('freemium', 'basic', 'premium')),
  CONSTRAINT valid_trial_count CHECK (trial_count >= 0)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_plan_type ON clients(plan_type);
CREATE INDEX IF NOT EXISTS idx_clients_subscription_end ON clients(subscription_end);
CREATE INDEX IF NOT EXISTS idx_clients_trial_status ON clients(plan_type, subscription_end);

-- Enable Row Level Security
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own profile"
  ON clients
  FOR SELECT
  TO public
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON clients
  FOR UPDATE
  TO public
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin full access on clients"
  ON clients
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to manage trial period
CREATE OR REPLACE FUNCTION manage_trial_period()
RETURNS TRIGGER AS $$
BEGIN
  -- Set trial period for new freemium users
  IF NEW.plan_type = 'freemium' AND (TG_OP = 'INSERT' OR OLD.plan_type != 'freemium') THEN
    NEW.subscription_end = now() + interval '7 days';
    NEW.trial_count = COALESCE(NEW.trial_count, 0) + 1;
  END IF;
  
  -- Clear trial info for paid plans
  IF NEW.plan_type IN ('basic', 'premium') THEN
    NEW.trial_count = 0;
    NEW.subscription_end = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for trial period management
DROP TRIGGER IF EXISTS manage_trial_period_trigger ON clients;
CREATE TRIGGER manage_trial_period_trigger
  BEFORE INSERT OR UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION manage_trial_period();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user_registration()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO clients (
    user_id,
    email,
    full_name,
    plan_type
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'plan_type', 'freemium')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_registration();

-- Create view for trial status
CREATE OR REPLACE VIEW trial_status_view AS
SELECT
  c.id,
  c.email,
  c.plan_type,
  c.trial_count,
  c.subscription_end,
  CASE
    WHEN c.plan_type != 'freemium' THEN 'paid'
    WHEN c.subscription_end > now() THEN 'active'
    ELSE 'expired'
  END as trial_status,
  COUNT(ut.id) as feature_usage_count
FROM clients c
LEFT JOIN usage_tracking ut ON c.id = ut.client_id
GROUP BY c.id, c.email, c.plan_type, c.trial_count, c.subscription_end;
