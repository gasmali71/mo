/*
  # Core System Schema Update

  1. New Tables
    - user_profiles: User profile information and preferences
    - usage_limits: Feature access control and usage tracking
    - subscriptions: Subscription management and status tracking

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated access
    - Implement usage tracking triggers

  3. Changes
    - Add subscription management
    - Implement usage limits
    - Add profile management
*/

-- Create user_profiles table if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_profiles') THEN
        CREATE TABLE user_profiles (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
            full_name text NOT NULL,
            plan_type text NOT NULL DEFAULT 'freemium',
            created_at timestamptz DEFAULT now(),
            updated_at timestamptz DEFAULT now(),
            CONSTRAINT valid_plan_type CHECK (plan_type IN ('freemium', 'basic', 'premium'))
        );

        -- Create indexes if they don't exist
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_profiles_user_id') THEN
            CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_profiles_plan_type') THEN
            CREATE INDEX idx_user_profiles_plan_type ON user_profiles(plan_type);
        END IF;

        ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

        -- Create policies
        CREATE POLICY "Users can read own profile"
            ON user_profiles
            FOR SELECT
            TO authenticated
            USING (auth.uid() = user_id);

        CREATE POLICY "Users can update own profile"
            ON user_profiles
            FOR UPDATE
            TO authenticated
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- Create usage_limits table if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'usage_limits') THEN
        CREATE TABLE usage_limits (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
            feature text NOT NULL,
            used_count integer DEFAULT 0,
            max_count integer NOT NULL,
            reset_date timestamptz,
            created_at timestamptz DEFAULT now(),
            updated_at timestamptz DEFAULT now()
        );

        -- Create indexes
        CREATE INDEX idx_usage_limits_user_id ON usage_limits(user_id);
        CREATE INDEX idx_usage_limits_feature ON usage_limits(feature);

        ALTER TABLE usage_limits ENABLE ROW LEVEL SECURITY;

        -- Create policies
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
    END IF;
END $$;

-- Create subscriptions table if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'subscriptions') THEN
        CREATE TABLE subscriptions (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
            plan_type text NOT NULL,
            status text NOT NULL,
            start_date timestamptz DEFAULT now(),
            end_date timestamptz,
            stripe_subscription_id text,
            stripe_customer_id text,
            payment_status text DEFAULT 'pending',
            last_payment_date timestamptz,
            next_payment_date timestamptz,
            amount_paid numeric(10,2),
            currency varchar(3) DEFAULT 'EUR',
            created_at timestamptz DEFAULT now(),
            updated_at timestamptz DEFAULT now(),
            CONSTRAINT valid_plan_type CHECK (plan_type IN ('freemium', 'basic', 'premium')),
            CONSTRAINT valid_status CHECK (status IN ('active', 'canceled', 'expired')),
            CONSTRAINT valid_payment_status CHECK (payment_status IN ('pending', 'paid', 'failed', 'expired')),
            CONSTRAINT valid_currency CHECK (currency IN ('EUR', 'USD', 'GBP'))
        );

        -- Create indexes
        CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
        CREATE INDEX idx_subscriptions_status ON subscriptions(status);

        ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

        -- Create policies
        CREATE POLICY "Users can read own subscription"
            ON subscriptions
            FOR SELECT
            TO authenticated
            USING (auth.uid() = user_id);

        CREATE POLICY "Service role can manage subscriptions"
            ON subscriptions
            FOR ALL
            TO service_role
            USING (true)
            WITH CHECK (true);
    END IF;
END $$;

-- Create trigger functions if they don't exist
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create user profile
    INSERT INTO user_profiles (user_id, full_name, plan_type)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'plan_type', 'freemium')
    );

    -- Set initial usage limits
    INSERT INTO usage_limits (user_id, feature, max_count)
    VALUES
        (NEW.id, 'test', CASE WHEN NEW.raw_user_meta_data->>'plan_type' = 'premium' THEN -1 ELSE 1 END),
        (NEW.id, 'report_basic', CASE WHEN NEW.raw_user_meta_data->>'plan_type' = 'freemium' THEN 1 ELSE -1 END),
        (NEW.id, 'report_premium', CASE WHEN NEW.raw_user_meta_data->>'plan_type' = 'premium' THEN -1 ELSE 0 END);

    -- Create subscription record
    INSERT INTO subscriptions (user_id, plan_type, status)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'plan_type', 'freemium'),
        'active'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create updated_at column trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create updated_at triggers for all tables
DO $$ 
BEGIN
    -- user_profiles
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_profiles_updated_at') THEN
        CREATE TRIGGER update_user_profiles_updated_at
            BEFORE UPDATE ON user_profiles
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- usage_limits
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_usage_limits_updated_at') THEN
        CREATE TRIGGER update_usage_limits_updated_at
            BEFORE UPDATE ON usage_limits
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- subscriptions
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_subscriptions_updated_at') THEN
        CREATE TRIGGER update_subscriptions_updated_at
            BEFORE UPDATE ON subscriptions
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Create RPC function for incrementing feature usage
CREATE OR REPLACE FUNCTION increment_feature_usage(p_feature text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE usage_limits
    SET used_count = used_count + 1
    WHERE feature = p_feature
    AND user_id = auth.uid()
    AND (max_count = -1 OR used_count < max_count);
END;
$$;
