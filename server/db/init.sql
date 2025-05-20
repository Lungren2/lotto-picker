-- =============================================
-- Lotto Picker Database Initialization Script
-- Compatible with PostgreSQL 13+
-- =============================================

-- Enable UUID extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Start transaction for atomicity
BEGIN;

-- =============================================
-- Create schema and set search path
-- =============================================
CREATE SCHEMA IF NOT EXISTS lotto_picker;
SET search_path TO lotto_picker, public;

-- =============================================
-- Create migrations table to track applied migrations
-- =============================================
CREATE TABLE IF NOT EXISTS migrations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  description TEXT
);

COMMENT ON TABLE migrations IS 'Tracks database migrations that have been applied';
COMMENT ON COLUMN migrations.name IS 'Unique name of the migration';
COMMENT ON COLUMN migrations.applied_at IS 'When the migration was applied';
COMMENT ON COLUMN migrations.description IS 'Optional description of what the migration does';

-- =============================================
-- Create groups table
-- =============================================
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE groups IS 'Lottery groups that users can join';
COMMENT ON COLUMN groups.id IS 'Unique identifier for the group';
COMMENT ON COLUMN groups.name IS 'Display name of the group';
COMMENT ON COLUMN groups.created_at IS 'When the group was created';
COMMENT ON COLUMN groups.updated_at IS 'When the group was last updated';

-- =============================================
-- Create users table
-- =============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE users IS 'Users who can join groups and create number sets';
COMMENT ON COLUMN users.id IS 'Unique identifier for the user';
COMMENT ON COLUMN users.client_id IS 'Client-side identifier for the user';
COMMENT ON COLUMN users.display_name IS 'Optional display name for the user';
COMMENT ON COLUMN users.created_at IS 'When the user was created';
COMMENT ON COLUMN users.updated_at IS 'When the user was last updated';

-- Create index on client_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_client_id ON users(client_id);

-- =============================================
-- Create group_invitations table
-- =============================================
CREATE TABLE IF NOT EXISTS group_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  invitation_code VARCHAR(20) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_invitation_code UNIQUE (invitation_code)
);

COMMENT ON TABLE group_invitations IS 'Invitations to join groups';
COMMENT ON COLUMN group_invitations.id IS 'Unique identifier for the invitation';
COMMENT ON COLUMN group_invitations.group_id IS 'Group that the invitation is for';
COMMENT ON COLUMN group_invitations.invitation_code IS 'Unique code that users can use to join the group';
COMMENT ON COLUMN group_invitations.expires_at IS 'When the invitation expires';
COMMENT ON COLUMN group_invitations.created_at IS 'When the invitation was created';

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_group_invitations_group_id ON group_invitations(group_id);
CREATE INDEX IF NOT EXISTS idx_group_invitations_code ON group_invitations(invitation_code);
CREATE INDEX IF NOT EXISTS idx_group_invitations_expires_at ON group_invitations(expires_at);

-- =============================================
-- Create group_members table
-- =============================================
CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_group_member UNIQUE (group_id, user_id)
);

COMMENT ON TABLE group_members IS 'Users who are members of groups';
COMMENT ON COLUMN group_members.id IS 'Unique identifier for the membership';
COMMENT ON COLUMN group_members.group_id IS 'Group that the user is a member of';
COMMENT ON COLUMN group_members.user_id IS 'User who is a member of the group';
COMMENT ON COLUMN group_members.joined_at IS 'When the user joined the group';

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);

-- =============================================
-- Create number_sets table
-- =============================================
CREATE TABLE IF NOT EXISTS number_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  numbers INTEGER[] NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  max_value INTEGER NOT NULL CHECK (max_value > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE number_sets IS 'Sets of lottery numbers created by users';
COMMENT ON COLUMN number_sets.id IS 'Unique identifier for the number set';
COMMENT ON COLUMN number_sets.group_id IS 'Group that the number set belongs to';
COMMENT ON COLUMN number_sets.user_id IS 'User who created the number set';
COMMENT ON COLUMN number_sets.numbers IS 'Array of lottery numbers';
COMMENT ON COLUMN number_sets.quantity IS 'Number of numbers in the set';
COMMENT ON COLUMN number_sets.max_value IS 'Maximum possible value for numbers';
COMMENT ON COLUMN number_sets.created_at IS 'When the number set was created';

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_number_sets_group_id ON number_sets(group_id);
CREATE INDEX IF NOT EXISTS idx_number_sets_user_id ON number_sets(user_id);
CREATE INDEX IF NOT EXISTS idx_number_sets_created_at ON number_sets(created_at);

-- Option 1: Create a unique constraint directly on the array
-- This works because PostgreSQL can compare arrays directly
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_number_set_per_group
ON number_sets(group_id, numbers);

-- Option 2: Alternative approach using a custom function (commented out)
-- In case direct array comparison doesn't work as expected
/*
CREATE OR REPLACE FUNCTION immutable_array_to_text(integer[]) RETURNS text AS $$
  SELECT array_to_string($1, ',');
$$ LANGUAGE SQL IMMUTABLE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_number_set_per_group_alt
ON number_sets(group_id, immutable_array_to_text(numbers));
*/

-- =============================================
-- Create functions and triggers
-- =============================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for groups table
DROP TRIGGER IF EXISTS update_groups_updated_at ON groups;
CREATE TRIGGER update_groups_updated_at
BEFORE UPDATE ON groups
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger for users table
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- Insert initial migration record
-- =============================================
INSERT INTO migrations (name, description)
VALUES ('001_initial_schema', 'Initial database schema creation')
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- Create sample data for development
-- =============================================
DO $$
DECLARE
  sample_group_id UUID;
  sample_user_id UUID;
BEGIN
  -- Only create sample data in development environment
  IF current_setting('app.environment', true) = 'development' THEN
    -- Create a sample group
    INSERT INTO groups (name)
    VALUES ('Sample Lottery Group')
    RETURNING id INTO sample_group_id;

    -- Create a sample user
    INSERT INTO users (client_id, display_name)
    VALUES ('sample-client-id', 'Sample User')
    RETURNING id INTO sample_user_id;

    -- Add the user to the group
    INSERT INTO group_members (group_id, user_id)
    VALUES (sample_group_id, sample_user_id);

    -- Create a sample invitation
    INSERT INTO group_invitations (group_id, invitation_code, expires_at)
    VALUES (
      sample_group_id,
      'SAMPLE123',
      CURRENT_TIMESTAMP + INTERVAL '24 hours'
    );

    -- Create a sample number set
    INSERT INTO number_sets (group_id, user_id, numbers, quantity, max_value)
    VALUES (
      sample_group_id,
      sample_user_id,
      ARRAY[1, 7, 13, 24, 35, 42],
      6,
      49
    );
  END IF;
END $$;

-- Commit the transaction
COMMIT;
