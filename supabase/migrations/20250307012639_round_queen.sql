/*
  # Fix Duplicate Indexes

  1. Changes
    - Add IF NOT EXISTS to all index creations
    - Drop and recreate indexes safely
    - Use DO blocks for conditional index creation
*/

-- Drop existing indexes if they exist
DO $$ 
BEGIN
    -- Drop user_profiles indexes
    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_user_profiles_user_id'
    ) THEN
        DROP INDEX idx_user_profiles_user_id;
    END IF;

    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_user_profiles_plan_type'
    ) THEN
        DROP INDEX idx_user_profiles_plan_type;
    END IF;

    -- Drop usage_limits indexes
    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_usage_limits_user_id'
    ) THEN
        DROP INDEX idx_usage_limits_user_id;
    END IF;

    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_usage_limits_feature'
    ) THEN
        DROP INDEX idx_usage_limits_feature;
    END IF;

    -- Drop subscriptions indexes
    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_subscriptions_user_id'
    ) THEN
        DROP INDEX idx_subscriptions_user_id;
    END IF;

    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_subscriptions_status'
    ) THEN
        DROP INDEX idx_subscriptions_status;
    END IF;
END $$;

-- Recreate indexes with IF NOT EXISTS
DO $$ 
BEGIN
    -- Recreate user_profiles indexes
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_user_profiles_user_id'
    ) THEN
        CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_user_profiles_plan_type'
    ) THEN
        CREATE INDEX idx_user_profiles_plan_type ON user_profiles(plan_type);
    END IF;

    -- Recreate usage_limits indexes
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_usage_limits_user_id'
    ) THEN
        CREATE INDEX idx_usage_limits_user_id ON usage_limits(user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_usage_limits_feature'
    ) THEN
        CREATE INDEX idx_usage_limits_feature ON usage_limits(feature);
    END IF;

    -- Recreate subscriptions indexes
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_subscriptions_user_id'
    ) THEN
        CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_subscriptions_status'
    ) THEN
        CREATE INDEX idx_subscriptions_status ON subscriptions(status);
    END IF;
END $$;

-- Verify indexes were created
DO $$ 
BEGIN
    -- Verify user_profiles indexes
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_user_profiles_user_id'
    ) THEN
        RAISE EXCEPTION 'Index idx_user_profiles_user_id was not created successfully';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_user_profiles_plan_type'
    ) THEN
        RAISE EXCEPTION 'Index idx_user_profiles_plan_type was not created successfully';
    END IF;

    -- Verify usage_limits indexes
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_usage_limits_user_id'
    ) THEN
        RAISE EXCEPTION 'Index idx_usage_limits_user_id was not created successfully';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_usage_limits_feature'
    ) THEN
        RAISE EXCEPTION 'Index idx_usage_limits_feature was not created successfully';
    END IF;

    -- Verify subscriptions indexes
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_subscriptions_user_id'
    ) THEN
        RAISE EXCEPTION 'Index idx_subscriptions_user_id was not created successfully';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_subscriptions_status'
    ) THEN
        RAISE EXCEPTION 'Index idx_subscriptions_status was not created successfully';
    END IF;
END $$;
